window.addEventListener("DOMContentLoaded", function () {

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

    // ←背景タイル（地理院）
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      credit: '地理院タイル（色別標高図）'
    }),

    // ←地形は平坦でOK
    terrainProvider: new Cesium.EllipsoidTerrainProvider()
  });

  // カメラ初期位置
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      135.5,   // 経度（実際の山の経度にあとで置き換えてOK）
      35.2,    // 緯度
      300.0    // カメラ高度[m]
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-30.0),
      roll: 0.0
    }
  });

  // GeoJSONルートの読み込み
  Cesium.GeoJsonDataSource.load('data/route.geojson').then(function (datasource) {

    // 線の色と太さを黄色に
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
