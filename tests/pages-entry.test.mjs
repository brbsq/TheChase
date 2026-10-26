import test from 'node:test';import assert from 'node:assert/strict';import {latestGameURL,pagesEntryHTML} from '../scripts/pages-entry.mjs';
test('canonical entry opens current build and retires stale release query labels',()=>{
 const url=new URL(latestGameURL('https://brbsq.github.io/TheChase/?release=old&v=older','abcdef123456'));assert.equal(url.pathname,'/TheChase/game/');assert.equal(url.searchParams.get('v'),'abcdef123456');assert.equal(url.searchParams.has('release'),false);
});
test('release redirect preserves pairing hashes and supported query parameters',()=>{
 const url=new URL(latestGameURL('https://brbsq.github.io/TheChase/index.html?pin=123456&release=old#camera=pair-id','abcdef123456'));assert.equal(url.pathname,'/TheChase/game/');assert.equal(url.searchParams.get('pin'),'123456');assert.equal(url.hash,'#camera=pair-id');
});
test('stable entry checks an uncached release manifest and has a fresh fallback',()=>{const html=pagesEntryHTML();assert.match(html,/cache:'no-store'/);assert.match(html,/release\.json\?check=/);assert.match(html,/fresh-.*Date.now/);assert.match(html,/location.replace\(target\)/);});
