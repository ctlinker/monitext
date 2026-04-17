import { playGround } from '../play';

playGround.parseError(`
Error: Something went wrong
    at run (myfile.ts)
    at fn myfile.ts
    at myfile.ts julifis.jxx
`);
