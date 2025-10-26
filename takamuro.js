// takamuro.js

// ページのDOMができてから実行
window.addEventListener("DOMContentLoaded", function () {

  // 1. Cesium.Viewer を初期化
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

    // まずは確実に動く地形。平坦な楕円体。
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
}),

imageryProvider: new Cesium.UrlTemplateImageryProvider({
  url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
  credit: '地理院タイル（色別標高図）'




    // ← imageryProvider は一旦入れない
    // （Cesium側のデフォルトレイヤを使わせてみる）
  });

  // 2. カメラの初期位置（適当に仮座標）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      135.5,  // 経度(仮)
      35.2,   // 緯度(仮)
      2000    // 視点高度[m]
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-45.0),
      roll: 0.0
    }
  });

  // 3. GeoJSONのルートを読み込んで重ねる
  Cesium.GeoJsonDataSource.load('data/route.geojson').then(function (datasource) {

    // 線の色と太さをカスタム（黄色いライン）
    datasource.entities.values.forEach(function (entity) {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = Cesium.Color.YELLOW;
        entity.polyline.width = 3;
      }
    });

    viewer.dataSources.add(datasource);
    viewer.zoomTo(datasource);

  }).catch(function (err) {
    console.error('GeoJSON読み込み失敗:', err);
  });

});
