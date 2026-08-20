'use strict';

// =========================================================
// FEDERAL MOTION — WEB BUILD // ALPHA 0.7
// Work + Hustle Expansion
// =========================================================

const SAVE_KEY = 'federal_motion_web_save_v1';
const TAX_QUEUE_KEY = 'federal_motion_tax_queue_v1';
const GAME_VERSION = 'Alpha 0.7';
const CURRENT_PATCH_ID = 'alpha_0_7_work_hustle_expansion';
const CURRENT_TUTORIAL_VERSION = 2;

const SUPABASE_URL = 'https://nrqgmlofflbnwhbywfbc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KlgKi5KFxRqrMbGzZIVVSQ_-JM9OlON';
const DEFAULT_MOTION_TAX_RATE = 0.05;

let fmBackend = {
  client:null,
  user:null,
  ready:false,
  syncing:false,
  taxRate:DEFAULT_MOTION_TAX_RATE,
  gameVersion:GAME_VERSION,
  error:null,
};

const DAY_START = 8 * 60;
const WARNING_TIME = 24 * 60;
const DAY_END = 26 * 60;
const MAX_HEAT = 5;
const MAX_HEALTH = 100;

// =========================================================
// GAME DATA
// =========================================================

const DRUGS = {
  weed:{name:'Weed',tier:'LOW',base_value:8,risk:1},
  pills:{name:'Pills',tier:'MEDIUM',base_value:16,risk:2},
  shrooms:{name:'Shrooms',tier:'MEDIUM',base_value:13,risk:2},
  lean:{name:'Lean',tier:'MEDIUM',base_value:18,risk:2},
  cocaine:{name:'Cocaine',tier:'HIGH',base_value:32,risk:4},
  meth:{name:'Meth',tier:'HIGH',base_value:29,risk:4},
  heroin:{name:'Heroin',tier:'HIGH',base_value:35,risk:5},
};

const WEAPONS = {
  cheap_handgun:{name:'Cheap Handgun',price:450,power:12,condition:70},
  handgun:{name:'Handgun',price:900,power:20,condition:85},
  shotgun:{name:'Shotgun',price:1600,power:30,condition:85},
  rifle:{name:'Rifle',price:2800,power:42,condition:90},
  elite_weapon:{name:'Elite Weapon',price:6000,power:58,condition:95},
};

const ARMOR = {
  light_armor:{name:'Light Armor',price:700,defense:12},
  body_armor:{name:'Body Armor',price:1800,defense:25},
  heavy_armor:{name:'Heavy Armor',price:4000,defense:40},
};

const CREW = {
  rico:{name:'Rico',price:500,combat:12,driving:10,loyalty:65,cut:10},
  ace:{name:'Ace',price:1200,combat:20,driving:24,loyalty:72,cut:15},
  brick:{name:'Brick',price:1800,combat:35,driving:7,loyalty:68,cut:18},
};

const LOCATIONS = {
  trap:{name:'Your Trap',area:'Southside',travel:0},
  corner_store:{name:'Corner Store',area:'Southside',travel:20},
  apartments:{name:'Apartments',area:'Southside',travel:25},
  hospital:{name:'County Hospital',area:'Southside',travel:30},
  supplier:{name:'Supplier Spot',area:'Southside',travel:30},
  black_market:{name:'Black Market',area:'Southside',travel:35},
  shopping_strip:{name:'Shopping Strip',area:'Midtown',travel:55},
  warehouse:{name:'Warehouse District',area:'Midtown',travel:70},
  garage:{name:'Garage',area:'Midtown',travel:60},
  bank:{name:'Bank District',area:'Midtown',travel:75},
  crew_spot:{name:'Crew Hangout',area:'Midtown',travel:65},
  rival_territory:{name:'Rival Territory',area:'Outskirts',travel:100},
  freight_yard:{name:'Freight Yard',area:'Outskirts',travel:115},
  secure_warehouse:{name:'Secure Warehouse',area:'Outskirts',travel:125},
  military_facility:{name:'Restricted Warehouse',area:'Outskirts',travel:145},
};

const MOVES = {
  quick_hustle:{name:'Quick Hustle',location:'corner_store',minutes:[45,75],base_success:90,cash:[70,160],xp:35,respect:1,heat:0,combat:false},
  house_hit:{name:'House Robbery',location:'apartments',minutes:[90,150],base_success:76,cash:[150,500],xp:70,respect:2,heat:1,combat:true,enemy:[8,24]},
  store_hit:{name:'Store Robbery',location:'shopping_strip',minutes:[90,150],base_success:72,cash:[300,900],xp:110,respect:3,heat:1,combat:true,enemy:[15,30]},
  rival_trap:{name:'Rival Trap House Hit',location:'rival_territory',minutes:[150,240],base_success:63,cash:[650,1800],xp:180,respect:5,heat:2,combat:true,enemy:[28,50],requires_weapon:true},
  bank_heist:{name:'Bank Heist',location:'bank',minutes:[300,420],base_success:48,cash:[3000,9000],xp:420,respect:10,heat:3,combat:true,enemy:[45,70],requires_weapon:true,requires_crew:1,requires_level:4},
  restricted_warehouse:{name:'Restricted Warehouse Heist',location:'military_facility',minutes:[360,480],base_success:38,cash:[7000,18000],xp:700,respect:16,heat:4,combat:true,enemy:[65,95],requires_weapon:true,requires_crew:2,requires_level:6},
};

const SIDE_HUSTLES = {
  delivery_run:{name:'Quick Delivery',minutes:[35,60],cash:[90,180],xp:25,respect:0,success:94,heat:0,risk:'LOW',clean:true,requires_level:1},
  moving_help:{name:'Moving Help',minutes:[60,100],cash:[130,240],xp:35,respect:0,success:93,heat:0,risk:'LOW',clean:true,requires_level:1},
  car_detail:{name:'Quick Car Detail',minutes:[50,90],cash:[120,230],xp:32,respect:0,success:95,heat:0,risk:'LOW',clean:true,requires_level:1},
  warehouse_day:{name:'Warehouse Day Work',minutes:[75,120],cash:[170,290],xp:45,respect:0,success:92,heat:0,risk:'LOW',clean:true,requires_level:1},
  courier:{name:'Courier Run',minutes:[55,95],cash:[160,310],xp:45,respect:1,success:90,heat:0,risk:'MEDIUM',clean:true,requires_level:1},
  resell_flip:{name:'Marketplace Flip',minutes:[70,120],cash:[220,420],xp:55,respect:1,success:84,heat:0,risk:'MEDIUM',clean:true,requires_level:2,entry_cost:90},
  odd_job:{name:'Last-Minute Odd Job',minutes:[45,90],cash:[140,280],xp:40,respect:0,success:88,heat:0,risk:'MEDIUM',clean:true,requires_level:1},
  night_delivery:{name:'After-Hours Delivery',minutes:[60,110],cash:[300,650],xp:80,respect:2,success:76,heat:1,risk:'HIGH',clean:false,requires_level:2},
  risky_pickup:{name:'Risky Pickup',minutes:[80,140],cash:[450,900],xp:115,respect:3,success:68,heat:1,risk:'HIGH',clean:false,requires_level:3},
  high_risk:{name:'High-Risk Opportunity',minutes:[120,200],cash:[800,1800],xp:180,respect:5,success:55,heat:2,risk:'EXTREME',clean:false,requires_level:4},
};

const LEGIT_JOBS = {
  car_wash:{name:'Car Wash',location:'shopping_strip',start:8*60,end:12*60,grace:30,pay:[260,340],xp:40,requires_level:1,milestone_bonus:250},
  warehouse:{name:'Warehouse Associate',location:'warehouse',start:8*60,end:16*60,grace:30,pay:[450,600],xp:65,requires_level:1,milestone_bonus:450},
  moving_crew:{name:'Moving Crew',location:'apartments',start:9*60,end:15*60,grace:30,pay:[380,520],xp:60,requires_level:2,milestone_bonus:400},
  night_stock:{name:'Night Stocker',location:'shopping_strip',start:18*60,end:24*60,grace:30,pay:[420,560],xp:75,requires_level:2,milestone_bonus:450},
  auto_detail:{name:'Auto Detailer',location:'garage',start:10*60,end:17*60,grace:30,pay:[500,680],xp:90,requires_level:3,milestone_bonus:550},
  security_desk:{name:'Security Desk',location:'secure_warehouse',start:16*60,end:24*60,grace:30,pay:[550,750],xp:105,requires_level:4,milestone_bonus:650},
  tech_temp:{name:'Tech Support Temp',location:'warehouse',start:9*60,end:17*60,grace:30,pay:[650,900],xp:130,requires_level:5,milestone_bonus:800},
};

// =========================================================
// STATE / HELPERS
// =========================================================

let player = null;
let screen = 'start';
let payload = null;

const $ = s => document.querySelector(s);
const app = () => document.getElementById('app');
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const money = n => `$${Math.round(Number(n)||0).toLocaleString()}`;
const stars = h => '★'.repeat(clamp(Math.floor(h||0),0,5)) + '☆'.repeat(5-clamp(Math.floor(h||0),0,5));
const escapeHtml = s => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatTime = m => { const x=((m%(24*60))+(24*60))%(24*60); const h=Math.floor(x/60),min=x%60,ap=h<12?'AM':'PM'; return `${h%12||12}:${String(min).padStart(2,'0')} ${ap}`; };

function emptyDrugInventory(){ return Object.fromEntries(Object.keys(DRUGS).map(k=>[k,0])); }
function emptyHustleCounts(){ return Object.fromEntries(Object.keys(SIDE_HUSTLES).map(k=>[k,0])); }

function freshJobState(){
  return {
    current_job:null,
    last_shift_day:null,
    shifts_worked:0,
    shifts_at_job:0,
    streak:0,
    total_earned:0,
    missed_shifts:0,
    reviews_earned:0,
    pay_multiplier:1,
  };
}

function newPlayer(name='Player'){
  return {
    name,
    version:GAME_VERSION,
    seen_updates:[],
    tutorial_version:0,
    tutorial_completed:false,
    used_systems:[],
    activity_log:[],
    clean_income:0,
    day:1,time:DAY_START,level:1,xp:0,respect:0,heat:0,health:100,cash_on_person:0,location:'trap',
    transport:{name:'Bicycle',speed_bonus:0,condition:100},phone:'Basic Phone',equipped_weapon:null,equipped_armor:null,
    weapon_inventory:[],armor_inventory:[],crew:[],carried_drugs:emptyDrugInventory(),
    trap:{cash:0,drug_stash:emptyDrugInventory(),weapons:[],armor:[],security:0,storage:1,condition:1,attention:0},
    market:Object.fromEntries(Object.keys(DRUGS).map(k=>[k,1])),
    supplier_trust:{Smoke:0,Doc:0,Ghost:0},
    job:freshJobState(),
    stats:{moves:0,successful_moves:0,failed_moves:0,hospital_visits:0,arrests:0,days_survived:1,legit_shifts:0,side_hustles:0,highest_heat:0,biggest_score:0},
    daily:{},
  };
}

function ensurePlayerSchema(p){
  if(!p) return p;
  p.version = GAME_VERSION;
  p.seen_updates ??= [];
  p.tutorial_version ??= 0;
  p.tutorial_completed ??= false;
  p.used_systems ??= [];
  p.activity_log ??= [];
  p.clean_income ??= 0;
  p.carried_drugs ??= emptyDrugInventory();
  for(const id of Object.keys(DRUGS)) p.carried_drugs[id] ??= 0;
  p.market ??= Object.fromEntries(Object.keys(DRUGS).map(k=>[k,1]));
  p.supplier_trust ??= {Smoke:0,Doc:0,Ghost:0};
  p.weapon_inventory ??= [];
  p.armor_inventory ??= [];
  p.crew ??= [];
  p.trap ??= {cash:0,drug_stash:emptyDrugInventory(),weapons:[],armor:[],security:0,storage:1,condition:1,attention:0};
  p.trap.drug_stash ??= emptyDrugInventory();
  for(const id of Object.keys(DRUGS)) p.trap.drug_stash[id] ??= 0;
  p.trap.weapons ??= []; p.trap.armor ??= []; p.trap.cash ??= 0; p.trap.security ??= 0; p.trap.storage ??= 1; p.trap.condition ??= 1; p.trap.attention ??= 0;
  p.job ??= freshJobState();
  const j=freshJobState(); for(const [k,v] of Object.entries(j)) p.job[k] ??= v;
  p.stats ??= {};
  const stats={moves:0,successful_moves:0,failed_moves:0,hospital_visits:0,arrests:0,days_survived:1,legit_shifts:0,side_hustles:0,highest_heat:0,biggest_score:0};
  for(const [k,v] of Object.entries(stats)) p.stats[k] ??= v;
  p.daily ??= {};
  if(!Object.keys(p.daily).length) resetDailyFor(p);
  p.daily.hustle_counts ??= emptyHustleCounts();
  p.daily.job_completed ??= false;
  return p;
}

function resetDailyFor(p){
  p.daily={
    cash_start:(p.cash_on_person||0)+(p.trap?.cash||0),
    xp_start:p.xp||0,
    respect_start:p.respect||0,
    heat_start:p.heat||0,
    successes:0,
    failures:0,
    hustle_counts:emptyHustleCounts(),
    job_completed:false,
  };
}
function resetDaily(){ resetDailyFor(player); }

function addActivity(text){
  if(!player) return;
  player.activity_log ??= [];
  player.activity_log.push(`Day ${player.day} ${formatTime(player.time)} — ${text}`);
  player.activity_log = player.activity_log.slice(-16);
}
function markUsed(name){ if(!player.used_systems.includes(name)) player.used_systems.push(name); }
function saveGame(){ if(!player) return; ensurePlayerSchema(player); localStorage.setItem(SAVE_KEY,JSON.stringify(player)); if(fmBackend.ready) syncCloudSave(); }
function loadGame(){ try{const p=JSON.parse(localStorage.getItem(SAVE_KEY));return ensurePlayerSchema(p);}catch{return null;} }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
function generateMarket(){ Object.keys(DRUGS).forEach(k=>player.market[k]=Math.round((0.8+Math.random()*0.5)*100)/100); }
function weaponName(){ return player.equipped_weapon&&WEAPONS[player.equipped_weapon]?WEAPONS[player.equipped_weapon].name:'Unarmed'; }
function armorName(){ return player.equipped_armor&&ARMOR[player.equipped_armor]?ARMOR[player.equipped_armor].name:'None'; }
function updateLevel(){ const n=1+Math.floor(player.xp/500); if(n>player.level){const old=player.level;player.level=n;return `LEVEL UP: ${old} → ${n}`;} return null; }
function currentObjective(){
  if(player.tutorial_version<CURRENT_TUTORIAL_VERSION) return 'Review the Phone / Guide tutorial.';
  if((player.stats.side_hustles||0)===0) return 'Try one Quick Move so you always have a way to make money.';
  if(!player.job.current_job) return 'Get hired for a legit job.';
  if((player.stats.legit_shifts||0)===0) return 'Clock in for your first legit shift.';
  if(player.heat>=3) return 'Cool down — work clean or Lay Low.';
  if(player.cash_on_person+player.trap.cash<500) return 'Build total cash to $500.';
  if(!player.weapon_inventory.length&&!player.trap.weapons.length) return 'Build your bankroll and explore gear when ready.';
  return 'Stack money, protect the trap, and unlock bigger opportunities.';
}

// =========================================================
// SUPABASE / MOTION TAX
// =========================================================

function backendStatusText(){ if(fmBackend.ready)return 'CLOUD ONLINE'; if(fmBackend.error)return 'LOCAL MODE'; return 'CONNECTING…'; }
function totalTrapValue(){let v=player?.trap?.cash||0; if(!player)return 0;Object.entries(player.trap.drug_stash).forEach(([id,g])=>v+=Math.floor(g*(DRUGS[id]?.base_value||0)));player.trap.weapons.forEach(x=>v+=WEAPONS[x.id]?.price||0);return v;}
function totalNetWorth(){ if(!player)return 0;let v=player.cash_on_person+totalTrapValue();player.weapon_inventory.forEach(x=>v+=WEAPONS[x.id]?.price||0);player.armor_inventory.forEach(id=>v+=ARMOR[id]?.price||0);return Math.max(0,Math.floor(v)); }

async function initBackend(){
  try{
    if(!window.supabase?.createClient) throw new Error('Supabase library did not load.');
    fmBackend.client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    let {data:{session},error:sessionError}=await fmBackend.client.auth.getSession(); if(sessionError)throw sessionError;
    if(!session){const {data,error}=await fmBackend.client.auth.signInAnonymously();if(error)throw error;session=data.session;}
    fmBackend.user=session?.user||null; if(!fmBackend.user)throw new Error('No authenticated player session.');
    await loadRemoteSettings(); fmBackend.ready=true; fmBackend.error=null;
    const local=loadGame();
    if(local){player=local;await ensurePlayerProfile();await syncCloudSave();}
    else{const cloud=await loadCloudSave();if(cloud){player=ensurePlayerSchema(cloud);localStorage.setItem(SAVE_KEY,JSON.stringify(player));screen=needsPatchNotes()?'whatsnew':'home';}}
    await flushTaxQueue(); render();
  }catch(err){console.warn('Federal Motion backend:',err);fmBackend.error=err?.message||String(err);fmBackend.ready=false;render();}
}
async function loadRemoteSettings(){
  if(!fmBackend.client)return;
  const {data,error}=await fmBackend.client.from('fm_game_settings').select('setting_key,setting_value').in('setting_key',['motion_tax_rate','game_version']);
  if(error)return;
  (data||[]).forEach(row=>{if(row.setting_key==='motion_tax_rate'){const n=Number(row.setting_value);if(Number.isFinite(n)&&n>=0&&n<=.25)fmBackend.taxRate=n;}if(row.setting_key==='game_version'&&row.setting_value)fmBackend.gameVersion=String(row.setting_value);});
}
async function ensurePlayerProfile(){
  if(!fmBackend.ready||!fmBackend.user||!player)return;
  const profile={user_id:fmBackend.user.id,player_name:player.name||'Player',title:player.title||'Peon',level:player.level||1,respect:player.respect||0,net_worth:totalNetWorth(),days_survived:player.stats?.days_survived||player.day||1,biggest_score:player.stats?.biggest_score||0,jobs_completed:(player.stats?.successful_moves||0)+(player.stats?.side_hustles||0)+(player.stats?.legit_shifts||0),arrests:player.stats?.arrests||0,hospital_visits:player.stats?.hospital_visits||0,highest_heat:Math.max(player.stats?.highest_heat||0,player.heat||0),updated_at:new Date().toISOString()};
  const {error}=await fmBackend.client.from('fm_players').upsert(profile,{onConflict:'user_id'}); if(error)console.warn('Profile sync:',error.message);
}
async function syncCloudSave(){
  if(!fmBackend.ready||!fmBackend.user||!player||fmBackend.syncing)return;fmBackend.syncing=true;
  try{const {error}=await fmBackend.client.from('fm_cloud_saves').upsert({user_id:fmBackend.user.id,save_data:player,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;await ensurePlayerProfile();}
  catch(err){console.warn('Cloud save:',err?.message||err);}finally{fmBackend.syncing=false;}
}
async function loadCloudSave(){if(!fmBackend.ready||!fmBackend.user)return null;const {data,error}=await fmBackend.client.from('fm_cloud_saves').select('save_data').eq('user_id',fmBackend.user.id).maybeSingle();if(error)return null;return data?.save_data||null;}
function makeUuid(){if(globalThis.crypto?.randomUUID){try{return globalThis.crypto.randomUUID();}catch{}}const bytes=new Uint8Array(16);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(b=>b.toString(16).padStart(2,'0'));return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10,16).join('')}`;}
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));}
function motionTaxFor(base){return Math.max(0,Math.floor(Math.max(0,base)*fmBackend.taxRate));}
function purchaseQuote(base){const tax=motionTaxFor(base);return{base,tax,total:base+tax};}
function queueMotionTax(tax){if(!tax||tax<=0)return;let q=[];try{q=JSON.parse(localStorage.getItem(TAX_QUEUE_KEY)||'[]');}catch{}q.push({event_id:makeUuid(),tax_amount:Math.floor(tax)});localStorage.setItem(TAX_QUEUE_KEY,JSON.stringify(q));flushTaxQueue();}
async function flushTaxQueue(){if(!fmBackend.ready||!fmBackend.client)return;let q=[];try{q=JSON.parse(localStorage.getItem(TAX_QUEUE_KEY)||'[]');}catch{}if(!q.length)return;q=q.map(x=>({event_id:isUuid(x?.event_id)?x.event_id:makeUuid(),tax_amount:Math.max(0,Math.floor(Number(x?.tax_amount)||0))})).filter(x=>x.tax_amount>0);const remaining=[];for(const item of q){const {error}=await fmBackend.client.rpc('fm_collect_motion_tax_v2',{event_id:item.event_id,tax_amount:item.tax_amount});if(error)remaining.push(item);}localStorage.setItem(TAX_QUEUE_KEY,JSON.stringify(remaining));}
function taxedPurchase(base){const q=purchaseQuote(base);if(player.cash_on_person<q.total)return{ok:false,...q};player.cash_on_person-=q.total;queueMotionTax(q.tax);return{ok:true,...q};}

// =========================================================
// DISPLAY
// =========================================================

function stat(k,v){return `<div class="stat"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`;}
function btn(label,action,small='',cls=''){return `<button class="btn ${cls}" data-action="${escapeHtml(action)}">${escapeHtml(label)}${small?`<small>${escapeHtml(small)}</small>`:''}</button>`;}
function back(to='home',label='← Back'){return btn(label,to,'','back');}
function progress(current,target){const pct=clamp(Math.floor((current/Math.max(1,target))*100),0,100);return `<div class="progress"><span style="width:${pct}%"></span></div>`;}
function header(){
  const sub=`${fmBackend.gameVersion||GAME_VERSION} · ${backendStatusText()}`;
  if(!player)return `<div class="logo">FEDERAL MOTION</div><div class="sublogo">${escapeHtml(sub)}</div>`;
  return `<div class="logo">FEDERAL MOTION</div><div class="sublogo">${escapeHtml(sub)}</div>
  <div class="card"><div class="status-grid">
    ${stat('DAY',player.day)}${stat('TIME',formatTime(player.time))}${stat('LOCATION',LOCATIONS[player.location]?.name||player.location)}${stat('CASH',money(player.cash_on_person))}
    ${stat('LEVEL',player.level)}${stat('XP',player.xp)}${stat('RESPECT',player.respect)}${stat('HEAT',stars(player.heat))}
    ${stat('HEALTH',`${player.health}/100`)}${stat('CLEAN',money(player.clean_income))}${stat('WEAPON',weaponName())}${stat('RIDE',player.transport?.name||'Bicycle')}
  </div></div>`;
}
function render(){
  let html=header();
  const routes={start:renderStart,home:renderHome,result:renderResult,moves:renderMoves,hustles:renderHustles,employment:renderEmployment,jobs:renderJobs,street:renderStreet,supplier:renderSupplier,black:renderBlack,weapons:renderWeapons,armor:renderArmor,equip:renderEquip,crew:renderCrew,map:renderMap,stash:renderStash,upgrades:renderUpgrades,hospital:renderHospital,status:renderStatus,market:renderMarket,phone:renderPhone,whatsnew:renderWhatsNew,tutorial:renderTutorial,activity:renderActivity};
  html+=(routes[screen]||renderHome)();
  html+=`<div class="footer-note">${fmBackend.ready?'Local save + cloud sync active.':'Local save active. Cloud sync reconnects automatically when available.'}</div>`;
  app().innerHTML=html;
}
function renderStart(){return `<div class="card"><div class="section-title">START</div><div class="actions">${hasSave()?btn('Continue Game','continue','','primary'):''}${btn('New Game','new','','primary')}${hasSave()?btn('Delete Save','deleteSave','Erase this browser save','danger'):''}</div></div>`;}
function renderHome(){
  const late=player.time>=WARNING_TIME?`<div class="notice">⚠ LATE NIGHT — get back to the trap soon. 2:00 AM is the danger window.</div>`:'';
  const job=player.job.current_job?LEGIT_JOBS[player.job.current_job]:null;
  const jobNotice=job?`<div class="notice good">EMPLOYED: ${escapeHtml(job.name)} · ${formatTime(job.start)}–${formatTime(job.end)} · ${Math.max(0,20-(player.job.shifts_at_job%20||0))||20} shift(s) until next review.</div>`:'';
  return `${late}${jobNotice}<div class="objective"><strong>OBJECTIVE:</strong> ${escapeHtml(currentObjective())}</div>
  <div class="section-title">WHAT'S THE MOVE?</div><div class="actions">
    ${btn('Make a Move','moves','Bigger risk/reward actions')}
    ${btn('Quick Moves','hustles','10 repeatable ways to make money')}
    ${btn('Employment','employment','Get hired, clock in, earn raises')}
    ${btn('Street Move','street','Move carried inventory')}
    ${btn('Supplier','supplier','Buy inventory from contacts')}
    ${btn('Black Market','black','Weapons, armor & gear')}
    ${btn('Crew','crew','Hire crew members')}
    ${btn('City Map','map','Travel around the city')}
    ${btn('Trap Stash','stash','Cash, inventory & weapons')}
    ${btn('Trap Upgrades','upgrades','Security, storage, condition')}
    ${btn('Lay Low','layLow','90 min · lower Heat/Attention','good')}
    ${btn('Hospital','hospital','Treatment and recovery')}
    ${btn('Phone / Guide','phone','Tutorial, update notes, activity')}
    ${btn('Status','status','Full player/trap/job status')}
    ${btn('End Day / Sleep','sleep','Must be at your trap','good')}
    ${btn('Save Game','save','Save now')}
  </div>`;
}
function renderResult(){const lines=(payload?.lines||[]).map(x=>`<div class="result-line">${escapeHtml(x)}</div>`).join('');return `<div class="card"><div class="result-title">${escapeHtml(payload?.title||'RESULT')}</div><div class="result-lines">${lines}</div><hr><div class="status-grid">${stat('Cash',money(player.cash_on_person))}${stat('XP',player.xp)}${stat('Respect',player.respect)}${stat('Heat',stars(player.heat))}${stat('Health',`${player.health}/100`)}${stat('Time',formatTime(player.time))}</div><div style="margin-top:12px">${btn('Continue','home','','primary')}</div></div>`;}

function renderMoves(){const items=Object.entries(MOVES).map(([id,m])=>{const r=requirement(m),chance=successChance(m);return `<div class="item"><div class="item-head"><span>${escapeHtml(m.name)}</span><span>${chance}%</span></div><div class="item-meta">Payout ${money(m.cash[0])}–${money(m.cash[1])} · Heat +${m.heat}★ · ${m.minutes[0]}–${m.minutes[1]} min${r?`<br><span class="bad-text">LOCKED: ${escapeHtml(r)}</span>`:''}</div><div style="margin-top:9px">${btn(r?'Locked':'Do Move',`doMove:${id}`,r||LOCATIONS[m.location].name,r?'':'primary')}</div></div>`;}).join('');return `${back()}<div class="section-title">AVAILABLE MOVES</div><div class="list">${items}</div>`;}

function hustleRepeatInfo(id){const n=player.daily.hustle_counts?.[id]||0;return {count:n,max:3,locked:n>=3,penalty:n*8};}
function renderHustles(){
  markUsed('Hustle Board');
  const cards=Object.entries(SIDE_HUSTLES).map(([id,h])=>{const rep=hustleRepeatInfo(id),lv=player.level<(h.requires_level||1),locked=rep.locked||lv;const effective=clamp(h.success-player.heat*(h.clean?2:4)-rep.penalty+Math.min(8,player.level),25,97);return `<div class="item"><div class="item-head"><span>${escapeHtml(h.name)}</span><span>${escapeHtml(h.risk)}</span></div><div class="item-meta">${money(h.cash[0])}–${money(h.cash[1])} · ${h.minutes[0]}–${h.minutes[1]} min · Chance ${effective}% · Repeat ${rep.count}/3${h.entry_cost?` · Entry ${money(h.entry_cost)}`:''}${lv?`<br><span class="bad-text">Requires Level ${h.requires_level}</span>`:''}${rep.locked?`<br><span class="bad-text">Too hot — switch moves until tomorrow.</span>`:''}</div>${progress(rep.count,3)}<div style="margin-top:9px">${btn(locked?'Unavailable':'Take Opportunity',`hustle:${id}`,h.clean?'Clean money':'Risky money',locked?'':'primary')}</div></div>`;}).join('');
  return `${back()}<div class="card"><div class="section-title">QUICK MOVES / HUSTLE BOARD</div><div class="muted">You can repeat the same opportunity up to 3 times per day. Repeating it lowers success, so rotate moves instead of spamming one button.</div></div><div class="list">${cards}</div>`;
}

function shiftsUntilReview(){const n=player.job.shifts_at_job||0;const mod=n%20;return mod===0&&n>0?20:20-mod;}
function jobStatus(job){if(player.job.last_shift_day===player.day)return 'DONE TODAY';if(player.time<job.start)return `STARTS ${formatTime(job.start)}`;if(player.time<=job.start+job.grace)return 'CLOCK IN NOW';if(player.time<job.end)return 'MISSED CLOCK-IN';return 'SHIFT OVER';}
function renderEmployment(){
  markUsed('Legit Jobs');
  if(!player.job.current_job){return `${back()}<div class="card"><div class="section-title">EMPLOYMENT</div><div class="muted">You are unemployed. Get hired first. Jobs have real schedules and you only get paid if you clock in and finish the shift.</div><div style="margin-top:10px">${btn('Open Job Board','jobs','','primary')}</div></div>`;}
  const id=player.job.current_job,job=LEGIT_JOBS[id],status=jobStatus(job),until=shiftsUntilReview();
  return `${back()}<div class="card"><div class="section-title">CURRENT JOB</div><div class="status-grid">${stat('Employer',job.name)}${stat('Schedule',`${formatTime(job.start)}–${formatTime(job.end)}`)}${stat('Today',status)}${stat('Pay Rate',`${Math.round(player.job.pay_multiplier*100)}%`)}${stat('Shifts Here',player.job.shifts_at_job)}${stat('Career Shifts',player.job.shifts_worked)}${stat('Missed',player.job.missed_shifts)}${stat('Clean Earned',money(player.job.total_earned))}</div><div class="kicker" style="margin-top:12px">NEXT PAY REVIEW / BONUS</div>${progress(20-until,20)}<div class="item-meta">${until} completed shift(s) until your next 20-shift review. Every review gives a one-time bonus and +10% base pay.</div><div class="actions" style="margin-top:12px">${btn('Clock In / Work Shift','workShift',status,'primary')}${btn('Job Board','jobs','Other openings')}${btn('Quit Job','quitJob','Lose your current shift streak','danger')}</div></div>`;
}
function renderJobs(){const cards=Object.entries(LEGIT_JOBS).map(([id,j])=>{const locked=player.level<j.requires_level;return `<div class="item"><div class="item-head"><span>${escapeHtml(j.name)}</span><span>LV ${j.requires_level}</span></div><div class="item-meta">${formatTime(j.start)}–${formatTime(j.end)} · 30-min grace · Base ${money(j.pay[0])}–${money(j.pay[1])}<br>20 completed shifts = ${money(j.milestone_bonus)} review bonus + 10% pay raise.</div><div style="margin-top:9px">${btn(locked?'Locked':player.job.current_job===id?'Current Job':'Get Hired',`hireJob:${id}`,locked?`Requires Level ${j.requires_level}`:LOCATIONS[j.location].name,locked||player.job.current_job===id?'':'primary')}</div></div>`;}).join('');return `${back('employment','← Employment')}<div class="section-title">JOB BOARD</div><div class="list">${cards}</div>`;}

function renderStreet(){const av=Object.entries(player.carried_drugs).filter(([,g])=>g>.001);if(!av.length)return `${back()}<div class="card">You don't have any inventory on you.</div>`;return `${back()}<div class="card"><div class="section-title">STREET MOVE</div><label>Product</label><select id="streetDrug">${av.map(([id,g])=>`<option value="${id}">${DRUGS[id].name} (${g.toFixed(1)}g)</option>`).join('')}</select><label>Amount (game grams)</label><input id="streetGrams" type="number" min="0.1" step="0.1" value="1"><div style="margin-top:10px">${btn('Make Street Move','streetGo','','primary')}</div></div>`;}
function renderSupplier(){return `${back()}<div class="section-title">SUPPLIER SPOT</div><div class="list"><div class="item"><div class="item-head"><span>Smoke</span><span>Trust ${player.supplier_trust.Smoke}</span></div><div class="item-meta">Weed / Shrooms</div>${btn('Meet Smoke','supplier:Smoke','','primary')}</div><div class="item"><div class="item-head"><span>Doc</span><span>Respect 3+</span></div><div class="item-meta">Pills / Lean</div>${btn('Meet Doc','supplier:Doc',player.respect<3?'Locked until Respect 3':'','primary')}</div><div class="item"><div class="item-head"><span>Ghost</span><span>Respect 8+</span></div><div class="item-meta">Cocaine / Meth / Heroin</div>${btn('Meet Ghost','supplier:Ghost',player.respect<8?'Locked until Respect 8':'','primary')}</div></div>`;}
function supplierProducts(name){return name==='Smoke'?['weed','shrooms']:name==='Doc'?['pills','lean']:['cocaine','meth','heroin'];}
function renderSupplierShop(name){const products=supplierProducts(name);return `${back('supplier','← Suppliers')}<div class="card"><div class="section-title">${escapeHtml(name.toUpperCase())}</div><div class="muted">Cash: ${money(player.cash_on_person)}</div><label>Product</label><select id="buyDrug">${products.map(id=>{const p=Math.max(1,Math.floor(DRUGS[id].base_value*.65));return `<option value="${id}">${DRUGS[id].name} — ${money(p)}/game gram + ${Math.round(fmBackend.taxRate*100)}% Motion Tax</option>`;}).join('')}</select><label>Amount (game grams)</label><input id="buyGrams" type="number" min="0.1" step="0.1" value="3.5"><div style="margin-top:10px">${btn('Buy','buyDrugGo','','primary')}</div></div>`;}
function renderBlack(){return `${back()}<div class="section-title">BLACK MARKET</div><div class="actions">${btn('Weapons','weapons','Buy weapons')}${btn('Armor','armor','Buy armor')}${btn('Equip Gear','equip','Choose weapon and armor')}</div>`;}
function renderWeapons(){return `${back('black','← Black Market')}<div class="list">${Object.entries(WEAPONS).map(([id,w])=>{const q=purchaseQuote(w.price);return `<div class="item"><div class="item-head"><span>${w.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Base ${money(w.price)} + ${money(q.tax)} Motion Tax · Power ${w.power} · Condition ${w.condition}%</div>${btn('Buy',`buyWeapon:${id}`,'','primary')}</div>`;}).join('')}</div>`;}
function renderArmor(){return `${back('black','← Black Market')}<div class="list">${Object.entries(ARMOR).map(([id,a])=>{const q=purchaseQuote(a.price);return `<div class="item"><div class="item-head"><span>${a.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Base ${money(a.price)} + ${money(q.tax)} Motion Tax · Defense ${a.defense}</div>${btn('Buy',`buyArmor:${id}`,'','primary')}</div>`;}).join('')}</div>`;}
function renderEquip(){const ws=player.weapon_inventory.map((x,i)=>`<option value="${i}">${WEAPONS[x.id]?.name||x.id} · ${x.condition}%</option>`).join(''),as=player.armor_inventory.map((id,i)=>`<option value="${i}">${ARMOR[id]?.name||id}</option>`).join('');return `${back('black','← Black Market')}<div class="card"><div class="section-title">EQUIP GEAR</div><label>Weapon</label><select id="equipWeapon"><option value="">Unarmed</option>${ws}</select><label>Armor</label><select id="equipArmor"><option value="">None</option>${as}</select><div style="margin-top:10px">${btn('Equip','equipGo','','primary')}</div></div>`;}
function renderCrew(){return `${back()}<div class="card"><div class="section-title">YOUR CREW</div>${player.crew.length?player.crew.map(id=>`<div class="item">${CREW[id].name} · Combat ${CREW[id].combat} · Driving ${CREW[id].driving} · Cut ${CREW[id].cut}%</div>`).join(''):'<div class="muted">Nobody yet.</div>'}</div><div class="section-title">AVAILABLE</div><div class="list">${Object.entries(CREW).filter(([id])=>!player.crew.includes(id)).map(([id,c])=>`<div class="item"><div class="item-head"><span>${c.name}</span><span>${money(c.price)}</span></div><div class="item-meta">Combat ${c.combat} · Driving ${c.driving} · Loyalty ${c.loyalty}% · Cut ${c.cut}%</div>${btn('Hire',`hire:${id}`,'','primary')}</div>`).join('')||'<div class="card">Everybody available is already with you.</div>'}</div>`;}
function renderMap(){const areas=['Southside','Midtown','Outskirts'];return `${back()}${areas.map(area=>`<div class="section-title">${area.toUpperCase()}</div><div class="list">${Object.entries(LOCATIONS).filter(([,l])=>l.area===area).map(([id,l])=>`<div class="item"><div class="item-head"><span>${l.name}</span><span>${travelTime(l.travel)} min</span></div>${btn(player.location===id?'You Are Here':'Travel',`travel:${id}`,'',player.location===id?'':'primary')}</div>`).join('')}</div>`).join('')}`;}
function drugList(inv){const x=Object.entries(inv).filter(([,g])=>g>.001);return x.length?x.map(([id,g])=>`<div class="stat"><span>${DRUGS[id].name}</span><strong>${g.toFixed(1)}g</strong></div>`).join(''):'<div class="muted">Empty</div>';}
function renderStash(){if(player.location!=='trap')return `${back()}<div class="card">You need to be at your trap to manage the stash.</div>`;const takeWeapons=player.trap.weapons.map((x,i)=>`<option value="${i}">${WEAPONS[x.id]?.name||x.id}</option>`).join('');return `${back()}<div class="card"><div class="section-title">CASH</div>${stat('On Person',money(player.cash_on_person))}${stat('Stored',money(player.trap.cash))}<div class="row"><input id="cashAmount" type="number" min="1" value="100">${btn('Deposit','depositCash')}${btn('Withdraw','withdrawCash')}</div></div><div class="card"><div class="section-title">ON PERSON</div>${drugList(player.carried_drugs)}<div class="section-title">TRAP STASH</div>${drugList(player.trap.drug_stash)}<hr><label>Drug</label><select id="stashDrug">${Object.keys(DRUGS).map(id=>`<option value="${id}">${DRUGS[id].name}</option>`).join('')}</select><label>Amount</label><input id="stashGrams" type="number" min="0.1" step="0.1" value="3.5"><div class="row" style="margin-top:8px">${btn('Store','storeDrug')}${btn('Take','takeDrug')}</div></div><div class="card"><div class="section-title">WEAPONS</div><div class="muted">On person: ${player.weapon_inventory.length} · Stored: ${player.trap.weapons.length}</div><div class="row" style="margin-top:8px">${btn('Store All Carried Weapons','storeWeapons')}</div>${player.trap.weapons.length?`<label>Stored weapon</label><select id="takeWeapon">${takeWeapons}</select>${btn('Take Weapon','takeWeaponGo')}`:''}</div>`;}
function renderUpgrades(){if(player.location!=='trap')return `${back()}<div class="card">You need to be at your trap.</div>`;const opts=[['security',500*(player.trap.security+1)],['storage',400*(player.trap.storage+1)],['condition',300*(player.trap.condition+1)]];return `${back()}<div class="list">${opts.map(([k,c])=>`<div class="item"><div class="item-head"><span>${k[0].toUpperCase()+k.slice(1)} ${player.trap[k]}/5</span><span>${money(c)}</span></div>${btn(player.trap[k]>=5?'MAXED':'Upgrade',`upgrade:${k}`,player.trap[k]>=5?'':'Uses 60 minutes',player.trap[k]>=5?'':'primary')}</div>`).join('')}</div>`;}
function renderHospital(){const miss=100-player.health,cost=Math.max(50,miss*8);return `${back()}<div class="card"><div class="section-title">COUNTY HOSPITAL</div>${stat('Health',`${player.health}/100`)}${stat('Full Treatment',money(cost))}<div style="margin-top:10px">${btn(player.health>=100?'Already Full Health':'Get Treatment','treat',player.health>=100?'':'Takes 120 minutes',player.health>=100?'':'primary')}</div></div>`;}
function renderStatus(){const j=player.job.current_job?LEGIT_JOBS[player.job.current_job]:null;return `${back()}<div class="card"><div class="section-title">PLAYER</div><div class="status-grid">${stat('Player',player.name)}${stat('Day',player.day)}${stat('Time',formatTime(player.time))}${stat('Location',LOCATIONS[player.location]?.name||player.location)}${stat('Level',player.level)}${stat('XP',player.xp)}${stat('Respect',player.respect)}${stat('Heat',stars(player.heat))}${stat('Health',`${player.health}/100`)}${stat('Cash on Person',money(player.cash_on_person))}${stat('Cash in Trap',money(player.trap.cash))}${stat('Clean Income',money(player.clean_income))}${stat('Weapon',weaponName())}${stat('Armor',armorName())}${stat('Transport',player.transport.name)}</div></div><div class="card"><div class="section-title">EMPLOYMENT</div><div class="status-grid">${stat('Job',j?j.name:'Unemployed')}${stat('Career Shifts',player.job.shifts_worked)}${stat('Missed Shifts',player.job.missed_shifts)}${stat('Pay Rate',`${Math.round(player.job.pay_multiplier*100)}%`)}${stat('Job Earnings',money(player.job.total_earned))}${stat('Reviews',player.job.reviews_earned)}</div></div><div class="card"><div class="section-title">TRAP</div><div class="status-grid">${stat('Security',`${player.trap.security}/5`)}${stat('Storage',`${player.trap.storage}/5`)}${stat('Condition',`${player.trap.condition}/5`)}${stat('Attention',`${player.trap.attention}%`)}</div></div>`;}
function renderMarket(){return `${back()}<div class="card"><div class="section-title">MORNING MARKET</div>${Object.entries(DRUGS).map(([id,d])=>{const m=player.market[id],txt=m>=1.18?'HIGH ↑':m<=.9?'LOW ↓':'NORMAL →',cls=m>=1.18?'market-high':m<=.9?'market-low':'';return `<div class="stat"><span>${d.name}</span><strong class="${cls}">${txt}</strong></div>`;}).join('')}</div>`;}

function renderPhone(){return `${back()}<div class="phone"><div class="phone-head">MOTION PHONE</div><div class="actions">${btn("What's New",'whatsnew','Alpha 0.7 notes')}${btn('Tutorial / Guide','tutorial','How the systems work')}${btn('Activity History','activity','Recent player actions')}${btn('Morning Market','market','Demand today')}</div></div>`;}
function renderWhatsNew(){return `${back('phone','← Phone')}<div class="card"><div class="result-title">ALPHA 0.7 — WORK + HUSTLE EXPANSION</div><div class="result-lines">
<div class="result-line">10 Quick Moves added so broke players always have something to do.</div>
<div class="result-line">Repeating the same Quick Move makes it hotter and locks after 3 uses for the day.</div>
<div class="result-line">Real Employment system: get hired, keep one job, clock in for scheduled shifts.</div>
<div class="result-line">30-minute clock-in grace window. Miss the shift and you make $0.</div>
<div class="result-line">Every 20 completed shifts at your job = one-time bonus + 10% permanent pay raise.</div>
<div class="result-line">Clean work lowers Heat and Trap Attention.</div>
<div class="result-line">Lay Low added for another way to cool Heat.</div>
<div class="result-line">Phone / Guide, objectives, activity history, update notes, save migration.</div>
<div class="result-line">Motion Tax, cloud save, owner metrics/profile sync remain active.</div>
</div><div style="margin-top:12px">${btn('Mark Update Seen','seenUpdate','','primary')}</div></div>`;}
function renderTutorial(){const pages=[['START','You begin with $0, a rundown trap, a basic phone, a bicycle, no weapon, no armor, and no crew.'],['MONEY','Quick Moves are your emergency money path. Employment pays clean money. Street Move uses inventory. Make a Move is bigger risk/reward.'],['QUICK MOVES','You can use the same Quick Move up to 3 times per day. Each repeat lowers success, so rotate activities.'],['EMPLOYMENT','Get hired first. Every job has a real shift. Arrive early and the game waits; arrive within 30 minutes late and you can still clock in; miss the window and pay is $0.'],['20-SHIFT REVIEW','Stay employed. Every 20 completed shifts at that job earns a one-time bonus and a permanent +10% base-pay raise.'],['HEAT','Risky activity raises Heat. Legit work and Lay Low can cool Heat. Trap Attention is separate and affects your home-base risk.'],['NIGHT','Get back to the trap before 2:00 AM. Staying out too late can cause robbery, injury, or arrest.']];return `${back('phone','← Phone')}<div class="list">${pages.map(([t,b],i)=>`<div class="item"><div class="item-head"><span>${i+1}. ${t}</span></div><div class="item-meta">${escapeHtml(b)}</div></div>`).join('')}</div><div style="margin-top:10px">${btn('Mark Tutorial Reviewed','tutorialDone','','primary')}</div>`;}
function renderActivity(){const a=(player.activity_log||[]).slice().reverse();return `${back('phone','← Phone')}<div class="section-title">RECENT ACTIVITY</div><div class="list">${a.length?a.map(x=>`<div class="item">${escapeHtml(x)}</div>`).join(''):'<div class="card muted">Nothing recorded yet.</div>'}</div>`;}

// =========================================================
// GAMEPLAY
// =========================================================

function travelTime(base){const mult={Bicycle:1,'Cheap Car':.65,Sedan:.5,'Fast Car':.38}[player.transport.name]||1;return Math.max(10,Math.floor(base*mult));}
function travelTo(id){if(id===player.location)return{ok:true};const mins=travelTime(LOCATIONS[id].travel);player.location=id;return advanceTime(mins);}
function advanceTime(mins){player.time+=mins;if(player.time>=DAY_END){lateNightEvent();return{ok:false,late:true};}return{ok:true};}
function combatPower(){let p=player.level*3;if(player.equipped_weapon)p+=WEAPONS[player.equipped_weapon].power;if(player.equipped_armor)p+=Math.floor(ARMOR[player.equipped_armor].defense/2);player.crew.forEach(id=>p+=CREW[id].combat);p+=Math.floor(player.respect/3);return p;}
function successChance(m){let c=m.base_success-player.heat*4+Math.min(12,player.level*2)+Math.min(8,Math.floor(player.respect/3));if(m.combat){const e=(m.enemy[0]+m.enemy[1])/2;c+=Math.floor((combatPower()-e)*.6);}return clamp(c,10,95);}
function requirement(m){if(player.level<(m.requires_level||1))return `Requires Level ${m.requires_level}`;if(m.requires_weapon&&!player.equipped_weapon)return 'Weapon required';if(player.crew.length<(m.requires_crew||0))return `Requires ${m.requires_crew} crew member(s)`;return '';}
function result(title,lines){player.stats.highest_heat=Math.max(player.stats.highest_heat||0,player.heat||0);saveGame();screen='result';payload={title,lines};render();}
function performMove(id){const m=MOVES[id],r=requirement(m);if(r){result('LOCKED',[r]);return;}travelTo(m.location);if(screen==='result')return;const chance=successChance(m);advanceTime(randInt(...m.minutes));if(screen==='result')return;player.stats.moves++;
  if(randInt(1,100)<=chance){let payout=randInt(...m.cash),cut=0;player.crew.forEach(cid=>cut+=Math.floor(payout*CREW[cid].cut/100));payout=Math.max(0,payout-cut);player.cash_on_person+=payout;player.xp+=m.xp;player.respect+=m.respect;player.heat=clamp(player.heat+m.heat,0,5);player.trap.attention=clamp(player.trap.attention+m.heat*4,0,100);player.stats.successful_moves++;player.daily.successes++;player.stats.biggest_score=Math.max(player.stats.biggest_score||0,payout);let lines=[`Cash: +${money(payout)}`,`XP: +${m.xp}`,`Respect: +${m.respect}`];if(cut)lines.push(`Crew cuts paid: ${money(cut)}`);if(m.heat)lines.push(`Heat: +${m.heat}★`);if(id==='house_hit'&&Math.random()<.35){const b=randInt(40,180);player.cash_on_person+=b;lines.push(`Stolen goods fenced: +${money(b)}`);}if(id==='rival_trap'){const d=Object.keys(DRUGS)[randInt(0,Object.keys(DRUGS).length-1)],g=Math.round((3.5+Math.random()*24.5)*10)/10;player.carried_drugs[d]+=g;lines.push(`Loot: ${g.toFixed(1)}g ${DRUGS[d].name}`);}const lvl=updateLevel();if(lvl)lines.push(lvl);addActivity(`Completed ${m.name} for ${money(payout)}`);result('MOVE SUCCESSFUL',lines);
  }else{player.stats.failed_moves++;player.daily.failures++;const x=Math.max(10,Math.floor(m.xp/4));player.xp+=x;let lines=[`XP from experience: +${x}`];if(m.combat){const defense=player.equipped_armor?ARMOR[player.equipped_armor].defense:0,enemy=randInt(...m.enemy),dmg=Math.max(8,randInt(15,45)+Math.max(0,Math.floor(enemy/10)-Math.floor(defense/8)));player.health-=dmg;if(player.health<=0){hospitalRespawn();return;}lines.push(`Health: -${dmg}`);if(Math.random()<.3){player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★');}}else{player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★');}addActivity(`Failed ${m.name}`);result('MOVE FAILED',lines);}
}

function performHustle(id){const h=SIDE_HUSTLES[id],rep=hustleRepeatInfo(id);if(player.level<(h.requires_level||1)){result('LOCKED',[`Requires Level ${h.requires_level}.`]);return;}if(rep.locked){result('TOO HOT',[`You already ran ${h.name} 3 times today. Switch to something else.`]);return;}const entry=h.entry_cost||0;if(entry&&player.cash_on_person<entry){result('NOT ENOUGH CASH',[`You need ${money(entry)} to start this flip.`]);return;}if(entry)player.cash_on_person-=entry;const elapsed=randInt(...h.minutes);advanceTime(elapsed);if(screen==='result')return;const chance=clamp(h.success-player.heat*(h.clean?2:4)-rep.penalty+Math.min(8,player.level),25,97);player.daily.hustle_counts[id]=(player.daily.hustle_counts[id]||0)+1;player.stats.moves++;player.stats.side_hustles++;markUsed('Hustle Board');
  if(randInt(1,100)<=chance){let payout=randInt(...h.cash);if(entry)payout+=entry;player.cash_on_person+=payout;player.xp+=h.xp;player.respect+=h.respect;player.heat=clamp(player.heat+h.heat,0,5);player.stats.successful_moves++;player.daily.successes++;if(h.clean)player.clean_income+=payout;const lines=[`Cash: +${money(payout)}`,`XP: +${h.xp}`];if(h.respect)lines.push(`Respect: +${h.respect}`);if(h.heat)lines.push(`Heat: +${h.heat}★`);if(h.clean&&player.heat>0&&Math.random()<.25){player.heat--;lines.push('Clean activity cooled Heat: -1★');}if((player.daily.hustle_counts[id]||0)>=2)lines.push('Same move is getting noticed. Success drops when repeated.');const lvl=updateLevel();if(lvl)lines.push(lvl);addActivity(`Completed ${h.name} for ${money(payout)}`);result('HUSTLE COMPLETE',lines);
  }else{player.stats.failed_moves++;player.daily.failures++;const lines=['The opportunity fell through.'];if(entry)lines.push(`Lost entry money: ${money(entry)}`);if(!h.clean){player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★');}if((player.daily.hustle_counts[id]||0)>=2)lines.push('Repeating this same move made it hotter.');addActivity(`Failed ${h.name}`);result('HUSTLE FAILED',lines);}
}

function getHired(id){const j=LEGIT_JOBS[id];if(!j)return;if(player.level<j.requires_level){result('NOT QUALIFIED',[`Requires Level ${j.requires_level}.`]);return;}if(player.job.current_job&&player.job.current_job!==id){result('ALREADY EMPLOYED',[`Quit ${LEGIT_JOBS[player.job.current_job].name} before taking another job.`]);return;}player.job.current_job=id;player.job.shifts_at_job=0;player.job.streak=0;player.job.pay_multiplier=Math.max(1,player.job.pay_multiplier||1);addActivity(`Hired at ${j.name}`);saveGame();result('YOU GOT THE JOB',[`${j.name}`,`Shift: ${formatTime(j.start)}–${formatTime(j.end)}`,'30-minute clock-in grace.','Complete 20 shifts for your first review bonus + 10% pay raise.']);}
function workShift(){const id=player.job.current_job;if(!id){result('NO JOB',['Get hired first.']);return;}const j=LEGIT_JOBS[id];if(player.job.last_shift_day===player.day){result('ALREADY WORKED',['You already completed today’s shift.']);return;}if(player.time>j.start+j.grace){player.job.missed_shifts++;player.job.streak=0;addActivity(`Missed ${j.name} shift`);saveGame();result('MISSED SHIFT',[`Clock-in window closed at ${formatTime(j.start+j.grace)}.`,'Pay: $0','Streak reset.']);return;}travelTo(j.location);if(screen==='result')return;if(player.time<j.start)player.time=j.start;const late=Math.max(0,player.time-j.start);player.time=j.end;const base=Math.round(randInt(...j.pay)*(player.job.pay_multiplier||1));player.cash_on_person+=base;player.clean_income+=base;player.xp+=j.xp;player.job.last_shift_day=player.day;player.job.shifts_worked++;player.job.shifts_at_job++;player.job.streak++;player.job.total_earned+=base;player.stats.legit_shifts++;player.daily.job_completed=true;markUsed('Legit Jobs');const heatBefore=player.heat;if(player.heat>0)player.heat--;player.trap.attention=Math.max(0,player.trap.attention-5);const lines=[`Shift: ${formatTime(j.start)}–${formatTime(j.end)}`,`Base pay: +${money(base)}`,`XP: +${j.xp}`,`Career shifts: ${player.job.shifts_worked}`];if(late)lines.push(`Clocked in ${late} minutes late (within grace).`);if(heatBefore>player.heat)lines.push('Heat cooled: -1★');lines.push('Trap Attention: -5%');
  if(player.job.shifts_at_job%20===0){player.job.reviews_earned++;player.job.pay_multiplier=Math.round((player.job.pay_multiplier+0.10)*100)/100;const bonus=j.milestone_bonus*Math.max(1,player.job.reviews_earned);player.cash_on_person+=bonus;player.clean_income+=bonus;player.job.total_earned+=bonus;lines.push(`20-SHIFT REVIEW BONUS: +${money(bonus)}`);lines.push(`PERMANENT PAY RAISE: now ${Math.round(player.job.pay_multiplier*100)}% base pay`);addActivity(`Earned ${j.name} 20-shift review + raise`);}
  const lvl=updateLevel();if(lvl)lines.push(lvl);addActivity(`Worked ${j.name} for ${money(base)} clean`);result('SHIFT COMPLETE',lines);
}
function quitJob(){if(!player.job.current_job)return;const name=LEGIT_JOBS[player.job.current_job]?.name||'job';player.job.current_job=null;player.job.shifts_at_job=0;player.job.streak=0;player.job.last_shift_day=null;addActivity(`Quit ${name}`);saveGame();result('JOB LEFT',[`You quit ${name}.`,'Your career totals stay saved, but job-specific 20-shift progress resets.']);}
function layLow(){const before=player.heat;if(player.time+90>=DAY_END){result('TOO LATE',['You do not have enough safe time left tonight.']);return;}advanceTime(90);player.heat=Math.max(0,player.heat-1);player.trap.attention=Math.max(0,player.trap.attention-8);addActivity('Laid low for 90 minutes');result('LAID LOW',[before>player.heat?'Heat: -1★':'Heat was already at 0.','Trap Attention: -8%',`Time: ${formatTime(player.time)}`]);}

function hospitalRespawn(){const cash=player.cash_on_person;player.cash_on_person=0;player.carried_drugs=emptyDrugInventory();let lost=null;if(player.equipped_weapon){lost=weaponName();const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null;}const x=Math.min(player.xp,Math.max(50,Math.floor(player.xp/10))),days=randInt(1,3);player.xp-=x;player.day+=days;player.time=DAY_START;player.location='hospital';player.health=65;player.stats.hospital_visits++;resetDaily();result('YOU WENT DOWN',[`Cash lost: ${money(cash)}`,'Carried inventory lost.',lost?`Weapon lost: ${lost}`:'No equipped weapon lost.',`XP lost: ${x}`,`Time passed: ${days} day(s)`,'Trap stash stayed safe.']);}
function arrestEvent(){const days=randInt(2,10),cash=Math.floor(player.cash_on_person*(.25+Math.random()*.45));player.cash_on_person-=cash;player.carried_drugs=emptyDrugInventory();if(player.equipped_weapon&&Math.random()<.75){const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null;}player.day+=days;player.time=DAY_START;player.location='trap';player.heat=Math.max(1,player.heat-1);player.respect=Math.max(0,player.respect-randInt(0,2));player.stats.arrests++;resetDaily();generateMarket();result('BUSTED',[`Jail time: ${days} days`,`Cash seized: ${money(cash)}`,'Carried inventory seized.','Stored trap stash remains separate.']);}
function lateNightEvent(){const severity=Math.max(1,Math.floor((player.time-DAY_END)/30)+1),danger=Math.min(90,25+severity*10+player.heat*8);if(randInt(1,100)>danger){player.location='trap';forcedEndDay(['You got lucky and made it back without losing anything.']);return;}const o=['robbed','arrested','injured'][randInt(0,2)];if(o==='arrested'){arrestEvent();return;}if(o==='robbed'){const c=player.cash_on_person;player.cash_on_person=0;player.carried_drugs=emptyDrugInventory();player.location='trap';forcedEndDay(['Caught slipping after 2:00 AM.',`Lost carried cash: ${money(c)}`,'Lost carried inventory.']);return;}player.health-=randInt(25,55);if(player.health<=0){hospitalRespawn();return;}player.location='trap';forcedEndDay([`You made it back hurt. Health: ${player.health}/100`]);}
function overnightEventLines(){const s=player.trap.security,a=player.trap.attention,v=totalTrapValue();let risk=clamp(5+Math.floor(a/4)+player.heat*5+Math.min(20,Math.floor(v/1000))-s*6,3,70);if(randInt(1,100)>risk){player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return['Quiet night. Nothing major happened.'];}const e=['robbery','pressure','damage'][randInt(0,2)],lines=[];if(e==='robbery'){lines.push('Somebody hit the trap overnight.');const loss=Math.min(player.trap.cash,randInt(0,Math.max(50,Math.floor(player.trap.cash/3)+1)));player.trap.cash-=loss;if(loss)lines.push(`Cash stolen: ${money(loss)}`);player.trap.condition=Math.max(0,player.trap.condition-1);}else if(e==='pressure'){player.heat=clamp(player.heat+1,0,5);lines.push('Heavy pressure around the neighborhood overnight.','Heat: +1★');}else{player.trap.condition=Math.max(0,player.trap.condition-1);lines.push('Something got damaged at the trap.','Trap Condition: -1');}player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return lines;}
function applyMissedJobIfNeeded(){if(!player.job.current_job||player.daily.job_completed)return null;const j=LEGIT_JOBS[player.job.current_job];if(player.job.last_shift_day===player.day)return null;if(player.time>=j.start+j.grace){player.job.missed_shifts++;player.job.streak=0;addActivity(`Missed ${j.name} shift`);return `Missed ${j.name}: $0 pay.`;}return null;}
function endDay(){if(player.location!=='trap'){result('CAN’T SLEEP YET',['You need to return to your trap before sleeping.']);return;}const miss=applyMissedJobIfNeeded(),cashNow=player.cash_on_person+player.trap.cash,summary=[`Cash Change: ${money(cashNow-player.daily.cash_start)}`,`XP Change: ${(player.xp-player.daily.xp_start>=0?'+':'')+(player.xp-player.daily.xp_start)}`,`Respect Change: ${(player.respect-player.daily.respect_start>=0?'+':'')+(player.respect-player.daily.respect_start)}`,`Heat Change: ${(player.heat-player.daily.heat_start>=0?'+':'')+(player.heat-player.daily.heat_start)}`,`Moves: ${player.daily.successes} successful / ${player.daily.failures} failed`,...(miss?[miss]:[]),`Trap Attention: ${player.trap.attention}%`],night=overnightEventLines();player.day++;player.time=DAY_START;player.location='trap';player.stats.days_survived++;if(player.heat>0&&Math.random()<.35)player.heat--;generateMarket();resetDaily();saveGame();result(`DAY ${player.day} — MORNING REPORT`,[...summary,'--- NIGHT REPORT ---',...night,`Heat: ${stars(player.heat)}`,'The city is moving again.']);}
function forcedEndDay(extra){const miss=applyMissedJobIfNeeded(),night=overnightEventLines();player.day++;player.time=DAY_START;player.location='trap';player.stats.days_survived++;if(player.heat>0&&Math.random()<.35)player.heat--;generateMarket();resetDaily();saveGame();result(`DAY ${player.day} — MORNING REPORT`,[...extra,...(miss?[miss]:[]),'--- NIGHT REPORT ---',...night,`Heat: ${stars(player.heat)}`]);}
function needsPatchNotes(){return player&&!player.seen_updates.includes(CURRENT_PATCH_ID);}

// =========================================================
// ACTION HANDLER
// =========================================================

function handle(action){
  if(action==='new'){const name=prompt('Enter player name:','Player')||'Player';player=newPlayer(name);generateMarket();resetDaily();saveGame();screen='whatsnew';render();return;}
  if(action==='continue'){player=loadGame();if(!player){screen='start';render();return;}screen=needsPatchNotes()?'whatsnew':'home';render();return;}
  if(action==='deleteSave'){if(confirm('Delete your Federal Motion browser save?')){localStorage.removeItem(SAVE_KEY);player=null;screen='start';render();}return;}
  if(action==='home'){screen='home';payload=null;render();return;}
  if(['moves','hustles','employment','jobs','street','supplier','black','weapons','armor','equip','crew','map','stash','upgrades','hospital','status','market','phone','whatsnew','tutorial','activity'].includes(action)){screen=action;payload=null;render();return;}
  if(action==='save'){saveGame();result('GAME SAVED',['Local save updated.',fmBackend.ready?'Cloud save queued/synced.':'Cloud will sync when connected.']);return;}
  if(action==='sleep'){endDay();return;}
  if(action==='layLow'){layLow();return;}
  if(action==='seenUpdate'){if(!player.seen_updates.includes(CURRENT_PATCH_ID))player.seen_updates.push(CURRENT_PATCH_ID);saveGame();screen='home';render();return;}
  if(action==='tutorialDone'){player.tutorial_version=CURRENT_TUTORIAL_VERSION;player.tutorial_completed=true;saveGame();result('GUIDE REVIEWED',['Tutorial marked complete.']);return;}
  if(action.startsWith('doMove:')){performMove(action.split(':')[1]);return;}
  if(action.startsWith('hustle:')){performHustle(action.split(':')[1]);return;}
  if(action.startsWith('hireJob:')){getHired(action.split(':')[1]);return;}
  if(action==='workShift'){workShift();return;}
  if(action==='quitJob'){quitJob();return;}
  if(action.startsWith('supplier:')){const n=action.split(':')[1];if((n==='Doc'&&player.respect<3)||(n==='Ghost'&&player.respect<8)){result('NOT YET',[n==='Doc'?'Doc: Come back when people actually know your name.':'Ghost isn’t interested yet.']);return;}travelTo('supplier');if(screen==='result')return;screen='supplierShop';payload=n;render();return;}
  if(action==='buyDrugGo'){const id=$('#buyDrug').value,g=parseFloat($('#buyGrams').value||0),p=Math.max(1,Math.floor(DRUGS[id].base_value*.65)),cost=Math.floor(g*p),name=payload;if(g<=0)return;const charge=taxedPurchase(cost);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)} including ${money(charge.tax)} Motion Tax.`]);return;}player.carried_drugs[id]+=g;player.supplier_trust[name]++;advanceTime(30);addActivity(`Bought ${g.toFixed(1)}g ${DRUGS[id].name}`);result('DEAL COMPLETE',[`${DRUGS[id].name}: +${g.toFixed(1)}g`,`Base: -${money(charge.base)}`,`Motion Tax: -${money(charge.tax)}`,`Total: -${money(charge.total)}`]);return;}
  if(action==='streetGo'){const id=$('#streetDrug').value,g=Math.min(parseFloat($('#streetGrams').value||0),player.carried_drugs[id]);if(g<=0)return;const d=DRUGS[id],pay=Math.floor(g*d.base_value*player.market[id]*(.85+Math.random()*.3)),chance=Math.max(40,96-(d.risk+player.heat)*4);advanceTime(randInt(35,65));if(screen==='result')return;player.stats.moves++;if(randInt(1,100)<=chance){player.carried_drugs[id]-=g;player.cash_on_person+=pay;const xp=Math.max(10,Math.floor(g*2));player.xp+=xp;if(randInt(1,100)<=d.risk*8)player.heat=clamp(player.heat+1,0,5);player.stats.successful_moves++;player.daily.successes++;const lvl=updateLevel();addActivity(`Street move: ${g.toFixed(1)}g ${d.name} for ${money(pay)}`);result('MOVE SUCCESSFUL',[`Moved: ${g.toFixed(1)}g ${d.name}`,`Cash: +${money(pay)}`,`XP: +${xp}`,...(lvl?[lvl]:[])]);}else{player.stats.failed_moves++;player.daily.failures++;player.heat=clamp(player.heat+1,0,5);result('MOVE WENT BAD',['The opportunity fell apart.','No inventory was lost.','Heat: +1★']);}return;}
  if(action.startsWith('buyWeapon:')){const id=action.split(':')[1],w=WEAPONS[id],charge=taxedPurchase(w.price);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)} including Motion Tax.`]);return;}player.weapon_inventory.push({id,condition:w.condition,upgrades:0});advanceTime(30);addActivity(`Purchased ${w.name}`);result('PURCHASE COMPLETE',[`Purchased ${w.name}.`,`Base: -${money(charge.base)}`,`Motion Tax: -${money(charge.tax)}`,`Total: -${money(charge.total)}`]);return;}
  if(action.startsWith('buyArmor:')){const id=action.split(':')[1],a=ARMOR[id],charge=taxedPurchase(a.price);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)} including Motion Tax.`]);return;}player.armor_inventory.push(id);advanceTime(25);result('PURCHASE COMPLETE',[`Purchased ${a.name}.`,`Base: -${money(charge.base)}`,`Motion Tax: -${money(charge.tax)}`,`Total: -${money(charge.total)}`]);return;}
  if(action==='equipGo'){const wi=$('#equipWeapon').value,ai=$('#equipArmor').value;player.equipped_weapon=wi===''?null:player.weapon_inventory[Number(wi)]?.id||null;player.equipped_armor=ai===''?null:player.armor_inventory[Number(ai)]||null;saveGame();result('GEAR EQUIPPED',[`Weapon: ${weaponName()}`,`Armor: ${armorName()}`]);return;}
  if(action.startsWith('hire:')){const id=action.split(':')[1],c=CREW[id];travelTo('crew_spot');if(screen==='result')return;if(player.cash_on_person<c.price){result('NOT ENOUGH CASH',[`Need ${money(c.price)}.`]);return;}player.cash_on_person-=c.price;player.crew.push(id);advanceTime(45);result('CREW UPDATED',[`${c.name} joined the crew.`]);return;}
  if(action.startsWith('travel:')){const id=action.split(':')[1];if(id===player.location)return;travelTo(id);if(screen==='result')return;result('TRAVEL COMPLETE',[`Arrived at ${LOCATIONS[id].name}.`,`Time: ${formatTime(player.time)}`]);return;}
  if(action==='depositCash'||action==='withdrawCash'){let a=Math.max(0,Math.floor(Number($('#cashAmount').value||0)));if(action==='depositCash'){a=Math.min(a,player.cash_on_person);player.cash_on_person-=a;player.trap.cash+=a;}else{a=Math.min(a,player.trap.cash);player.trap.cash-=a;player.cash_on_person+=a;}saveGame();screen='stash';render();return;}
  if(action==='storeDrug'||action==='takeDrug'){const id=$('#stashDrug').value;let g=Math.max(0,Number($('#stashGrams').value||0));const src=action==='storeDrug'?player.carried_drugs:player.trap.drug_stash,dst=action==='storeDrug'?player.trap.drug_stash:player.carried_drugs;g=Math.min(g,src[id]);src[id]-=g;dst[id]+=g;saveGame();screen='stash';render();return;}
  if(action==='storeWeapons'){player.trap.weapons.push(...player.weapon_inventory);player.weapon_inventory=[];player.equipped_weapon=null;saveGame();screen='stash';render();return;}
  if(action==='takeWeaponGo'){const i=Number($('#takeWeapon').value);if(Number.isFinite(i)&&player.trap.weapons[i])player.weapon_inventory.push(player.trap.weapons.splice(i,1)[0]);saveGame();screen='stash';render();return;}
  if(action.startsWith('upgrade:')){const k=action.split(':')[1];if(player.trap[k]>=5)return;const costs={security:500*(player.trap.security+1),storage:400*(player.trap.storage+1),condition:300*(player.trap.condition+1)},c=costs[k];if(player.cash_on_person<c){result('NOT ENOUGH CASH',[`Need ${money(c)}.`]);return;}player.cash_on_person-=c;player.trap[k]++;advanceTime(60);result('TRAP UPGRADED',[`${k[0].toUpperCase()+k.slice(1)} upgraded to ${player.trap[k]}/5.`]);return;}
  if(action==='treat'){if(player.health>=100)return;travelTo('hospital');if(screen==='result')return;const c=Math.max(50,(100-player.health)*8);if(player.cash_on_person<c){result('NOT ENOUGH CASH',[`Treatment costs ${money(c)}.`]);return;}player.cash_on_person-=c;player.health=100;advanceTime(120);result('TREATMENT COMPLETE',['Health restored to 100/100.',`Cash: -${money(c)}`]);return;}
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handle(b.dataset.action);});

render();
initBackend();
