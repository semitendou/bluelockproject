export const KEY = 'bluelock-app-data';
export const CATEGORIES = ['ACADEMIC','COMPETITIONS','PROJECTS','LANGUAGES','CODING','READING','FITNESS','PERSONAL','ADMIN'];
export const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];
export const STAT_NAMES = ['EXECUTION','FOCUS','DISCIPLINE','MASTERY','CREATION'];
export const LEVELS = [
  {id:1,name:'AWAKENING',points:0}, {id:2,name:'FOUNDATION',points:200},
  {id:3,name:'WEAPON',points:600}, {id:4,name:'FLOW',points:1200},
  {id:5,name:'ADAPTATION',points:2000}, {id:6,name:'DOMINANCE',points:3500},
  {id:7,name:'EVOLUTION',points:5500}, {id:8,name:'COMPLETE EGO',points:8000}
];
export const isoDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const addDays = (day, amount) => { const [y,m,d]=day.split('-').map(Number); return isoDay(new Date(y,m-1,d+amount)); };
export const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const array = x => Array.isArray(x) ? x : [];
const defaults = () => ({
  schemaVersion:2, profile:{name:'PLAYER',archetype:'THE SOVEREIGN EXECUTOR',primaryWeapon:'RUTHLESS EXECUTION',secondaryWeapon:'STRUCTURED ADAPTATION',stats:{EXECUTION:32,FOCUS:27,DISCIPLINE:30,MASTERY:25,CREATION:28},longTermGoals:[],currentGoals:[]},
  egoPoints:0,egoTransactions:[],tasks:[],trainingSessions:[],calendar:[],books:[],readingSessions:[],projects:[],achievements:[],dailyDebriefs:[],timeDebriefs:[],winConditions:{},settings:{weekStartsMonday:true}
});
export function normalize(raw){
  const base=defaults();
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return base;
  const profile=raw.profile && typeof raw.profile==='object' ? raw.profile : {};
  const merged={...base,...raw,profile:{...base.profile,...profile,stats:{...base.profile.stats,...(profile.stats||{})}}};
  for(const k of ['tasks','egoTransactions','trainingSessions','calendar','books','readingSessions','projects','achievements','dailyDebriefs','timeDebriefs']) merged[k]=array(raw[k]);
  merged.winConditions=raw.winConditions && typeof raw.winConditions==='object' && !Array.isArray(raw.winConditions)? raw.winConditions : {};
  merged.egoPoints=Math.max(0,Number(raw.egoPoints)||0);
  merged.settings={...base.settings,...(raw.settings||{})};
  return merged;
}
export function validateImport(raw){
  if(!raw || typeof raw!=='object'||Array.isArray(raw)||!raw.profile||typeof raw.profile!=='object'||!Array.isArray(raw.tasks))throw new Error('Not a valid Project Ego backup.');
  if(raw.tasks.length>20000)throw new Error('This backup has too many tasks.');
  return normalize(raw);
}
export function getLevel(points){const n=Math.max(0,Number(points)||0);const current=LEVELS.reduce((last,l)=>n>=l.points?l:last,LEVELS[0]);const next=LEVELS.find(l=>l.id===current.id+1)||null;return {current,next,progress:next?Math.max(0,n-current.points):0,needed:next?next.points-current.points:0,percent:next?Math.min(100,Math.round((n-current.points)/(next.points-current.points)*100)):100};}
export function completionForDate(tasks,date){const matches=array(tasks).filter(t=>t.date===date);return {total:matches.length,done:matches.filter(t=>t.completed).length,percent:matches.length?Math.round(matches.filter(t=>t.completed).length/matches.length*100):0};}
export function toggleTask(state,id,checked,date=isoDay()){
  const s=normalize(state), t=s.tasks.find(item=>String(item.id)===String(id));if(!t || Boolean(t.completed)===Boolean(checked))return s;
  if(checked){ t.completed=true;t.completedDate=`${date}T12:00:00`;if(!t.pointsAwarded){const points=Math.max(0,Number(t.egoPoints)||0);s.egoPoints+=points;s.egoTransactions.push({id:makeId(),date,task:t.name,points});t.pointsAwarded=true;}}
  else{t.completed=false;t.completedDate=null;}
  return s;
}
export function addTask(state, task){const s=normalize(state);const cleaned=String(task.name||'').trim();if(!cleaned)throw new Error('Task name is required.');s.tasks.push({id:makeId(),completed:false,completedDate:null,pointsAwarded:false,category:'PERSONAL',priority:'MEDIUM',targetDuration:0,egoPoints:20,difficulty:3,notes:'',...task,name:cleaned});return s;}
export function statScores(state){const s=normalize(state),done=s.tasks.filter(t=>t.completed),activeDays=new Set(done.map(t=>String(t.completedDate||t.date||'').slice(0,10)).filter(Boolean)).size;const counts=category=>done.filter(t=>t.category===category).length;return Object.fromEntries(STAT_NAMES.map(name=>{const base=Number(s.profile.stats[name])||0;let bonus=0;switch(name){case 'EXECUTION': bonus=Math.min(done.length*2,32);break;case 'FOCUS':bonus=Math.min(activeDays*2,24);break;case 'DISCIPLINE':bonus=Math.min(activeDays*3,30);break;case 'MASTERY':bonus=Math.min(counts('ACADEMIC')*3+counts('READING')*2+counts('LANGUAGES')*2,32);break;case 'CREATION':bonus=Math.min(counts('PROJECTS')*4+counts('CODING')*3+counts('COMPETITIONS')*2,32);break;}
    return [name,Math.min(100,Math.max(0,Math.round(base+bonus)))];}));}
export function activitySeries(state,days=7,end=isoDay()) {const s=normalize(state);return Array.from({length:days},(_,i)=>{const date=addDays(end,i-days+1);const events=s.egoTransactions.filter(x=>x.date===date);return {date,points:events.reduce((sum,x)=>sum+Math.max(0,Number(x.points)||0),0),count:s.tasks.filter(t=>t.completed&&String(t.completedDate||t.date||'').slice(0,10)===date).length};});}
export function streak(state,end=isoDay()) {const days=new Set(normalize(state).tasks.filter(t=>t.completed).map(t=>String(t.completedDate||t.date||'').slice(0,10)));let cursor=days.has(end)?end:addDays(end,-1),count=0;while(days.has(cursor) && count<10000){count++;cursor=addDays(cursor,-1);}return count;}
export const ACHIEVEMENTS=[
  {id:'first-step',icon:'✦',name:'FIRST STEP',desc:'Finish your first task.',test:s=>s.tasks.some(t=>t.completed)},
  {id:'triple-threat',icon:'◈',name:'TRIPLE THREAT',desc:'Complete three tasks.',test:s=>s.tasks.filter(t=>t.completed).length>=3},
  {id:'on-a-roll',icon:'↗',name:'ON A ROLL',desc:'Build a three-day training streak.',test:s=>streak(s)>=3},
  {id:'scholar',icon:'▤',name:'THE SCHOLAR',desc:'Log your first reading session.',test:s=>s.readingSessions.length>0},
  {id:'architect',icon:'⬡',name:'THE ARCHITECT',desc:'Create your first project.',test:s=>s.projects.length>0},
  {id:'reflect',icon:'◎',name:'SELF AWARE',desc:'Complete a daily debrief.',test:s=>s.dailyDebriefs.length>0},
  {id:'foundation',icon:'◆',name:'FOUNDATION',desc:'Reach level 2.',test:s=>s.egoPoints>=200},
  {id:'flow-state',icon:'✧',name:'FLOW STATE',desc:'Reach level 4.',test:s=>s.egoPoints>=1200}
];
export function unlockedAchievements(state){const s=normalize(state);return ACHIEVEMENTS.filter(a=>a.test(s));}
export function summary(state,day=isoDay()){const s=normalize(state);const completed=s.tasks.filter(t=>t.completed).length;return {completed,total:s.tasks.length,today:completionForDate(s.tasks,day),points:s.egoPoints,level:getLevel(s.egoPoints),streak:streak(s,day),achievements:unlockedAchievements(s).length};}
