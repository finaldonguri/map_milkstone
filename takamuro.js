window.addEventListener("DOMContentLoaded", function () {

  // 1. Viewerをまず最低構成で立ち上げる
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

  terrainProvider: new Cesium.JapanGSITerrainProvider({
    // heightPower は標高の強調倍率。1.0 = 等倍、2.0 = 2倍持ち上げ
    heightPower: 1.0,
    // url はデフォルトで 'https://cyberjapandata.gsi.go.jp/xyz/dem/' になってるはず
    // もし https が必要なら明示的に:
    url: 'https://cyberjapandata.gsi.go.jp/xyz/dem/'
  })
});

  // 2. 念のためGlobeがちゃんとあるようにする（地球本体が無いとタイル貼れない）
  if (!viewer.scene.globe) {
    viewer.scene.globe = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
    viewer.scene.globe.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }

  // 3. ここで手動で背景タイルレイヤを追加する
  const gsiLayer = viewer.scene.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      // 標準地図 or relief 好きな方
      url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      credit: '地理院タイル（色別標高図）'
    })
  );

  // 透明度を少し調整したければ例えば:
  // gsiLayer.alpha = 1.0;

  // 4. カメラ位置（山のあたりに寄せる）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      135.5,   // 経度（あなたの山に置き換えOK）
      35.2,    // 緯度
      300.0    // カメラ高度[m]
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-30.0),
      roll: 0.0
    }
  });

  // 5. ルート読み込み＆表示
  Cesium.GeoJsonDataSource.load('data/route.geojson').then(function (datasource) {

    datasource.entities.values.forEach(function (entity) {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = Cesium.Color.YELLOW;
        entity.polyline.width = 3;
      }
    });

    viewer.dataSources.add(datasource);

    // ルートにズーム
    viewer.zoomTo(datasource);
  }).catch(function (err) {
    console.error('GeoJSON読み込み失敗:', err);
  });

});
