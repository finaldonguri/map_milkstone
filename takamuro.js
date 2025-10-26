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

    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      credit: '地理院タイル（色別標高図）'
    }),

    terrainProvider: new Cesium.EllipsoidTerrainProvider()
  });

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      135.5,  // 経度
      35.2,   // 緯度
      300.0   // 高さ[m]
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-30.0),
      roll: 0.0
    }
  });

  Cesium.GeoJsonDataSource.load('data/route.geojson').then(function (datasource) {
    datasource.entities.values.forEach(function (entity) {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = Cesium.Color.YELLOW;
        entity.polyline.width = 3;
      }
    });
    viewer.dataSources.add(datasource);
    viewer.zoomTo(datasource);
  });
});
