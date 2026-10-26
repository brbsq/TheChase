// SJK(C) subject names; suggested topics are editable teacher aids, not a syllabus.
export const SUBJECTS=[
 {id:'english',label:'English',language:'English',topics:['English action words and simple sentences','Singular and plural nouns','Articles: a, an and the','Subject and object pronouns','Possessive adjectives and pronouns','The verb to be: am, is and are','Have got and has got','There is and there are','Present simple and daily routines','Present continuous','Past simple: regular and irregular verbs','Past continuous and past simple','Future forms: will and going to','Present perfect: ever, for and since','Adjectives: comparatives and superlatives','Comparisons: as, too and enough','Adverbs of manner and frequency','Prepositions of place and time','Question words: who, what, where, when, why and how','Countable and uncountable nouns','Quantifiers: some, any, much and many','Conjunctions: and, or, but, so and because','Imperatives and instructions','Modal verbs: can and could','Obligation and advice: must, have to and should','Speculation: may, might and could','Used to','First conditional','Passive voice','Reported speech','Question tags','Indefinite pronouns and adverbs']},
 {id:'bahasa-melayu',label:'Bahasa Melayu',language:'Bahasa Melayu',topics:['Kata nama dan kata kerja','Kata adjektif','Penjodoh bilangan','Imbuhan','Pemahaman ayat','Peribahasa']},
 {id:'bahasa-cina',label:'Bahasa Cina',language:'Simplified Chinese',topics:['识字与词语','量词','近义词与反义词','句子理解','标点符号','成语']},
 {id:'matematik',label:'Matematik',language:'Simplified Chinese',topics:['数与数位','加法与减法','乘法与除法','分数','时间与时刻','钱币','长度、质量与容量','空间与形状','数据处理']},
 {id:'sains',label:'Sains',language:'Simplified Chinese',topics:['科学技能','人类与健康','动物','植物','材料','力与运动','电','地球与宇宙']},
 {id:'sejarah',label:'Sejarah',language:'Simplified Chinese',topics:['历史与证据','马来西亚历史人物','国家象征','独立历史','马来西亚各州']},
 {id:'pendidikan-moral',label:'Pendidikan Moral',language:'Simplified Chinese',topics:['尊重与礼貌','诚实','负责任','合作','关爱与感恩']},
 {id:'pendidikan-islam',label:'Pendidikan Islam',language:'Bahasa Melayu',topics:['Akidah','Ibadah','Akhlak','Sirah','Jawi']},
 {id:'pjpk',label:'Pendidikan Jasmani dan Pendidikan Kesihatan',language:'Simplified Chinese',topics:['运动安全','基本运动技能','团队运动','健康饮食','个人卫生']},
 {id:'seni-visual',label:'Pendidikan Seni Visual',language:'Simplified Chinese',topics:['线条与形状','色彩','图案与设计','美术材料与工具']},
 {id:'muzik',label:'Pendidikan Muzik',language:'Simplified Chinese',topics:['节奏','音高','乐器','音乐符号','速度与力度']},
 {id:'rbt',label:'Reka Bentuk dan Teknologi',language:'Simplified Chinese',topics:['设计过程','工具与安全','材料与制作','电路','编程基础']}
];
export function subjectInfo(id='english'){return SUBJECTS.find(s=>s.id===id)||SUBJECTS[0];}
export function moveQuestion(questions,from,to){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=questions.length||to>=questions.length)return false;const [question]=questions.splice(from,1);questions.splice(to,0,question);return true;}
export function preferredController({external=false,builtIn=false,current='keyboard',explicit=false}={}){return explicit?current:external?'phone':builtIn?'camera':current;}
