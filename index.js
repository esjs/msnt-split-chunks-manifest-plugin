class MsntSplitChunksManifestPlugin {
  constructor(options) {
    const defaults = {
      dist: '',
      ext: 'js',
      name: 'manifest.json',
      rtlDist: 'rtl/',
      rtl: true,
      commonPagesMapping: null
    };

    this.options = Object.assign(defaults, options);
  }

  apply(compiler) {
    const commonPagesMapping = this.options.commonPagesMapping;

    compiler.hooks.emit.tapAsync(
      'MsntSplitChunksManifestPlugin',
      (compilation, cb) => {
        const mapping = {},
          mappingRtl = {};

        for (const entry of compilation.entrypoints) {
          const [key, value] = entry;

          mapping[key] = [];

          value
            .getFiles()
            .filter(file => file.endsWith(`.${this.options.ext}`))
            .forEach(file => {
              mapping[key].push(file);
            });

          if (
            commonPagesMapping &&
            commonPagesMapping[key] &&
            commonPagesMapping[key].length
          ) {
            commonPagesMapping[key].forEach(additionalEntry => {
              mapping[additionalEntry] = mapping[key].slice();
            });
          }
        }

        const data = JSON.stringify(mapping);
        const dataRtl = JSON.stringify(mappingRtl);

        compilation.assets[`${this.options.dist}${this.options.name}`] = {
          source() {
            return data;
          },
          size() {
            return data.length;
          }
        };

        if (this.options.ext === 'css' && this.options.rtl) {
          compilation.assets[`${this.options.rtlDist}${this.options.name}`] = {
            source() {
              return data;
            },
            size() {
              return data.length;
            }
          };
        }

        cb();
      }
    );
  }
}

module.exports = MsntSplitChunksManifestPlugin;
