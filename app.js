'use strict';

const SAVE_KEY='federal_motion_web_save_v2';
const LEGACY_SAVE_KEY='federal_motion_web_save_v1';
const TAX_QUEUE_KEY='federal_motion_tax_queue_v1';
const LOSS_QUEUE_KEY='federal_motion_owner_loss_queue_v1';
const SUPABASE_URL='https://nrqgmlofflbnwhbywfbc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_KlgKi5KFxRqrMbGzZIVVSQ_-JM9OlON';

const DAY_START=8*60, WARNING_TIME=24*60, DAY_END=26*60, MAX_HEAT=5, MAX_HEALTH=100;
const DEFAULT_MOTION_TAX_RATE=.05;

let fmBackend={client:null,user:null,ready:false,syncing:false,taxRate:DEFAULT_MOTION_TAX_RATE,gameVersion:'Alpha 0.3',error:null,ownerBank:null,isOwner:false,ownerDashboard:null};
let player=null, screen='start', payload=null;

const DRUGS={
 weed:{name:'Weed',tier:'LOW',base_value:8,risk:1},
 pills:{name:'Pills',tier:'MEDIUM',base_value:16,risk:2},
 shrooms:{name:'Shrooms',tier:'MEDIUM',base_value:13,risk:2},
 lean:{name:'Lean',tier:'MEDIUM',base_value:18,risk:2},
 cocaine:{name:'Cocaine',tier:'HIGH',base_value:32,risk:4},
 meth:{name:'Meth',tier:'HIGH',base_value:29,risk:4},
 heroin:{name:'Heroin',tier:'HIGH',base_value:35,risk:5},
};

const WEAPONS={
 street_pistol:{name:'Street Pistol',price:450,power:12,condition:70,tier:1},
 g_style:{name:'G-Style Pistol',price:950,power:21,condition:86,tier:2},
 fn_style:{name:'FN-Style Pistol',price:1450,power:27,condition:88,tier:2},
 sawed_style:{name:'Sawed-Off Style Shotgun',price:1850,power:33,condition:76,tier:3},
 pump_shotgun:{name:'Pump Shotgun',price:2400,power:38,condition:90,tier:3},
 draco_style:{name:'Draco-Style Compact',price:3600,power:46,condition:84,tier:4},
 mini_arp_style:{name:'Mini ARP-Style Carbine',price:4700,power:52,condition:88,tier:4},
 elite_carbine:{name:'Elite Carbine',price:7200,power:63,condition:95,tier:5},
};

const ARMOR={
 light_armor:{name:'Light Armor',price:700,defense:12,tier:1},
 body_armor:{name:'Standard Body Armor',price:1800,defense:25,tier:2},
 heavy_armor:{name:'Heavy Armor',price:4000,defense:40,tier:3},
 elite_armor:{name:'Elite Armor',price:7500,defense:55,tier:4},
};

const CREW={
 rico:{name:'Rico',price:500,role:'Driver',combat:12,driving:18,loyalty:65,cut:10},
 ace:{name:'Ace',price:1200,role:'Scout',combat:20,driving:24,loyalty:72,cut:15},
 brick:{name:'Brick',price:1800,role:'Muscle',combat:35,driving:7,loyalty:68,cut:18},
 nova:{name:'Nova',price:2400,role:'Tech',combat:14,driving:14,loyalty:76,cut:14},
 saint:{name:'Saint',price:2800,role:'Medic',combat:16,driving:12,loyalty:82,cut:16},
};

const VEHICLES={
 bicycle:{name:'Bicycle',price:0,speed:.95,storage:5,attention:0,reliability:100},
 beater:{name:'Old Beater Sedan',price:1800,speed:.68,storage:18,attention:1,reliability:65},
 muscle:{name:'V8 Street Coupe',price:6200,speed:.48,storage:12,attention:3,reliability:78},
 suv:{name:'Full-Size SUV',price:8500,speed:.56,storage:35,attention:2,reliability:84},
 sport:{name:'Performance Coupe',price:14500,speed:.38,storage:10,attention:4,reliability:88},
 executive:{name:'Executive Sedan',price:22000,speed:.44,storage:20,attention:2,reliability:94},
};

const PROPERTIES={
 starter_trap:{name:'Starter Trap',price:0,type:'Trap',storage:1,security:0,status:0},
 apartment:{name:'City Apartment',price:6500,type:'Home',storage:1,security:1,status:1},
 garage_property:{name:'Private Garage',price:12000,type:'Garage',storage:2,security:1,status:2},
 second_trap:{name:'Second Trap',price:18000,type:'Trap',storage:3,security:2,status:3},
 warehouse_property:{name:'Warehouse',price:40000,type:'Warehouse',storage:5,security:3,status:5},
 business_front:{name:'Business Front',price:65000,type:'Business',storage:2,security:3,status:8},
 luxury_home:{name:'Luxury Property',price:120000,type:'Home',storage:3,security:4,status:12},
};

const PHONES={
 burner:{name:'Burner Phone',price:0,tier:1,apps:['messages','contacts']},
 budget:{name:'Budget Smartphone',price:1200,tier:2,apps:['messages','contacts','jobs','market','map']},
 premium:{name:'Premium Smartphone',price:5000,tier:3,apps:['messages','contacts','jobs','market','map','objectives','achievements','alerts']},
 elite:{name:'Encrypted Elite Phone',price:12000,tier:4,apps:['messages','contacts','jobs','market','map','objectives','achievements','alerts','leaderboard','properties','garage']},
};

const LOCATIONS={
 trap:{name:'Your Trap',area:'Southside',travel:0},corner_store:{name:'Corner Store',area:'Southside',travel:20},
 apartments:{name:'Apartments',area:'Southside',travel:25},hospital:{name:'County Hospital',area:'Southside',travel:30},
 supplier:{name:'Supplier Spot',area:'Southside',travel:30},black_market:{name:'Black Market',area:'Southside',travel:35},
 shopping_strip:{name:'Shopping Strip',area:'Midtown',travel:55},warehouse:{name:'Warehouse District',area:'Midtown',travel:70},
 garage:{name:'Garage',area:'Midtown',travel:60},bank:{name:'Bank District',area:'Midtown',travel:75},
 crew_spot:{name:'Crew Hangout',area:'Midtown',travel:65},rival_territory:{name:'Rival Territory',area:'Outskirts',travel:100},
 freight_yard:{name:'Freight Yard',area:'Outskirts',travel:115},secure_warehouse:{name:'Secure Warehouse',area:'Outskirts',travel:125},
 military_facility:{name:'Restricted Warehouse',area:'Outskirts',travel:145},
};

const MOVES={
 quick_hustle:{name:'Quick Hustle',location:'corner_store',minutes:[45,75],base_success:90,cash:[70,160],xp:35,respect:1,heat:0,combat:false},
 house_hit:{name:'House Robbery',location:'apartments',minutes:[90,150],base_success:76,cash:[150,500],xp:70,respect:2,heat:1,combat:true,enemy:[8,24],requires_weapon:true,weapon_tier:1},
 store_hit:{name:'Store Robbery',location:'shopping_strip',minutes:[90,150],base_success:72,cash:[300,900],xp:110,respect:3,heat:1,combat:true,enemy:[15,30],requires_weapon:true,weapon_tier:2},
 rival_trap:{name:'Rival Trap House Hit',location:'rival_territory',minutes:[150,240],base_success:63,cash:[650,1800],xp:180,respect:5,heat:2,combat:true,enemy:[28,50],requires_weapon:true,weapon_tier:2},
 bank_heist:{name:'Bank Heist',location:'bank',minutes:[300,420],base_success:48,cash:[3000,9000],xp:420,respect:10,heat:3,combat:true,enemy:[45,70],requires_weapon:true,weapon_tier:4,requires_crew:1,requires_level:4},
 restricted_warehouse:{name:'Restricted Warehouse Heist',location:'military_facility',minutes:[360,480],base_success:38,cash:[7000,18000],xp:700,respect:16,heat:4,combat:true,enemy:[65,95],requires_weapon:true,weapon_tier:5,requires_crew:2,requires_level:6},
};

const ACHIEVEMENTS={
 first_motion:{name:'First Motion',desc:'Earn your first $1,000 total cash.',rarity:'Common'},
 armed_up:{name:'Armed Up',desc:'Own your first weapon.',rarity:'Common'},
 not_alone:{name:'Not Alone',desc:'Recruit your first crew member.',rarity:'Uncommon'},
 five_o:{name:'Five-O',desc:'Reach 5-star heat.',rarity:'Rare'},
 big_money:{name:'Big Money',desc:'Reach $10,000 net worth.',rarity:'Rare'},
 survivor:{name:'Survivor',desc:'Survive 30 in-game days.',rarity:'Legendary'},
 been_down:{name:'Been Down Before',desc:'Take your first hospital trip.',rarity:'Uncommon'},
 big_score:{name:'Big Score',desc:'Complete a major heist.',rarity:'Legendary'},
 property_owner:{name:'Property Owner',desc:'Own a second property.',rarity:'Uncommon'},
 federal_motion:{name:'Federal Motion',desc:'Reach Federal Motion status.',rarity:'Federal'},
};

const STAGES=[
 {name:'The Bottom',title:'Peon',level:1,respect:0,worth:0},
 {name:'Getting Motion',title:'Small Fry',level:2,respect:5,worth:1000},
 {name:'On The Rise',title:'Hustler',level:4,respect:15,worth:5000},
 {name:'Established',title:'Gangsta',level:6,respect:30,worth:15000},
 {name:'Heavy Motion',title:'Enforcer',level:9,respect:50,worth:40000},
 {name:'Shot Caller',title:'Shot Caller',level:12,respect:70,worth:80000},
 {name:'City Boss',title:'Mob Boss',level:15,respect:90,worth:140000},
 {name:'Federal Motion',title:'Federal Motion',level:20,respect:120,worth:250000},
];

const $=s=>document.querySelector(s), app=()=>document.getElementById('app');
const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a, clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const money=n=>`$${Math.round(n).toLocaleString()}`;
const stars=h=>'★'.repeat(clamp(h,0,5))+'☆'.repeat(5-clamp(h,0,5));
const formatTime=m=>{const x=((m%(24*60))+(24*60))%(24*60),h=Math.floor(x/60),min=x%60,ap=h<12?'AM':'PM';return `${h%12||12}:${String(min).padStart(2,'0')} ${ap}`};
const escapeHtml=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const ICONS={phone:'📱',cash:'💵',heat:'🚨',health:'❤️',xp:'⚡',respect:'👑',weapon:'🔫',armor:'🛡️',ride:'🚗',jobs:'🎯',street:'🧱',supplier:'🤝',market:'🛒',crew:'👥',map:'🗺️',garage:'🏎️',property:'🏠',stash:'📦',upgrade:'🛠️',laylow:'🌙',skills:'📈',objectives:'📋',achievements:'🏆',hospital:'🏥',status:'📊',sleep:'🛏️',save:'💾',owner:'💰',dashboard:'🛰️',alert:'⚠️'};
function icon(k){return ICONS[k]||'•'}
function meter(label,value,max,cls=''){const pct=clamp((Number(value)||0)/Math.max(1,max)*100,0,100);return `<div class="meter-block ${cls}"><div class="meter-label"><span>${escapeHtml(label)}</span><strong>${Math.round(value)}/${Math.round(max)}</strong></div><div class="meter"><div style="width:${pct}%"></div></div></div>`}

function emptyDrugInventory(){return Object.fromEntries(Object.keys(DRUGS).map(k=>[k,0]))}
function newPlayer(name='Player'){
 return {
  name,day:1,time:DAY_START,level:1,xp:0,respect:0,heat:0,health:100,cash_on_person:0,location:'trap',
  phone_id:'burner',equipped_weapon:null,equipped_armor:null,weapon_inventory:[],armor_inventory:[],crew:[],
  carried_drugs:emptyDrugInventory(),vehicles:['bicycle'],active_vehicle:'bicycle',properties:['starter_trap'],
  trap:{cash:0,drug_stash:emptyDrugInventory(),weapons:[],armor:[],security:0,storage:1,condition:1,attention:0},
  market:Object.fromEntries(Object.keys(DRUGS).map(k=>[k,1])),supplier_trust:{Smoke:0,Doc:0,Ghost:0},
  skills:{combat:{xp:0,level:1},street:{xp:0,level:1},charisma:{xp:0,level:1},driving:{xp:0,level:1},business:{xp:0,level:1},endurance:{xp:0,level:1}},
  achievements:[],messages:[{from:'Unknown',text:'Everybody starts somewhere. Get some motion.'}],
  stats:{moves:0,successful_moves:0,failed_moves:0,hospital_visits:0,arrests:0,days_survived:1,biggest_score:0,highest_heat:0,total_earned:0},
  daily:{}
 };
}
function migratePlayer(p){
 if(!p)return null;
 const d=newPlayer(p.name||'Player');
 p={...d,...p};
 p.trap={...d.trap,...(p.trap||{})};
 p.stats={...d.stats,...(p.stats||{})};
 p.skills={...d.skills,...(p.skills||{})};
 for(const k of Object.keys(d.skills))p.skills[k]={...d.skills[k],...(p.skills[k]||{})};
 p.carried_drugs={...d.carried_drugs,...(p.carried_drugs||{})};
 p.trap.drug_stash={...d.trap.drug_stash,...(p.trap.drug_stash||{})};
 if(!p.phone_id)p.phone_id='burner';
 if(!Array.isArray(p.vehicles))p.vehicles=['bicycle'];
 if(!p.active_vehicle)p.active_vehicle='bicycle';
 if(!Array.isArray(p.properties))p.properties=['starter_trap'];
 if(!Array.isArray(p.achievements))p.achievements=[];
 if(!Array.isArray(p.messages))p.messages=d.messages;
 return p;
}
function resetDaily(){player.daily={cash_start:player.cash_on_person+player.trap.cash,xp_start:player.xp,respect_start:player.respect,heat_start:player.heat,successes:0,failures:0}}
function saveGame(){if(!player)return;localStorage.setItem(SAVE_KEY,JSON.stringify(player));if(fmBackend.ready)syncCloudSave()}
function loadGame(){try{return migratePlayer(JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY)))}catch{return null}}
function hasSave(){return !!(localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY))}
function generateMarket(){Object.keys(DRUGS).forEach(k=>player.market[k]=Math.round((.8+Math.random()*.5)*100)/100)}

function xpForLevel(level){
 if(level<=1)return 0;
 const inc=[250,400,600,850,1150];
 let total=0;
 for(let l=2;l<=level;l++){const i=l-2;total+=i<inc.length?inc[i]:1150+(i-inc.length+1)*350}
 return total;
}
function levelFromXp(xp){let l=1;while(l<100&&xp>=xpForLevel(l+1))l++;return l}
function updateLevel(){const n=levelFromXp(player.xp);if(n>player.level){const old=player.level;player.level=n;return `LEVEL UP: ${old} → ${n}`}return null}
function nextLevelXp(){return xpForLevel(player.level+1)}
function currentLevelXp(){return xpForLevel(player.level)}
function levelProgress(){const a=currentLevelXp(),b=nextLevelXp();return clamp((player.xp-a)/Math.max(1,b-a),0,1)}

function totalNetWorth(){
 if(!player)return 0;
 let v=player.cash_on_person+player.trap.cash;
 Object.entries(player.trap.drug_stash).forEach(([id,g])=>v+=Math.floor(g*DRUGS[id].base_value));
 player.trap.weapons.forEach(x=>v+=WEAPONS[x.id]?.price||0);
 player.weapon_inventory.forEach(x=>v+=WEAPONS[x.id]?.price||0);
 player.armor_inventory.forEach(id=>v+=ARMOR[id]?.price||0);
 player.vehicles.forEach(id=>v+=VEHICLES[id]?.price||0);
 player.properties.forEach(id=>v+=PROPERTIES[id]?.price||0);
 return Math.max(0,Math.floor(v));
}
function stageInfo(){
 let s=STAGES[0],worth=totalNetWorth();
 for(const x of STAGES)if(player.level>=x.level&&player.respect>=x.respect&&worth>=x.worth)s=x;
 return s;
}
function weaponName(){return player.equipped_weapon?WEAPONS[player.equipped_weapon]?.name||'Unknown':'Unarmed'}
function armorName(){return player.equipped_armor?ARMOR[player.equipped_armor]?.name||'Unknown':'None'}
function vehicleName(){return VEHICLES[player.active_vehicle]?.name||'Bicycle'}
function currentWeaponTier(){return player.equipped_weapon?(WEAPONS[player.equipped_weapon]?.tier||0):0}
function skillLevel(k){return player.skills?.[k]?.level||1}
function addSkillXP(k,amount){
 const s=player.skills[k]||(player.skills[k]={xp:0,level:1});s.xp+=amount;
 const n=1+Math.floor(s.xp/150);if(n>s.level)s.level=n;
}
function checkAchievements(){
 const before=new Set(player.achievements), worth=totalNetWorth(), s=stageInfo();
 const unlock=k=>{if(!before.has(k)){player.achievements.push(k);before.add(k);player.messages.push({from:'Achievements',text:`Unlocked: ${ACHIEVEMENTS[k].name}`})}};
 if(player.stats.total_earned>=1000)unlock('first_motion');
 if(player.weapon_inventory.length+player.trap.weapons.length>0)unlock('armed_up');
 if(player.crew.length)unlock('not_alone');
 if(player.heat>=5)unlock('five_o');
 if(worth>=10000)unlock('big_money');
 if(player.stats.days_survived>=30)unlock('survivor');
 if(player.stats.hospital_visits>0)unlock('been_down');
 if(player.stats.biggest_score>=3000)unlock('big_score');
 if(player.properties.length>=2)unlock('property_owner');
 if(s.name==='Federal Motion')unlock('federal_motion');
 player.stats.highest_heat=Math.max(player.stats.highest_heat||0,player.heat);
}
function objectives(){
 const s=stageInfo(),worth=totalNetWorth();
 if(s.name==='The Bottom')return [
  ['Reach Level 2',player.level>=2],['Earn $1,000 total',player.stats.total_earned>=1000],['Own a weapon',player.weapon_inventory.length+player.trap.weapons.length>0]
 ];
 if(s.name==='Getting Motion')return [
  ['Reach Respect 15',player.respect>=15],['Reach $5,000 net worth',worth>=5000],['Recruit crew',player.crew.length>0]
 ];
 if(s.name==='On The Rise')return [
  ['Reach Level 6',player.level>=6],['Own a vehicle',player.vehicles.length>1],['Own second property',player.properties.length>1]
 ];
 if(s.name==='Established')return [
  ['Reach $40,000 net worth',worth>=40000],['Complete a major heist',player.stats.biggest_score>=3000],['Reach Respect 50',player.respect>=50]
 ];
 return [
  [`Reach Level ${Math.min(20,player.level+3)}`,player.level>=20],
  ['Reach $250,000 net worth',worth>=250000],
  ['Reach Respect 120',player.respect>=120]
 ];
}

function backendStatusText(){return fmBackend.ready?'CLOUD ONLINE':fmBackend.error?'LOCAL MODE':'CONNECTING…'}
async function initBackend(){
 try{
  if(!window.supabase?.createClient)throw new Error('Supabase library did not load.');
  fmBackend.client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  let {data:{session},error}=await fmBackend.client.auth.getSession();if(error)throw error;
  if(!session){const r=await fmBackend.client.auth.signInAnonymously();if(r.error)throw r.error;session=r.data.session}
  fmBackend.user=session?.user||null;if(!fmBackend.user)throw new Error('No authenticated player session.');
  await loadRemoteSettings();fmBackend.ready=true;fmBackend.error=null;await refreshOwnerBank();
  const local=loadGame();
  if(local){player=local;await ensurePlayerProfile();await syncCloudSave()}
  else{const cloud=await loadCloudSave();if(cloud){player=migratePlayer(cloud);localStorage.setItem(SAVE_KEY,JSON.stringify(player));screen='home'}}
  await flushTaxQueue();await flushOwnerLossQueue();render();
 }catch(err){console.error('Federal Motion backend:',err);fmBackend.error=err?.message||String(err);fmBackend.ready=false;render()}
}
async function loadRemoteSettings(){
 if(!fmBackend.client)return;
 const {data,error}=await fmBackend.client.from('fm_game_settings').select('setting_key,setting_value').in('setting_key',['motion_tax_rate','game_version']);
 if(error)return;
 for(const row of data||[]){if(row.setting_key==='motion_tax_rate'){const n=Number(row.setting_value);if(Number.isFinite(n)&&n>=0&&n<=.25)fmBackend.taxRate=n}if(row.setting_key==='game_version'&&row.setting_value)fmBackend.gameVersion=String(row.setting_value)}
}

async function refreshOwnerBank(){
 if(!fmBackend.ready||!fmBackend.client)return null;
 const {data,error}=await fmBackend.client.rpc('fm_get_owner_bank');
 if(error){
  console.warn('Owner bank check:',error.message);
  fmBackend.ownerBank=null;fmBackend.isOwner=false;
  return null;
 }
 const row=Array.isArray(data)?data[0]:data;
 if(row){
  fmBackend.ownerBank=row;
  fmBackend.isOwner=true;
  return row;
 }
 fmBackend.ownerBank=null;fmBackend.isOwner=false;
 return null;
}

async function withdrawOwnerFunds(amount){
 amount=Math.floor(Number(amount)||0);
 if(!fmBackend.isOwner||amount<=0)return {ok:false,error:'Invalid owner withdrawal'};
 const {data,error}=await fmBackend.client.rpc('fm_spend_owner_bank',{spend_amount:amount});
 if(error)return {ok:false,error:error.message};
 player.cash_on_person+=amount;
 await refreshOwnerBank();
 saveGame();
 return {ok:true,new_balance:Number(data)};
}
async function ensurePlayerProfile(){
 if(!fmBackend.ready||!fmBackend.user||!player)return;
 checkAchievements();const profile={
  user_id:fmBackend.user.id,player_name:player.name||'Player',title:stageInfo().title,level:player.level||1,respect:player.respect||0,
  net_worth:totalNetWorth(),days_survived:player.stats.days_survived||player.day||1,biggest_score:player.stats.biggest_score||0,
  jobs_completed:player.stats.successful_moves||0,arrests:player.stats.arrests||0,hospital_visits:player.stats.hospital_visits||0,
  highest_heat:player.stats.highest_heat||0,updated_at:new Date().toISOString()
 };
 const {error}=await fmBackend.client.from('fm_players').upsert(profile,{onConflict:'user_id'});if(error)console.warn('Profile sync:',error.message)
}
async function syncCloudSave(){
 if(!fmBackend.ready||!fmBackend.user||!player||fmBackend.syncing)return;fmBackend.syncing=true;
 try{checkAchievements();const {error}=await fmBackend.client.from('fm_cloud_saves').upsert({user_id:fmBackend.user.id,save_data:player,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;await ensurePlayerProfile()}
 catch(err){console.warn('Cloud save:',err?.message||err)}finally{fmBackend.syncing=false}
}
async function loadCloudSave(){
 if(!fmBackend.ready||!fmBackend.user)return null;
 const {data,error}=await fmBackend.client.from('fm_cloud_saves').select('save_data').eq('user_id',fmBackend.user.id).maybeSingle();
 return error?null:(data?.save_data||null)
}
function makeUuid(){
 if(globalThis.crypto&&typeof globalThis.crypto.randomUUID==='function'){try{return globalThis.crypto.randomUUID()}catch{}}
 const bytes=new Uint8Array(16);if(globalThis.crypto&&typeof globalThis.crypto.getRandomValues==='function')globalThis.crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(b=>b.toString(16).padStart(2,'0'));
 return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`;
}
function motionTaxFor(base){return Math.max(0,Math.floor(Math.max(0,base)*fmBackend.taxRate))}
function purchaseQuote(base){const tax=motionTaxFor(base);return{base,tax,total:base+tax}}
function queueMotionTax(tax){if(!tax||tax<=0)return;let q=[];try{q=JSON.parse(localStorage.getItem(TAX_QUEUE_KEY)||'[]')}catch{}q.push({event_id:makeUuid(),tax_amount:Math.floor(tax)});localStorage.setItem(TAX_QUEUE_KEY,JSON.stringify(q));flushTaxQueue()}
async function flushTaxQueue(){
 if(!fmBackend.ready||!fmBackend.client)return;let q=[];try{q=JSON.parse(localStorage.getItem(TAX_QUEUE_KEY)||'[]')}catch{}if(!q.length)return;
 const remain=[];for(const item of q){const {error}=await fmBackend.client.rpc('fm_collect_motion_tax_v2',{event_id:item.event_id,tax_amount:item.tax_amount});if(error){console.warn('Motion Tax pending:',error.message);remain.push(item)}}
 localStorage.setItem(TAX_QUEUE_KEY,JSON.stringify(remain));
 if(fmBackend.isOwner) await refreshOwnerBank();
}
function taxedPurchase(base){const q=purchaseQuote(base);if(player.cash_on_person<q.total)return{ok:false,...q};player.cash_on_person-=q.total;queueMotionTax(q.tax);addSkillXP('business',Math.max(2,Math.floor(base/250)));return{ok:true,...q}}

function queueOwnerLoss(amount,lossType='player_loss'){
 amount=Math.max(0,Math.floor(Number(amount)||0));
 if(amount<=0)return;
 let q=[];
 try{q=JSON.parse(localStorage.getItem(LOSS_QUEUE_KEY)||'[]')}catch{}
 q.push({event_id:makeUuid(),loss_amount:amount,loss_type:String(lossType||'player_loss')});
 localStorage.setItem(LOSS_QUEUE_KEY,JSON.stringify(q));
 flushOwnerLossQueue();
}

async function flushOwnerLossQueue(){
 if(!fmBackend.ready||!fmBackend.client)return;
 let q=[];
 try{q=JSON.parse(localStorage.getItem(LOSS_QUEUE_KEY)||'[]')}catch{}
 if(!q.length)return;

 const remain=[];
 for(const item of q){
  const {error}=await fmBackend.client.rpc('fm_collect_player_loss',{
   p_event_id:item.event_id,
   p_loss_amount:item.loss_amount,
   p_loss_type:item.loss_type
  });
  if(error){
   console.warn('Owner loss pending:',error.message);
   remain.push(item);
  }
 }
 localStorage.setItem(LOSS_QUEUE_KEY,JSON.stringify(remain));
 if(fmBackend.isOwner)await refreshOwnerBank();
}

function header(){
 if(!player)return `<div class="hero"><div class="hero-kicker">DBEST LABS PRESENTS</div><div class="logo">FEDERAL MOTION</div><div class="sublogo">${escapeHtml(fmBackend.gameVersion)} · ${backendStatusText()}</div></div>`;
 const s=stageInfo();
 return `<div class="hero compact"><div class="hero-kicker">${escapeHtml(s.name)} · ${escapeHtml(s.title)}</div><div class="logo">FEDERAL MOTION</div><div class="sublogo">${escapeHtml(fmBackend.gameVersion)} · ${backendStatusText()}</div></div>
 <div class="hud card"><div class="hud-top"><div><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(s.title)}</small></div><div class="hud-clock">${formatTime(player.time)}<small>DAY ${player.day}</small></div></div>
 <div class="hud-grid">${meter(`${icon('health')} Health`,player.health,100,'health')}${meter(`${icon('xp')} XP`,player.xp-currentLevelXp(),nextLevelXp()-currentLevelXp(),'xp')}${meter(`${icon('respect')} Respect`,player.respect,Math.max(20,s.respect+25),'respect')}${meter(`${icon('heat')} Heat`,player.heat,5,'heat')}</div>
 <div class="hud-strip"><div><span>${icon('cash')} CASH</span><strong>${money(player.cash_on_person)}</strong></div><div><span>📍 LOCATION</span><strong>${escapeHtml(LOCATIONS[player.location]?.name||player.location)}</strong></div><div><span>${icon('weapon')} WEAPON</span><strong>${escapeHtml(weaponName())}</strong></div><div><span>${icon('ride')} RIDE</span><strong>${escapeHtml(vehicleName())}</strong></div></div></div>`;
}

function stat(k,v){return `<div class="stat"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`}
function btn(label,action,small='',cls=''){return `<button class="btn ${cls}" data-action="${action}">${label}${small?`<small>${small}</small>`:''}</button>`}
function back(){return btn('← Back','home','','back')}
function menuCard(emoji,title,sub,action,kind=''){return `<button class="menu-card ${kind}" data-action="${action}"><div class="menu-icon">${emoji}</div><div class="menu-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(sub)}</small></div><div class="menu-arrow">›</div></button>`}
function render(){
 let html=header();
 const map={
  start:renderStart,home:renderHome,result:renderResult,moves:renderMoves,street:renderStreet,supplier:renderSupplier,
  black:renderBlack,weapons:renderWeapons,armor:renderArmor,equip:renderEquip,crew:renderCrew,map:renderMap,stash:renderStash,
  upgrades:renderUpgrades,hospital:renderHospital,status:renderStatus,market:renderMarket,phone:renderPhone,objectives:renderObjectives,
  achievements:renderAchievements,skills:renderSkills,laylow:renderLayLow,vehicles:renderVehicles,properties:renderProperties,
  howto:renderHowTo,patch:renderPatchNotes,leaderboard:renderLeaderboard,ownerWallet:renderOwnerWallet,ownerDashboard:renderOwnerDashboard
 };
 if(screen==='supplierShop')html+=renderSupplierShop(payload);else html+=(map[screen]||renderHome)();
 app().innerHTML=html+`<div class="footer-note">${fmBackend.ready?'Local save + cloud sync active.':'Local save active. Cloud will sync when connected.'}</div>`;
}
function renderStart(){
 return `<div class="card"><div class="section-title">START</div><div class="actions">
 ${hasSave()?btn('Continue Game','continue','','primary'):''}${btn('New Game','new','','primary')}
 ${btn('How To Play','howto','Learn the systems')}${btn('Patch Notes','patch','What changed in Alpha 0.2')}
 ${hasSave()?btn('Delete Save','deleteSave','Erase local browser save','danger'):''}</div></div>`;
}
function renderHome(){
 const late=player.time>=WARNING_TIME?`<div class="notice warning">${icon('alert')} LATE NIGHT — 2:00 AM is the danger window.</div>`:'';
 const hot=player.heat>=4?`<div class="notice danger">${icon('heat')} HIGH HEAT — odds, supplier prices and overnight risk are worse.</div>`:'';
 const ownerTools=fmBackend.isOwner?`<div class="section-title private-title">PRIVATE OWNER TOOLS</div><div class="menu-grid owner-grid">${menuCard(icon('owner'),'Owner Wallet',`Tax balance ${money(fmBackend.ownerBank?.balance||0)}`,'ownerWallet','owner')}${menuCard(icon('dashboard'),'Owner Dashboard','Private live game activity','ownerDashboard','owner')}</div>`:'';
 return `${late}${hot}<div class="section-title">CITY ACTIONS</div><div class="menu-grid">
 ${menuCard(icon('phone'),'Phone',PHONES[player.phone_id].name,'phone','phone')}
 ${menuCard(icon('jobs'),'Make a Move','Jobs, robberies & heists','moves','jobs')}
 ${menuCard(icon('street'),'Street Move','Move carried inventory','street','street')}
 ${menuCard(icon('supplier'),'Supplier','Contacts & inventory','supplier','supplier')}
 ${menuCard(icon('market'),'Black Market','Weapons, armor & phones','black','market')}
 ${menuCard(icon('crew'),'Crew','Recruit and manage crew','crew','crew')}
 ${menuCard(icon('map'),'City Map','Travel around the city','map','map')}
 ${menuCard(icon('garage'),'Garage','Vehicles & active ride','vehicles','garage')}
 ${menuCard(icon('property'),'Properties','Own multiple locations','properties','property')}
 ${menuCard(icon('stash'),'Trap Stash','Cash, inventory & weapons','stash','stash')}
 ${menuCard(icon('upgrade'),'Trap Upgrades','Security, storage, condition','upgrades','upgrade')}
 ${menuCard(icon('laylow'),'Lay Low','Reduce heat with time','laylow','laylow')}
 ${menuCard(icon('skills'),'Skills','Natural progression','skills','skills')}
 ${menuCard(icon('objectives'),'Objectives','Current progression goals','objectives','objectives')}
 ${menuCard(icon('achievements'),'Achievements','Badges and milestones','achievements','achievements')}
 ${menuCard(icon('hospital'),'Hospital','Treatment and recovery','hospital','hospital')}
 ${menuCard(icon('status'),'Status','Full player & trap status','status','status')}
 ${menuCard(icon('sleep'),'End Day / Sleep','Must be at your trap','sleep','sleep')}
 ${menuCard(icon('save'),'Save Game','Local + cloud sync','save','save')}
 </div>${ownerTools}`;
}

function renderResult(){
 const lines=(payload?.lines||[]).map(x=>`<div class="result-line">${escapeHtml(x)}</div>`).join('');
 return `<div class="card"><div class="result-title">${escapeHtml(payload?.title||'RESULT')}</div><div class="result-lines">${lines}</div><hr>
 <div class="status-grid">${stat('Cash',money(player.cash_on_person))}${stat('XP',player.xp)}${stat('Respect',player.respect)}${stat('Heat',stars(player.heat))}${stat('Health',`${player.health}/100`)}${stat('Time',formatTime(player.time))}</div>
 <div style="margin-top:12px">${btn('Continue','home','','primary')}</div></div>`;
}
function difficulty(m){
 const c=successChance(m),power=combatPower(),enemy=m.enemy?(m.enemy[0]+m.enemy[1])/2:0;
 let score=c+(player.health-70)*.15+(power-enemy)*.08-player.heat*1.5;
 if(score>=76)return{key:'green',label:'🟢 GREEN'};
 if(score>=57)return{key:'yellow',label:'🟡 YELLOW'};
 if(score>=38)return{key:'red',label:'🔴 RED'};
 return{key:'black',label:'⚫ BLACK'};
}
function renderMoves(){
 const items=Object.entries(MOVES).map(([id,m])=>{const r=requirement(m),chance=successChance(m),d=difficulty(m),crewReq=m.requires_crew||0,wt=m.weapon_tier||0;return `<div class="job-card ${d.key}"><div class="job-banner"><span>${escapeHtml(m.name)}</span><span class="difficulty ${d.key}">${d.label}</span></div><div class="job-metrics"><div><span>SUCCESS</span><strong>${chance}%</strong></div><div><span>PAYOUT</span><strong>${money(m.cash[0])}–${money(m.cash[1])}</strong></div><div><span>TIME</span><strong>${m.minutes[0]}–${m.minutes[1]}m</strong></div><div><span>HEAT</span><strong>+${m.heat}★</strong></div></div><div class="job-reqs"><span>📍 ${escapeHtml(LOCATIONS[m.location].name)}</span><span>${wt?`🔫 Tier ${wt}+`:'🔫 No weapon req.'}</span><span>👥 Crew ${crewReq}</span><span>❤️ ${player.health}/100</span></div>${r?`<div class="locked-banner">LOCKED · ${escapeHtml(r)}</div>`:''}<div class="job-action">${btn(r?'Locked':'Do Move',`doMove:${id}`,r?'Meet requirements first':'Attempt this move',r?'':'primary')}</div></div>`}).join('');
 return `${back()}<div class="section-title">JOB READINESS</div><div class="legend-row"><span>🟢 Favorable</span><span>🟡 Risky</span><span>🔴 Dangerous</span><span>⚫ Extreme</span></div><div class="job-list">${items}</div>`;
}

function renderStreet(){
 const av=Object.entries(player.carried_drugs).filter(([,g])=>g>.001);
 if(!av.length)return `${back()}<div class="card">You don't have any inventory on you.</div>`;
 return `${back()}<div class="card"><div class="section-title">STREET MOVE</div><label>Product</label><select id="streetDrug">${av.map(([id,g])=>`<option value="${id}">${DRUGS[id].name} (${g.toFixed(1)}g)</option>`).join('')}</select><label>Amount (game grams)</label><input id="streetGrams" type="number" min="0.1" step="0.1" value="1"><div style="margin-top:10px">${btn('Make Street Move','streetGo','','primary')}</div></div>`;
}
function renderSupplier(){
 const heatTax=player.heat>=3?`<div class="notice">High heat is making suppliers cautious. Prices are ${player.heat*3}% higher.</div>`:'';
 return `${back()}${heatTax}<div class="section-title">SUPPLIER SPOT</div><div class="list">
 <div class="item"><div class="item-head"><span>Smoke</span><span>Trust ${player.supplier_trust.Smoke}</span></div><div class="item-meta">Weed / Shrooms</div>${btn('Meet Smoke','supplier:Smoke','','primary')}</div>
 <div class="item"><div class="item-head"><span>Doc</span><span>Respect 3+</span></div><div class="item-meta">Pills / Lean</div>${btn('Meet Doc','supplier:Doc',player.respect<3?'Locked until Respect 3':'','primary')}</div>
 <div class="item"><div class="item-head"><span>Ghost</span><span>Respect 8+</span></div><div class="item-meta">Higher-risk inventory</div>${btn('Meet Ghost','supplier:Ghost',player.respect<8?'Locked until Respect 8':'','primary')}</div>
 </div>`;
}
function supplierProducts(name){return name==='Smoke'?['weed','shrooms']:name==='Doc'?['pills','lean']:['cocaine','meth','heroin']}
function supplierUnitPrice(id){const base=Math.max(1,Math.floor(DRUGS[id].base_value*.65));return Math.ceil(base*(1+(player.heat>=3?player.heat*.03:0)))}
function renderSupplierShop(name){
 const products=supplierProducts(name);
 return `${btn('← Suppliers','supplier','','back')}<div class="card"><div class="section-title">${name.toUpperCase()}</div><div class="muted">Cash: ${money(player.cash_on_person)} · Motion Tax ${Math.round(fmBackend.taxRate*100)}%</div>
 <label>Product</label><select id="buyDrug">${products.map(id=>{const p=supplierUnitPrice(id);return `<option value="${id}" data-price="${p}">${DRUGS[id].name} — ${money(p)}/game gram</option>`}).join('')}</select>
 <label>Amount (game grams)</label><input id="buyGrams" type="number" min="0.1" step="0.1" value="3.5"><div style="margin-top:10px">${btn('Buy','buyDrugGo','','primary')}</div></div>`;
}
function renderBlack(){return `${back()}<div class="section-title">BLACK MARKET</div><div class="actions">${btn('Weapons','weapons','Tier 1–5')}${btn('Armor','armor','Light → Elite')}${btn('Equip Gear','equip','Choose active gear')}${btn('Phone Shop','phoneShop','Upgrade your phone')}</div>`}
function renderWeapons(){return `${btn('← Black Market','black','','back')}<div class="list">${Object.entries(WEAPONS).map(([id,w])=>{const q=purchaseQuote(w.price);return `<div class="item"><div class="item-head"><span>${w.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Tier ${w.tier} · Power ${w.power} · Condition ${w.condition}% · Tax ${money(q.tax)}</div>${btn('Buy',`buyWeapon:${id}`,'','primary')}</div>`}).join('')}</div>`}
function renderArmor(){return `${btn('← Black Market','black','','back')}<div class="list">${Object.entries(ARMOR).map(([id,a])=>{const q=purchaseQuote(a.price);return `<div class="item"><div class="item-head"><span>${a.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Tier ${a.tier} · Defense ${a.defense} · Tax ${money(q.tax)}</div>${btn('Buy',`buyArmor:${id}`,'','primary')}</div>`}).join('')}</div>`}
function renderEquip(){
 const ws=player.weapon_inventory.map((x,i)=>`<option value="${i}">${WEAPONS[x.id].name} · Tier ${WEAPONS[x.id].tier} · ${x.condition}%</option>`).join(''),as=player.armor_inventory.map((id,i)=>`<option value="${i}">${ARMOR[id].name}</option>`).join('');
 return `${btn('← Black Market','black','','back')}<div class="card"><div class="section-title">EQUIP GEAR</div><label>Weapon</label><select id="equipWeapon"><option value="">Unarmed</option>${ws}</select><label>Armor</label><select id="equipArmor"><option value="">None</option>${as}</select><div style="margin-top:10px">${btn('Equip','equipGo','','primary')}</div></div>`;
}
function renderCrew(){return `${back()}<div class="card"><div class="section-title">YOUR CREW</div>${player.crew.length?player.crew.map(id=>`<div class="item">${CREW[id].name} · ${CREW[id].role} · Loyalty ${CREW[id].loyalty}% · Cut ${CREW[id].cut}%</div>`).join(''):'<div class="muted">Nobody yet.</div>'}</div><div class="section-title">AVAILABLE</div><div class="list">${Object.entries(CREW).filter(([id])=>!player.crew.includes(id)).map(([id,c])=>{const q=purchaseQuote(c.price);return `<div class="item"><div class="item-head"><span>${c.name} · ${c.role}</span><span>${money(q.total)}</span></div><div class="item-meta">Combat ${c.combat} · Driving ${c.driving} · Loyalty ${c.loyalty}% · Cut ${c.cut}%</div>${btn('Hire',`hire:${id}`,'','primary')}</div>`}).join('')||'<div class="card">Everybody available is already with you.</div>'}</div>`}
function renderMap(){const areas=['Southside','Midtown','Outskirts'];return `${back()}${areas.map(area=>`<div class="section-title">${area.toUpperCase()}</div><div class="list">${Object.entries(LOCATIONS).filter(([,l])=>l.area===area).map(([id,l])=>`<div class="item"><div class="item-head"><span>${l.name}</span><span>${travelTime(l.travel)} min</span></div>${btn(player.location===id?'You Are Here':'Travel',`travel:${id}`,'',player.location===id?'':'primary')}</div>`).join('')}</div>`).join('')}`}
function drugList(inv){const x=Object.entries(inv).filter(([,g])=>g>.001);return x.length?x.map(([id,g])=>`<div class="stat"><span>${DRUGS[id].name}</span><strong>${g.toFixed(1)}g</strong></div>`).join(''):'<div class="muted">Empty</div>'}
function renderStash(){
 if(player.location!=='trap')return `${back()}<div class="card">You need to be at your trap to manage the stash.</div>`;
 const takeWeapons=player.trap.weapons.map((x,i)=>`<option value="${i}">${WEAPONS[x.id].name}</option>`).join('');
 return `${back()}<div class="card"><div class="section-title">CASH</div>${stat('On Person',money(player.cash_on_person))}${stat('Stored',money(player.trap.cash))}<div class="row"><input id="cashAmount" type="number" min="1" value="100">${btn('Deposit','depositCash')}${btn('Withdraw','withdrawCash')}</div></div>
 <div class="card"><div class="section-title">ON PERSON</div>${drugList(player.carried_drugs)}<div class="section-title">TRAP STASH</div>${drugList(player.trap.drug_stash)}<hr><label>Drug</label><select id="stashDrug">${Object.keys(DRUGS).map(id=>`<option value="${id}">${DRUGS[id].name}</option>`).join('')}</select><label>Amount</label><input id="stashGrams" type="number" min="0.1" step="0.1" value="3.5"><div class="row" style="margin-top:8px">${btn('Store','storeDrug')}${btn('Take','takeDrug')}</div></div>
 <div class="card"><div class="section-title">WEAPONS</div><div class="muted">On person: ${player.weapon_inventory.length} · Stored: ${player.trap.weapons.length}</div><div class="row" style="margin-top:8px">${btn('Store All Carried Weapons','storeWeapons')}</div>${player.trap.weapons.length?`<label>Stored weapon</label><select id="takeWeapon">${takeWeapons}</select>${btn('Take Weapon','takeWeaponGo')}`:''}</div>`;
}
function renderUpgrades(){if(player.location!=='trap')return `${back()}<div class="card">You need to be at your trap.</div>`;const opts=[['security',500*(player.trap.security+1)],['storage',400*(player.trap.storage+1)],['condition',300*(player.trap.condition+1)]];return `${back()}<div class="list">${opts.map(([k,c])=>{const q=purchaseQuote(c);return `<div class="item"><div class="item-head"><span>${k[0].toUpperCase()+k.slice(1)} ${player.trap[k]}/5</span><span>${money(q.total)}</span></div><div class="item-meta">Base ${money(c)} · Tax ${money(q.tax)}</div>${btn(player.trap[k]>=5?'MAXED':'Upgrade',`upgrade:${k}`,player.trap[k]>=5?'':'Uses 60 minutes',player.trap[k]>=5?'':'primary')}</div>`}).join('')}</div>`}
function renderHospital(){const miss=100-player.health,cost=Math.max(50,miss*8);return `${back()}<div class="card"><div class="section-title">COUNTY HOSPITAL</div>${stat('Health',`${player.health}/100`)}${stat('Full Treatment',money(cost))}<div style="margin-top:10px">${btn(player.health>=100?'Already Full Health':'Get Treatment','treat',player.health>=100?'':'Takes 120 minutes',player.health>=100?'':'primary')}</div></div>`}
function renderStatus(){
 const s=stageInfo();
 return `${back()}<div class="card"><div class="section-title">PLAYER</div><div class="status-grid">${stat('Player',player.name)}${stat('Stage',s.name)}${stat('Title',s.title)}${stat('Day',player.day)}${stat('Level',player.level)}${stat('XP',player.xp)}${stat('Respect',player.respect)}${stat('Net Worth',money(totalNetWorth()))}${stat('Heat',stars(player.heat))}${stat('Health',`${player.health}/100`)}${stat('Cash',money(player.cash_on_person))}${stat('Trap Cash',money(player.trap.cash))}${stat('Weapon',weaponName())}${stat('Armor',armorName())}${stat('Vehicle',vehicleName())}${stat('Phone',PHONES[player.phone_id].name)}</div></div>
 <div class="card"><div class="section-title">TRAP</div><div class="status-grid">${stat('Security',`${player.trap.security}/5`)}${stat('Storage',`${player.trap.storage}/5`)}${stat('Condition',`${player.trap.condition}/5`)}${stat('Attention',`${player.trap.attention}%`)}${stat('Properties',player.properties.length)}${stat('Vehicles',player.vehicles.length)}</div></div>`;
}
function renderMarket(){return `${back()}<div class="card"><div class="section-title">MORNING MARKET</div>${Object.entries(DRUGS).map(([id,d])=>{const m=player.market[id],txt=m>=1.18?'HIGH ↑':m<=.9?'LOW ↓':'NORMAL →',cls=m>=1.18?'market-high':m<=.9?'market-low':'';return `<div class="stat"><span>${d.name}</span><strong class="${cls}">${txt}</strong></div>`}).join('')}</div>`}
function renderPhone(){
 const ph=PHONES[player.phone_id],apps=ph.apps;
 const iconApp=(name,emoji,label,sub,action)=>apps.includes(name)?`<button class="phone-app" data-action="${action}"><span class="phone-app-icon">${emoji}</span><strong>${label}</strong><small>${sub}</small></button>`:'';
 return `${back()}<div class="phone-wrap phone-tier-${ph.tier}"><div class="phone-shell"><div class="phone-notch"></div><div class="phone-top"><span>${formatTime(player.time)}</span><span>${ph.name}</span><span>▮▮▮</span></div><div class="phone-screen"><div class="phone-wallpaper"><div class="phone-city">FEDERAL<br>MOTION</div><div class="phone-date">Day ${player.day} · ${stageInfo().title}</div></div><div class="phone-grid">
 ${iconApp('messages','💬','Messages',`${player.messages.length} stored`,'phoneMessages')}
 ${iconApp('contacts','👤','Contacts','Suppliers & crew','supplier')}
 ${iconApp('jobs','🎯','Jobs','Available moves','moves')}
 ${iconApp('market','📈','Market','Morning demand','market')}
 ${iconApp('map','🗺️','Map','City navigation','map')}
 ${iconApp('objectives','📋','Objectives','Progression goals','objectives')}
 ${iconApp('achievements','🏆','Achievements','Badges','achievements')}
 ${iconApp('alerts','🚨','Alerts',player.heat>=3?'Heat warning active':'No major alerts','phoneAlerts')}
 ${iconApp('leaderboard','🥇','Leaderboard','Online rankings','leaderboard')}
 ${iconApp('properties','🏠','Properties',`${player.properties.length} owned`,'properties')}
 ${iconApp('garage','🚘','Garage',`${player.vehicles.length} rides`,'vehicles')}
 </div><div class="phone-dock">${btn('Upgrade Phone','phoneShop',`Current tier ${ph.tier}`,'primary')}</div></div></div></div>`;
}

function renderPhoneShop(){
 const items=Object.entries(PHONES).filter(([id])=>id!==player.phone_id).map(([id,p])=>{const q=purchaseQuote(p.price),owned=PHONES[player.phone_id].tier>=p.tier;
 return `<div class="item"><div class="item-head"><span>${p.name}</span><span>Tier ${p.tier}</span></div><div class="item-meta">${p.apps.join(' · ')}<br>${owned?'Already below your current tier':`Price ${money(q.total)} · Tax ${money(q.tax)}`}</div>${owned?'':btn('Buy / Activate',`buyPhone:${id}`,'','primary')}</div>`}).join('');
 return `${btn('← Phone','phone','','back')}<div class="section-title">PHONE SHOP</div><div class="list">${items}</div>`;
}
function renderObjectives(){const s=stageInfo();return `${back()}<div class="card"><div class="item-head"><span>${s.name}</span><span>${s.title}</span></div><div class="muted">Federal Motion is a long-term status, not an ending. The game continues after you reach it.</div></div><div class="list">${objectives().map(([t,d])=>`<div class="item objective ${d?'done':''}"><div class="item-head"><span>${d?'✓':'○'} ${escapeHtml(t)}</span><span>${d?'DONE':'ACTIVE'}</span></div></div>`).join('')}</div>`}
function renderAchievements(){return `${back()}<div class="section-title">ACHIEVEMENTS</div><div class="list">${Object.entries(ACHIEVEMENTS).map(([id,a])=>{const got=player.achievements.includes(id);return `<div class="item achievement ${got?'':'locked'}"><div class="item-head"><span>${got?'🏆':'🔒'} ${a.name}</span><span class="rarity-${a.rarity}">${a.rarity}</span></div><div class="item-meta">${a.desc}</div></div>`}).join('')}</div>`}
function renderSkills(){const names={combat:'Combat',street:'Street Smarts',charisma:'Charisma',driving:'Driving',business:'Business',endurance:'Endurance'};return `${back()}<div class="card"><div class="muted">Skills improve naturally from related actions.</div></div><div class="list">${Object.entries(names).map(([k,n])=>{const s=player.skills[k];return `<div class="item"><div class="item-head"><span>${n}</span><span>Lv ${s.level}</span></div><div class="item-meta">${s.xp} skill XP</div><div class="progress"><div style="width:${(s.xp%150)/1.5}%"></div></div></div>`}).join('')}</div>`}
function renderLayLow(){
 if(player.location!=='trap')return `${back()}<div class="card">Go back to your trap before laying low.</div>`;
 return `${back()}<div class="card"><div class="section-title">LAY LOW</div>${stat('Current Heat',stars(player.heat))}<div class="muted">Cooling off costs time. High heat stays playable, but it hurts odds and increases pressure.</div></div><div class="actions">
 ${btn('Keep Quiet — 4 Hours','laylow:4','60% chance to lose 1★')}
 ${btn('Stay In — 8 Hours','laylow:8','Guaranteed -1★','good')}
 ${btn('Disappear For The Day','laylow:day','Lose up to 2★, day advances','good')}
 </div>`;
}
function renderVehicles(){
 return `${back()}<div class="card"><div class="section-title">YOUR GARAGE</div>${player.vehicles.map(id=>`<div class="item"><div class="item-head"><span>${VEHICLES[id].name}</span><span>${player.active_vehicle===id?'ACTIVE':'OWNED'}</span></div><div class="item-meta">Speed ${Math.round((1-VEHICLES[id].speed)*100)} · Storage ${VEHICLES[id].storage} · Reliability ${VEHICLES[id].reliability}%</div>${player.active_vehicle===id?'':btn('Set Active',`activeVehicle:${id}`)}</div>`).join('')}</div>
 <div class="section-title">VEHICLE MARKET</div><div class="list">${Object.entries(VEHICLES).filter(([id])=>!player.vehicles.includes(id)).map(([id,v])=>{const q=purchaseQuote(v.price);return `<div class="item"><div class="item-head"><span>${v.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Speed ${Math.round((1-v.speed)*100)} · Storage ${v.storage} · Attention ${v.attention} · Reliability ${v.reliability}% · Tax ${money(q.tax)}</div>${btn('Buy Vehicle',`buyVehicle:${id}`,'','primary')}</div>`}).join('')}</div>`;
}
function renderProperties(){
 return `${back()}<div class="card"><div class="section-title">OWNED LOCATIONS</div>${player.properties.map(id=>`<div class="item"><div class="item-head"><span>${PROPERTIES[id].name}</span><span>${PROPERTIES[id].type}</span></div><div class="item-meta">Storage +${PROPERTIES[id].storage} · Security +${PROPERTIES[id].security} · Status +${PROPERTIES[id].status}</div></div>`).join('')}</div>
 <div class="section-title">PROPERTY MARKET</div><div class="list">${Object.entries(PROPERTIES).filter(([id])=>!player.properties.includes(id)).map(([id,p])=>{const q=purchaseQuote(p.price);return `<div class="item"><div class="item-head"><span>${p.name}</span><span>${money(q.total)}</span></div><div class="item-meta">${p.type} · Storage +${p.storage} · Security +${p.security} · Status +${p.status} · Tax ${money(q.tax)}</div>${btn('Buy Property',`buyProperty:${id}`,'','primary')}</div>`}).join('')}</div>`;
}
function renderHowTo(){return `${btn('← Start','start','','back')}<div class="card"><div class="section-title">HOW TO PLAY</div><div class="result-lines">
 <div class="result-line">Every action uses in-game time. Start at 8:00 AM and watch the 2:00 AM danger window.</div>
 <div class="result-line">Jobs now show 🟢 / 🟡 / 🔴 / ⚫ readiness based on your actual character and current heat.</div>
 <div class="result-line">All robberies require a weapon. Bigger jobs require stronger weapon tiers, crew and level.</div>
 <div class="result-line">Heat runs 0–5 stars. High heat does not stop play, but it makes the city harder. Use Lay Low to cool off.</div>
 <div class="result-line">Skills level naturally. Titles require a mix of level, respect and net worth.</div>
 <div class="result-line">Federal Motion is a long-term status, not an ending. Keep playing afterward.</div>
 <div class="result-line">Purchases include the in-game Motion Tax. Cloud saves and online stat syncing are active when CLOUD ONLINE appears.</div>
 </div></div>`}
function renderPatchNotes(){return `${btn('← Start','start','','back')}<div class="card"><div class="result-title">ALPHA 0.3 — UI UPDATE</div><div class="result-lines"><div class="result-line">NEW: Full HUD redesign with visual health, XP, respect and heat meters.</div><div class="result-line">NEW: Gritty street / trap-phone visual style across the game.</div><div class="result-line">NEW: Redesigned phone screens that visually improve with phone tier.</div><div class="result-line">NEW: Larger visual menu cards and cleaner navigation.</div><div class="result-line">NEW: Rebuilt job cards showing success %, payout, time, heat, weapon tier, crew and location.</div><div class="result-line">NEW: Improved alerts, status presentation and progression visibility.</div><div class="result-line">POLISH: Better spacing, mobile layout, panel styling and feedback states.</div></div></div>`}


function renderOwnerWallet(){
 if(!fmBackend.isOwner)return `${back()}<div class="card">Owner access required.</div>`;
 const b=fmBackend.ownerBank||{balance:0,total_tax_collected:0,total_tax_events:0,player_losses_collected:0,player_loss_events:0};
 return `${back()}<div class="section-title private-title">PRIVATE OWNER WALLET</div>
 <div class="dashboard-grid">
  <div class="dash-card"><span>SPENDABLE BALANCE</span><strong>${money(b.balance||0)}</strong></div>
  <div class="dash-card"><span>LIFETIME MOTION TAX</span><strong>${money(b.total_tax_collected||0)}</strong></div>
  <div class="dash-card"><span>PLAYER LOSSES COLLECTED</span><strong>${money(b.player_losses_collected||0)}</strong></div>
  <div class="dash-card"><span>TAX EVENTS</span><strong>${Number(b.total_tax_events||0).toLocaleString()}</strong></div>
  <div class="dash-card"><span>PLAYER LOSS EVENTS</span><strong>${Number(b.player_loss_events||0).toLocaleString()}</strong></div>
  <div class="dash-card"><span>PLAYER CASH</span><strong>${money(player.cash_on_person)}</strong></div>
  <div class="dash-card wide">
   <span>TRANSFER TO PLAYER CASH</span>
   <div class="muted" style="margin:8px 0">Withdraw Owner Wallet funds into your character cash so the money can be spent normally in-game.</div>
   <input id="ownerWithdrawAmount" type="number" min="1" step="1" value="100">
   <div style="margin-top:10px">${btn('Withdraw To Player Cash','ownerWithdraw','','good')}</div>
  </div>
 </div>`;
}

function renderOwnerDashboard(){
 if(!fmBackend.isOwner)return `${back()}<div class="card">Owner access required.</div>`;
 return `${back()}<div class="section-title private-title">PRIVATE OWNER DASHBOARD</div>
 <div id="ownerDashboardBox" class="dashboard-grid">
   <div class="dash-card wide"><span>STATUS</span><strong>Loading live activity…</strong></div>
 </div>`;
}

async function loadOwnerDashboard(){
 if(!fmBackend.isOwner||!fmBackend.client)return;
 const box=document.getElementById('ownerDashboardBox');
 if(!box)return;

 const {data,error}=await fmBackend.client.rpc('fm_owner_dashboard');
 if(error){
  box.innerHTML=`<div class="dash-card wide"><span>ERROR</span><strong>${escapeHtml(error.message)}</strong></div>`;
  return;
 }

 const d=Array.isArray(data)?data[0]:data;
 if(!d){
  box.innerHTML='<div class="dash-card wide"><span>STATUS</span><strong>No dashboard data.</strong></div>';
  return;
 }

 const recent=(d.recent_players||[]).map(p=>
  `<div class="activity-row"><strong>${escapeHtml(p.player_name||'Player')}</strong><span>Lv ${p.level||1}</span><small>Last sync: ${escapeHtml(p.last_sync||'Unknown')}</small></div>`
 ).join('')||'<div class="muted">No recent players.</div>';

 box.innerHTML=`
   <div class="dash-card"><span>OWNER WALLET</span><strong>${money(d.owner_balance||0)}</strong></div>
   <div class="dash-card"><span>LIFETIME TAX</span><strong>${money(d.total_tax_collected||0)}</strong></div>
   <div class="dash-card"><span>TAX EVENTS</span><strong>${Number(d.total_tax_events||0).toLocaleString()}</strong></div>
   <div class="dash-card"><span>PLAYER PROFILES</span><strong>${Number(d.total_player_profiles||0).toLocaleString()}</strong></div>
   <div class="dash-card"><span>ACTIVE RECENTLY</span><strong>${Number(d.players_active_recently||0).toLocaleString()}</strong></div>
   <div class="dash-card"><span>HIGHEST LEVEL</span><strong>${d.highest_level||1}</strong></div>
   <div class="dash-card"><span>HIGHEST NET WORTH</span><strong>${money(d.highest_net_worth||0)}</strong></div>
   <div class="dash-card"><span>LATEST CLOUD SAVE</span><strong class="dash-small">${escapeHtml(d.latest_cloud_save||'None')}</strong></div>
   <div class="dash-card wide"><span>RECENT PLAYER ACTIVITY</span><div class="activity-list">${recent}</div></div>`;
}

function renderLeaderboard(){return `${back()}<div class="card"><div class="section-title">ONLINE LEADERBOARD</div><div id="leaderboardBox" class="muted">Loading rankings…</div></div>`}

function travelTime(base){const v=VEHICLES[player.active_vehicle]||VEHICLES.bicycle;return Math.max(10,Math.floor(base*v.speed))}
function travelTo(id){if(id===player.location)return{ok:true};const mins=travelTime(LOCATIONS[id].travel);player.location=id;addSkillXP('driving',Math.max(2,Math.floor(mins/20)));return advanceTime(mins)}
function advanceTime(mins){player.time+=mins;if(player.time>=DAY_END){lateNightEvent();return{ok:false,late:true}}return{ok:true}}
function combatPower(){let p=player.level*3+skillLevel('combat')*2;if(player.equipped_weapon)p+=WEAPONS[player.equipped_weapon].power;if(player.equipped_armor)p+=Math.floor(ARMOR[player.equipped_armor].defense/2);player.crew.forEach(id=>p+=CREW[id].combat);p+=Math.floor(player.respect/3);return p}
function successChance(m){let c=m.base_success-player.heat*4+Math.min(12,player.level*2)+Math.min(8,Math.floor(player.respect/3))+skillLevel('street');if(m.combat){const e=(m.enemy[0]+m.enemy[1])/2;c+=Math.floor((combatPower()-e)*.6)}return clamp(c,8,95)}
function requirement(m){if(player.level<(m.requires_level||1))return `Requires Level ${m.requires_level}`;if(m.requires_weapon&&!player.equipped_weapon)return 'Weapon required';if(m.weapon_tier&&currentWeaponTier()<m.weapon_tier)return `Requires Weapon Tier ${m.weapon_tier}+`;if(player.crew.length<(m.requires_crew||0))return `Requires ${m.requires_crew} crew member(s)`;return''}
function result(title,lines){checkAchievements();saveGame();screen='result';payload={title,lines};render()}

function performMove(id){
 const m=MOVES[id],r=requirement(m);if(r){result('LOCKED',[r]);return}
 travelTo(m.location);if(screen==='result')return;const chance=successChance(m);advanceTime(randInt(...m.minutes));if(screen==='result')return;
 player.stats.moves++;addSkillXP(m.combat?'combat':'street',m.combat?18:10);addSkillXP('endurance',5);
 if(randInt(1,100)<=chance){
  let gross=randInt(...m.cash),cut=0;player.crew.forEach(cid=>cut+=Math.floor(gross*CREW[cid].cut/100));let payout=Math.max(0,gross-cut);
  player.cash_on_person+=payout;player.stats.total_earned+=payout;player.stats.biggest_score=Math.max(player.stats.biggest_score||0,payout);
  player.xp+=m.xp;player.respect+=m.respect;player.heat=clamp(player.heat+m.heat,0,5);player.trap.attention=clamp(player.trap.attention+m.heat*4,0,100);
  player.stats.successful_moves++;player.daily.successes++;
  let lines=[`Cash: +${money(payout)}`,`XP: +${m.xp}`,`Respect: +${m.respect}`];if(cut)lines.push(`Crew cuts paid: ${money(cut)}`);if(m.heat)lines.push(`Heat: +${m.heat}★`);
  if(id==='house_hit'&&Math.random()<.35){const b=randInt(40,180);player.cash_on_person+=b;player.stats.total_earned+=b;lines.push(`Stolen goods fenced: +${money(b)}`)}
  if(id==='rival_trap'){const d=Object.keys(DRUGS)[randInt(0,Object.keys(DRUGS).length-1)],g=Math.round((3.5+Math.random()*24.5)*10)/10;player.carried_drugs[d]+=g;lines.push(`Loot: ${g.toFixed(1)}g ${DRUGS[d].name}`)}
  const lvl=updateLevel();if(lvl)lines.push(lvl);result('MOVE SUCCESSFUL',lines);
 }else{
  player.stats.failed_moves++;player.daily.failures++;const x=Math.max(10,Math.floor(m.xp/4));player.xp+=x;let lines=[`XP from experience: +${x}`];
  if(m.combat){let defense=player.equipped_armor?ARMOR[player.equipped_armor].defense:0,enemy=randInt(...m.enemy),dmg=Math.max(8,randInt(15,45)+Math.max(0,Math.floor(enemy/10)-Math.floor(defense/8)));player.health-=dmg;addSkillXP('endurance',12);if(player.health<=0){hospitalRespawn();return}lines.push(`Health: -${dmg}`);if(Math.random()<.3){player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★')}}else{player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★')}
  result('MOVE FAILED',lines)
 }
}
function hospitalRespawn(){const cash=player.cash_on_person;player.cash_on_person=0;if(cash>0)queueOwnerLoss(cash,'hospital_downed');player.carried_drugs=emptyDrugInventory();let lost=null;if(player.equipped_weapon){lost=weaponName();const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null}const x=Math.min(player.xp,Math.max(50,Math.floor(player.xp/10))),days=randInt(1,3);player.xp-=x;player.day+=days;player.time=DAY_START;player.location='hospital';player.health=65;player.stats.hospital_visits++;addSkillXP('endurance',25);resetDaily();result('YOU WENT DOWN',[`Cash lost from your person: ${money(cash)}`,'Carried inventory lost.',lost?`Weapon lost: ${lost}`:'No equipped weapon lost.',`XP lost: ${x}`,`Time passed: ${days} day(s)`,'Your trap stash and stored cash were untouched.'])}
function arrestEvent(){const days=randInt(2,10),cash=Math.floor(player.cash_on_person*(.25+Math.random()*.45));player.cash_on_person-=cash;if(cash>0)queueOwnerLoss(cash,'arrest_seizure');player.carried_drugs=emptyDrugInventory();if(player.equipped_weapon&&Math.random()<.75){const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null}player.day+=days;player.time=DAY_START;player.location='trap';player.heat=Math.max(1,player.heat-1);player.respect=Math.max(0,player.respect-randInt(0,2));player.stats.arrests++;resetDaily();generateMarket();result('BUSTED',[`Jail time: ${days} days`,`Cash seized: ${money(cash)}`,'Carried inventory seized.','Stored trap stash remains separate.'])}
function lateNightEvent(){const severity=Math.max(1,Math.floor((player.time-DAY_END)/30)+1),danger=Math.min(90,25+severity*10+player.heat*8);if(randInt(1,100)>danger){player.location='trap';forcedEndDay(['You got lucky and made it back.']);return}const o=['robbed','arrested','injured'][randInt(0,2)];if(o==='arrested'){arrestEvent();return}if(o==='robbed'){const c=player.cash_on_person;player.cash_on_person=0;if(c>0)queueOwnerLoss(c,'late_night_robbery');player.carried_drugs=emptyDrugInventory();player.location='trap';forcedEndDay([`Caught slipping after 2:00 AM.`,`Lost carried cash: ${money(c)}`,'Lost carried inventory.']);return}player.health-=randInt(25,55);if(player.health<=0){hospitalRespawn();return}player.location='trap';forcedEndDay([`You made it back hurt. Health: ${player.health}/100`])}
function totalTrapValue(){let v=player.trap.cash;Object.entries(player.trap.drug_stash).forEach(([id,g])=>v+=Math.floor(g*DRUGS[id].base_value));player.trap.weapons.forEach(x=>v+=WEAPONS[x.id]?.price||0);return v}
function overnightEventLines(){const s=player.trap.security,a=player.trap.attention,v=totalTrapValue();let risk=5+Math.floor(a/4)+player.heat*5+Math.min(20,Math.floor(v/1000))-s*6;risk=clamp(risk,3,70);if(randInt(1,100)>risk){player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return['Quiet night. Nothing major happened.']}const e=['robbery','pressure','damage'][randInt(0,2)],lines=[];if(e==='robbery'){lines.push('Somebody hit the trap overnight.');const loss=Math.min(player.trap.cash,randInt(0,Math.max(50,Math.floor(player.trap.cash/3)+1)));player.trap.cash-=loss;if(loss){queueOwnerLoss(loss,'trap_robbery');lines.push(`Cash stolen: ${money(loss)}`);}player.trap.condition=Math.max(0,player.trap.condition-1)}else if(e==='pressure'){player.heat=clamp(player.heat+1,0,5);lines.push('Heavy pressure overnight.','Heat: +1★')}else{player.trap.condition=Math.max(0,player.trap.condition-1);lines.push('Something got damaged at the trap.','Trap Condition: -1')}player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return lines}
function endDay(){if(player.location!=='trap'){result('CAN’T SLEEP YET',['Return to your trap before sleeping.']);return}const cashNow=player.cash_on_person+player.trap.cash,summary=[`Cash Change: ${money(cashNow-player.daily.cash_start)}`,`XP Change: ${(player.xp-player.daily.xp_start>=0?'+':'')+(player.xp-player.daily.xp_start)}`,`Respect Change: ${(player.respect-player.daily.respect_start>=0?'+':'')+(player.respect-player.daily.respect_start)}`,`Heat Change: ${(player.heat-player.daily.heat_start>=0?'+':'')+(player.heat-player.daily.heat_start)}`,`Moves: ${player.daily.successes} successful / ${player.daily.failures} failed`,`Trap Attention: ${player.trap.attention}%`],night=overnightEventLines();player.day++;player.time=DAY_START;player.location='trap';player.stats.days_survived++;if(player.heat>0&&Math.random()<.35)player.heat--;generateMarket();resetDaily();result(`DAY ${player.day} — MORNING REPORT`,[...summary,'--- NIGHT REPORT ---',...night,`Heat: ${stars(player.heat)}`,'The city is moving again.'])}
function forcedEndDay(extra){const night=overnightEventLines();player.day++;player.time=DAY_START;player.location='trap';player.stats.days_survived++;if(player.heat>0&&Math.random()<.35)player.heat--;generateMarket();resetDaily();result(`DAY ${player.day} — MORNING REPORT`,[...extra,'--- NIGHT REPORT ---',...night,`Heat: ${stars(player.heat)}`])}

async function loadLeaderboard(){
 if(!fmBackend.ready||!fmBackend.client)return;
 const box=document.getElementById('leaderboardBox');if(!box)return;
 const {data,error}=await fmBackend.client.rpc('fm_public_leaderboard',{limit_n:25});
 if(error){box.textContent='Leaderboard backend not installed yet. Run the Alpha 0.2 SQL update.';return}
 box.innerHTML=(data||[]).map((r,i)=>`<div class="item"><div class="item-head"><span>#${i+1} ${escapeHtml(r.player_name||'Player')}</span><span>${escapeHtml(r.title||'')}</span></div><div class="item-meta">Level ${r.level} · Respect ${r.respect} · Net Worth ${money(r.net_worth)} · Days ${r.days_survived}</div></div>`).join('')||'No ranked players yet.';
}
function renderMessages(){return `${btn('← Phone','phone','','back')}<div class="section-title">MESSAGES</div><div class="list">${player.messages.slice(-20).reverse().map(m=>`<div class="item"><div class="item-head"><span>${escapeHtml(m.from)}</span></div><div class="item-meta">${escapeHtml(m.text)}</div></div>`).join('')}</div>`}
function renderAlerts(){const x=[];if(player.heat>=3)x.push(`Heat is ${stars(player.heat)}. Odds and supplier prices are worse.`);if(player.trap.attention>=50)x.push(`Trap attention is ${player.trap.attention}%. Overnight risk is climbing.`);if(player.time>=WARNING_TIME)x.push('Late-night danger window is approaching.');if(!x.length)x.push('No major alerts right now.');return `${btn('← Phone','phone','','back')}<div class="section-title">ALERTS</div><div class="list">${x.map(t=>`<div class="notice">${escapeHtml(t)}</div>`).join('')}</div>`}

function handle(action){
 if(action==='new'){const name=prompt('Enter player name:','Player')||'Player';player=newPlayer(name);generateMarket();resetDaily();saveGame();screen='market';payload=null;render();return}
 if(action==='continue'){player=loadGame();if(!player){screen='start';render();return}screen='home';render();return}
 if(action==='deleteSave'){if(confirm('Delete your Federal Motion local save?')){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(LEGACY_SAVE_KEY);player=null;screen='start';render()}return}
 if(action==='start'){screen='start';render();return}
 if(action==='home'){screen='home';payload=null;render();return}
 const direct=['moves','street','supplier','black','weapons','armor','equip','crew','map','stash','upgrades','hospital','status','market','phone','objectives','achievements','skills','laylow','vehicles','properties','howto','patch','leaderboard','ownerWallet','ownerDashboard'];
 if(direct.includes(action)){screen=action;payload=null;render();if(action==='leaderboard')setTimeout(loadLeaderboard,0);if(action==='ownerDashboard')setTimeout(loadOwnerDashboard,0);return}
 if(action==='phoneShop'){screen='phoneShop';payload=null;app().innerHTML=header()+renderPhoneShop()+`<div class="footer-note">Local + cloud save active.</div>`;return}
 if(action==='phoneMessages'){app().innerHTML=header()+renderMessages()+`<div class="footer-note">Local + cloud save active.</div>`;return}
 if(action==='phoneAlerts'){app().innerHTML=header()+renderAlerts()+`<div class="footer-note">Local + cloud save active.</div>`;return}
 if(action==='save'){saveGame();result('GAME SAVED',['Local save updated.','Cloud sync requested.']);return}
 if(action==='ownerWithdraw'){
  const amount=Math.floor(Number($('#ownerWithdrawAmount')?.value||0));
  if(amount<=0){result('OWNER WALLET',['Enter a valid amount.']);return}
  withdrawOwnerFunds(amount).then(r=>{
   if(!r.ok){result('OWNER WALLET',[r.error||'Withdrawal failed.']);return}
   result('OWNER WITHDRAWAL',[`Owner Wallet: -${money(amount)}`,`Player Cash: +${money(amount)}`,`Owner Wallet Remaining: ${money(r.new_balance)}`]);
  });
  return;
 }
 if(action==='sleep'){endDay();return}
 if(action.startsWith('doMove:')){performMove(action.split(':')[1]);return}
 if(action.startsWith('supplier:')){const n=action.split(':')[1];if((n==='Doc'&&player.respect<3)||(n==='Ghost'&&player.respect<8)){result('NOT YET',[n==='Doc'?'Doc: Come back when people know your name.':'Ghost isn’t interested yet.']);return}travelTo('supplier');if(screen==='result')return;screen='supplierShop';payload=n;render();return}
 if(action==='buyDrugGo'){const id=$('#buyDrug').value,g=parseFloat($('#buyGrams').value||0),p=supplierUnitPrice(id),cost=Math.floor(g*p),name=payload;if(g<=0)return;const charge=taxedPurchase(cost);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)} including ${money(charge.tax)} Motion Tax.`]);return}player.carried_drugs[id]+=g;player.supplier_trust[name]++;addSkillXP('charisma',4);advanceTime(30);if(screen==='result')return;result('DEAL COMPLETE',[`${DRUGS[id].name}: +${g.toFixed(1)}g`,`Base: -${money(charge.base)}`,`Motion Tax: -${money(charge.tax)}`,`Total: -${money(charge.total)}`]);return}
 if(action==='streetGo'){const id=$('#streetDrug').value,g=Math.min(parseFloat($('#streetGrams').value||0),player.carried_drugs[id]);if(g<=0)return;const d=DRUGS[id],pay=Math.floor(g*d.base_value*player.market[id]*(.85+Math.random()*.3)),chance=Math.max(40,96-(d.risk+player.heat)*4+skillLevel('street'));advanceTime(randInt(35,65));if(screen==='result')return;player.stats.moves++;addSkillXP('street',12);if(randInt(1,100)<=chance){player.carried_drugs[id]-=g;player.cash_on_person+=pay;player.stats.total_earned+=pay;const xp=Math.max(10,Math.floor(g*2));player.xp+=xp;if(randInt(1,100)<=d.risk*8)player.heat=clamp(player.heat+1,0,5);player.stats.successful_moves++;player.daily.successes++;const lvl=updateLevel();result('MOVE SUCCESSFUL',[`Moved: ${g.toFixed(1)}g ${d.name}`,`Cash: +${money(pay)}`,`XP: +${xp}`,...(lvl?[lvl]:[])])}else{player.stats.failed_moves++;player.daily.failures++;player.heat=clamp(player.heat+1,0,5);result('MOVE WENT BAD',['The opportunity fell apart.','No inventory was lost.','Heat: +1★'])}return}
 if(action.startsWith('buyWeapon:')){const id=action.split(':')[1],w=WEAPONS[id],c=taxedPurchase(w.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)} including Motion Tax.`]);return}player.weapon_inventory.push({id,condition:w.condition,upgrades:0});advanceTime(30);result('PURCHASE COMPLETE',[`Purchased ${w.name}.`,`Base: -${money(c.base)}`,`Motion Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action.startsWith('buyArmor:')){const id=action.split(':')[1],a=ARMOR[id],c=taxedPurchase(a.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)} including Motion Tax.`]);return}player.armor_inventory.push(id);advanceTime(25);result('PURCHASE COMPLETE',[`Purchased ${a.name}.`,`Motion Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action.startsWith('buyPhone:')){const id=action.split(':')[1],p=PHONES[id];if(PHONES[player.phone_id].tier>=p.tier)return;const c=taxedPurchase(p.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.phone_id=id;addSkillXP('business',10);result('PHONE UPGRADED',[`New phone: ${p.name}`,`Motion Tax: -${money(c.tax)}`,`Apps unlocked: ${p.apps.join(', ')}`]);return}
 if(action==='equipGo'){const wi=$('#equipWeapon').value,ai=$('#equipArmor').value;player.equipped_weapon=wi===''?null:player.weapon_inventory[Number(wi)].id;player.equipped_armor=ai===''?null:player.armor_inventory[Number(ai)];result('GEAR EQUIPPED',[`Weapon: ${weaponName()}`,`Armor: ${armorName()}`]);return}
 if(action.startsWith('hire:')){const id=action.split(':')[1],c=CREW[id];travelTo('crew_spot');if(screen==='result')return;const charge=taxedPurchase(c.price);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)}.`]);return}player.crew.push(id);addSkillXP('charisma',15);advanceTime(45);result('CREW UPDATED',[`${c.name} joined as ${c.role}.`,`Motion Tax: -${money(charge.tax)}`]);return}
 if(action.startsWith('travel:')){const id=action.split(':')[1];if(id===player.location)return;travelTo(id);if(screen==='result')return;result('TRAVEL COMPLETE',[`Arrived at ${LOCATIONS[id].name}.`,`Time: ${formatTime(player.time)}`]);return}
 if(action.startsWith('activeVehicle:')){const id=action.split(':')[1];if(player.vehicles.includes(id)){player.active_vehicle=id;saveGame();screen='vehicles';render()}return}
 if(action.startsWith('buyVehicle:')){const id=action.split(':')[1],v=VEHICLES[id],c=taxedPurchase(v.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.vehicles.push(id);player.active_vehicle=id;result('VEHICLE PURCHASED',[`${v.name} added to your garage.`,`Motion Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action.startsWith('buyProperty:')){const id=action.split(':')[1],p=PROPERTIES[id],c=taxedPurchase(p.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.properties.push(id);result('PROPERTY PURCHASED',[`${p.name} is now yours.`,`Motion Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action==='depositCash'||action==='withdrawCash'){let a=Math.max(0,Math.floor(Number($('#cashAmount').value||0)));if(action==='depositCash'){a=Math.min(a,player.cash_on_person);player.cash_on_person-=a;player.trap.cash+=a}else{a=Math.min(a,player.trap.cash);player.trap.cash-=a;player.cash_on_person+=a}saveGame();screen='stash';render();return}
 if(action==='storeDrug'||action==='takeDrug'){const id=$('#stashDrug').value;let g=Math.max(0,Number($('#stashGrams').value||0)),src=action==='storeDrug'?player.carried_drugs:player.trap.drug_stash,dst=action==='storeDrug'?player.trap.drug_stash:player.carried_drugs;g=Math.min(g,src[id]);src[id]-=g;dst[id]+=g;saveGame();screen='stash';render();return}
 if(action==='storeWeapons'){player.trap.weapons.push(...player.weapon_inventory);player.weapon_inventory=[];player.equipped_weapon=null;saveGame();screen='stash';render();return}
 if(action==='takeWeaponGo'){const i=Number($('#takeWeapon').value);if(Number.isFinite(i)&&player.trap.weapons[i])player.weapon_inventory.push(player.trap.weapons.splice(i,1)[0]);saveGame();screen='stash';render();return}
 if(action.startsWith('upgrade:')){const k=action.split(':')[1];if(player.trap[k]>=5)return;const base={security:500*(player.trap.security+1),storage:400*(player.trap.storage+1),condition:300*(player.trap.condition+1)}[k],c=taxedPurchase(base);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.trap[k]++;advanceTime(60);result('TRAP UPGRADED',[`${k[0].toUpperCase()+k.slice(1)} upgraded to ${player.trap[k]}/5.`,`Motion Tax: -${money(c.tax)}`]);return}
 if(action==='treat'){if(player.health>=100)return;travelTo('hospital');if(screen==='result')return;const c=Math.max(50,(100-player.health)*8);if(player.cash_on_person<c){result('NOT ENOUGH CASH',[`Treatment costs ${money(c)}.`]);return}player.cash_on_person-=c;player.health=100;advanceTime(120);addSkillXP('endurance',6);result('TREATMENT COMPLETE',['Health restored to 100/100.',`Cash: -${money(c)}`]);return}
 if(action.startsWith('laylow:')){if(player.location!=='trap')return;const mode=action.split(':')[1];if(player.heat<=0){result('ALREADY COLD',['Heat is already at zero.']);return}
  if(mode==='4'){advanceTime(240);const ok=Math.random()<.6;if(ok)player.heat=Math.max(0,player.heat-1);player.trap.attention=Math.max(0,player.trap.attention-8);result('LAY LOW',[ok?'Heat: -1★':'Heat did not drop this time.','Trap attention cooled down.']);return}
  if(mode==='8'){advanceTime(480);player.heat=Math.max(0,player.heat-1);player.trap.attention=Math.max(0,player.trap.attention-15);result('LAY LOW',['Heat: -1★','Trap attention cooled down.']);return}
  if(mode==='day'){const drop=Math.min(player.heat,2);player.heat-=drop;player.trap.attention=Math.max(0,player.trap.attention-25);player.day++;player.time=DAY_START;player.stats.days_survived++;generateMarket();resetDaily();result('DISAPPEARED FOR THE DAY',[`Heat: -${drop}★`,'A full day passed.','Trap attention dropped.']);return}
 }
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handle(b.dataset.action)});
render();initBackend();
