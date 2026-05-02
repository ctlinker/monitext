import { playGround } from '../play';

playGround.parseError(`
Error: Something went wrong
    at run (/var/www/app/dist/server.js)
    at Object.<anonymous> (C:\\Program Files\\nodejs\\node_modules\\lib\\index.js)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)
    at eval (eval at <anonymous> (/home/cat/dev/project/src/eval.ts), <anonymous>:1:1)
    at async main (https://cdn.example.com/bundle.min.js:1:9932)
    at fetchData (https://example.com/api/client.js:120:17)
    at file:///Users/cat/dev/esm/module.mjs:55:9
    at webpack:///src/components/Button.tsx:77:14
    at vite://localhost/src/main.ts:33:11
    at Object.method (/path/with spaces/and (parentheses)/file name.ts:9:2)
    at fn myfile.ts
    at myfile.ts
    at Promise.all (index 0)
    at async Promise.allSettled (index 2)
    at new Function (<anonymous>)
    at <anonymous>
`);
