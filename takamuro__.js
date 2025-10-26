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

    // imageryProvider: new Cesium.OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/'
    }), 
    //

    // ↓ここをまず安全なものにする
    // terrainProvider: new Cesium.JapanGSITerrainProvider({ heightPower: 1.0 })
    // ↑をコメントアウトして ↓に置き換える

    terrainProvider: new Cesium.EllipsoidTerrainProvider()
    // または ionのトークンセット済みであれば:
    // terrainProvider: Cesium.createWorldTerrain()
  });

  // カメラ初期位置
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      135.5,  // 仮の経度
      35.2,   // 仮の緯度
      2000    // 高度[m]
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-45.0),
      roll: 0.0
    }
  });

  // GeoJSONをオーバーレイ
  Cesium.GeoJsonDataSource.load('data/route.geojson').then(function (datasource) {
    // ルートのスタイルを見やすくする（黄色とかはCesium任せだと変わる可能性あるのでカスタム可）
    datasource.entities.values.forEach(function(entity){
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
