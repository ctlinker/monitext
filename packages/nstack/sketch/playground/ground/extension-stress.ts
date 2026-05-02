import { playGround } from '../play';

playGround.parseError(`
Error: Something went wrong
    at run (myfile.ts)
    at fn myfile.ts
    at myfile.ts julifis.jxx
    at myfile:2 
    at /server.tsx myfile.ts
    at method.name server.jsx
    at eval (eval at <anonymous> (/home/cat/dev/project/src/eval.js), native:1:1)
`);
