export type Profile = {birthDate:string; sex:'male'|'female'; height:number; startWeight:number; goalWeight:number|null; mode:'recomp'|'gentle'; dailyFactor:number; proteinFactor:number; waterGoal:number; stairsMinutes:number; special:boolean; notes:string};
export type Entry = {id:string;date:string;kind:'food'|'exercise'|'body'|'life';data:Record<string,any>;updatedAt?:string};
export type State = {profile:Profile;revision:number;entries:Entry[];days:{date:string;complete:boolean}[];updatedAt:string|null};
export const DEFAULT_PROFILE:Profile={birthDate:'2000-01-01',sex:'male',height:175,startWeight:70,goalWeight:null,mode:'recomp',dailyFactor:1.2,proteinFactor:1.6,waterGoal:2000,stairsMinutes:10,special:false,notes:''};
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function shiftDate(date:string,n:number){const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function ageOn(birth:string,date=today()){const b=birth.split('-').map(Number),d=date.split('-').map(Number);return d[0]-b[0]-(d[1]<b[1]||d[1]===b[1]&&d[2]<b[2]?1:0);}
export const EXERCISES=[
 {key:'bike',name:'自行车 · 轻松',met:4,low:3.5,high:6,kind:'aerobic',source:'Compendium 2024 · 休闲骑行'},
 {key:'strength',name:'力量训练 · 含休息',met:3.5,low:2.5,high:5,kind:'strength',source:'Compendium 2024 · 多动作抗阻训练'},
 {key:'stairs',name:'爬楼／楼梯机',met:6.8,low:4.5,high:9.3,kind:'aerobic',source:'Compendium 2024 · 爬楼参考；机器强度未知'},
 {key:'walk',name:'快走',met:4.8,low:3.5,high:5.5,kind:'aerobic',source:'Compendium 2024 · 约5.6–6.3 km/h'},
 {key:'run',name:'慢跑',met:7.5,low:6.5,high:9,kind:'aerobic',source:'Compendium 2024 · 一般慢跑'},
] as const;
// Starter estimates, not laboratory values. User-entered package labels take precedence.
export const FOODS=[
 {name:'熟白米饭',unit:'g',amount:150,kcal:130,p:2.7,c:28.2,f:0.3,base:100},
 {name:'鸡蛋（可食部分）',unit:'个',amount:1,kcal:72,p:6.3,c:0.4,f:5,base:1},
 {name:'熟鸡胸肉（去皮）',unit:'g',amount:100,kcal:165,p:31,c:0,f:3.6,base:100},
 {name:'全脂牛奶',unit:'ml',amount:250,kcal:61,p:3.2,c:4.8,f:3.3,base:100},
 {name:'燕麦片（干）',unit:'g',amount:40,kcal:379,p:13.2,c:67.7,f:6.5,base:100},
 {name:'香蕉（去皮）',unit:'g',amount:100,kcal:89,p:1.1,c:22.8,f:0.3,base:100},
 {name:'苹果（可食部分）',unit:'g',amount:150,kcal:52,p:0.3,c:13.8,f:0.2,base:100},
 {name:'西兰花（熟，无油）',unit:'g',amount:150,kcal:35,p:2.4,c:7.2,f:0.4,base:100},
 {name:'食用油',unit:'g',amount:10,kcal:900,p:0,c:0,f:100,base:100},
 {name:'美式咖啡（无糖）',unit:'杯',amount:1,kcal:5,p:0,c:0,f:0,base:1},
];
export function netCalories(weight:number,minutes:number,met:number){return Math.max(0,met-1)*3.5*weight/200*minutes;}
export function latestWeight(entries:Entry[],p:Profile,date:string){return [...entries].filter(e=>e.kind==='body'&&e.date<=date&&e.data.weight!=null).sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||b.id).localeCompare(a.updatedAt||a.id))[0]?.data.weight??p.startWeight;}
export function summarize(s:State,date:string){
 const p=s.profile,w=latestWeight(s.entries,p,date),age=ageOn(p.birthDate,date),bmi=w/(p.height/100)**2;
 const ree=10*w+6.25*p.height-5*age+(p.sex==='male'?5:-161),base=ree*p.dailyFactor;
 const rows=s.entries.filter(e=>e.date===date),foods=rows.filter(e=>e.kind==='food'),ex=rows.filter(e=>e.kind==='exercise'),body=rows.filter(e=>e.kind==='body');
 const sum=(key:string)=>foods.reduce((v,e)=>v+(Number(e.data[key])||0),0);
 const exercise=ex.reduce((v,e)=>v+netCalories(w,e.data.minutes,e.data.met),0);
 const exerciseLow=ex.reduce((v,e)=>v+netCalories(w,e.data.minutes,e.data.metLow??e.data.met),0),exerciseHigh=ex.reduce((v,e)=>v+netCalories(w,e.data.minutes,e.data.metHigh??e.data.met),0);
 const safe=age>=18&&bmi>=18.5&&!p.special;
 const tdee=base+exercise,target=safe?Math.max(p.sex==='male'?1500:1200,tdee*(p.mode==='gentle'?.9:1)):null;
 const complete=s.days.some(d=>d.date===date&&d.complete),known=foods.every(e=>e.data.kcal!=null),kcal=sum('kcal');
 const macrosKnown=(key:string)=>foods.every(e=>e.data[key]!=null);
 const weekStart=shiftDate(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));
 const weekly=s.entries.filter(e=>e.kind==='exercise'&&e.date>=weekStart&&e.date<=date);
 const moderate=weekly.reduce((v,e)=>v+(e.data.category==='aerobic'&&e.data.met>=3?e.data.minutes*(e.data.met>=6?2:1):0),0);
 const strengthDays=new Set(weekly.filter(e=>e.data.category==='strength').map(e=>e.date)).size;
 const water=body.reduce((v,e)=>v+(e.data.water||0),0),sleep=[...body].reverse().find(e=>e.data.sleep!=null)?.data.sleep;
 const waist=[...s.entries].filter(e=>e.kind==='body'&&e.date<=date&&e.data.waist!=null).sort((a,b)=>b.date.localeCompare(a.date))[0]?.data.waist;
 return {weight:w,age,bmi,ree,base,exercise,exerciseLow,exerciseHigh,tdee,target,kcal,p:sum('protein'),c:sum('carbs'),f:sum('fat'),proteinKnown:macrosKnown('protein'),carbsKnown:macrosKnown('carbs'),fatKnown:macrosKnown('fat'),foodCount:foods.length,unknownFoods:foods.filter(e=>e.data.kcal==null).length,complete,known,balance:complete&&known&&foods.length?tdee-kcal:null,proteinGoal:w*p.proteinFactor,moderate,strengthDays,water,sleep,waist,waistRatio:waist?waist/p.height:null,minutes:ex.reduce((v,e)=>v+e.data.minutes,0),safe};
}
export function weightTrend(s:State,date:string){
 const weights=s.entries.filter(e=>e.kind==='body'&&e.data.weight!=null&&e.date<=date).sort((a,b)=>a.date.localeCompare(b.date));
 const perDate=new Map<string,number>();for(const e of weights)perDate.set(e.date,e.data.weight);
 const points=[...perDate].map(([date,weight])=>({date,weight}));
 const avg=(end:string)=>{const a=points.filter(p=>p.date>=shiftDate(end,-6)&&p.date<=end);return a.length?a.reduce((v,p)=>v+p.weight,0)/a.length:null;};
 return {points:points.filter(p=>p.date>=shiftDate(date,-29)),average:avg(date),previousAverage:avg(shiftDate(date,-7)),sampleDays:points.filter(p=>p.date>=shiftDate(date,-6)).length};
}
