import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('dist');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp('public',out,{recursive:true});
await writeFile(resolve(out,'index.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>The Chase</title></head><body><a href="./game/">Open The Chase</a><script>location.replace(new URL("./game/"+location.search+location.hash,location.href).href)</script></body></html>');
await writeFile(resolve(out,'.nojekyll'),'');
const html=await readFile(resolve(out,'game/index.html'),'utf8');if(/(?:src|href)=["']\/(?!\/)/.test(html))throw Error('Root-relative asset links cannot be published on a GitHub project page.');
console.log('GitHub Pages static game built in dist/');
