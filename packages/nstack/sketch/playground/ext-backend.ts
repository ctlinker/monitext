import { playGround } from './play';

playGround.interpretErrorStack(`
    Error: Something went wrong

        at run (/var/www/app/dist/server.js)

        at Object.<anonymous> (C:\\Program Files\\nodejs\\node_modules\\lib\\index.js)
        at eval (eval at <anonymous> (/home/cat/dev/project/src/eval.ts), <anonymous>:1:1)

        at <anonymous>
    `);
