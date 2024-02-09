import * as esbuild from 'esbuild-wasm';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // handle root entry file of 'index.js'
      build.onResolve({ filter: /^index\.js$/ }, (args: any) => {
        console.log('onResolve', args);
        return { path: args.path, namespace: 'a' };
      });
      // handle relative paths in a module
      build.onResolve({ filter: /^\.+\// }, (args: any) => {
        console.log('onResolve', args);
        return {
          namespace: 'a',
          path: new URL(args.path, 'http://unpkg.com' + args.resolveDir + '/')
            .href,
        };
      });
      // handle main file of a module
      // in case we have some trouble with some root module name, come back here
      // also, the instructor still has this marked async, but I do not.
      build.onResolve({ filter: /.*/ }, (args: any) => {
        console.log('onResolve', args);
        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`,
        };
      });
    },
  };
};
