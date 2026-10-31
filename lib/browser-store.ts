import {EXERCISES,today,type State,type Entry} from './fitness';
type Overlay={entries:Entry[];deleted:Record<string,string>;days:{date:string;complete:boolean;updatedAt:string}[];profile?:State['profile'];revision?:number;updatedAt?:string};
const PREFIX='daily-fit-v2';let secret='',current:State;
const toBytes=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const b64=(b:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(b)));
async function cryptoKey(){return crypto.subtle.importKey('raw',toBytes(secret),{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function unpack(data:any){const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:toBytes(data.iv)},await cryptoKey(),toBytes(data.ciphertext));return JSON.parse(new TextDecoder().decode(raw));}
async function pack(data:any){const iv=crypto.getRandomValues(new Uint8Array(12)),buf=await crypto.subtle.encrypt({name:'AES-GCM',iv},await cryptoKey(),new TextEncoder().encode(JSON.stringify(data)));return {iv:b64(iv),ciphertext:b64(buf)};}
const empty=():Overlay=>({entries:[],deleted:{},days:[]});
async function overlay():Promise<Overlay>{const text=localStorage.getItem(PREFIX+'-edits');if(!text)return empty();try{return await unpack(JSON.parse(text));}catch{throw Error('本机记录未能解密。请使用原来的专属链接打开。');}}
async function persist(o:Overlay){localStorage.setItem(PREFIX+'-edits',JSON.stringify(await pack(o)));}
export async function readJournal(_date=today()):Promise<State>{
 const fromHash=new URLSearchParams(location.hash.slice(1)).get('k');secret=fromHash||localStorage.getItem(PREFIX+'-key')||'';
 if(!/^[A-Za-z0-9_-]{43}$/.test(secret))throw Error('请使用聊天中收到的专属直达链接；普通网址不包含个人记录的访问码。');
 let published:State;try{const response=await fetch(import.meta.env.BASE_URL+'data/journal.enc.json?v='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('网络暂时不可用');const envelope=await response.json();published=await unpack(envelope);}catch(e){throw Error('未能打开记录，请检查网络与专属链接是否完整。');}
 localStorage.setItem(PREFIX+'-key',secret);
 const o=await overlay(),records=new Map(published.entries.map(e=>[e.id,e]));
 for(const e of o.entries){const p=records.get(e.id);if(!p||(e.updatedAt||'')>=(p.updatedAt||''))records.set(e.id,e);}
 for(const [id,when] of Object.entries(o.deleted)){if((records.get(id)?.updatedAt||'')<=when)records.delete(id);}
 const days=new Map(published.days.map(d=>[d.date,d]));for(const d of o.days){const newerFood=[...records.values()].some(e=>e.kind==='food'&&e.date===d.date&&(e.updatedAt||'')>d.updatedAt);days.set(d.date,{date:d.date,complete:d.complete&&!newerFood});}
 current={...published,profile:o.profile&&(o.updatedAt||'')>(published.updatedAt||'')?o.profile:published.profile,revision:Math.max(published.revision,o.revision||0),entries:[...records.values()].sort((a,b)=>a.date.localeCompare(b.date)||(a.updatedAt||'').localeCompare(b.updatedAt||'')),days:[...days.values()]};return structuredClone(current);
}
export async function writeJournal(input:any){
 if(!current)await readJournal();const o=await overlay(),now=new Date().toISOString();
 const validDate=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=today()&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 const save=(e:Entry)=>{if(!e.id||!validDate(e.date)||!['food','exercise','body','life'].includes(e.kind))throw Error('记录格式或日期无效');if(e.kind==='food'&&(!e.data.name||!(e.data.amount>0)))throw Error('请填写食物和有效份量');if(e.kind==='exercise'&&(!(e.data.minutes>0)||e.data.met<1||(e.data.metLow??e.data.met)>e.data.met||(e.data.metHigh??e.data.met)<e.data.met))throw Error('运动时长或强度范围无效');const old=current.entries.find(x=>x.id===e.id);o.entries=o.entries.filter(x=>x.id!==e.id);o.entries.push({...e,updatedAt:now});delete o.deleted[e.id];for(const day of new Set([...(e.kind==='food'?[e.date]:[]),...(old?.kind==='food'?[old.date]:[])])){o.days=o.days.filter(d=>d.date!==day);o.days.push({date:day,complete:false,updatedAt:now});}};
 if(input.op==='entry')save(input.entry);
 else if(input.op==='batch'){if(!Array.isArray(input.entries)||input.entries.length>100)throw Error('一次最多保存100条');for(const e of input.entries)save(e);}
 else if(input.op==='delete'){const e=current.entries.find(x=>x.id===input.id);if(!e)throw Error('记录不存在');o.entries=o.entries.filter(x=>x.id!==input.id);o.deleted[input.id]=now;if(e.kind==='food'){o.days=o.days.filter(d=>d.date!==e.date);o.days.push({date:e.date,complete:false,updatedAt:now});}}
 else if(input.op==='complete'){if(!validDate(input.date)||typeof input.complete!=='boolean')throw Error('日期或状态无效');if(input.complete&&!current.entries.some(e=>e.date===input.date&&e.kind==='food'))throw Error('请先记下饮食');o.days=o.days.filter(d=>d.date!==input.date);o.days.push({date:input.date,complete:input.complete,updatedAt:now});}
 else if(input.op==='profile'){if(input.revision!==current.revision)throw Error('档案已变化，请刷新后保存');const p={...current.profile,...input.profile};if(p.height<120||p.height>230||p.startWeight<25||p.startWeight>400)throw Error('请检查身高和体重');if(p.goalWeight&&p.goalWeight/(p.height/100)**2<18.5)throw Error('目标体重低于成人BMI参考下限');o.profile=p;o.revision=current.revision+1;o.updatedAt=now;}
 else if(input.op==='template'){if(!validDate(input.date)||input.stairsMinutes<1||input.stairsMinutes>60)throw Error('模板参数无效');if(current.entries.some(e=>e.date===input.date&&e.kind==='exercise'&&!e.id.startsWith('routine:')))throw Error('这一天已有实际运动记录。请直接编辑已有条目，避免重复计算训练时长。');EXERCISES.slice(0,3).forEach((x,i)=>save({id:`routine:${input.date}:${x.key}`,date:input.date,kind:'exercise',data:{name:x.name,minutes:i===0?20:i===1?40:input.stairsMinutes,met:x.met,metLow:x.low,metHigh:x.high,category:x.kind,group:i===1?input.group:'',note:'按当天实际完成记录；力量时长含休息。'}}));}
 else throw Error('不支持的操作');
 await persist(o);return {saved:true};
}
export function localChangeCount(){return current?undefined:0;}
