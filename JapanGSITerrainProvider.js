//**
(function(){
var
    defaultValue = Cesium.defaultValue,
    defined = Cesium.defined,
    defineProperties = Cesium.defineProperties,
    loadText = Cesium.loadText,
    throttleRequestByServer = Cesium.throttleRequestByServer,
    Event = Cesium.Event,
    Credit = Cesium.Credit,
    WebMercatorTilingScheme = Cesium.WebMercatorTilingScheme,
    HeightmapTerrainData = Cesium.HeightmapTerrainData,
    TerrainProvider = Cesium.TerrainProvider,
    when = Cesium.when;

"use strict";



// ===== Cesium互換フォールバック =====

// defaultValue(a, b): a が undefined / null のとき b を返す
if (typeof defaultValue !== 'function') {
    defaultValue = function(a, b) {
        return (a === undefined || a === null) ? b : a;
    };
}

// defined(x): x が undefined/null じゃないかを返す
if (typeof defined !== 'function') {
    defined = function(x) {
        return x !== undefined && x !== null;
    };
}

// defineProperties(obj, {prop:{get:..., set:...}, ...})
// あなたのCesium.jsに Cesium.defineProperties が無いので、Object.definePropertiesで代用
if (typeof defineProperties !== 'function') {
    defineProperties = function (target, props) {
        Object.defineProperties(target, props);
    };
}

// when(promise, onFulfilled, onRejected)
// 古いCesiumはwhen(Promise, ...)を使ってた。なければPromise.resolveで代用。
if (typeof when === 'undefined') {
    when = function(promise, onFulfilled, onRejected) {
        return Promise.resolve(promise).then(onFulfilled, onRejected);
    };
}

// throttleRequestByServer(url) が無いビルド用フォールバック
if (typeof throttleRequestByServer !== 'function') {
    throttleRequestByServer = function (url) {
        // 本来は同じサーバーへの同時リクエスト数を制御して
        // 混雑や403を防ぐためのラッパなんだけど、
        // ここでは最低限「そのままURLを返す」だけにする。
        return url;
    };
}

// loadText(url) が無いビルド用フォールバック
if (typeof loadText !== 'function') {
    loadText = function(url) {
        return fetch(url).then(function (r) {
            return r.text();
        });
    };
}


// ===== フォールバックここまで =====



    var trailingSlashRegex = /\/$/;
    var defaultCredit = new Credit('国土地理院');
    var GSI_MAX_TERRAIN_LEVEL = 14;

    var JapanGSITerrainProvider = function JapanGSITerrainProvider(options) {
        options = defaultValue(options, {});

        var url = defaultValue(options.url, 'https://cyberjapandata.gsi.go.jp/xyz/dem/');

        if (!trailingSlashRegex.test(url)) {
            url = url + '/';
        }

        this._url = url;
        this._proxy = options.proxy;
        this._heightPower = defaultValue(options.heightPower , 1);

        this._tilingScheme = new WebMercatorTilingScheme({numberOfLevelZeroTilesX:2});

        this._heightmapWidth = 32;
        this._demDataWidth   = 256;

        this._terrainDataStructure = {
            heightScale:       1,
            heightOffset:      0,
            elementsPerHeight: 1,
            stride:            1,
            elementMultiplier: 256
        };

        this._levelZeroMaximumGeometricError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(this._tilingScheme.ellipsoid, this._heightmapWidth, this._tilingScheme.getNumberOfXTilesAtLevel(0));

        this._errorEvent = new Event();

        var credit = defaultValue(options.credit, defaultCredit);
        if (typeof credit === 'string') {
            credit = new Credit(credit);
        }
        this._credit = credit;
    };

    JapanGSITerrainProvider.prototype.requestTileGeometry = function(x, y, level, throttleRequests) {
    var orgx = x;
    var orgy = y;
    var shift = 0;
    if (level > GSI_MAX_TERRAIN_LEVEL) {
        shift = level - GSI_MAX_TERRAIN_LEVEL;
        level = GSI_MAX_TERRAIN_LEVEL;
    }

    x >>= shift + 1;
    y >>= shift;
    var shiftx = (orgx % Math.pow(2, shift + 1)) / Math.pow(2, shift + 1);
    var shifty = (orgy % Math.pow(2, shift)) / Math.pow(2, shift);

    var url = this._url + level + '/' + x + '/' + y + '.txt';

    var proxy = this._proxy;
    if (defined(proxy)) {
        url = proxy.getURL(url);
    }

    // リクエスト準備
    throttleRequests = defaultValue(throttleRequests, true);

    var promise;
    if (throttleRequests) {
        promise = throttleRequestByServer(url, loadText);
        if (!defined(promise)) {
            // サーバーに遠慮して今回は取らない、という場合
            return undefined;
        }
    } else {
        promise = loadText(url);
    }

    var self = this;

    // ←↓↓↓↓ ココからが重要: タイルパースを try/catch で守る ↓↓↓↓
    return when(promise, function(data) {
        try {
            // 1. テキストを行ごとに分解して heightCSV 二次元配列を作る
            var heightCSV = [];
            var LF = String.fromCharCode(10);
            var lines = data.split(LF);

            for (var i = 0; i < lines.length; i++) {
                // 空行や変な行を飛ばす
                if (!lines[i] || lines[i].length === 0) {
                    continue;
                }
                var heights = lines[i].split(",");
                for (var j = 0; j < heights.length; j++) {
                    if (heights[j] === "e" || heights[j] === undefined || heights[j] === "") {
                        heights[j] = 0;
                    }
                }
                heightCSV.push(heights);
            }

            var whm = self._heightmapWidth;   // 32
            var wim = self._demDataWidth;     // 256
            var hmp = new Int16Array(whm * whm);

            for (var yy = 0; yy < whm; ++yy) {
                for (var xx = 0; xx < whm; ++xx) {

                    var py = Math.round(
                        (yy / Math.pow(2, shift) / (whm - 1) + shifty) * (wim - 1)
                    );
                    var px = Math.round(
                        (xx / Math.pow(2, shift + 1) / (whm - 1) + shiftx) * (wim - 1)
                    );

                    // heightCSV[py] や heightCSV[py][px] が存在しないケースに備える
                    if (
                        py < 0 || py >= heightCSV.length ||
                        !heightCSV[py] ||
                        px < 0 || px >= heightCSV[py].length
                    ) {
                        // データがない場所は0mで埋める
                        hmp[yy * whm + xx] = 0;
                    } else {
                        var hVal = Number(heightCSV[py][px]);
                        if (isNaN(hVal)) {
                            hVal = 0;
                        }
                        hmp[yy * whm + xx] = Math.round(hVal * self._heightPower);
                    }
                }
            }

            // 2. HeightmapTerrainData に渡してCesium側に標高メッシュとして返す
            return new HeightmapTerrainData({
                buffer:        hmp,
                width:         self._heightmapWidth,
                height:        self._heightmapWidth,
                structure:     self._terrainDataStructure,
                childTileMask: GSI_MAX_TERRAIN_LEVEL
            });

        } catch (e) {
            // パースに失敗したタイルはスキップ（null返し）
            console.log(
                'An error occurred in "JapanGSITerrainProvider": ' +
                'Failed to obtain terrain tile X: ' + x +
                ' Y: ' + y +
                ' Level: ' + level +
                '. Error message: "' + e + '"'
            );
            return null;
        }
    }, function(err) {
        // fetch/load そのものが失敗したときの保険
        console.log(
            'An error occurred in "JapanGSITerrainProvider": ' +
            'Failed to request terrain tile X: ' + x +
            ' Y: ' + y +
            ' Level: ' + level +
            '. Network error: "' + err + '"'
        );
        return null;
    });
};


    JapanGSITerrainProvider.prototype.getLevelMaximumGeometricError = function(level) {
        return this._levelZeroMaximumGeometricError / (1 << level);
    };
    JapanGSITerrainProvider.prototype.hasWaterMask = function() {
        return !true;
    };
    JapanGSITerrainProvider.prototype.getTileDataAvailable = function(x, y, level) {
        return true;
    };

    defineProperties(JapanGSITerrainProvider.prototype, {
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        credit : {
            get : function() {
                return this._credit;
            }
        },

        tilingScheme : {
            get : function() {
                return this._tilingScheme;
            }
        },

        ready : {
            get : function() {
                return true;
            }
        }
    });

    Cesium.JapanGSITerrainProvider = JapanGSITerrainProvider;
})();

