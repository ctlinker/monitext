import { playGround } from '../play';

playGround.parseError(String.raw`
    Error: Something went wrong
    
        at Object.<anonymous> (/home/cat/dev/project/src/index.ts:12:5)
        at Module._compile (node:internal/modules/cjs/loader:1256:14)
        at Module._extensions..js (node:internal/modules/cjs/loader:1310:10)

        at run (/var/www/app/dist/server.js:88:23)
        at processTicksAndRejections (node:internal/process/task_queues:96:5)

        at C:\Users\cat\Desktop\test project\app.js:42:13
        at Object.<anonymous> (C:\Program Files\nodejs\node_modules\lib\index.js:10:2)

        at fetchData (https://example.com/api/client.js:120:17)
        at async main (https://cdn.example.com/bundle.min.js:1:9932)

        at file:///Users/cat/dev/esm/module.mjs:55:9
        at file:///C:/Users/cat/dev/esm/windows.mjs:101:33

        at blob:https://example.com/3f1c9d2a-aaaa-bbbb-cccc-ddddeeeeffff:23:7

        at eval (eval at <anonymous> (/home/cat/dev/project/src/eval), <anonymous>:1:1)
        at eval (eval at run (C:\dev\app\runner.js:22:5), <anonymous>:5:10)

        at new Function (<anonymous>)
        at Function.executeUserCode (node:vm:132:12)

        at webpack:///src/components/Button.tsx:77:14
        at webpack:///(webpack)/bootstrap:19:1

        at vite://localhost/src/main.ts:33:11
        at http://localhost:5173/src/App.tsx?t=1680000000000:45:21

        at async Promise.all (index 0)
        at async Promise.allSettled (index 2)

        at some weird line without coords
        at another:broken:line
        at maybe (missing:coord)

        at /path/with spaces/and (parentheses)/file name.ts:9:2

        at /path/with spaces and file name.ts:9:2
        at C:\path with spaces\file (copy).js:100:20

        at mixed://protocol/that/isnt/real:12:34
        at /trailing/colon/path.ts:
        at C:\weird\windows\path.js:
        at index.ts:22

        at internal/process/execution.js:80:27
        at node:internal/main/run_main_module:23:47

        at <anonymous>
        eval (eval at processJob (eval at bootstrap (eval at c (/home/cat/dev/project/src/eval.ts:13), <anonymous>:1:1), worker.js:5:2), runner.js:12:8)
    `);
