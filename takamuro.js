// ページ読み込み完了後に実行
window.onload = function () {
    // Cesium ionのアクセストークン
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0';

    // Cesiumビューワーを作成
    var viewer = new Cesium.Viewer('mapdiv', {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        scene3DOnly: true,
        timeline: false,
        // 国土地理院の陰影起伏図を背景に使用
        imageryProvider: new Cesium.OpenStreetMapImageryProvider({
            url: '//cyberjapandata.gsi.go.jp/xyz/relief/'
        }),
        // 国土地理院の地形データを使用
        terrainProvider: new Cesium.JapanGSITerrainProvider({
            heightPower: 1.0
        })
    });

    // 標準地図レイヤーを追加（半透明）
    var layers = viewer.scene.imageryLayers;
    var osm = layers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({
            url: '//cyberjapandata.gsi.go.jp/xyz/std/'
        })
    );
    osm.alpha = 0.6; // 透明度60%

    // 情報パネルを作成
    var infoDiv = document.createElement('div');
    infoDiv.id = 'info';
    infoDiv.innerHTML = '<h3>高室山ルート</h3><p>読み込み中...</p>';
    document.body.appendChild(infoDiv);

    // GeoJSONルートを読み込み
    var routePath = 'data/route.geojson';
    var promise = Cesium.GeoJsonDataSource.load(routePath, {
        stroke: Cesium.Color.RED,
        strokeWidth: 4,
        clampToGround: true // 地形に沿わせる
    });

    promise.then(function (dataSource) {
        // データソースを追加
        viewer.dataSources.add(dataSource);

        // ルートの情報を表示
        var entities = dataSource.entities.values;
        infoDiv.innerHTML =
            '<h3>高室山ルート</h3>' +
            '<p>ポイント数: ' + entities.length + '</p>' +
            '<p><small>地形データ: 国土地理院</small></p>';

        // カメラをルートに合わせる
        viewer.zoomTo(dataSource, new Cesium.HeadingPitchRange(0, -0.5, 5000));

        // 各ポイントにマーカーを追加
        entities.forEach(function (entity, index) {
            if (entity.position) {
                entity.point = new Cesium.PointGraphics({
                    color: Cesium.Color.YELLOW,
                    pixelSize: 8,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                });

                // スタート地点
                if (index === 0) {
                    entity.label = {
                        text: 'スタート',
                        font: '14pt sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    };
                    entity.point.color = Cesium.Color.GREEN;
                    entity.point.pixelSize = 12;
                }

                // ゴール地点
                if (index === entities.length - 1) {
                    entity.label = {
                        text: 'ゴール',
                        font: '14pt sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    };
                    entity.point.color = Cesium.Color.BLUE;
                    entity.point.pixelSize = 12;
                }
            }
        });
    }).catch(function (error) {
        infoDiv.innerHTML =
            '<h3>エラー</h3>' +
            '<p>ルートの読み込みに失敗しました</p>' +
            '<p><small>' + error.message + '</small></p>';
        console.error('GeoJSON読み込みエラー:', error);
    });
};