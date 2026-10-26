import {pathToFileURL} from 'node:url';
export async function retirePagesDeployments({request,sha,published=false}){
 const head=await request('/git/ref/heads/main');if(head.object?.sha!==sha)throw Error('A newer main commit exists; refusing to change deployment statuses.');
 const deployments=[];for(let page=1;;page++){const batch=await request('/deployments?environment=github-pages&per_page=100&page='+page);deployments.push(...batch);if(batch.length<100)break;}
 const current=deployments.find(d=>d.sha===sha);if(!current)throw Error('Current Pages deployment was not found.');
 const state=await request(`/deployments/${current.id}/statuses?per_page=1`);if(state[0]?.state!=='success'&&!(published&&['in_progress','queued','pending'].includes(state[0]?.state)))throw Error('Current Pages deployment is not successful; preserving previous deployments.');
 let retired=0;for(const deployment of deployments){if(deployment.id===current.id||deployment.sha===sha||deployment.environment!=='github-pages'||deployment.created_at>current.created_at)continue;
  const statuses=await request(`/deployments/${deployment.id}/statuses?per_page=1`);if(statuses[0]?.state!=='success')continue;
  await request(`/deployments/${deployment.id}/statuses`,'POST',{state:'inactive',environment:'github-pages',description:'Superseded by the current main release.',auto_inactive:false});retired++;
 }return retired;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {GITHUB_TOKEN,GITHUB_REPOSITORY,GITHUB_SHA}=process.env;if(!GITHUB_TOKEN||!GITHUB_REPOSITORY||!GITHUB_SHA)throw Error('GitHub deployment environment is missing.');
 const request=async(path,method='GET',body)=>{const response=await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}${path}`,{method,headers:{Authorization:`Bearer ${GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw Error(`Deployment API request failed: ${response.status} ${path}`);return response.json();};
 console.log(`Retired ${await retirePagesDeployments({request,sha:GITHUB_SHA,published:process.env.PAGES_DEPLOYMENT_SUCCESS==='true'})} older Pages deployments.`);
}
