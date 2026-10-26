import {pagesEntryHTML} from './pages-entry.mjs';
import {versionAssets} from './version-assets.mjs';
import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('dist');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp('public',out,{recursive:true});
await writeFile(resolve(out,'index.html'),pagesEntryHTML());
await writeFile(resolve(out,'.nojekyll'),'');
const html=await readFile(resolve(out,'game/index.html'),'utf8');if(/(?:src|href)=["']\/(?!\/)/.test(html))throw Error('Root-relative asset links cannot be published on a GitHub project page.');
const version=await versionAssets(resolve(out,'game'));await writeFile(resolve(out,'release.json'),JSON.stringify({version})+'\n');console.log('GitHub Pages static game built in dist/ · '+version);
