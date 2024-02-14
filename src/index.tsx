import * as esbuild from 'esbuild-wasm';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
  const ref = useRef<any>();
  const iframe = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const cols = 80;
  const rows = 20;

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    // never attempt to do transpiling unless we're 100% sure
    // we've initialized our service
    if (!ref.current) {
      return;
    }

    console.log(ref.current);

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });
    // console.log(result);
    // I'm keeping setCode on for now, but he's not
    // setCode(result.outputFiles[0].text);
    iframe.current.contentWindow.postMessage(result.outputFiles[0].text, '*');
  };
  const html = `
  <html>
    <head></head>
    <body>
      <div id="root"></div>
      <script>
        window.addEventListener('message', (event) => {
          eval(event.data)
        }, false);
      </script>
    </body>
  </html>
  `;
  return (
    <div>
      <textarea
        name=""
        id=""
        cols={cols}
        rows={rows}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
      <iframe
        ref={iframe}
        sandbox="allow-scripts"
        srcDoc={html}
        title="child-code-execution"
      />
    </div>
  );
};

// ReactDOM.render(<App/>, document.querySelector('#root'));

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// root.render(<App />);

// CommonJS: require, module.exports
// ES Modules: import, export
