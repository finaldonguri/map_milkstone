// ページ読み込み完了後に実行
window.onload = function () {
    // Cesium ionのアクセストークン
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0';

    // 国土地理院の地形プロバイダーを作成
    var terrainProvider = new Cesium.JapanGSITerrainProvider({
        url: 'https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png'
    });

    // Cesiumビューワーを作成
    var viewer = new Cesium.Viewer('mapdiv', {
        terrainProvider: terrainProvider,
        baseLayerPicker: true,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        // 国土地理院の標準地図を背景に使用
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
            credit: new Cesium.Credit('国土地理院')
        })
    });

    // 地形の誇張（山の起伏を強調）
    viewer.scene.globe.terrainExaggeration = 1.5;

    // 初期カメラ位置（日本周辺）
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(138.0, 36.0, 500000)
    });

    // 情報パネルを作成
    var infoDiv = document.createElement('div');
    infoDiv.id = 'info';
    infoDiv.innerHTML = '<h3>高室山ルート</h3><p>読み込み中...</p>';
    document.body.appendChild(infoDiv);

    // GeoJSONルートを読み込み
    Cesium.GeoJsonDataSource.load('data/route.geojson', {
        stroke: Cesium.Color.RED,
        strokeWidth: 4,
        clampToGround: true // 地形に沿わせる
    }).then(function (dataSource) {
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
