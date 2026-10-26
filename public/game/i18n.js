import {MESSAGES} from './translations.js';
export const LANGUAGES=['en','zh','ms'];
// Every visit starts in English; teachers can switch language during the session.
let language='en';
export const interfaceLanguage=()=>language;
const forms=(lang,zh,ms)=>lang==='zh'?zh:ms;
const rules=[
 [/^(\d+) players visible$/,(m,l)=>forms(l,`${m[1]} 名玩家可见`,`${m[1]} pemain kelihatan`)],
 [/^Finish after ([\d.]+) (questions|metres|minutes). Keep jogging through every question.$/,(m,l)=>forms(l,`完成 ${m[1]} ${m[2]==='questions'?'道题':m[2]==='metres'?'米':'分钟'}后结束。每道题都要保持慢跑。`,`Tamat selepas ${m[1]} ${m[2]==='questions'?'soalan':m[2]==='metres'?'meter':'minit'}. Terus berjoging sepanjang setiap soalan.`)],
 [/^(\d+)m clear$/,(m,l)=>forms(l,`领先 ${m[1]} 米`,`Jarak selamat ${m[1]}m`)],
 [/^(\d+) camera devices? available. Enable one in player setup, or pair a phone.$/,(m,l)=>forms(l,`找到 ${m[1]} 个摄像设备。请在玩家设置启用，或配对手机。`,`${m[1]} peranti kamera tersedia. Aktifkan dalam persediaan pemain atau pasangkan telefon.`)],
 [/^P(\d+) ✕ No jump$/,(m,l)=>forms(l,`P${m[1]} ✕ 未跳跃`,`P${m[1]} ✕ Tidak melompat`)],

 [/^(\d+) metres$/,(m,l)=>forms(l,`${m[1]} 米`,`${m[1]} meter`)],
 [/^(\d+) minutes$/,(m,l)=>forms(l,`${m[1]} 分钟`,`${m[1]} minit`)],
 [/^(\d+)s$/,(m,l)=>forms(l,`${m[1]} 秒`,`${m[1]}s`)],

 [/^YEAR (\d+) ENGLISH$/,(m,l)=>forms(l,`${m[1]} 年级英语`,`TAHUN ${m[1]} BAHASA INGGERIS`)],
 [/^(\d+)(?:st|nd|rd|th)$/,(m,l)=>forms(l,`第 ${m[1]} 名`,`Ke-${m[1]}`)],
 [/^(\d+) \/ (\d+) questions$/,(m,l)=>forms(l,`${m[1]} / ${m[2]} 道题`,`${m[1]} / ${m[2]} soalan`)],
 [/^Year (\d+)$/,(m,l)=>forms(l,`${m[1]} 年级`,`Tahun ${m[1]}`)],
 [/^(\d+) players?$/,(m,l)=>forms(l,`${m[1]} 名玩家`,`${m[1]} pemain`)],
 [/^(\d+) questions?$/,(m,l)=>forms(l,`${m[1]} 道题`,`${m[1]} soalan`)],
 [/^(\d+) question sets?$/,(m,l)=>forms(l,`${m[1]} 个题组`,`${m[1]} set soalan`)],
 [/^(\d+) sets?$/,(m,l)=>forms(l,`${m[1]} 个题组`,`${m[1]} set`)],
 [/^(\d+) selected$/,(m,l)=>forms(l,`已选 ${m[1]} 道`,`${m[1]} dipilih`)],
 [/^(\d+) resources?$/,(m,l)=>forms(l,`${m[1]} 项资源`,`${m[1]} sumber`)],
 [/^(\d+) correct$/,(m,l)=>forms(l,`${m[1]} 题答对`,`${m[1]} betul`)],
 [/^(\d+) answered$/,(m,l)=>forms(l,`已答 ${m[1]} 题`,`${m[1]} dijawab`)],
 [/^(\d+) tracked$/,(m,l)=>forms(l,`已追踪 ${m[1]} 人`,`${m[1]} dijejak`)],
 [/^Question (\d+) of (\d+)$/,(m,l)=>forms(l,`第 ${m[1]} 题，共 ${m[2]} 题`,`Soalan ${m[1]} daripada ${m[2]}`)],
 [/^QUESTION (\d+)$/,(m,l)=>forms(l,`第 ${m[1]} 题`,`SOALAN ${m[1]}`)],
 [/^Question (\d+) · (.*)$/,(m,l)=>forms(l,`第 ${m[1]} 题 · ${m[2]}`,`Soalan ${m[1]} · ${m[2]}`)],
 [/^Question (\d+)$/,(m,l)=>forms(l,`第 ${m[1]} 题`,`Soalan ${m[1]}`)],
 [/^Select question (\d+)$/,(m,l)=>forms(l,`选择第 ${m[1]} 题`,`Pilih soalan ${m[1]}`)],
 [/^Answer ([ABC])$/,(m,l)=>forms(l,`答案 ${m[1]}`,`Jawapan ${m[1]}`)],
 [/^Mark answer ([ABC]) as correct$/,(m,l)=>forms(l,`将答案 ${m[1]} 标为正确`,`Tandakan jawapan ${m[1]} sebagai betul`)],
 [/^Draft (\d+)$/,(m,l)=>forms(l,`草稿 ${m[1]}`,`Draf ${m[1]}`)],
 [/^BATCH CONFIRMATION (\d+) OF 3$/,(m,l)=>forms(l,`批次确认 ${m[1]} / 3`,`PENGESAHAN KELOMPOK ${m[1]} DARIPADA 3`)],
 [/^Unsaved batch$/,(m,l)=>forms(l,'未保存的更改','Kelompok belum disimpan')],
 [/^Finish after (\d+) questions. Keep jogging through every question.$/,(m,l)=>forms(l,`完成 ${m[1]} 道题后结束。每道题都要保持慢跑。`,`Tamat selepas ${m[1]} soalan. Terus berjoging sepanjang setiap soalan.`)],
 [/^Race to (\d+) metres. Keep jogging to build distance.$/,(m,l)=>forms(l,`跑到 ${m[1]} 米。持续慢跑以增加距离。`,`Lumba sejauh ${m[1]} meter. Terus berjoging untuk menambah jarak.`)],
 [/^Race for (\d+) minutes. Keep jogging until the timer ends.$/,(m,l)=>forms(l,`比赛 ${m[1]} 分钟。保持慢跑直到计时结束。`,`Berlumba selama ${m[1]} minit. Terus berjoging hingga masa tamat.`)],
 [/^(\d+) players? locked · ready to race$/,(m,l)=>forms(l,`已锁定 ${m[1]} 名玩家 · 准备比赛`,`${m[1]} pemain dikunci · sedia berlumba`)],
 [/^(\d+) \/ (\d+) players detected · tap a person or lock all$/,(m,l)=>forms(l,`已检测 ${m[1]} / ${m[2]} 人 · 点选人物或锁定所有人`,`${m[1]} / ${m[2]} pemain dikesan · ketik orang atau kunci semua`)],
 [/^(\d+) draft questions for a NEW set. Customise the category and title, review the answers, then create it.$/,(m,l)=>forms(l,`新题组有 ${m[1]} 道草稿题目。请调整年级与标题，检查答案后创建。`,`${m[1]} soalan draf untuk set BAHARU. Sesuaikan kategori dan tajuk, semak jawapan, kemudian cipta.`)],
 [/^Choose character (\d+) for player (\d+)$/,(m,l)=>forms(l,`为玩家 ${m[2]} 选择角色 ${m[1]}`,`Pilih watak ${m[1]} untuk pemain ${m[2]}`)],
 [/^P(\d+) (left|right|jump|jog|controls)$/,(m,l)=>`P${m[1]} `+({left:forms(l,'向左','kiri'),right:forms(l,'向右','kanan'),jump:forms(l,'跳跃','lompat'),jog:forms(l,'慢跑','joging'),controls:forms(l,'控制','kawalan')})[m[2]]],
 [/^Preview (.+)$/,(m,l)=>forms(l,`预览 ${m[1]}`,`Pratonton ${m[1]}`)],
 [/^Correct answer: (.*)$/,(m,l)=>forms(l,`正确答案：${m[1]}`,`Jawapan betul: ${m[1]}`)],
 [/^Public library: (.*)$/,(m,l)=>translate('Public library:',l)+' '+translate(m[1],l)],
 [/^Personal library: (.*)$/,(m,l)=>translate('Personal library:',l)+' '+translate(m[1],l)],
 [/^([\d:]+) of racing$/,(m,l)=>forms(l,`比赛用时 ${m[1]}`,`Masa perlumbaan ${m[1]}`)],
 [/^(\d+) saved sets → (\d+) proposed sets$/,(m,l)=>forms(l,`${m[1]} 个已保存题组 → ${m[2]} 个待保存题组`,`${m[1]} set tersimpan → ${m[2]} set dicadangkan`)]
];
export function translate(value,lang=language){if(lang==='en'||!LANGUAGES.includes(lang))return String(value);const raw=String(value),text=raw.trim();let result=MESSAGES[text]?.[lang];if(result===undefined){if(text.includes(' · '))result=text.split(' · ').map(s=>translate(s,lang)).join(' · ');else{for(const [pattern,format] of rules){const match=text.match(pattern);if(match){result=format(match,lang);break;}}}}
 if(result===undefined){const suffix=text.match(/^(.*?)(\s*[→↑↓↗●○♪])$/u);if(suffix&&suffix[1])result=translate(suffix[1],lang)+suffix[2];}
 if(result===undefined){const prefix=text.match(/^([‹›←→↑↓✦✎▤🌐▦▤]+\s*)(.+)$/u);if(prefix)result=prefix[1]+translate(prefix[2],lang);}
 if(result===undefined){for(const [prefix,zh,ms]of [['Batch not saved: ','批次未保存：','Kelompok tidak disimpan: '],['Cloud bank could not load. ','无法加载云端题库。','Bank awan tidak dapat dimuatkan. '],['Google sign-in could not finish: ','Google 登录未完成：','Log masuk Google tidak selesai: '],['Sync unavailable: ','无法同步：','Penyegerakan tidak tersedia: '],['Could not check publication status: ','无法检查发布状态：','Status penerbitan tidak dapat disemak: '],['Update: ','更新：','Kemas kini: '],['Save set: ','保存题组：','Simpan set: '],['Delete set: ','删除题组：','Padam set: '],['Delete Sample: ','删除示例：','Padam Contoh: ']])if(text.startsWith(prefix)){result=(lang==='zh'?zh:ms)+translate(text.slice(prefix.length),lang);break;}}
 return result===undefined?raw:raw.replace(text,result);
}
const textState=new WeakMap(),attrState=new WeakMap();
const SKIP='script,style,[data-i18n-skip],#language-select,#account-name,#community-preview-title,#question-text,#question-explanation';
function translateText(node){if(!node.parentElement||node.parentElement.closest('textarea,'+SKIP))return;const prior=textState.get(node),source=prior&&node.nodeValue===prior.rendered?prior.source:node.nodeValue;if(!source.trim())return;const rendered=translate(source);textState.set(node,{source,rendered});if(node.nodeValue!==rendered)node.nodeValue=rendered;}
function translateAttributes(el){if(el.closest(SKIP))return;if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.setAttribute('value',el.value);let states=attrState.get(el);if(!states){states=new Map();attrState.set(el,states);}for(const attr of ['aria-label','placeholder','title']){const current=el.getAttribute(attr);if(current===null)continue;const prior=states.get(attr),source=prior&&current===prior.rendered?prior.source:current,rendered=translate(source);states.set(attr,{source,rendered});if(current!==rendered)el.setAttribute(attr,rendered);}}
function visit(root){if(root.nodeType===3){translateText(root);return;}if(root.nodeType!==1||root.closest(SKIP))return;translateAttributes(root);for(const child of root.childNodes)visit(child);}
export function setLanguage(value){if(!LANGUAGES.includes(value))return;language=value;if(typeof document!=='undefined'){document.documentElement.lang=value==='zh'?'zh-Hans':value;visit(document.body);window.dispatchEvent(new CustomEvent('chase-language',{detail:value}));}}
export function startI18n(){const select=document.querySelector('#language-select');select.value=language;select.onchange=()=>setLanguage(select.value);document.documentElement.lang=language==='zh'?'zh-Hans':language;visit(document.body);const observer=new MutationObserver(records=>{const roots=new Set();for(const record of records){if(record.type==='childList')record.addedNodes.forEach(node=>roots.add(node));else roots.add(record.target);}for(const root of roots)if(root.isConnected)visit(root);});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});}
