import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
// Version the complete graph together to preserve shared module singletons.
export async function versionAssets(root){
 const files=[];async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await visit(path);else if(/\.(?:js|css|html)$/.test(entry.name))files.push(path);}}await visit(root);files.sort();
 const sources=await Promise.all(files.map(async path=>({path,text:await readFile(path,'utf8')}))),hash=createHash('sha256');for(const source of sources)hash.update(relative(root,source.path)).update('\0').update(source.text);const version=hash.digest('hex').slice(0,12);
 for(const {path,text}of sources){let output=text;if(path.endsWith('.js'))output=output.replace(/(\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])(\.{1,2}\/[^'"\n]+\.js)\2/g,(_,prefix,quote,url)=>prefix+quote+url+'?v='+version+quote);if(path.endsWith('.html'))output=output.replace(/((?:src|href)=["'])(\.\/[^"']+\.(?:js|css))(["'])/g,(_,prefix,url,quote)=>prefix+url+'?v='+version+quote);if(output!==text)await writeFile(path,output);}
 return version;
}
