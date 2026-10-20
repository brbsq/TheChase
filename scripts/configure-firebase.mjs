import {readFile,writeFile} from 'node:fs/promises';
// This accepts the public Web SDK config, never a service-account credential.
const config=JSON.parse(await readFile(process.argv[2]||'/dev/stdin','utf8'));
for(const key of ['apiKey','authDomain','databaseURL','projectId','appId'])if(typeof config[key]!=='string'||!config[key])throw Error('Missing Firebase web config field: '+key);
if(config.private_key||config.type==='service_account')throw Error('Use the public Firebase Web SDK config, not a service account.');
const keys=['apiKey','authDomain','databaseURL','projectId','storageBucket','messagingSenderId','appId','measurementId'];const publicConfig=Object.fromEntries(keys.filter(k=>config[k]).map(k=>[k,config[k]]));
await writeFile('public/game/firebase-config.js','// Public Firebase Web SDK config. Access is protected by database rules.\nexport const firebaseConfig = '+JSON.stringify(publicConfig,null,2)+';\n');
await writeFile('.firebaserc',JSON.stringify({projects:{default:config.projectId}},null,2)+'\n');console.log('Linked Firebase web app: '+config.projectId);
