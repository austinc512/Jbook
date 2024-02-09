import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
  name: 'filecache',
});

export const fetchPlugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /.*/, namespace: 'a' }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode,
          };
        } else {
          // check to see if we've already fetched this file
          // and if it's in the cache
          const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
            args.path
          );
          // if so, return it immediately
          if (cachedResult) {
            return cachedResult;
          }
          // else request the package
          console.log(args.path);
          const { data, request } = await axios.get(args.path);
          let result: esbuild.OnLoadResult;
          if (args.path.match(/.css$/)) {
            console.log(`MATCHED CSS`);
            result = {
              loader: 'css',
              contents: data,
              resolveDir: new URL('./', request.responseURL).pathname,
            };
          } else {
            result = {
              loader: 'jsx',
              contents: data,
              resolveDir: new URL('./', request.responseURL).pathname,
            };
          }

          // store response in cache
          await fileCache.setItem(args.path, result);
          return result;
        }
      });
    },
  };
};
