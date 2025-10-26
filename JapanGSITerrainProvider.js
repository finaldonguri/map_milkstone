(function () {
  "use strict";

  const {
    defaultValue,
    defined,
    Credit,
    WebMercatorTilingScheme,
    HeightmapTerrainData,
    TerrainProvider,
    Event,
  } = Cesium;

  const defaultCredit = new Credit("国土地理院");
  const GSI_MAX_TERRAIN_LEVEL = 15;

  function JapanGSITerrainProvider(options) {
    options = defaultValue(options, {});

    this._usePngData = defaultValue(options.usePngData, true);
    this._url = defaultValue(
      options.url,
      "https://cyberjapandata.gsi.go.jp/xyz/dem_png"
    );
    this._proxy = options.proxy;
    this._heightPower = defaultValue(options.heightPower, 1);
    this._tilingScheme = new WebMercatorTilingScheme();

    this._heightmapWidth = 32;
    this._terrainDataStructure = {
      heightScale: 1,
      heightOffset: 0,
      elementsPerHeight: 1,
      stride: 1,
      elementMultiplier: 256,
    };

    this._levelZeroMaximumGeometricError =
      TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
        this._tilingScheme.ellipsoid,
        this._heightmapWidth,
        this._tilingScheme.getNumberOfXTilesAtLevel(0)
      );

    this._errorEvent = new Event();
    this._credit = defaultValue(options.credit, defaultCredit);
    if (typeof this._credit === "string") this._credit = new Credit(this._credit);
  }

  JapanGSITerrainProvider.prototype.requestTileGeometry = function (x, y, level) {
    if (level > GSI_MAX_TERRAIN_LEVEL) level = GSI_MAX_TERRAIN_LEVEL;

    const url = `${this._url}/${level}/${x}/${y}.png`;
    return Cesium.Resource.fetchImage({ url }).then((image) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const img = ctx.getImageData(0, 0, 256, 256).data;

      const size = this._heightmapWidth;
      const heights = new Float32Array(size * size);

      for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
          const px = Math.floor((i / (size - 1)) * 255);
          const py = Math.floor((j / (size - 1)) * 255);
          const idx = (py * 256 + px) * 4;
          const R = img[idx],
            G = img[idx + 1],
            B = img[idx + 2];
          let h = 0;
          if (!(R === 128 && G === 0 && B === 0)) {
            h = (R * 65536 + G * 256 + B);
            if (h > 8388608) h -= 16777216;
            h = h * 0.01;
          }
          heights[j * size + i] = h;
        }
      }

      return new HeightmapTerrainData({
        buffer: heights,
        width: size,
        height: size,
        structure: this._terrainDataStructure,
      });
    });
  };

  JapanGSITerrainProvider.prototype.getLevelMaximumGeometricError = function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };
  JapanGSITerrainProvider.prototype.hasWaterMask = function () {
    return false;
  };
  JapanGSITerrainProvider.prototype.getTileDataAvailable = function () {
    return true;
  };

  Object.defineProperties(JapanGSITerrainProvider.prototype, {
    errorEvent: { get() { return this._errorEvent; } },
    credit: { get() { return this._credit; } },
    tilingScheme: { get() { return this._tilingScheme; } },
    ready: { get() { return true; } },
  });

  Cesium.JapanGSITerrainProvider = JapanGSITerrainProvider;
})();
