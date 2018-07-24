class MsntSplitChunksManifestPlugin {
  constructor(options) {
    const defaults = {
      dist: '',
      ext: 'js',
      name: 'manifest.json'
    };

    this.options = Object.assign(defaults, options);
  }

  apply(compiler) {
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
              mapping[key].push(file);
            });
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

        cb();
      }
    );
  }
}

module.exports = MsntSplitChunksManifestPlugin;
