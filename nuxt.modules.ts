import { resolve, sep, basename } from 'pathe';
import fs from 'fs';
import { addPlugin, addLayout, useNuxt } from '@nuxt/kit';
import glob from 'glob';

export default {
  dirname: '',
  moduleName() {
    return basename(resolve(this.dirname));
  },
  config() {
    try {
      return require(resolve(this.dirname + '/config.json'));
    } catch (e) {
      return {};
    }
  },

  /**
   * Generate module routes from directory & JSON config file
   */
  registerRoutes() {
    const config: any = this.config();
    const dirname: string = this.dirname;
    return {
      'pages:extend'(pages: Array<object>) {
        const files: string[] = glob.sync('./**/*.vue', {
          cwd: `${dirname}/pages`,
        });

        const setPath = (pageName: string, file: string) => {
          if (/^\.\/.*(-\w+\.vue)$/.test(file) == false) {
            let p = `/${resolve(dirname).split(sep).pop()}${pageName
              .replace('/index', '')
              .replace(/\[\.\.\.((?:[a-z|0-9]*))+\]/g, ':$1(.*)*')
              .replace(/\[((?:[a-z|0-9]*))+\]/g, ':$1')}`;

            let slugs: any = p.match(/(?:\/\b_\w+\b(?!\.vue))/g);
            let n = `${resolve(dirname).split(sep).pop()}${
              /index$/g.test(pageName) && !/\[|_/.test(pageName)
                ? pageName
                    .replace(/\//g, '-')
                    .replace(/index$/g, '')
                    .replace(/-$/, '')
                : '-' + pageName.replace(/^\/|\]|\[\.\.\.|\[|\/index/g, '').replace(/\/\[|\//gi, '-')
            }`;
            let names: any = n.match(/(?:-\b_\w+\b(?!\.vue))/g);
            p = p.replace(/(?:\/\b_\w+\b(?!\.vue))/g, '');
            n = n.replace(/(?:-\b_\w+\b(?!\.vue))/g, '');
            if (slugs) {
              for (var i = slugs.length - 1; i >= 0; i--) {
                p = `${slugs[i].replace(/_/g, ':')}${p}`;
              }
            }
            if (names) {
              for (var i = names.length - 1; i >= 0; i--) {
                n = `${names[i].replace(/-_/g, '')}-${n}`;
              }
            }
            pages.unshift({
              name: n,
              path: p,
              file: resolve(dirname, `./pages/${file}`),
            });
          }
        };
        if (config.routes) {
          config.routes.forEach((route: any) => {
            pages.unshift({
              name: route?.name || dirname,
              path: route.path.replace(/\/$/g, '') + '/',
              file: resolve(dirname, `./pages/${route.page}`),
            });
          });
        }
        for (const file of files) {
          const pageName: string = file.replace(/^./, '').replace(/.vue/, '');
          setPath(pageName, file);
        }
      },
    };
  },
  /**
   * Generate module server middleware from JSON config file
   */
  registerMiddlewares() {
    const plugins: string[] = glob.sync('**/!(-)*.ts', {
      cwd: `${this.dirname}/middleware`,
    });
    return plugins.forEach((file) => {
      addPlugin(resolve(`${this.dirname}/middleware/${file}`));
    });
  },
  /**
   * Register locales
   */
  registerLocales() {
    const dirname: any = this.dirname;
    const moduleName: string = this.moduleName();
    return {
      'i18n:extend-messages'(additionalMessages: any) {
        const files: string[] = glob.sync('*.json', {
          cwd: `${dirname}/locales`,
        });
        for (const file of files) {
          const translation = require(resolve(dirname + '/locales', file));
          additionalMessages.unshift({
            [file.replace(/.json$/, '')]: {
              [moduleName.toUpperCase()]: translation,
            },
          });
        }
      },
    };
  },
  /**
   * Register module component
   */
  registerComponents() {
    const dirname: any = this.dirname;
    const moduleName: string = this.moduleName();
    return {
      'components:dirs'(dirs: Array<object>) {
        // Add ./components dir to the list
        dirs.push({
          path: resolve(dirname, './components'),
          prefix: moduleName,
        });
      },
    };
  },
  /**
   * Register autoimport composables (ts files)
   */
  registerComposables() {
    const dirname: string = this.dirname;
    const autoImports: { [key: string]: string[] } = {};
    const padding = ' '.repeat(4);
    const basePath = resolve('./');
    return {
      'imports:extend'(composableImport: any) {
        autoImports.composables = composableImport.map((autoImport: any) => {
          if (autoImport.as) return autoImport.as!.toString();
          return autoImport.name.toString();
        });
      },
      'modules:done'() {
        const filename = '.eslintrc.modules.json';
        const fullPath = resolve(basePath, filename);

        const getContents = () => {
          // To prevent formatter accidentally fix padding of template string
          let contents = '';
          contents += '{\n';
          contents += '  "globals": {';
          for (const autoImport in autoImports) {
            autoImports[autoImport].forEach((imp) => {
              contents += '\n';
              contents += `${padding}"${imp}": "readonly",`;
            });
          }
          contents = `${contents.slice(0, -1)}\n`;
          contents += '  }\n';
          contents += '}\n';
          return contents;
        };

        fs.writeFile(fullPath, getContents(), function (err) {
          if (err) throw err;
        });
      },
      'imports:dirs'(dirs: any) {
        dirs.unshift(resolve(dirname, './composables'));
        dirs.unshift(resolve(dirname, './utils'));
        dirs.unshift(resolve(dirname, './stores'));
      },
    };
  },
  /**
   * Register plugins
   */
  registerPlugins() {
    const plugins: string[] = glob.sync('**/!(-)*.ts', {
      cwd: `${this.dirname}/plugins`,
    });
    return plugins.forEach((file) => {
      addPlugin(resolve(`${this.dirname}/plugins/${file}`));
    });
  },
  /**
   * Register global layouts
   */
  registerLayouts() {
    const layouts: string[] = glob.sync('**/!(-)*.vue', {
      cwd: `${this.dirname}/layouts`,
    });

    /** add layouts */
    layouts.forEach((file) => {
      addLayout(resolve(`${this.dirname}/layouts/${file}`), file.replace(/.vue$/gi, ''));
    });
  },
  /**
   * Register module alias
   */
  registerAlias() {
    let config: any = this.config();
    /** register env var */
    let envs =
      process.env.NODE_ENV !== 'production' && config.envDev && !process.env.DEBUG ? config.envDev : config.env;
    useNuxt().options.alias['@' + this.moduleName().toLocaleUpperCase()] = resolve(this.dirname);
    useNuxt().options.runtimeConfig = {
      ...envs,
      ...useNuxt().options.runtimeConfig,
    };
    useNuxt().options.runtimeConfig.public = {
      ...envs,
      ...useNuxt().options.runtimeConfig.public,
    };
  },
  /**
   * Return module hooks
   */
  hooks() {
    return {
      ...this.registerRoutes(),
      ...this.registerComponents(),
      ...this.registerLocales(),
      ...this.registerComposables(),
    };
  },
  setup(options: any, nuxt: any) {
    this.registerAlias();
    this.registerPlugins();
    this.registerMiddlewares();
    this.registerLayouts();
  },
};
