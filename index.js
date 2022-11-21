const path = require('path');

class MsntSplitChunksManifestPlugin {
  constructor(options) {
    const defaults = {
      dist: '', // place where config will be stored (should be relative to output folder)
      distPath: '', // path to add to files path
      ext: 'js',
      name: 'manifest.json',
      nameLazy: 'manifest-lazy.json',
      rtlDist: 'rtl/', // same ad "dist" but for RTL
      rtl: true,
      checkEmptyRegExp: /html\.svg-build\{.*?\}/g, // RegExp to remove content file and check is it empty (by default removed "html.svg-build{}" blocks)
      checkSourceMapRegExp: /\/\*#\s*?sourceMappingURL=.*?\s*?\*\//,
      skipEmptyCSSEntries: true,
      commonPagesMapping: null,
      ignoreInitialLazyFiles: true,
    };

    if (
      defaults.checkEmptyRegExp &&
      !(defaults.checkEmptyRegExp instanceof RegExp)
    ) {
      throw new Error(
        '"checkEmptyRegExp" should be either falsy or instance of RegExp'
      );
    }

    this.options = Object.assign(defaults, options);
  }

  apply(compiler) {
    const commonPagesMapping = this.options.commonPagesMapping;

    compiler.hooks.emit.tapAsync(
      'MsntSplitChunksManifestPlugin',
      (compilation, cb) => {
        const mapping = {};
        const mappingLazy = {};

        for (const entry of compilation.entrypoints) {
          const [key, value] = entry;

          const isLazy = key.startsWith('lazy__');

          let files = value
            .getFiles()
            .filter(file => file.endsWith(`.${this.options.ext}`));
          
          if (this.options.ignoreInitialLazyFiles && isLazy) {
            files = files.slice(0, -1);
            
            if (!files.length) continue;
          };
          
          if (isLazy) {
            mappingLazy[key] = [];
          } else {
            mapping[key] = [];
          }

          files
            .forEach(file => {
              if (
                this.options.ext === 'css' &&
                this.options.skipEmptyCSSEntries
              ) {
                let source = compilation.assets[file].source();

                // check whether only content of file is html
                if (this.options.checkEmptyRegExp) {
                  source = source.replace(this.options.checkEmptyRegExp, '');
                }
                // check whether only content of file is sourceMap
                if (this.options.checkSourceMapRegExp) {
                  source = source.replace(this.options.checkSourceMapRegExp, '');
                }

                // skip empty entry css files
                if (!source.trim().length) return;
              }

              if (isLazy) {
                mappingLazy[key].push(this.options.distPath + file);
              } else {
                mapping[key].push(this.options.distPath + file);
              }
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
        const dataLazy = JSON.stringify(mappingLazy);

        compilation.assets[`${this.options.dist}${this.options.name}`] = {
          source() {
            return data;
          },
          size() {
            return data.length;
          },
        };
        compilation.assets[`${this.options.dist}${this.options.nameLazy}`] = {
          source() {
            return dataLazy;
          },
          size() {
            return dataLazy.length;
          },
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

          const mappingLazyRtl = Object.assign({}, mappingLazy);
          for (let i in mappingLazyRtl) {
            mappingLazyRtl[i] = mappingLazyRtl[i].map(
              file =>
                path.dirname(file) +
                '/' +
                this.options.rtlDist +
                path.basename(file)
            );
          }

          const dataRtl = JSON.stringify(mappingRtl);
          const dataLazyRtl = JSON.stringify(mappingLazyRtl);

          compilation.assets[`${this.options.rtlDist}${this.options.name}`] = {
            source() {
              return dataRtl;
            },
            size() {
              return dataRtl.length;
            },
          };
          compilation.assets[`${this.options.rtlDist}${this.options.nameLazy}`] = {
            source() {
              return dataLazyRtl;
            },
            size() {
              return dataLazyRtl.length;
            },
          };
        }

        cb();
      }
    );
  }
}

module.exports = MsntSplitChunksManifestPlugin;
