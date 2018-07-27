const path = require('path');

class MsntSplitChunksManifestPlugin {
  constructor(options) {
    const defaults = {
      dist: '', // place where config will be stored (should be relative to output folder)
      distPath: '', // path to add to files path
      ext: 'js',
      name: 'manifest.json',
      rtlDist: 'rtl/', // same ad "dist" but for RTL
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
        const mapping = {};

        for (const entry of compilation.entrypoints) {
          const [key, value] = entry;

          mapping[key] = [];

          value
            .getFiles()
            .filter(file => file.endsWith(`.${this.options.ext}`))
            .forEach(file => {
              mapping[key].push(this.options.distPath + file);
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

        compilation.assets[`${this.options.dist}${this.options.name}`] = {
          source() {
            return data;
          },
          size() {
            return data.length;
          }
        };

        if (this.options.ext === 'css' && this.options.rtl) {
          const mappingRtl = Object.assign({}, mapping);

          for (let i in mappingRtl) {
            mappingRtl[i] = mappingRtl[i].map(
              file =>
                path.dirname(file) +
                '/' +
                this.options.rtlDist +
                path.basename(file)
            );
          }

          const dataRtl = JSON.stringify(mappingRtl);

          compilation.assets[`${this.options.rtlDist}${this.options.name}`] = {
            source() {
              return dataRtl;
            },
            size() {
              return dataRtl.length;
            }
          };
        }

        cb();
      }
    );
  }
}

module.exports = MsntSplitChunksManifestPlugin;
