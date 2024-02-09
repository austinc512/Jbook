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
      // index route
      build.onLoad({ filter: /^index\.js$/ }, (args: any) => {
        console.log('onLoad', args);
        return {
          loader: 'jsx',
          contents: inputCode,
        };
      });
      // check cache
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );
        if (cachedResult) {
          return cachedResult;
        }
      });
      // CSS files
      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        console.log('onLoad', args);
        console.log(args.path);
        const { data, request } = await axios.get(args.path);

        const escaped = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");
        const contents = `
          const style = document.createElement('style')
          style.innerText = '${escaped}';
          document.head.appendChild(style)    
              `;
        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
      // JS files
      build.onLoad({ filter: /.*/, namespace: 'a' }, async (args: any) => {
        console.log('onLoad', args);
        console.log(args.path);
        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
    },
  };
};
