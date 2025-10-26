window.addEventListener("DOMContentLoaded", function () {

  // ← 必須：あなたのCesium ionトークンをここに入れる
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0';

  const viewer = new Cesium.Viewer('mapdiv', {
    animation : false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    scene3DOnly: true,
    timeline: false,

    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      credit: '地理院タイル（色別標高図）'
    }),

    // ここが平坦→立体になるところ
    terrainProvider: Cesium.createWorldTerrain()
  });

  // カメラ位置（座標はあなたの山に合わせていい）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      135.5,   // 経度
      35.2,    // 緯度
      300.0    // カメラ高度[m]。山が高いなら500〜1000くらいにしてもOK
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-30.0),
      roll: 0.0
    }
  });

  // ルート読み込み
  Cesium.GeoJsonDataSource.load('data/route.geojson').then(function (datasource) {

    datasource.entities.values.forEach(function (entity) {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = Cesium.Color.YELLOW;
        entity.polyline.width = 3;
        // Optional: ルートをちょっと地面から浮かせたいなら clampToGround:false にする等
      }
    });

    viewer.dataSources.add(datasource);
    viewer.zoomTo(datasource);
  }).catch(function (err) {
    console.error('GeoJSON読み込み失敗:', err);
  });

});
