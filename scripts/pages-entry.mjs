// Keep the root entry stable: it asks for the latest manifest on every visit.
export function latestGameURL(href,version){
 const current=new URL(href),target=new URL('./game/',current);target.search=current.search;target.searchParams.delete('release');target.searchParams.set('v',version);target.hash=current.hash;return target.href;
}
export function pagesEntryHTML(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>The Chase</title></head><body><a id="open-game" href="./game/">Open The Chase</a><script>
const latestGameURL=${latestGameURL.toString()};
(async()=>{let version='fresh-'+Date.now();try{const response=await fetch('./release.json?check='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('Release unavailable');const release=await response.json();if(!/^[a-f0-9]{12}$/.test(release.version))throw Error('Invalid release');version=release.version;}catch{}const target=latestGameURL(location.href,version);document.getElementById('open-game').href=target;location.replace(target);})();
</script></body></html>`;}
