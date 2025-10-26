// takamuro.js
// Cesium が内部アセット(Workers, Assets, ThirdParty, Widgetsなど)を探す基準パスを指定してあげる
// "./Build/Cesium/" は index.html からの相対パス
if (Cesium.buildModuleUrl && Cesium.buildModuleUrl.setBaseUrl) {
    Cesium.buildModuleUrl.setBaseUrl("./Build/Cesium/");
}

// まずCesiumのIonキーを無効にしておく（Cesiumのデフォルトで怒られることがあるため）
// 無くても動く場合は消してOK
if (Cesium.Ion) {
    Cesium.Ion.defaultAccessToken = "";
}

// 背景に使う地理院タイル（色別標高図など）
// relief タイルは陰影＋色分けされていて山の形がわかりやすい
const gsiImagery = new Cesium.UrlTemplateImageryProvider({
    url: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png",
    credit: "国土地理院 色別標高図"
});

// 地形（高さ）プロバイダ
// JapanGSITerrainProvider はあなたが用意したスクリプト側で
// CesiumのTerrainProvider互換オブジェクトとして定義されている想定
// 変更前：const gsiTerrain = new JapanGSITerrainProvider();
const gsiTerrain = new Cesium.JapanGSITerrainProvider({
    url: "https://cyberjapandata.gsi.go.jp/xyz/dem/"
});

// Cesium Viewer本体をつくる。
// 注意: container のIDは index.html 側と一致させること("mapdiv")
const viewer = new Cesium.Viewer("mapdiv", {
    imageryProvider: gsiImagery,
    terrainProvider: gsiTerrain,

    // UIのオプション（いらなければtrue/falseで調整OK）
    baseLayerPicker: false,
    geocoder: false,
    homeButton: true,
    timeline: false,
    animation: false,
    fullscreenButton: true,
    sceneModePicker: true,
    navigationHelpButton: false
});

// ----------------------
// カメラ初期位置を高室山へ
// ----------------------
//
// 経度・緯度・高度[m] を設定する。
// 経度: 東経は+ / 緯度: 北緯は+ / 高度はカメラの距離イメージ。
//
// 下は例としての座標（仮）。あなたの高室山の座標に置き換えてください。
// もし既に高室山の正確な座標を把握してるなら、それを使う。
// ズームしすぎて真っ黒になるなら高度を少し上げて(4000→8000とか)再トライ。
//
const takamuroLon = 136.305;   // 経度(例)
const takamuroLat = 35.2545;   // 緯度(例)
const cameraHeight = 3000.0;   // カメラ高度[m]目安

viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
        takamuroLon,
        takamuroLat,
        cameraHeight
    ),
    orientation: {
        heading: Cesium.Math.toRadians(0.0),     // 方位 0度 = 北向き
        pitch: Cesium.Math.toRadians(-45.0),     // 下向きに45度
        roll: 0.0
    }
});

// スムーズに寄りたい場合は flyTo でもOK （setView の代わりにこっちを使う）
// viewer.camera.flyTo({
//     destination: Cesium.Cartesian3.fromDegrees(
//         takamuroLon,
//         takamuroLat,
//         cameraHeight
//     ),
//     orientation: {
//         heading: Cesium.Math.toRadians(0.0),
//         pitch: Cesium.Math.toRadians(-45.0),
//         roll: 0.0
//     }
// });

// 地形がちゃんと盛り上がっているか確認しやすいように、地平線の霧などを少し弱めることも可能。
// （必要になったらここに viewer.scene.globe.depthTestAgainstTerrain = true; とか調整を足していける）
