// Cesium ionのアクセストークン（今は使わないけど置いておいてOK）
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0';

window.addEventListener('DOMContentLoaded', function () {
  console.log('ページ読み込み完了');

  // 情報パネル
  var infoDiv = document.createElement('div');
  infoDiv.id = 'info';
  infoDiv.innerHTML = '<h3>高室山ルート</h3><p>初期化中...</p>';
  document.body.appendChild(infoDiv);

  console.log('Cesiumビューワー作成開始');

  var viewer = new Cesium.Viewer('mapdiv', {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: true,
    geocoder: false,
    homeButton: true,
    navigationHelpButton: false,
    sceneModePicker: false,
    scene3DOnly: true,
    timeline: false,

    // ←ここをついにJapanGSITerrainProvider版に変える
    terrainProvider: new Cesium.JapanGSITerrainProvider({
        heightPower: 1.0,
        url: 'https://cyberjapandata.gsi.go.jp/xyz/dem/'
    }),

    // 色別標高図タイル
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      credit: '国土地理院 色別標高図'
    })
  });

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(



        136.3,    // 経度（←あなたの山の経度に置き換えて）
        35.2,     // 緯度（←あなたの山の緯度に置き換えて）
        2000.0    // 上空高さ[m]。2000とか3000ぐらいにすると局所ズームになる
    ),
    orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-45.0),
        roll: 0.0
    }
});

  console.log('Cesiumビューワー作成完了');

  // 標準地図を半透明でオーバーレイ
  var stdLayer = viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
      credit: '国土地理院 標準地図'
    })
  );
  stdLayer.alpha = 0.9;

  infoDiv.innerHTML = '<h3>高室山ルート</h3><p>GeoJSON読み込み中...</p>';

  var routePath = 'data/route.geojson';
  console.log('GeoJSON読み込み開始:', routePath);

  Cesium.GeoJsonDataSource.load(routePath).then(function (dataSource) {
    console.log('GeoJSON読み込み成功');

    viewer.dataSources.add(dataSource);

    var entities = dataSource.entities.values;
    console.log('エンティティ数:', entities.length);

    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];

      if (entity.polyline) {
        entity.polyline.material = Cesium.Color.RED;
        entity.polyline.width = 5;
        // clampToGround は古いビルドだと無いことがあるので、必要なら後で戻す
        // entity.polyline.clampToGround = true;
      }

      if (entity.position) {
        entity.point = new Cesium.PointGraphics({
          pixelSize: 10,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2
        });

        if (i === 0) {
          entity.point.pixelSize = 15;
          entity.point.color = Cesium.Color.GREEN;
        }

        if (i === entities.length - 1) {
          entity.point.pixelSize = 15;
          entity.point.color = Cesium.Color.BLUE;
        }
      }
    }

    infoDiv.innerHTML =
      '<h3>高室山ルート</h3>' +
      '<p>ポイント数: ' + entities.length + '</p>' +
      '<p><small>地形: 平坦(テスト)</small></p>';

    viewer.zoomTo(
      dataSource,
      new Cesium.HeadingPitchRange(
        0,
        -0.5,
        1500 // ちょい近め
      )
    );
  }).catch(function (error) {
    console.error('GeoJSON読み込みエラー:', error);
    infoDiv.innerHTML =
      '<h3>エラー</h3>' +
      '<p>ルートの読み込みに失敗しました</p>' +
      '<p>エラー: ' + error.message + '</p>';
  });
});
