'use strict';

const SAVE_KEY='federal_motion_web_save_v2';
const LEGACY_SAVE_KEY='federal_motion_web_save_v1';
const TAX_QUEUE_KEY='federal_motion_tax_queue_v1';
const LOSS_QUEUE_KEY='federal_motion_owner_loss_queue_v1';
const UPKEEP_QUEUE_KEY='federal_motion_owner_upkeep_queue_v1';
const SUPABASE_URL='https://nrqgmlofflbnwhbywfbc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_KlgKi5KFxRqrMbGzZIVVSQ_-JM9OlON';

const DAY_START=8*60, WARNING_TIME=24*60, DAY_END=26*60, MAX_HEAT=5, MAX_HEALTH=100;
const DEFAULT_MOTION_TAX_RATE=.05;

let fmBackend={client:null,user:null,ready:false,syncing:false,taxRate:DEFAULT_MOTION_TAX_RATE,gameVersion:'Alpha 0.8.2',error:null,ownerBank:null,isOwner:false,ownerDashboard:null,playerCrew:null,crewTerritories:[],publicCrews:[]};
let player=null, screen='start', payload=null;
let actionOriginScreen='home';

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

const PROPERTY_ECONOMY={
 starter_trap:{income:[0,0],upkeep:0},
 apartment:{income:[0,0],upkeep:20},
 garage_property:{income:[10,45],upkeep:35},
 second_trap:{income:[90,190],upkeep:65},
 warehouse_property:{income:[180,360],upkeep:130},
 business_front:{income:[300,650],upkeep:220},
 luxury_home:{income:[0,0],upkeep:275},
};
const VEHICLE_UPKEEP={bicycle:0,beater:12,muscle:30,suv:42,sport:65,executive:90};
const CREW_UPKEEP={rico:18,ace:30,brick:40,nova:48,saint:55};
const PHONE_UPKEEP={burner:0,budget:4,premium:12,elite:25};


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



const LEGIT_JOBS={
 fedup:{company:'FedUp Logistics',title:'Package Handler',start:480,duration:480,base_pay:95,description:'Move boxes nobody needed overnight. Management calls it a career.',skill:'endurance',promotions:[{shifts:0,title:'Package Handler',pay:95},{shifts:20,title:'Senior Package Handler',pay:110,bonus:175},{shifts:40,title:'Lead Package Handler',pay:130,bonus:250},{shifts:60,title:'Team Lead',pay:155,bonus:350},{shifts:100,title:'Shift Supervisor',pay:190,bonus:600}]},
 probably_legal:{company:'Probably Legal Construction LLC',title:'Laborer',start:480,duration:540,base_pay:110,description:'Carry expensive stuff while somebody making four times your wage points at it.',skill:'endurance',promotions:[{shifts:0,title:'Laborer',pay:110},{shifts:20,title:'Experienced Laborer',pay:125,bonus:200},{shifts:40,title:'Crew Lead',pay:145,bonus:275},{shifts:60,title:'Site Lead',pay:170,bonus:400},{shifts:100,title:'Foreman',pay:210,bonus:700}]},
 deliver_eventually:{company:'WeDeliverEventually',title:'Delivery Driver',start:540,duration:480,base_pay:100,description:'Deliver somebody else’s impulse purchase and pray the address actually exists.',skill:'driving',requires_vehicle:true,promotions:[{shifts:0,title:'Delivery Driver',pay:100},{shifts:20,title:'Route Driver',pay:115,bonus:175},{shifts:40,title:'Senior Driver',pay:135,bonus:250},{shifts:60,title:'Route Captain',pay:160,bonus:375},{shifts:100,title:'Dispatch Lead',pay:195,bonus:625}]},
 auto_correct:{company:'Auto Correct Garage',title:'Shop Assistant',start:600,duration:480,base_pay:105,description:'Fix other people’s rides while your own check-engine light stays on.',skill:'driving',promotions:[{shifts:0,title:'Shop Assistant',pay:105},{shifts:20,title:'Service Helper',pay:120,bonus:190},{shifts:40,title:'Junior Tech',pay:140,bonus:275},{shifts:60,title:'Service Tech',pay:165,bonus:400},{shifts:100,title:'Shop Lead',pay:205,bonus:675}]},
 dial_deny:{company:'Dial & Deny Wireless',title:'Sales Associate',start:660,duration:480,base_pay:90,description:'Explain activation fees with a straight face.',skill:'charisma',promotions:[{shifts:0,title:'Sales Associate',pay:90},{shifts:20,title:'Senior Associate',pay:105,bonus:160},{shifts:40,title:'Keyholder',pay:125,bonus:235},{shifts:60,title:'Assistant Manager',pay:150,bonus:350},{shifts:100,title:'Store Manager',pay:185,bonus:575}]},
 tip_optional:{company:'Tip Optional Pizza',title:'Kitchen Crew',start:840,duration:480,base_pay:85,description:'Make dinner for people who will complain about a $2 delivery fee.',skill:'endurance',promotions:[{shifts:0,title:'Kitchen Crew',pay:85},{shifts:20,title:'Senior Crew',pay:100,bonus:150},{shifts:40,title:'Shift Lead',pay:120,bonus:225},{shifts:60,title:'Assistant Manager',pay:145,bonus:325},{shifts:100,title:'General Manager',pay:180,bonus:550}]},
 stand_around:{company:'Stand Around Security',title:'Security Guard',start:960,duration:480,base_pay:100,description:'Protect property you could never afford.',skill:'street',promotions:[{shifts:0,title:'Security Guard',pay:100},{shifts:20,title:'Senior Guard',pay:115,bonus:175},{shifts:40,title:'Shift Guard',pay:135,bonus:250},{shifts:60,title:'Site Supervisor',pay:160,bonus:375},{shifts:100,title:'Regional Supervisor',pay:195,bonus:625}]}
};

const TERRITORY_ZONES={
 southside:{name:'Southside',district:'Southside',gang:'Redline Crew',difficulty:32,signature_drug:'weed',weapon_pool:['street_pistol','fn_style'],bonus:'Street income +5%',bonus_value:5},
 midtown:{name:'Midtown Strip',district:'Midtown',gang:'Midtown Kings',difficulty:42,signature_drug:'pills',weapon_pool:['fn_style','pump_shotgun'],bonus:'Shop prices -5%',bonus_value:5},
 apartments_zone:{name:'Apartment Blocks',district:'Southside',gang:'Brickhouse Mob',difficulty:48,signature_drug:'shrooms',weapon_pool:['street_pistol','pump_shotgun'],bonus:'Property income +8%',bonus_value:8},
 warehouse_zone:{name:'Warehouse District',district:'Midtown',gang:'Dockside Union',difficulty:58,signature_drug:'cocaine',weapon_pool:['pump_shotgun','draco_style'],bonus:'Storage income +10%',bonus_value:10},
 outskirts:{name:'Outskirts',district:'Outskirts',gang:'County Line',difficulty:68,signature_drug:'meth',weapon_pool:['draco_style','mini_arp_style'],bonus:'Travel risk -8%',bonus_value:8},
 restricted_zone:{name:'Restricted Zone',district:'Outskirts',gang:'Black Flag',difficulty:78,signature_drug:'heroin',weapon_pool:['mini_arp_style','elite_carbine'],bonus:'High-tier job odds +5%',bonus_value:5},
};
const CREW_EMBLEMS=['♛','⚡','☠','◆','♠','★','♜','🔥'];
const CREW_COLORS=['Green','Red','Gold','Blue','Purple','Orange'];
const CREW_RANKS=['Boss','Underboss','Lieutenant','Member'];
const CREW_MAX_MEMBERS=10;

const MOVES={
 quick_hustle:{name:'Quick Hustle',location:'corner_store',minutes:[45,75],base_success:88,cash:[35,85],xp:30,respect:1,heat:0,combat:false},
 house_hit:{name:'House Robbery',location:'apartments',minutes:[90,150],base_success:72,cash:[90,260],xp:60,respect:2,heat:1,combat:true,enemy:[8,24],requires_weapon:true,weapon_tier:1},
 store_hit:{name:'Store Robbery',location:'shopping_strip',minutes:[100,170],base_success:68,cash:[180,500],xp:95,respect:3,heat:1,combat:true,enemy:[15,30],requires_weapon:true,weapon_tier:2},
 rival_trap:{name:'Rival Trap House Hit',location:'rival_territory',minutes:[170,260],base_success:58,cash:[400,1100],xp:155,respect:5,heat:2,combat:true,enemy:[28,50],requires_weapon:true,weapon_tier:2},
 bank_heist:{name:'Bank Heist',location:'bank',minutes:[330,450],base_success:42,cash:[1800,5000],xp:360,respect:10,heat:3,combat:true,enemy:[45,70],requires_weapon:true,weapon_tier:4,requires_crew:1,requires_level:4},
 restricted_warehouse:{name:'Restricted Warehouse Heist',location:'military_facility',minutes:[390,510],base_success:32,cash:[4500,11000],xp:600,respect:16,heat:4,combat:true,enemy:[65,95],requires_weapon:true,weapon_tier:5,requires_crew:2,requires_level:6},
};

// ===== ALPHA 0.7 QUICK MOVES / HUSTLE BOARD =====
// Small repeatable opportunities that give early-game players more options
// without replacing the deeper Make a Move, Employment, Territory, or City Life systems.
const SIDE_HUSTLES={
 delivery_run:{name:'Quick Delivery',minutes:[35,60],cash:[45,95],xp:22,respect:0,success:94,heat:0,risk:'LOW',clean:true,requires_level:1},
 moving_help:{name:'Moving Help',minutes:[60,100],cash:[55,120],xp:30,respect:0,success:93,heat:0,risk:'LOW',clean:true,requires_level:1},
 car_detail:{name:'Quick Car Detail',minutes:[50,90],cash:[50,110],xp:28,respect:0,success:95,heat:0,risk:'LOW',clean:true,requires_level:1},
 warehouse_day:{name:'Warehouse Day Work',minutes:[75,120],cash:[65,135],xp:38,respect:0,success:92,heat:0,risk:'LOW',clean:true,requires_level:1},
 courier:{name:'Courier Run',minutes:[55,95],cash:[70,150],xp:38,respect:1,success:90,heat:0,risk:'MEDIUM',clean:true,requires_level:1},
 resell_flip:{name:'Marketplace Flip',minutes:[70,120],cash:[95,210],xp:48,respect:1,success:84,heat:0,risk:'MEDIUM',clean:true,requires_level:2,entry_cost:55},
 odd_job:{name:'Last-Minute Odd Job',minutes:[45,90],cash:[60,130],xp:34,respect:0,success:88,heat:0,risk:'MEDIUM',clean:true,requires_level:1},
 night_delivery:{name:'After-Hours Delivery',minutes:[60,110],cash:[120,280],xp:65,respect:2,success:76,heat:1,risk:'HIGH',clean:false,requires_level:2},
 risky_pickup:{name:'Risky Pickup',minutes:[80,140],cash:[180,390],xp:90,respect:3,success:68,heat:1,risk:'HIGH',clean:false,requires_level:3},
 high_risk:{name:'High-Risk Opportunity',minutes:[120,200],cash:[300,700],xp:135,respect:5,success:55,heat:2,risk:'EXTREME',clean:false,requires_level:4},
 check_scheme:{name:'Counterfeit Check Scheme',minutes:[90,150],cash:[220,520],xp:95,respect:2,success:62,heat:2,risk:'HIGH',clean:false,requires_level:3,entry_cost:75},
 bank_paper:{name:'Bank Paper Scam',minutes:[120,190],cash:[450,950],xp:150,respect:4,success:48,heat:3,risk:'EXTREME',clean:false,requires_level:5,entry_cost:140},
 fake_deposit:{name:'Fake Deposit Play',minutes:[75,130],cash:[180,420],xp:85,respect:2,success:66,heat:2,risk:'HIGH',clean:false,requires_level:3,entry_cost:60},
};


// ===== ALPHA 0.8 CITY PRESSURE =====
const LICENSES={
 drivers:{name:"Driver's License",price:180,desc:'Required for normal legal vehicle operation during traffic stops.'},
 carry:{name:'City Carry Permit',price:650,desc:'Reduces legal trouble from carrying eligible low-tier weapons during a stop.'}
};
const SCAM_GEAR={
 laptop:{name:'Burner Laptop',price:900,tier:1},reader:{name:'Card Reader',price:1250,tier:1},
 blank_media:{name:'Blank Card Pack',price:500,tier:1},printer:{name:'Document Printer Kit',price:1800,tier:2},
 access_key:{name:'Omni Access Key',price:3500,tier:3},workstation:{name:'Encrypted Workstation',price:6500,tier:4}
};
const FRAUD_JOBS={
 digital_flip:{name:'Digital Flip',tier:1,minutes:[70,110],cash:[140,300],success:82,heat:1,req:['laptop']},
 card_cashout:{name:'Card Cashout',tier:1,minutes:[90,140],cash:[260,600],success:70,heat:2,req:['laptop','reader','blank_media']},
 paper_play:{name:'Bank Paper Job',tier:2,minutes:[120,180],cash:[500,1200],success:58,heat:2,req:['laptop','printer']},
 atm_cashout:{name:'ATM Cashout',tier:3,minutes:[110,170],cash:[850,1900],success:48,heat:3,req:['laptop','access_key']},
 account_score:{name:'Account Score',tier:4,minutes:[160,240],cash:[1600,3800],success:38,heat:4,req:['workstation','access_key','printer']}
};
const DAILY_OBJECTIVE_POOL=[
 ['Complete 2 Quick Moves',p=>(p.daily?.hustles_completed||0)>=2],['Work a legit shift',p=>(p.daily?.legit_shifts||0)>=1],
 ['Earn $300 today',p=>(p.daily?.earned||0)>=300],['Reduce Heat at least once',p=>(p.daily?.heat_reduced||0)>=1],
 ['Complete a supplier purchase',p=>(p.daily?.supplier_buys||0)>=1],['Finish a scam-career job',p=>(p.daily?.fraud_jobs||0)>=1]
];
const WEEKLY_OBJECTIVE_POOL=[
 ['Complete 5 legit shifts',p=>(p.weekly?.legit_shifts||0)>=5],['Complete 10 Quick Moves',p=>(p.weekly?.hustles||0)>=10],
 ['Earn $3,000 this week',p=>(p.weekly?.earned||0)>=3000],['Complete 3 scam-career jobs',p=>(p.weekly?.fraud_jobs||0)>=3],
 ['Complete a major move',p=>(p.weekly?.major_moves||0)>=1],['Lower Heat 3 times',p=>(p.weekly?.heat_reduced||0)>=3]
];
function hasScamGear(id){return (player.scam?.gear||[]).includes(id)}
function policePressure(){return clamp((player.heat||0)*18+(player.warrants||0)*12+(player.trap?.attention||0)*.15,0,98)}
function addAlert(text,type='CITY'){player.alerts=player.alerts||[];player.alerts.unshift({day:player.day,time:formatTime(player.time),type,text});player.alerts=player.alerts.slice(0,40);player.messages.unshift({from:type,text,day:player.day})}
function policeCheck(reason='CITY PRESSURE'){
 if(player.heat<=0)return [];
 const roll=randInt(1,100),pressure=policePressure(),lines=[];
 if(roll>pressure*.42)return lines;
 if(player.heat<=2){lines.push('POLICE: Traffic stop.');if(player.active_vehicle!=='bicycle'&&!player.licenses.drivers){player.cash_on_person=Math.max(0,player.cash_on_person-120);lines.push('No driver license: $120 citation.')}if(player.equipped_weapon&&!player.licenses.carry){player.heat=clamp(player.heat+1,0,5);lines.push('Unpermitted carry raised Heat: +1★')}}
 else if(player.heat===3){player.warrants=Math.max(1,player.warrants||0);lines.push('POLICE: Search pressure escalated. A warrant is now active.');addAlert('A warrant was issued. Searches and stops are more dangerous.','POLICE')}
 else if(player.heat===4){player.warrants=Math.max(1,player.warrants||0);player.trap.attention=clamp(player.trap.attention+12,0,100);lines.push('POLICE: Active warrant + property surveillance. Trap attention +12%.');addAlert('Police surveillance increased around your properties.','POLICE')}
 else {const arrest=randInt(1,100)<=55+(player.warrants||0)*8;if(arrest){player.stats.arrests=(player.stats.arrests||0)+1;player.cash_on_person=Math.floor(player.cash_on_person*.65);player.heat=3;player.warrants=0;player.time=DAY_START;lines.push('ARREST: You lost 35% of carried cash and came back at 3★ Heat.')}else{player.trap.attention=clamp(player.trap.attention+20,0,100);lines.push('RAID WARNING: You slipped the sweep. Trap attention +20%.');addAlert('Raid pressure is active. Stashing and laying low may be smart.','POLICE')}}
 addActivity(`${reason}: ${lines[0]||'Police pressure'}`);return lines;
}
function ensureObjectives(){
 player.weekly=player.weekly||{week:Math.floor((player.day-1)/7)+1,earned:0,hustles:0,legit_shifts:0,fraud_jobs:0,major_moves:0,heat_reduced:0,claimed:[]};
 const wk=Math.floor((player.day-1)/7)+1;if(player.weekly.week!==wk)player.weekly={week:wk,earned:0,hustles:0,legit_shifts:0,fraud_jobs:0,major_moves:0,heat_reduced:0,claimed:[]};
 player.objective_state=player.objective_state||{};
 const seed=player.day%DAILY_OBJECTIVE_POOL.length;player.objective_state.daily=[seed,(seed+2)%DAILY_OBJECTIVE_POOL.length,(seed+4)%DAILY_OBJECTIVE_POOL.length];
 player.objective_state.weekly=[(wk-1)%WEEKLY_OBJECTIVE_POOL.length,(wk+1)%WEEKLY_OBJECTIVE_POOL.length,(wk+3)%WEEKLY_OBJECTIVE_POOL.length];
}
function claimObjective(kind,idx){ensureObjectives();const pool=kind==='daily'?DAILY_OBJECTIVE_POOL:WEEKLY_OBJECTIVE_POOL,state=kind==='daily'?player.daily:player.weekly,key=`${kind}_${kind==='daily'?player.day:player.weekly.week}_${idx}`;player.objective_claims=player.objective_claims||[];if(player.objective_claims.includes(key)||!pool[idx][1](player))return;const reward=kind==='daily'?150:750,xp=kind==='daily'?40:180;player.cash_on_person+=reward;player.xp+=xp;player.stats.total_earned+=reward;player.objective_claims.push(key);saveGame();result('OBJECTIVE REWARD',[`${pool[idx][0]} complete.`,`Cash: +${money(reward)}`,`XP: +${xp}`])}

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

const ICONS={phone:'📱',cash:'💵',heat:'🚨',health:'❤️',xp:'⚡',respect:'👑',weapon:'🔫',armor:'🛡️',ride:'🚗',jobs:'🎯',street:'🧱',supplier:'🤝',market:'🛒',crew:'👥',map:'🗺️',garage:'🏎️',property:'🏠',stash:'📦',upgrade:'🛠️',laylow:'🌙',skills:'📈',objectives:'📋',achievements:'🏆',hospital:'🏥',status:'📊',sleep:'🛏️',save:'💾',owner:'💰',dashboard:'🛰️',bank:'🏦',profile:'🪪',playercrew:'🛡️',territory:'🗺️',hq:'🏴',alert:'⚠️'};
function icon(k){return ICONS[k]||'•'}
function meter(label,value,max,cls=''){const pct=clamp((Number(value)||0)/Math.max(1,max)*100,0,100);return `<div class="meter-block ${cls}"><div class="meter-label"><span>${escapeHtml(label)}</span><strong>${Math.round(value)}/${Math.round(max)}</strong></div><div class="meter"><div style="width:${pct}%"></div></div></div>`}

function emptyDrugInventory(){return Object.fromEntries(Object.keys(DRUGS).map(k=>[k,0]))}
function newPlayer(name='Player'){
 return {
  name,day:1,time:DAY_START,level:1,xp:0,respect:0,heat:0,health:100,cash_on_person:0,bank_cash:0,bills_due:0,work_rep:0,location:'trap',
  phone_id:'burner',equipped_weapon:null,equipped_armor:null,weapon_inventory:[],armor_inventory:[],crew:[],
  carried_drugs:emptyDrugInventory(),vehicles:['bicycle'],vehicle_condition:{bicycle:100},active_vehicle:'bicycle',properties:['starter_trap'],
  trap:{cash:0,drug_stash:emptyDrugInventory(),weapons:[],armor:[],security:0,storage:1,condition:1,attention:0},
  market:Object.fromEntries(Object.keys(DRUGS).map(k=>[k,1])),supplier_trust:{Smoke:0,Doc:0,Ghost:0},
  skills:{combat:{xp:0,level:1},street:{xp:0,level:1},charisma:{xp:0,level:1},driving:{xp:0,level:1},business:{xp:0,level:1},endurance:{xp:0,level:1}},
  achievements:[],messages:[{from:'Unknown',text:'Everybody starts somewhere. Get some motion.'}],
  stats:{moves:0,successful_moves:0,failed_moves:0,hospital_visits:0,arrests:0,days_survived:1,biggest_score:0,highest_heat:0,total_earned:0,total_expenses:0,total_property_income:0,random_events:0,total_banked:0,job_counts:{},legit_shifts:0,legit_pay_earned:0},
  licenses:{drivers:false,carry:false},warrants:0,scam:{gear:[],rep:0,jobs:0},alerts:[],objective_claims:[],og_reward_claimed:false,og_reward_eligible:false,weekly:{week:1,earned:0,hustles:0,legit_shifts:0,fraud_jobs:0,major_moves:0,heat_reduced:0,claimed:[]},daily:{}
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
 if(!p.vehicle_condition||typeof p.vehicle_condition!=='object')p.vehicle_condition={};
 p.vehicles.forEach(id=>{if(!Number.isFinite(p.vehicle_condition[id]))p.vehicle_condition[id]=VEHICLES[id]?.reliability||100});
 if(!p.active_vehicle)p.active_vehicle='bicycle';
 if(!Array.isArray(p.properties))p.properties=['starter_trap'];
 if(!Array.isArray(p.achievements))p.achievements=[];
 if(!Array.isArray(p.messages))p.messages=d.messages;
 if(!Number.isFinite(p.bank_cash))p.bank_cash=0;
 if(!Number.isFinite(p.bills_due))p.bills_due=0;
 if(!Number.isFinite(p.work_rep))p.work_rep=0;
 if(!Number.isFinite(p.clean_income))p.clean_income=0;
 if(!Array.isArray(p.activity_log))p.activity_log=[];
 if(!p.tutorial||typeof p.tutorial!=='object')p.tutorial={};
 if(!Number.isFinite(p.tutorial.step))p.tutorial.step=0;
 if(typeof p.tutorial.completed!=='boolean')p.tutorial.completed=false;
 if(typeof p.tutorial.seen_version!=='string')p.tutorial.seen_version='';
 if(!p.licenses||typeof p.licenses!=='object')p.licenses={drivers:false,carry:false};
 if(!Number.isFinite(p.warrants))p.warrants=0;
 if(!p.scam||typeof p.scam!=='object')p.scam={gear:[],rep:0,jobs:0};
 if(!Array.isArray(p.scam.gear))p.scam.gear=[];
 if(!Array.isArray(p.alerts))p.alerts=[];
 if(!Array.isArray(p.objective_claims))p.objective_claims=[];
 if(typeof p.og_reward_claimed!=='boolean')p.og_reward_claimed=false;
 if(typeof p.og_reward_eligible!=='boolean')p.og_reward_eligible=true;
 if(!p.weekly||typeof p.weekly!=='object')p.weekly={week:Math.floor((p.day-1)/7)+1,earned:0,hustles:0,legit_shifts:0,fraud_jobs:0,major_moves:0,heat_reduced:0,claimed:[]};
 if(!p.employment||typeof p.employment!=='object')p.employment={};
 const empD={current_job:null,shifts_worked:0,pending_pay:0,week_shifts:0,writeups:0,missed_shifts:0,last_shift_day:0,last_payday_day:0,employment_history:[]};
 Object.entries(empD).forEach(([k,v])=>{if(p.employment[k]===undefined)p.employment[k]=v});
 if(!Array.isArray(p.employment.employment_history))p.employment.employment_history=[];
 if(!Number.isFinite(p.stats.legit_shifts))p.stats.legit_shifts=0;
 if(!Number.isFinite(p.stats.legit_pay_earned))p.stats.legit_pay_earned=0;
 if(!Number.isFinite(p.stats.side_hustles))p.stats.side_hustles=0;
 if(!p.stats.job_counts||typeof p.stats.job_counts!=='object')p.stats.job_counts={};
 for(const k of ['total_expenses','total_property_income','random_events','total_banked'])if(!Number.isFinite(p.stats[k]))p.stats[k]=0;
 if(!p.daily||typeof p.daily!=='object')p.daily={};
 if(!p.daily.job_counts||typeof p.daily.job_counts!=='object')p.daily.job_counts={};
 if(!p.daily.hustle_counts||typeof p.daily.hustle_counts!=='object')p.daily.hustle_counts={};
 if(!Number.isFinite(p.daily.moves_attempted))p.daily.moves_attempted=(p.daily.successes||0)+(p.daily.failures||0);
 return p;
}
function resetDaily(){player.daily={cash_start:player.cash_on_person+player.trap.cash+(player.bank_cash||0),xp_start:player.xp,respect_start:player.respect,heat_start:player.heat,successes:0,failures:0,job_counts:{},hustle_counts:{},moves_attempted:0,hustles_completed:0,legit_shifts:0,fraud_jobs:0,earned:0,heat_reduced:0,supplier_buys:0}}
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
 let v=player.cash_on_person+player.trap.cash+(player.bank_cash||0);
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
  else{const cloud=await loadCloudSave();if(cloud){player=migratePlayer(cloud);localStorage.setItem(SAVE_KEY,JSON.stringify(player))}}
  screen='start';
  payload=null;
  await flushTaxQueue();await flushOwnerLossQueue();await flushOwnerUpkeepQueue();await refreshCrewWorld();render();
 }catch(err){console.error('Federal Motion backend:',err);fmBackend.error=err?.message||String(err);fmBackend.ready=false;render()}
}
async function loadRemoteSettings(){
 if(!fmBackend.client)return;
 const {data,error}=await fmBackend.client.from('fm_game_settings').select('setting_key,setting_value').in('setting_key',['motion_tax_rate','game_version']);
 if(error)return;
 for(const row of data||[]){if(row.setting_key==='motion_tax_rate'){const n=Number(row.setting_value);if(Number.isFinite(n)&&n>=0&&n<=.25)fmBackend.taxRate=n}/* Public build version is pinned in code so stale backend settings cannot downgrade the client label. */}
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

async function refreshPlayerCrew(){
 if(!fmBackend.ready||!fmBackend.client){fmBackend.playerCrew=null;return null}
 const {data,error}=await fmBackend.client.rpc('fm_get_my_crew');
 if(error){console.warn('Crew state:',error.message);fmBackend.playerCrew=null;return null}
 const row=Array.isArray(data)?data[0]:data;
 fmBackend.playerCrew=row||null;
 return fmBackend.playerCrew;
}
async function loadPublicCrews(){
 if(!fmBackend.ready||!fmBackend.client)return [];
 const {data,error}=await fmBackend.client.rpc('fm_list_public_crews');
 if(error){console.warn('Public crews:',error.message);return []}
 fmBackend.publicCrews=data||[];
 return fmBackend.publicCrews;
}
async function loadTerritories(){
 if(!fmBackend.ready||!fmBackend.client)return [];
 const {data,error}=await fmBackend.client.rpc('fm_get_territories');
 if(error){console.warn('Territories:',error.message);return []}
 fmBackend.crewTerritories=data||[];
 return fmBackend.crewTerritories;
}
async function refreshCrewWorld(){
 await refreshPlayerCrew();
 await Promise.all([loadTerritories(),loadPublicCrews()]);
}
function crewRankCanWithdraw(rank){return rank==='Boss'||rank==='Underboss'}
function crewRankCanManage(rank){return rank==='Boss'||rank==='Underboss'}
function localBattlePower(){
 if(!player)return 0;
 let p=player.level*6+player.respect*.8+skillLevel('combat')*4+skillLevel('street')*2;
 if(player.equipped_weapon)p+=(WEAPONS[player.equipped_weapon]?.power||0)*1.5;
 if(player.equipped_armor)p+=(ARMOR[player.equipped_armor]?.defense||0)*.7;
 p+=player.crew.reduce((sum,id)=>sum+(CREW[id]?.combat||0),0)*.6;
 if(player.health<75)p-=10;
 if(player.health<40)p-=15;
 if(player.heat>=4)p-=8;
 return Math.max(5,Math.round(p));
}
async function crewRpc(name,args={}){
 if(!fmBackend.ready||!fmBackend.client)return {ok:false,error:'Cloud backend offline.'};
 const {data,error}=await fmBackend.client.rpc(name,args);
 if(error)return {ok:false,error:error.message};
 await refreshCrewWorld();
 return {ok:true,data};
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
function cityTaxNote(){return `<div class="notice"><strong>City Tax</strong><br><span class="muted">A small in-game transaction fee added to certain purchases to help balance the city economy.</span></div>`}
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

function queueOwnerUpkeep(amount,source='upkeep'){
 amount=Math.max(0,Math.floor(Number(amount)||0));
 if(amount<=0)return;
 let q=[];
 try{q=JSON.parse(localStorage.getItem(UPKEEP_QUEUE_KEY)||'[]')}catch{}
 q.push({event_id:makeUuid(),amount,source:String(source||'upkeep')});
 localStorage.setItem(UPKEEP_QUEUE_KEY,JSON.stringify(q));
 flushOwnerUpkeepQueue();
}

async function flushOwnerUpkeepQueue(){
 if(!fmBackend.ready||!fmBackend.client)return;
 let q=[];
 try{q=JSON.parse(localStorage.getItem(UPKEEP_QUEUE_KEY)||'[]')}catch{}
 if(!q.length)return;

 const remain=[];
 for(const item of q){
  const {error}=await fmBackend.client.rpc('fm_collect_owner_upkeep',{
   p_event_id:item.event_id,
   p_amount:item.amount,
   p_source:item.source
  });
  if(error){
   console.warn('Owner upkeep pending:',error.message);
   remain.push(item);
  }
 }
 localStorage.setItem(UPKEEP_QUEUE_KEY,JSON.stringify(remain));
 if(fmBackend.isOwner)await refreshOwnerBank();
}

function header(){
 if(!player)return `<div class="hero"><div class="hero-kicker">DBEST LABS PRESENTS</div><div class="logo">FEDERAL MOTION</div><div class="sublogo">${escapeHtml(fmBackend.gameVersion)} · ${backendStatusText()}</div></div>`;
 const s=stageInfo();
 return `<div class="hero compact"><div class="hero-kicker">${escapeHtml(s.name)} · ${escapeHtml(s.title)}</div><div class="logo">FEDERAL MOTION</div><div class="sublogo">${escapeHtml(fmBackend.gameVersion)} · ${backendStatusText()}</div></div>
 <div class="hud card"><div class="hud-top"><div><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(s.title)}</small></div><div class="hud-clock">${formatTime(player.time)}<small>DAY ${player.day}</small></div></div>
 <div class="hud-grid">${meter(`${icon('health')} Health`,player.health,100,'health')}${meter(`${icon('xp')} XP`,player.xp-currentLevelXp(),nextLevelXp()-currentLevelXp(),'xp')}${meter(`${icon('respect')} Respect`,player.respect,Math.max(20,s.respect+25),'respect')}${meter(`${icon('heat')} Heat`,player.heat,5,'heat')}</div>
 <div class="hud-strip"><div><span>${icon('cash')} CASH</span><strong>${money(player.cash_on_person)}</strong></div><div><span>📍 LOCATION</span><strong>${escapeHtml(LOCATIONS[player.location]?.name||player.location)}</strong></div><button class="hud-quick" data-action="quickWeapon"><span>${icon('weapon')} WEAPON</span><strong>${escapeHtml(weaponName())}</strong></button><button class="hud-quick" data-action="quickVehicle"><span>${icon('ride')} RIDE</span><strong>${escapeHtml(vehicleName())}</strong></button></div></div>`;
}

function stat(k,v){return `<div class="stat"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`}
function btn(label,action,small='',cls=''){return `<button class="btn ${cls}" data-action="${action}">${label}${small?`<small>${small}</small>`:''}</button>`}
function back(){return btn('← Back','home','','back')}
function menuCard(emoji,title,sub,action,kind=''){return `<button class="menu-card ${kind}" data-action="${action}"><div class="menu-icon">${emoji}</div><div class="menu-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(sub)}</small></div><div class="menu-arrow">›</div></button>`}
function render(){
 let html=header();
 const map={
  start:renderStart,home:renderHome,result:renderResult,moves:renderMoves,hustles:renderHustles,street:renderStreet,supplier:renderSupplier,
  black:renderBlack,weapons:renderWeapons,armor:renderArmor,equip:renderEquip,crew:renderCrew,map:renderMap,stash:renderStash,
  upgrades:renderUpgrades,hospital:renderHospital,status:renderStatus,market:renderMarket,phone:renderPhone,objectives:renderObjectives,
  achievements:renderAchievements,skills:renderSkills,laylow:renderLayLow,vehicles:renderVehicles,properties:renderProperties,
  howto:renderHowTo,tutorial:renderTutorial,whatsnew:renderWhatsNew,patch:renderPatchNotes,activityHistory:renderActivityHistory,leaderboard:renderLeaderboard,bank:renderBank,employment:renderEmployment,licenses:renderLicenses,scamCareer:renderScamCareer,phoneAlerts:renderPhoneAlerts,dailyWeekly:renderDailyWeekly,profile:renderProfile,moveConfirm:renderMoveConfirm,playerCrew:renderPlayerCrew,territories:renderTerritories,territoryDetail:renderTerritoryDetail,ownerWallet:renderOwnerWallet,ownerDashboard:renderOwnerDashboard
 };
 if(screen==='supplierShop')html+=renderSupplierShop(payload);else html+=(map[screen]||renderHome)();
 app().innerHTML=html+`<div class="footer-note">${fmBackend.ready?'Local save + cloud sync active.':'Local save active. Cloud will sync when connected.'}</div>`;
}


function renderMoveConfirm(){
 const id=payload?.moveId,m=MOVES[id];
 if(!m)return `${back()}<div class="card">Move unavailable.</div>`;
 const chance=successChance(m,id),pay=currentMovePayout(id,m),risks=riskItemsForMove(m);
 const danger=chance>=90?'RARE FAILURE STILL POSSIBLE':chance>=70?'RISK PRESENT':'HIGH RISK';
 return `<div class="card risk-confirm">
  <div class="risk-kicker">⚠️ ${danger}</div>
  <h2>${escapeHtml(m.name)}</h2>
  <div class="risk-copy">If this move goes bad, you could lose cash, gear, health, or get arrested depending on the outcome.</div>
  <div class="job-metrics">
   <div><span>SUCCESS</span><strong>${chance}%</strong></div>
   <div><span>PAYOUT</span><strong>${money(pay[0])}–${money(pay[1])}</strong></div>
   <div><span>HEAT</span><strong>+${m.heat}★</strong></div>
   <div><span>TIME</span><strong>${m.minutes[0]}–${m.minutes[1]}m</strong></div>
  </div>
  ${(prepBreakdown(m,id).crewBonus||prepBreakdown(m,id).gearBonus)?`<div class="notice good">PREP BONUS ACTIVE · Extra crew and/or stronger gear are helping.</div>`:''}
  <div class="section-title">ODDS BREAKDOWN</div>
  <div class="odds-box">${oddsBreakdownHtml(m,id)}<div class="odds-final"><span>FINAL</span><strong>${chance}%</strong></div></div>
  <div class="section-title">WHAT YOU COULD LOSE</div>
  <div class="risk-list">${risks.length?risks.map(x=>`<div>• ${escapeHtml(x)}</div>`).join(''):'<div>• No major carried assets.</div>'}</div>
  <div class="actions risk-actions">${btn('GO ANYWAY',`confirmMove:${id}`,'Accept the risk','danger')}${btn('BACK OUT','moves','','back')}</div>
 </div>`;
}

function renderQuickWeaponPicker(){
 const owned=player.weapon_inventory||[];
 const items=[
  `<button class="quick-pick ${!player.equipped_weapon?'active':''}" data-action="quickWeaponEquip:none">
    <div><span class="quick-icon">✋</span><strong>Unarmed</strong></div>
    <small>${!player.equipped_weapon?'CURRENT':'Carry no weapon'}</small>
   </button>`,
  ...owned.map((w,i)=>{
   const info=WEAPONS[w.id]||{name:'Unknown Weapon',tier:'?'};
   const active=player.equipped_weapon===w.id;
   return `<button class="quick-pick ${active?'active':''}" data-action="quickWeaponEquip:${i}">
     <div><span class="quick-icon">${icon('weapon')}</span><strong>${escapeHtml(info.name)}</strong></div>
     <small>${active?'CURRENT':`Tier ${info.tier||'?'} · Condition ${w.condition??100}%`}</small>
    </button>`;
  })
 ].join('');
 return `<div class="quick-overlay">
  <div class="quick-panel">
   <div class="quick-head"><div><span>QUICK LOADOUT</span><strong>Choose Weapon</strong></div>${btn('✕','quickClose','','quick-close')}</div>
   <div class="quick-list">${items}</div>
  </div>
 </div>`;
}

function renderQuickVehiclePicker(){
 const owned=player.vehicles||[];
 const items=owned.map(id=>{
  const v=VEHICLES[id]||{name:'Unknown Ride',reliability:'?'};
  const active=player.active_vehicle===id;
  return `<button class="quick-pick ${active?'active':''}" data-action="quickVehicleEquip:${id}">
    <div><span class="quick-icon">${icon('ride')}</span><strong>${escapeHtml(v.name)}</strong></div>
    <small>${active?'CURRENT':`Reliability ${v.reliability??'?'}% · Storage ${v.storage??'?'}`}</small>
   </button>`;
 }).join('');
 return `<div class="quick-overlay">
  <div class="quick-panel">
   <div class="quick-head"><div><span>QUICK GARAGE</span><strong>Choose Ride</strong></div>${btn('✕','quickClose','','quick-close')}</div>
   <div class="quick-list">${items||'<div class="muted">No vehicles owned.</div>'}</div>
  </div>
 </div>`;
}

function openQuickPicker(type){
 const overlay=type==='weapon'?renderQuickWeaponPicker():renderQuickVehiclePicker();
 app().insertAdjacentHTML('beforeend',overlay);
}

function closeQuickPicker(){
 document.querySelector('.quick-overlay')?.remove();
}


function addActivity(text){
 if(!player)return;
 if(!Array.isArray(player.activity_log))player.activity_log=[];
 player.activity_log.unshift({day:player.day,time:formatTime(player.time),text:String(text)});
 player.activity_log=player.activity_log.slice(0,40);
}
function hustleRepeatInfo(id){
 const count=Math.max(0,Number(player.daily?.hustle_counts?.[id]||0));
 return{count,max:3,locked:count>=3,penalty:count*8};
}
function hustleChance(id,h){
 const r=hustleRepeatInfo(id);
 const heatHit=h.clean?player.heat*2:player.heat*4;
 return clamp(h.success-heatHit-r.penalty+Math.min(6,Math.floor(player.level/2)),25,97);
}
function renderHustles(){
 const items=Object.entries(SIDE_HUSTLES).map(([id,h])=>{
  const r=hustleRepeatInfo(id),locked=player.level<(h.requires_level||1)||r.locked;
  const why=player.level<(h.requires_level||1)?`Requires Level ${h.requires_level}`:r.locked?'Daily limit reached':'Take opportunity';
  const chance=hustleChance(id,h);
  return `<div class="job-card ${h.risk==='LOW'?'green':h.risk==='MEDIUM'?'yellow':h.risk==='HIGH'?'red':'black'}"><div class="job-banner"><span>${escapeHtml(h.name)}</span><span class="difficulty ${h.risk==='LOW'?'green':h.risk==='MEDIUM'?'yellow':h.risk==='HIGH'?'red':'black'}">${escapeHtml(h.risk)}</span></div><div class="job-metrics"><div><span>SUCCESS</span><strong>${chance}%</strong></div><div><span>PAYOUT</span><strong>${money(h.cash[0])}–${money(h.cash[1])}</strong></div><div><span>TIME</span><strong>${h.minutes[0]}–${h.minutes[1]}m</strong></div><div><span>USES TODAY</span><strong>${r.count}/3</strong></div></div>${r.count?`<div class="notice warning">Repeat pressure: -${r.penalty}% success on this opportunity today.</div>`:''}<div class="job-reqs"><span>${h.clean?'✅ Clean':'⚠️ Risky'}</span><span>Heat +${h.heat}★</span>${h.entry_cost?`<span>Up-front ${money(h.entry_cost)}</span>`:''}</div><div class="job-action">${btn(locked?'Locked':'Take Opportunity',`doHustle:${id}`,why,locked?'':'primary')}</div></div>`;
 }).join('');
 return `${back()}<div class="section-title">QUICK MOVES / HUSTLE BOARD</div><div class="card"><div class="muted">Small opportunities for when you need motion without taking a major job. The same hustle can be used up to 3 times per day; repeating it lowers your odds.</div></div><div class="job-list">${items}</div>`;
}
function performSideHustle(id){
 const h=SIDE_HUSTLES[id];if(!h)return;
 const r=hustleRepeatInfo(id);
 if(player.level<(h.requires_level||1)){result('LOCKED',[`Requires Level ${h.requires_level}.`]);return}
 if(r.locked){result('DAILY LIMIT',[`${h.name} has already been used 3 times today.`,'Try another opportunity or come back tomorrow.']);return}
 const cost=Math.max(0,Number(h.entry_cost||0));
 if(cost>player.cash_on_person){result('NOT ENOUGH CASH',[`You need ${money(cost)} on you to start this opportunity.`]);return}
 if(cost){player.cash_on_person-=cost;player.stats.total_expenses=(player.stats.total_expenses||0)+cost}
 const chance=hustleChance(id,h),elapsed=randInt(h.minutes[0],h.minutes[1]);
 player.daily.hustle_counts[id]=r.count+1;
 player.stats.side_hustles=(player.stats.side_hustles||0)+1;player.daily.hustles_completed=(player.daily.hustles_completed||0)+1;player.weekly.hustles=(player.weekly.hustles||0)+1;
 player.daily.moves_attempted=(player.daily.moves_attempted||0)+1;
 advanceTime(elapsed);if(screen==='result')return;
 if(randInt(1,100)<=chance){
  let payout=randInt(h.cash[0],h.cash[1]);
  if(cost)payout+=cost;
  player.cash_on_person+=payout;player.stats.total_earned=(player.stats.total_earned||0)+payout;
  player.xp+=h.xp||0;player.respect+=h.respect||0;player.heat=clamp(player.heat+(h.heat||0),0,5);
  player.daily.successes=(player.daily.successes||0)+1;player.stats.successful_moves=(player.stats.successful_moves||0)+1;
  const lines=[`Cash: +${money(payout)}`,`XP: +${h.xp||0}`];
  if(h.respect)lines.push(`Respect: +${h.respect}`);
  if(h.clean){player.clean_income=(player.clean_income||0)+payout;player.trap.attention=Math.max(0,player.trap.attention-3);if(player.heat>0&&Math.random()<.25){player.heat--;lines.push('Clean work cooled Heat: -1★')}lines.push('Trap Attention: -3%')}
  else if(h.heat)lines.push(`Heat: +${h.heat}★`);
  addSkillXP(h.clean?'endurance':'street',5);const lvl=updateLevel();if(lvl)lines.push(lvl);addActivity(`Completed ${h.name}`);result('QUICK MOVE COMPLETE',lines);
 }else{
  player.daily.failures=(player.daily.failures||0)+1;player.stats.failed_moves=(player.stats.failed_moves||0)+1;
  if(!h.clean)player.heat=clamp(player.heat+1,0,5);
  addActivity(`Failed ${h.name}`);result('QUICK MOVE FAILED',[h.clean?'The opportunity fell through. No payout.':'The opportunity went bad. No payout.',!h.clean?'Heat: +1★':'No Heat added.']);
 }
}
function renderActivityHistory(){
 const rows=(player.activity_log||[]).slice(0,30).map(x=>`<div class="item"><div class="item-head"><span>${escapeHtml(x.text||'Activity')}</span><span>Day ${escapeHtml(x.day||'?')}</span></div><div class="item-meta">${escapeHtml(x.time||'')}</div></div>`).join('');
 return `${back()}<div class="section-title">ACTIVITY HISTORY</div><div class="list">${rows||'<div class="card muted">No activity logged yet.</div>'}</div>`;
}

function renderStart(){
 return `<div class="card"><div class="section-title">START</div><div class="actions">
 ${hasSave()?btn('Continue Game','continue','','primary'):''}${btn('New Game','new','','primary')}
 ${btn('How To Play','howto','Learn the systems')}${btn('Patch Notes','patch','Full version history')}
 ${hasSave()?btn('Delete Save','deleteSave','Erase local browser save','danger'):''}</div></div>`;
}
function renderHome(){
 const late=player.time>=WARNING_TIME?`<div class="notice warning">${icon('alert')} LATE NIGHT — 2:00 AM is the danger window.</div>`:'';
 const hot=player.heat>=4?`<div class="notice danger">${icon('heat')} HIGH HEAT — odds, supplier prices and overnight risk are worse.</div>`:'';
 const ownerTools=fmBackend.isOwner?`<div class="section-title private-title">PRIVATE OWNER TOOLS</div><div class="menu-grid owner-grid">${menuCard(icon('owner'),'Owner Wallet',`Tax balance ${money(fmBackend.ownerBank?.balance||0)}`,'ownerWallet','owner')}${menuCard(icon('dashboard'),'Owner Dashboard','Private live game activity','ownerDashboard','owner')}</div>`:'';
 return `${late}${hot}<div class="section-title">CITY ACTIONS</div><div class="menu-grid">
 ${menuCard(icon('phone'),'Phone',PHONES[player.phone_id].name,'phone','phone')}
 ${menuCard(icon('jobs'),'Make a Move','Jobs, robberies & heists','moves','jobs')}
 ${menuCard('⚡','Quick Moves','Clean work & street hustles','hustles','jobs')}
 ${menuCard('💻','Scam Career',`Rep ${player.scam?.rep||0} · ${(player.scam?.gear||[]).length} tools`,'scamCareer','jobs')}
 ${menuCard('🪪','Licenses',`${player.licenses?.drivers?'Driver ✓':'Driver —'} · ${player.licenses?.carry?'Carry ✓':'Carry —'}`,'licenses','status')}
 ${menuCard('🚔','Police Pressure',`${stars(player.heat)} · ${player.warrants||0} warrant(s)`,'phoneAlerts','status')}
 ${menuCard(icon('street'),'Street Move','Move carried inventory','street','street')}
 ${menuCard(icon('supplier'),'Supplier','Contacts & inventory','supplier','supplier')}
 ${menuCard(icon('market'),'Black Market','Weapons, armor & phones','black','market')}
 ${menuCard(icon('crew'),'Crew','Recruit and manage crew','crew','crew')}
 ${menuCard(icon('playercrew'),'Player Crew',fmBackend.playerCrew?`${fmBackend.playerCrew.crew_name} · ${fmBackend.playerCrew.rank}`:'Create or join a crew','playerCrew','crew')}
 ${menuCard(icon('territory'),'Territories','Take zones from NPC gangs','territories','map')}
 ${menuCard(icon('map'),'City Map','Travel around the city','map','map')}
 ${menuCard(icon('garage'),'Garage','Vehicles & active ride','vehicles','garage')}
 ${menuCard(icon('property'),'Properties','Own multiple locations','properties','property')}
 ${menuCard(icon('stash'),'Trap Stash','Cash, inventory & weapons','stash','stash')}
 ${menuCard(icon('bank'),'Cash Reserve',`Protected cash ${money(player.bank_cash||0)}`,'bank','stash')}
 ${menuCard('💼','Employment',workJob()?`${workJob().company} · ${currentWorkTier()?.title||workJob().title}`:'Get a legit job','employment','status')}
 ${menuCard(icon('profile'),'Player Profile','Career stats & records','profile','status')}
 ${menuCard(icon('upgrade'),'Trap Upgrades','Security, storage, condition','upgrades','upgrade')}
 ${menuCard(icon('laylow'),'Lay Low','Reduce heat with time','laylow','laylow')}
 ${menuCard(icon('skills'),'Skills','Natural progression','skills','skills')}
 ${menuCard(icon('objectives'),'Objectives','Daily, weekly & progression goals','dailyWeekly','objectives')}
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
 <div style="margin-top:12px">${btn('Continue','resultContinue','','primary')}${btn('Main Menu','home','','back')}</div></div>`;
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
 const items=Object.entries(MOVES).map(([id,m])=>{const r=requirement(m),chance=successChance(m,id),d=difficulty(m),crewReq=m.requires_crew||0,wt=m.weapon_tier||0,repeats=jobRepeatCount(id),pay=currentMovePayout(id,m),spam=repeats?`<div class="notice warning">This move is getting hot · repeated ${repeats}× today · payout and odds reduced.</div>`:'';return `<div class="job-card ${d.key}"><div class="job-banner"><span>${escapeHtml(m.name)}</span><span class="difficulty ${d.key}">${d.label}</span></div><div class="job-metrics"><div><span>SUCCESS</span><strong>${chance}%</strong></div><div><span>PAYOUT</span><strong>${money(pay[0])}–${money(pay[1])}</strong></div><div><span>TIME</span><strong>${m.minutes[0]}–${m.minutes[1]}m</strong></div><div><span>HEAT</span><strong>+${m.heat}★</strong></div></div>${spam}${(prepBreakdown(m,id).crewBonus||prepBreakdown(m,id).gearBonus)?`<div class="notice good">PREP BONUS ACTIVE · Extra preparation is increasing your odds.</div>`:''}<div class="job-reqs"><span>📍 ${escapeHtml(LOCATIONS[m.location].name)}</span><span>${wt?`🔫 Tier ${wt}+`:'🔫 No weapon req.'}</span><span>👥 Crew ${crewReq}</span><span>❤️ ${player.health}/100</span></div><details class="odds-details"><summary>Why ${chance}%?</summary><div class="odds-box">${oddsBreakdownHtml(m,id)}<div class="odds-final"><span>FINAL</span><strong>${chance}%</strong></div></div></details>${r?`<div class="locked-banner">LOCKED · ${escapeHtml(r)}</div>`:''}<div class="job-action">${btn(r?'Locked':'Do Move',`doMove:${id}`,r?'Meet requirements first':'Attempt this move',r?'':'primary')}</div></div>`}).join('');
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
 return `${btn('← Suppliers','supplier','','back')}${cityTaxNote()}<div class="card"><div class="section-title">${name.toUpperCase()}</div><div class="muted">Cash: ${money(player.cash_on_person)} · City Tax ${Math.round(fmBackend.taxRate*100)}%</div>
 <label>Product</label><select id="buyDrug">${products.map(id=>{const p=supplierUnitPrice(id);return `<option value="${id}" data-price="${p}">${DRUGS[id].name} — ${money(p)}/game gram</option>`}).join('')}</select>
 <label>Amount (game grams)</label><input id="buyGrams" type="number" min="0.1" step="0.1" value="3.5"><div style="margin-top:10px">${btn('Buy','buyDrugGo','','primary')}</div></div>`;
}
function renderBlack(){return `${back()}<div class="section-title">BLACK MARKET</div><div class="actions">${btn('Weapons','weapons','Tier 1–5')}${btn('Armor','armor','Light → Elite')}${btn('Equip Gear','equip','Choose active gear')}${btn('Phone Shop','phoneShop','Upgrade your phone')}</div>`}
function renderWeapons(){return `${btn('← Black Market','black','','back')}${cityTaxNote()}<div class="list">${Object.entries(WEAPONS).map(([id,w])=>{const q=purchaseQuote(w.price);return `<div class="item"><div class="item-head"><span>${w.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Tier ${w.tier} · Power ${w.power} · Condition ${w.condition}% · City Tax ${money(q.tax)}</div>${btn('Buy',`buyWeapon:${id}`,'','primary')}</div>`}).join('')}</div>`}
function renderArmor(){return `${btn('← Black Market','black','','back')}${cityTaxNote()}<div class="list">${Object.entries(ARMOR).map(([id,a])=>{const q=purchaseQuote(a.price);return `<div class="item"><div class="item-head"><span>${a.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Tier ${a.tier} · Defense ${a.defense} · City Tax ${money(q.tax)}</div>${btn('Buy',`buyArmor:${id}`,'','primary')}</div>`}).join('')}</div>`}
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
function renderUpgrades(){if(player.location!=='trap')return `${back()}<div class="card">You need to be at your trap.</div>`;const opts=[['security',500*(player.trap.security+1)],['storage',400*(player.trap.storage+1)],['condition',300*(player.trap.condition+1)]];return `${back()}<div class="list">${opts.map(([k,c])=>{const q=purchaseQuote(c);return `<div class="item"><div class="item-head"><span>${k[0].toUpperCase()+k.slice(1)} ${player.trap[k]}/5</span><span>${money(q.total)}</span></div><div class="item-meta">Base ${money(c)} · City Tax ${money(q.tax)}</div>${btn(player.trap[k]>=5?'MAXED':'Upgrade',`upgrade:${k}`,player.trap[k]>=5?'':'Uses 60 minutes',player.trap[k]>=5?'':'primary')}</div>`}).join('')}</div>`}
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
 </div><div class="phone-dock"><div class="actions">${btn('Quick Moves','hustles','Hustle Board')}${btn('Patch Notes','patch','Version history')}${btn('Activity','activityHistory','Recent actions')}</div>${btn('Upgrade Phone','phoneShop',`Current tier ${ph.tier}`,'primary')}</div></div></div></div>`;
}

function renderPhoneAlerts(){
 const rows=(player.alerts||[]).map(a=>`<div class="item"><div class="item-head"><span>${escapeHtml(a.type)}</span><span>Day ${a.day}</span></div><div class="item-meta">${escapeHtml(a.time)} · ${escapeHtml(a.text)}</div></div>`).join('');
 return `${back()}<div class="card"><div class="section-title">CITY PRESSURE</div><div class="status-grid">${stat('Heat',stars(player.heat))}${stat('Warrants',player.warrants||0)}${stat('Pressure',`${Math.round(policePressure())}%`)}${stat('Trap Attention',`${player.trap.attention}%`)}</div><div class="muted">5★ never blocks a move. It means you are choosing to operate while police pressure is at its worst.</div></div><div class="section-title">ALERTS</div><div class="list">${rows||'<div class="card muted">No alerts yet.</div>'}</div>`;
}
function renderLicenses(){return `${back()}<div class="card"><div class="section-title">CITY LICENSES</div><div class="muted">Licenses do not stop illegal choices. They change what happens during police encounters.</div></div><div class="list">${Object.entries(LICENSES).map(([id,x])=>`<div class="item"><div class="item-head"><span>${escapeHtml(x.name)}</span><span>${player.licenses[id]?'ACTIVE':money(x.price)}</span></div><div class="item-meta">${escapeHtml(x.desc)}</div>${player.licenses[id]?'':btn('Get License',`buyLicense:${id}`,'','primary')}</div>`).join('')}</div>`}
function renderScamCareer(){const gear=Object.entries(SCAM_GEAR).map(([id,g])=>`<div class="item"><div class="item-head"><span>${escapeHtml(g.name)}</span><span>${hasScamGear(id)?'OWNED':money(g.price)}</span></div><div class="item-meta">Career tool · Tier ${g.tier}</div>${hasScamGear(id)?'':btn('Buy Tool',`buyScamGear:${id}`,'','primary')}</div>`).join('');const jobs=Object.entries(FRAUD_JOBS).map(([id,j])=>{const missing=j.req.filter(x=>!hasScamGear(x));const chance=clamp(j.success+(player.scam?.rep||0)*.35-player.heat*4,20,94);return `<div class="job-card ${j.tier>=4?'black':j.tier>=3?'red':j.tier>=2?'yellow':'green'}"><div class="job-banner"><span>${escapeHtml(j.name)}</span><span>TIER ${j.tier}</span></div><div class="job-metrics"><div><span>SUCCESS</span><strong>${Math.round(chance)}%</strong></div><div><span>PAYOUT</span><strong>${money(j.cash[0])}–${money(j.cash[1])}</strong></div><div><span>HEAT</span><strong>+${j.heat}★</strong></div><div><span>TIME</span><strong>${j.minutes[0]}–${j.minutes[1]}m</strong></div></div><div class="job-reqs"><span>${missing.length?'Missing: '+missing.map(x=>SCAM_GEAR[x].name).join(', '):'Equipment ready'}</span></div><div class="job-action">${btn('Run Play',`fraudJob:${id}`,missing.length?'Get required gear first':'Abstract fictional game roll',missing.length?'':'primary')}</div></div>`}).join('');return `${back()}<div class="card"><div class="hero-kicker">SCAM CAREER</div><h2>Digital & Paper Motion</h2><div class="muted">Build equipment, reputation and access. Jobs are fictionalized game abstractions—requirements, odds, payout, Heat and consequences.</div><div class="status-grid">${stat('Scam Rep',player.scam?.rep||0)}${stat('Career Jobs',player.scam?.jobs||0)}${stat('Tools',(player.scam?.gear||[]).length)}${stat('Heat',stars(player.heat))}</div></div><div class="section-title">CAREER JOBS</div><div class="job-list">${jobs}</div><div class="section-title">BLACK-MARKET TOOLS</div><div class="list">${gear}</div>`}
function renderDailyWeekly(){ensureObjectives();const daily=player.objective_state.daily.map(i=>{const o=DAILY_OBJECTIVE_POOL[i],done=o[1](player),key=`daily_${player.day}_${i}`,claimed=(player.objective_claims||[]).includes(key);return `<div class="item objective ${done?'done':''}"><div class="item-head"><span>${done?'✓':'○'} ${escapeHtml(o[0])}</span><span>${claimed?'CLAIMED':done?'READY':'ACTIVE'}</span></div>${done&&!claimed?btn('Claim $150 + 40 XP',`claimObj:daily:${i}`,'','good'):''}</div>`}).join('');const weekly=player.objective_state.weekly.map(i=>{const o=WEEKLY_OBJECTIVE_POOL[i],done=o[1](player),key=`weekly_${player.weekly.week}_${i}`,claimed=(player.objective_claims||[]).includes(key);return `<div class="item objective ${done?'done':''}"><div class="item-head"><span>${done?'✓':'○'} ${escapeHtml(o[0])}</span><span>${claimed?'CLAIMED':done?'READY':'ACTIVE'}</span></div>${done&&!claimed?btn('Claim $750 + 180 XP',`claimObj:weekly:${i}`,'','good'):''}</div>`}).join('');return `${back()}<div class="section-title">DAILY OBJECTIVES · DAY ${player.day}</div><div class="list">${daily}</div><div class="section-title">WEEKLY OBJECTIVES · WEEK ${player.weekly.week}</div><div class="list">${weekly}</div><div class="section-title">PROGRESSION</div>${renderObjectives().replace(back(),'')}`}

function renderPhoneShop(){
 const items=Object.entries(PHONES).filter(([id])=>id!==player.phone_id).map(([id,p])=>{const q=purchaseQuote(p.price),owned=PHONES[player.phone_id].tier>=p.tier;
 return `<div class="item"><div class="item-head"><span>${p.name}</span><span>Tier ${p.tier}</span></div><div class="item-meta">${p.apps.join(' · ')}<br>${owned?'Already below your current tier':`Price ${money(q.total)} · City Tax ${money(q.tax)}`}</div>${owned?'':btn('Buy / Activate',`buyPhone:${id}`,'','primary')}</div>`}).join('');
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
 return `${back()}<div class="card"><div class="section-title">YOUR GARAGE</div>${player.vehicles.map(id=>`<div class="item"><div class="item-head"><span>${VEHICLES[id].name}</span><span>${player.active_vehicle===id?'ACTIVE':'OWNED'}</span></div><div class="item-meta">Speed ${Math.round((1-VEHICLES[id].speed)*100)} · Storage ${VEHICLES[id].storage} · Condition ${Math.round(player.vehicle_condition?.[id]??VEHICLES[id].reliability)}%</div>${(player.vehicle_condition?.[id]??100)<95?btn('Repair',`repairVehicle:${id}`,`Estimated ${money(Math.max(20,Math.round((100-(player.vehicle_condition?.[id]??100))*8)))}`):''}${player.active_vehicle===id?'':btn('Set Active',`activeVehicle:${id}`)}</div>`).join('')}</div>
 <div class="section-title">VEHICLE MARKET</div><div class="list">${Object.entries(VEHICLES).filter(([id])=>!player.vehicles.includes(id)).map(([id,v])=>{const q=purchaseQuote(v.price);return `<div class="item"><div class="item-head"><span>${v.name}</span><span>${money(q.total)}</span></div><div class="item-meta">Speed ${Math.round((1-v.speed)*100)} · Storage ${v.storage} · Attention ${v.attention} · Reliability ${v.reliability}% · City Tax ${money(q.tax)}</div>${btn('Buy Vehicle',`buyVehicle:${id}`,'','primary')}</div>`}).join('')}</div>`;
}
function renderProperties(){
 return `${back()}<div class="card"><div class="section-title">OWNED LOCATIONS</div>${player.properties.map(id=>`<div class="item"><div class="item-head"><span>${PROPERTIES[id].name}</span><span>${PROPERTIES[id].type}</span></div><div class="item-meta">Storage +${PROPERTIES[id].storage} · Security +${PROPERTIES[id].security} · Status +${PROPERTIES[id].status} · Daily income ${money(PROPERTY_ECONOMY[id]?.income?.[0]||0)}–${money(PROPERTY_ECONOMY[id]?.income?.[1]||0)} · Upkeep ${money(PROPERTY_ECONOMY[id]?.upkeep||0)}</div></div>`).join('')}</div>
 <div class="section-title">PROPERTY MARKET</div><div class="list">${Object.entries(PROPERTIES).filter(([id])=>!player.properties.includes(id)).map(([id,p])=>{const q=purchaseQuote(p.price);return `<div class="item"><div class="item-head"><span>${p.name}</span><span>${money(q.total)}</span></div><div class="item-meta">${p.type} · Storage +${p.storage} · Security +${p.security} · Status +${p.status} · Income ${money(PROPERTY_ECONOMY[id]?.income?.[0]||0)}–${money(PROPERTY_ECONOMY[id]?.income?.[1]||0)}/day · Upkeep ${money(PROPERTY_ECONOMY[id]?.upkeep||0)}/day · City Tax ${money(q.tax)}</div>${btn('Buy Property',`buyProperty:${id}`,'','primary')}</div>`}).join('')}</div>`;
}


function myControlledZones(){const c=fmBackend.playerCrew;return !c?[]:(fmBackend.crewTerritories||[]).filter(t=>t.owner_crew_id===c.crew_id).map(t=>t.zone_key)}
function territoryBonusPercent(type){
 const zones=myControlledZones();let n=0;
 zones.forEach(id=>{
  const z=TERRITORY_ZONES[id];
  if(!z)return;
  if(type==='property'&&id==='apartments_zone')n+=z.bonus_value||0;
  if(type==='street'&&id==='southside')n+=z.bonus_value||0;
  if(type==='job'&&id==='restricted_zone')n+=z.bonus_value||0;
 });
 return n;
}

function workJob(){return player?.employment?.current_job?LEGIT_JOBS[player.employment.current_job]||null:null}
function currentWorkTier(job=workJob()){if(!job)return null;let t=job.promotions[0];for(const x of job.promotions)if((player.employment.shifts_worked||0)>=x.shifts)t=x;return t}
function nextWorkTier(job=workJob()){return job?job.promotions.find(x=>x.shifts>(player.employment.shifts_worked||0))||null:null}
function workShiftPay(job=workJob()){return currentWorkTier(job)?.pay||job?.base_pay||0}
function canClockIn(){
 const j=workJob();if(!j)return{ok:false,msg:'You do not have a job.'};
 if(player.equipped_weapon)return{ok:false,msg:'Management noticed the weapon. Unequip it before reporting to work.'};
 if(j.requires_vehicle&&!player.active_vehicle)return{ok:false,msg:'This job requires an active vehicle.'};
 if(player.employment.last_shift_day===player.day)return{ok:false,msg:'You already worked today.'};
 if(player.time<j.start-60)return{ok:false,msg:`Your shift does not start until ${formatTime(j.start)}.`};
 if(player.time>j.start+30)return{ok:false,msg:'You missed the 30-minute clock-in grace window for this shift.'};
 return{ok:true};
}
function workEvent(){const a=['Your manager noticed you actually showed up prepared.','A coworker called out. Of course they did.','Something broke and everybody stared at it.','A customer asked for the manager.','Nothing caught fire. Great shift.','Management discovered you own free time.'];return a[randInt(0,a.length-1)]}
function applyWorkMilestone(job,oldN,newN){const lines=[];for(const t of job.promotions)if(t.shifts>oldN&&t.shifts<=newN){if(t.bonus){player.employment.pending_pay+=t.bonus;lines.push(`Seniority bonus: +${money(t.bonus)} pending pay`)}if(t.shifts>0)lines.push(`Promotion: ${t.title} · ${money(t.pay)}/shift`)}return lines}
function paydayIfDue(){const e=player.employment;if(!e||e.pending_pay<=0)return[];if(!(player.day%7===6||player.day-e.last_payday_day>=7))return[];const a=Math.floor(e.pending_pay);player.bank_cash=(player.bank_cash||0)+a;player.stats.total_earned+=a;player.stats.legit_pay_earned=(player.stats.legit_pay_earned||0)+a;e.pending_pay=0;e.week_shifts=0;e.last_payday_day=player.day;player.messages.unshift({from:'Payroll',text:`Payday deposit: ${money(a)}.`,day:player.day});return[`PAYDAY: ${money(a)} deposited to Cash Reserve.`]}
function processMissedWorkDay(){const j=workJob();if(!j||player.employment.last_shift_day===player.day||player.time<j.start+j.duration)return[];player.employment.missed_shifts++;player.employment.writeups++;player.work_rep=Math.max(0,(player.work_rep||0)-2);const lines=[`MISSED SHIFT: ${j.company}`,`Write-ups: ${player.employment.writeups}/3`];if(player.employment.writeups>=3){player.employment.employment_history.unshift({company:j.company,title:currentWorkTier(j)?.title||j.title,shifts:player.employment.shifts_worked||0,status:'Fired'});player.messages.unshift({from:`${j.company} HR`,text:'After careful consideration, we have decided to promote you to customer.',day:player.day});player.employment.current_job=null;player.employment.writeups=0;player.employment.shifts_worked=0;lines.push('FIRED: Promoted to customer.')}return lines}
function streetTemptationMessage(){if(!workJob()||Math.random()>.35)return null;const a=['You really finna work 9 hours for that check? I got something faster.','That whole week check could be one good night. Hit me back.','HR got you working hard. The city pays different after dark.'];const t=a[randInt(0,a.length-1)];player.messages.unshift({from:'Unknown Number',text:t,day:player.day});return t}

function dailyExpenseEstimate(){
 let n=0;
 player.properties.forEach(id=>n+=(PROPERTY_ECONOMY[id]?.upkeep||0));
 player.vehicles.forEach(id=>n+=(VEHICLE_UPKEEP[id]||0));
 player.crew.forEach(id=>n+=(CREW_UPKEEP[id]||0));
 n+=(PHONE_UPKEEP[player.phone_id]||0);
 return Math.max(0,Math.floor(n));
}
function propertyIncomeEstimate(){
 let lo=0,hi=0;
 player.properties.forEach(id=>{const a=PROPERTY_ECONOMY[id]?.income||[0,0];lo+=a[0];hi+=a[1]});
 return [lo,hi];
}

function renderEmployment(){
 const e=player.employment,j=workJob();
 if(!j){
  const list=Object.entries(LEGIT_JOBS).map(([id,x])=>`<div class="employment-card"><div class="job-banner"><span>${escapeHtml(x.company)}</span><span class="difficulty green">LEGIT</span></div><div class="employment-copy"><strong>${escapeHtml(x.title)}</strong><p>${escapeHtml(x.description)}</p></div><div class="job-metrics"><div><span>START</span><strong>${formatTime(x.start)}</strong></div><div><span>SHIFT</span><strong>${Math.round(x.duration/60)} hrs</strong></div><div><span>PAY</span><strong>${money(x.base_pay)}</strong></div><div><span>PAYDAY</span><strong>Weekly</strong></div></div>${x.requires_vehicle?'<div class="notice warning">Requires an active vehicle.</div>':''}<div class="job-action">${btn('Take Job',`takeLegitJob:${id}`,'','primary')}</div></div>`).join('');
  return `${back()}<div class="section-title">EMPLOYMENT</div><div class="card corporate-card"><div class="hero-kicker">MOTIONWORKS CAREER PORTAL</div><h2>Find Your Next Underpaid Opportunity</h2><div class="muted">Legit work is safer, pays weekly, builds Work Rep and can cool Heat. Every shift begins at or after the 8:00 AM day start.</div></div><div class="employment-list">${list}</div>`;
 }
 const t=currentWorkTier(j),n=nextWorkTier(j),c=canClockIn();
 return `${back()}<div class="card corporate-card"><div class="hero-kicker">CURRENT EMPLOYER</div><h2>${escapeHtml(j.company)}</h2><div class="muted">${escapeHtml(t.title)} · ${money(workShiftPay(j))}/shift · Weekly payday</div></div><div class="dashboard-grid">${profileStat('Completed Shifts',e.shifts_worked)}${profileStat('Pending Pay',money(e.pending_pay))}${profileStat('Work Rep',player.work_rep||0)}${profileStat('Write-ups',`${e.writeups}/3`)}</div><div class="card"><div class="section-title">NEXT SHIFT</div><div class="status-grid">${stat('Starts',formatTime(j.start))}${stat('Ends',formatTime(j.start+j.duration))}${stat('Length',`${Math.round(j.duration/60)} hours`)}</div><div class="notice ${c.ok?'good':'warning'}">${escapeHtml(c.ok?'You can clock in now.':c.msg)}</div>${player.equipped_weapon?btn(player.active_vehicle&&player.active_vehicle!=='bicycle'?`Leave Weapon in ${vehicleName()}`:'Unequip Weapon for Work','stowWeaponForWork','Keeps the weapon in your inventory but removes it from your active loadout','good'):''}${btn('CLOCK IN','clockInLegit','',c.ok?'primary':'')}</div><div class="card"><div class="section-title">SENIORITY</div><div class="item-meta">${n?`${n.shifts-e.shifts_worked} more shifts until ${n.title} · ${money(n.pay)}/shift${n.bonus?` · ${money(n.bonus)} bonus`:''}`:'Top promotion reached.'}</div></div><div class="card"><div class="section-title">COMPANY POLICY</div><div class="result-line">No equipped weapons while clocked in.</div><div class="result-line">Three write-ups can get you fired.</div><div class="result-line">Pay is deposited weekly.</div>${btn('Quit Job','quitLegitJob','','danger')}</div>`;
}

function renderBank(){
 const inc=propertyIncomeEstimate(),up=dailyExpenseEstimate();
 return `${back()}<div class="card"><div class="section-title">CASH RESERVE</div>
 <div class="status-grid">${stat('On Person',money(player.cash_on_person))}${stat('Trap Cash',money(player.trap.cash))}${stat('Protected Reserve',money(player.bank_cash||0))}${stat('Bills Due',money(player.bills_due||0))}</div>
 <div class="muted" style="margin-top:10px">Reserve cash is protected from carried-cash arrest, robbery and hospital losses. Deposits and withdrawals are handled from your trap.</div></div>
 <div class="card"><div class="section-title">DAILY ECONOMY</div>
 <div class="status-grid">${stat('Estimated Upkeep',money(up))}${stat('Property Income',`${money(inc[0])}–${money(inc[1])}`)}</div>
 <div class="muted" style="margin-top:8px">Higher-tier property can earn passive income, but vehicles, phones, crew and property create daily upkeep.</div></div>
 <div class="card"><div class="section-title">MOVE CASH</div>
 <input id="bankAmount" type="number" min="1" step="1" value="100">
 <div class="actions" style="margin-top:10px">${btn('Deposit From Pocket','bankDeposit','','primary')}${btn('Withdraw To Pocket','bankWithdraw')}${player.bills_due>0?btn('Pay Bills','payBills',`Due ${money(player.bills_due)}`,'good'):''}</div></div>`;
}
function favoriteMove(){
 const entries=Object.entries(player.stats.job_counts||{});
 if(!entries.length)return 'None yet';
 entries.sort((a,b)=>b[1]-a[1]);
 return MOVES[entries[0][0]]?.name||'Unknown';
}
function winRate(){
 const total=(player.stats.successful_moves||0)+(player.stats.failed_moves||0);
 return total?Math.round((player.stats.successful_moves||0)/total*100):0;
}
function renderProfile(){
 const s=stageInfo();
 return `${back()}<div class="profile-hero card"><div class="profile-badge">FM</div><div><div class="hero-kicker">PLAYER PROFILE</div><h2>${escapeHtml(player.name)}</h2><div class="muted">${escapeHtml(s.name)} · ${escapeHtml(s.title)} · Level ${player.level}</div></div></div>
 <div class="section-title">CAREER</div><div class="dashboard-grid">
 ${profileStat('Net Worth',money(totalNetWorth()))}
 ${profileStat('Total Earned',money(player.stats.total_earned||0))}
 ${profileStat('Biggest Score',money(player.stats.biggest_score||0))}
 ${profileStat('Success Rate',`${winRate()}%`)}
 ${profileStat('Successful Moves',player.stats.successful_moves||0)}
 ${profileStat('Failed Moves',player.stats.failed_moves||0)}
 ${profileStat('Arrests',player.stats.arrests||0)}
 ${profileStat('Hospital Visits',player.stats.hospital_visits||0)}
 ${profileStat('Days Survived',player.stats.days_survived||1)}
 ${profileStat('Highest Heat',`${player.stats.highest_heat||0}★`)}
 ${profileStat('Favorite Move',favoriteMove())}
 ${profileStat('Achievements',`${player.achievements.length}/${Object.keys(ACHIEVEMENTS).length}`)}
 </div>
 <div class="section-title">CITY LIFE</div><div class="dashboard-grid">
 ${profileStat('Current Job',workJob()?`${workJob().company} · ${currentWorkTier()?.title||workJob().title}`:'Unemployed')}
 ${profileStat('Work Rep',player.work_rep||0)}
 ${profileStat('Legit Shifts',player.stats.legit_shifts||0)}
 ${profileStat('Legit Pay Earned',money(player.stats.legit_pay_earned||0))}
 ${profileStat('Protected Reserve',money(player.bank_cash||0))}
 ${profileStat('Property Income',money(player.stats.total_property_income||0))}
 ${profileStat('Lifetime Expenses',money(player.stats.total_expenses||0))}
 ${profileStat('Random Events',player.stats.random_events||0)}
 ${profileStat('Properties',player.properties.length)}
 ${profileStat('Vehicles',player.vehicles.length)}
 ${profileStat('Crew',player.crew.length)}
 ${profileStat('Respect',player.respect)}
 </div>`;
}
function profileStat(label,value){return `<div class="dash-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`}

function renderHowTo(){return `${btn('← Start','start','','back')}<div class="card"><div class="section-title">HOW TO PLAY</div><div class="result-lines">
 <div class="result-line">Every action uses in-game time. Start at 8:00 AM and watch the 2:00 AM danger window.</div>
 <div class="result-line">Jobs now show 🟢 / 🟡 / 🔴 / ⚫ readiness based on your actual character and current heat.</div>
 <div class="result-line">All robberies require a weapon. Bigger jobs require stronger weapon tiers, crew and level.</div>
 <div class="result-line">Heat runs 0–5 stars. High heat does not stop play, but it makes the city harder. Use Lay Low to cool off.</div>
 <div class="result-line">Skills level naturally. Titles require a mix of level, respect and net worth.</div>
 <div class="result-line">Federal Motion is a long-term status, not an ending. Keep playing afterward.</div>
 <div class="result-line">Cloud saves and online stat syncing are active when CLOUD ONLINE appears.</div>
 <div class="result-line">City Life: reserve cash protects money from carried-cash losses. Property can create income, while crew, vehicles, phones and property create daily upkeep.</div>
 <div class="result-line">Unpaid bills carry forward. Random city events can help or hurt at the end of each day.</div>
 </div></div>`}

const TUTORIAL_STEPS=[
 {title:'WELCOME TO FEDERAL MOTION',text:'This first run is protected. Tutorial actions are freebies so you can learn the city without getting arrested, hurt or losing your starter progress.',tip:'Your real risk begins after the walkthrough.'},
 {title:'CHECK YOUR PHONE',text:'Your phone carries jobs, alerts, objectives, market information and city navigation. Better phones unlock more apps.',tip:'Check Alerts when Heat or warrants start climbing.'},
 {title:'GET YOUR FIRST MOTION',text:'Quick Moves are your starter lane. Clean work builds money with low pressure; risky lanes pay more but bring consequences.',tip:'The tutorial assumes your first starter hustle succeeds.'},
 {title:'PROTECT YOUR MONEY',text:'Cash on you can be exposed during bad outcomes. Your trap stash and Cash Reserve are safer places to keep progress.',tip:'Do not carry everything into a high-risk move.'},
 {title:'WORK A CLEAN SHIFT',text:'Employment gives scheduled clean income, Work Rep, promotions and a way to cool Heat. Shifts start no earlier than the 8:00 AM game day.',tip:'Clock in unarmed and within the grace window.'},
 {title:'HEAT & POLICE',text:'Heat never locks you out. Traffic stops can escalate into searches, warrants, surveillance, raids and arrests. Licenses change some stop outcomes.',tip:'At 5★ you can still make the move—you are accepting the pressure.'},
 {title:'SCAM CAREER',text:'The scam lane works like another career tree. Buy fictional black-market tools, build Scam Rep and unlock higher-tier abstract plays.',tip:'The game uses fictional requirements and chance rolls, not real-world instructions.'},
 {title:'END THE DAY',text:'Return to your trap, review the city report and sleep. Daily events, bills, property income, work and police pressure can all change overnight.',tip:'Get home before the danger window when you can.'},
 {title:'YOU ARE READY',text:'Your protected introduction is complete. Build your own route through legit work, street motion, crews, properties, vehicles, territories and the scam career.',tip:'There is no single correct path.'}
]
function renderTutorial(){
 const i=clamp(Number(player?.tutorial?.step||0),0,TUTORIAL_STEPS.length-1),t=TUTORIAL_STEPS[i];
 return `<div class="card tutorial-card"><div class="hero-kicker">NEW PLAYER WALKTHROUGH · ${i+1}/${TUTORIAL_STEPS.length}</div><h2>${escapeHtml(t.title)}</h2><div class="tutorial-copy">${escapeHtml(t.text)}</div><div class="notice good">TIP: ${escapeHtml(t.tip)}</div><div class="actions">${i>0?btn('← Back','tutorialPrev','','back'):''}${btn(i===TUTORIAL_STEPS.length-1?'ENTER THE CITY →':'Next →','tutorialNext','','primary')}</div></div>`;
}
function renderWhatsNew(){
 const og=player.og_reward_eligible&&!player.og_reward_claimed?`<div class="card og-card"><div class="hero-kicker">MESSAGE FROM THE OWNER</div><h2>YOU SURVIVED THE EARLY BUILDS 😂</h2><div class="tutorial-copy">You made it through the ugly builds, broken buttons, questionable balance and whatever the hell Alpha was doing back then. Appreciate you being here through the first waves of Federal Motion. $10,000 is waiting for you. Enjoy it. Spend wisely. Or don’t. I already know how y’all play.</div>${btn('CLAIM $10,000 OG BONUS','claimOgReward','','good')}</div>`:'';
 return `<div class="card tutorial-card"><div class="hero-kicker">NEW IN ALPHA 0.8.1</div><h2>FLOW FIX</h2><div class="result-lines"><div class="result-line">🚔 Heat now escalates into traffic stops, searches, warrants, surveillance, raids and arrests. 5★ never blocks a move.</div><div class="result-line">🪪 Driver and carry licenses now affect police encounters.</div><div class="result-line">💻 Scam Career is now a progression lane with equipment, reputation and higher-tier fictional plays.</div><div class="result-line">📱 Phone Alerts track police pressure, work, city events and important changes.</div><div class="result-line">🎯 Daily + weekly objectives now pay claimable rewards.</div><div class="result-line">🚗 Vehicle reliability/repair and deeper property benefits are part of city progression.</div></div><div class="actions">${btn('SHOW WALKTHROUGH','whatsNewTutorial','','back')}${btn('ENTER CITY','whatsNewDone','','primary')}</div></div>${og}`;
}
const PATCH_NOTES_HISTORY=[
 {version:'Alpha 0.8.1',title:'FLOW FIX',notes:['Escalating police pressure: stops, searches, warrants, raids and arrests','Driver and carry licenses','Scam Career equipment + reputation progression','Phone alerts','Daily and weekly objectives','Vehicle reliability and property utility','One-time OG appreciation reward for returning players']},
 {
  version:'Alpha 0.7',
  title:'CITY SYSTEMS + TUTORIAL UPDATE',
  notes:[
   'NEW: Full first-time player walkthrough plus one-time What’s New alerts for returning players.',
   'BALANCE: Legit job schedules now align with the 8:00 AM game-day start.',
   'BALANCE: Legit base pay, promotion pay and milestone bonuses increased.',
   'NEW: Legit shifts can cool Heat and consistent attendance can earn bonus pay.',
   'NEW: Quick Moves include clean side work, street opportunities and fictional scam/fraud plays.',
   'NEW: Same Quick Move can be used up to 3 times per day; repeats reduce success odds.',
   'NEW: Activity History records recent Quick Move results.',
   'RESTORED: Alpha 0.5 Employment, crews, territory, City Life, phone tiers, vehicles, properties, skills, achievements and owner systems remain intact.',
   'RESTORED: economy, cloud sync, upkeep/bills, and progression systems remain intact.',
   'SAVE: Existing v2 and legacy v1 browser saves continue to migrate forward.'
  ]
 },
 {
  version:'Alpha 0.5',
  title:'EMPLOYMENT & LEGIT HUSTLES',
  notes:[
   'NEW: Scheduled legitimate jobs with named fictional employers.',
   'NEW: 8–9 hour shifts with modest entry-level pay and weekly payday.',
   'NEW: Players must unequip weapons before clocking in.',
   'NEW: Completed shifts build seniority, Work Rep and promotion progress.',
   'NEW: Raises and bonuses unlock at 20, 40, 60 and 100 completed shifts.',
   'NEW: Missed shifts create write-ups and repeated attendance problems can get players fired.',
   'NEW: Workplace events, overtime, employer messages and sarcastic HR notifications.',
   'NEW: Employment history and legit-career stats are tracked.',
   'NEW: Street-side messages can tempt employed players with faster risky money.'
  ]
 },

 {
  version:'Alpha 0.5',
  title:'CREWS & TERRITORY',
  notes:[
   'NEW: Online player crews can now be created or joined.',
   'NEW: Crews support public or invite-only joining with a 10-member cap.',
   'NEW: Crew ranks include Boss, Underboss, Lieutenant and Member.',
   'NEW: Crew HQ shows members, crew reputation, invite code and a shared crew bank.',
   'NEW: Six NPC-controlled territories can be challenged for influence.',
   'NEW: Territory battles use player progression, gear, health and crew readiness.',
   'NEW: Controlled zones grant gameplay bonuses while your crew holds them.',
   'NEW: Former NPC gangs build retake pressure after losing control.',
   'NEW: Territory defense battles can protect a controlled zone.',
   'NEW: Hold rewards unlock at 2, 4 and 6 days.',
   'NEW: Hold rewards visibly show signature-product rewards and rare weapon-drop chances.',
   'NEW: Territory battles use cooldowns so zone control cannot be spammed.'
  ]
 },
 {
  version:'Alpha 0.4',
  title:'PREP & RISK',
  notes:[
   'NEW: Over-preparing can improve success odds through extra crew and stronger weapon tiers.',
   'NEW: Job cards show a success-chance breakdown so players can see what is helping or hurting their odds.',
   'NEW: Risk confirmation appears before dangerous moves.',
   'NEW: Risk warnings show carried cash, gear and possible consequences before committing.',
   'NEW: Very high-odds failures are labeled as rare failures instead of looking like a bug.',
   'FIX: Crew payout sharing is capped so successful high-risk jobs remain worthwhile.',
   'BALANCE: Extra crew can improve preparation without consuming nearly the entire score.'
  ]
 },
 {
  version:'Alpha 0.4',
  title:'CITY LIFE',
  notes:[
   'NEW: Cash Reserve lets players protect money instead of carrying everything.',
   'NEW: Daily upkeep applies to vehicles, phones, crew and properties.',
   'NEW: Income-producing properties can generate passive income.',
   'NEW: Unpaid bills carry forward until paid.',
   'NEW: Random city events can happen as days pass.',
   'NEW: Player Profile tracks career records, economy stats and progression.',
   'NEW: Refreshing the game returns players to the start screen while preserving their save.',
   'NEW: Refreshes request the newest game files to reduce stale mobile caching.'
  ]
 },
 {
  version:'Alpha 0.3',
  title:'ECONOMY & CONSEQUENCES',
  notes:[
   'BALANCE: Early-game payouts were reduced so progression takes longer.',
   'BALANCE: Repeating the same move lowers payout and success odds.',
   'BALANCE: Repeating jobs builds additional heat and pressure.',
   'BALANCE: High heat has a much stronger effect on success odds.',
   'BALANCE: Failed moves can lead to arrest, especially at high heat.',
   'BALANCE: Jail and hospital consequences were made more serious.',
   'BALANCE: Street-sale income was reduced to prevent bypassing the slower economy.',
   'NEW: Weapon and ride HUD slots can be tapped to quickly switch equipped gear.',
   'POLISH: HUD quick-switch controls keep the same visual style as the other HUD slots.'
  ]
 },
 {
  version:'Alpha 0.3',
  title:'UI UPDATE',
  notes:[
   'NEW: Full HUD redesign with visual health, XP, respect and heat meters.',
   'NEW: Gritty street / trap-phone visual style across the game.',
   'NEW: Redesigned phone screens that visually improve with phone tier.',
   'NEW: Large visual menu cards and cleaner navigation.',
   'NEW: Rebuilt job cards showing success %, payout, time, heat, weapon tier, crew and location.',
   'NEW: Improved alerts, status presentation and progression visibility.',
   'POLISH: Better spacing, mobile layout, panel styling and feedback states.'
  ]
 }
];

function renderPatchNotes(){
 const sections=PATCH_NOTES_HISTORY.map((release,idx)=>`
  <div class="card patch-release">
   <div class="result-title">${escapeHtml(release.version)} — ${escapeHtml(release.title)}</div>
   <div class="result-lines">${release.notes.map(n=>`<div class="result-line">${escapeHtml(n)}</div>`).join('')}</div>
  </div>`).join('');
 return `${btn('← Start','start','','back')}
 <div class="card"><div class="hero-kicker">FEDERAL MOTION CHANGELOG</div><div class="muted">Latest updates are shown first. This history only contains public player-facing changes.</div></div>
 ${sections}`;
}

function renderOwnerWallet(){
 if(!fmBackend.isOwner)return `${back()}<div class="card">Owner access required.</div>`;
 const b=fmBackend.ownerBank||{balance:0,total_tax_collected:0,total_tax_events:0,player_losses_collected:0,player_loss_events:0,upkeep_bills_collected:0,upkeep_bill_events:0};
 return `${back()}<div class="section-title private-title">PRIVATE OWNER WALLET</div>
 <div class="dashboard-grid">
  <div class="dash-card"><span>SPENDABLE BALANCE</span><strong>${money(b.balance||0)}</strong></div>
  <div class="dash-card"><span>LIFETIME MOTION TAX</span><strong>${money(b.total_tax_collected||0)}</strong></div>
  <div class="dash-card"><span>PLAYER LOSSES COLLECTED</span><strong>${money(b.player_losses_collected||0)}</strong></div>
  <div class="dash-card"><span>UPKEEP & BILLS COLLECTED</span><strong>${money(b.upkeep_bills_collected||0)}</strong></div>
  <div class="dash-card"><span>TAX EVENTS</span><strong>${Number(b.total_tax_events||0).toLocaleString()}</strong></div>
  <div class="dash-card"><span>PLAYER LOSS EVENTS</span><strong>${Number(b.player_loss_events||0).toLocaleString()}</strong></div>
  <div class="dash-card"><span>UPKEEP/BILL EVENTS</span><strong>${Number(b.upkeep_bill_events||0).toLocaleString()}</strong></div>
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


function renderPlayerCrew(){
 const c=fmBackend.playerCrew;
 if(!fmBackend.ready)return `${back()}<div class="card">Crew network requires CLOUD ONLINE.</div>`;
 if(!c){
  const publics=(fmBackend.publicCrews||[]).map(x=>`<div class="item"><div class="item-head"><span>${escapeHtml(x.emblem||'◆')} ${escapeHtml(x.crew_name)} [${escapeHtml(x.tag)}]</span><span>${x.member_count}/${CREW_MAX_MEMBERS}</span></div><div class="item-meta">Crew Rep ${x.crew_rep||0} · Zones ${x.zones_controlled||0}</div>${x.member_count<CREW_MAX_MEMBERS?btn('Join Crew',`joinPublicCrew:${x.crew_id}`,'','primary'):''}</div>`).join('');
  return `${back()}
  <div class="section-title">PLAYER CREWS</div>
  <div class="card"><div class="hero-kicker">CREATE A CREW</div>
   <label>Crew Name</label><input id="crewName" maxlength="24" placeholder="Crew name">
   <label>Tag</label><input id="crewTag" maxlength="5" placeholder="FM">
   <label>Visibility</label><select id="crewVisibility"><option value="public">Public</option><option value="invite">Invite Only</option></select>
   <label>Emblem</label><select id="crewEmblem">${CREW_EMBLEMS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select>
   <label>Color</label><select id="crewColor">${CREW_COLORS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select>
   ${btn('Create Crew','createPlayerCrew','','primary')}
  </div>
  <div class="card"><div class="hero-kicker">JOIN BY INVITE CODE</div><input id="crewInviteCode" maxlength="8" placeholder="Invite code">${btn('Join Invite Crew','joinInviteCrew','','primary')}</div>
  <div class="section-title">PUBLIC CREWS</div><div class="list">${publics||'<div class="muted">No public crews yet. You can be first.</div>'}</div>`;
 }

 const members=(c.members||[]).map(m=>`<div class="item"><div class="item-head"><span>${escapeHtml(m.player_name||'Player')}</span><span>${escapeHtml(m.rank||'Member')}</span></div><div class="item-meta">Lv ${m.level||1} · Respect ${m.respect||0}${m.user_id===fmBackend.user?.id?' · YOU':''}</div></div>`).join('');
 const controlled=(fmBackend.crewTerritories||[]).filter(t=>t.owner_crew_id===c.crew_id);
 return `${back()}
 <div class="crew-hero card"><div class="crew-emblem">${escapeHtml(c.emblem||'◆')}</div><div><div class="hero-kicker">CREW HQ</div><h2>${escapeHtml(c.crew_name)} <span class="muted">[${escapeHtml(c.tag)}]</span></h2><div class="muted">${escapeHtml(c.rank)} · ${c.member_count}/${CREW_MAX_MEMBERS} members · Rep ${c.crew_rep||0}</div></div></div>
 <div class="dashboard-grid">
  ${profileStat('Crew Bank',money(c.crew_bank||0))}
  ${profileStat('Zones Controlled',controlled.length)}
  ${profileStat('Crew Rep',c.crew_rep||0)}
  ${profileStat('Invite Code',c.invite_code||'—')}
 </div>
 <div class="card"><div class="section-title">CREW BANK</div><input id="crewBankAmount" type="number" min="1" step="1" value="100"><div class="actions">${btn('Deposit From Reserve','crewBankDeposit','','primary')}${crewRankCanWithdraw(c.rank)?btn('Withdraw To Reserve','crewBankWithdraw','','good'):''}</div><div class="muted" style="margin-top:8px">All members can deposit. Boss and Underboss can withdraw.</div></div>
 <div class="section-title">CONTROLLED TERRITORY</div><div class="list">${controlled.map(t=>territoryMiniCard(t)).join('')||'<div class="muted">Your crew does not control a zone yet.</div>'}</div>
 <div class="section-title">MEMBERS</div><div class="list">${members}</div>
 <div class="card">${btn('View Territory Map','territories','','primary')}${c.rank!=='Boss'?btn('Leave Crew','leavePlayerCrew','','danger'):''}</div>`;
}
function territoryMiniCard(t){
 const z=TERRITORY_ZONES[t.zone_key]||{};
 return `<div class="item"><div class="item-head"><span>${escapeHtml(z.name||t.zone_name||t.zone_key)}</span><span>${t.hold_days||0}d held</span></div><div class="item-meta">${escapeHtml(z.bonus||'Zone bonus')} · Retake pressure ${t.retake_pressure||0}%</div>${btn('Open Zone',`territory:${t.zone_key}`)}</div>`;
}
function renderTerritories(){
 if(!fmBackend.ready)return `${back()}<div class="card">Territories require CLOUD ONLINE.</div>`;
 const cards=Object.entries(TERRITORY_ZONES).map(([id,z])=>{
  const t=(fmBackend.crewTerritories||[]).find(x=>x.zone_key===id)||{};
  const owner=t.owner_crew_name||z.gang;
  const owned=!!(fmBackend.playerCrew&&t.owner_crew_id===fmBackend.playerCrew.crew_id);
  return `<button class="territory-card ${owned?'owned':''}" data-action="territory:${id}">
   <div class="territory-top"><div><span>${escapeHtml(z.district)}</span><strong>${escapeHtml(z.name)}</strong></div><div class="territory-control">${owned?'YOUR CREW':'CONTROLLED BY'}<strong>${escapeHtml(owner)}</strong></div></div>
   <div class="territory-meter"><i style="width:${clamp(t.influence||0,0,100)}%"></i></div>
   <div class="territory-meta"><span>Difficulty ${z.difficulty}</span><span>Influence ${t.influence||0}%</span><span>${owned?`${t.hold_days||0}d held`:'NPC/Rival Control'}</span></div>
   <div class="territory-bonus">${escapeHtml(z.bonus)}</div>
  </button>`;
 }).join('');
 return `${back()}<div class="section-title">CITY TERRITORIES</div><div class="card"><div class="muted">Create or join a player crew, build influence through territory battles, then hold zones for bonuses and rewards. Former NPC gangs build retake pressure after losing control.</div></div><div class="territory-grid">${cards}</div>`;
}
function nextHoldReward(holdDays,claimed){
 const milestones=[2,4,6];
 for(const m of milestones)if(holdDays<m||!(claimed||[]).includes(m))return m;
 return 6;
}
function territoryRewardText(zone,day){
 const d=DRUGS[zone.signature_drug]?.name||'Signature Product';
 if(day===2)return `7g ${d} · 5% rare weapon chance · Crew Rep`;
 if(day===4)return `14g ${d} · 10% rare weapon chance · Crew Rep`;
 return `28g (1 oz) ${d} · 18% rare weapon chance · Major Crew Rep`;
}
function renderTerritoryDetail(){
 const id=payload?.zoneKey,z=TERRITORY_ZONES[id];
 if(!z)return `${back()}<div class="card">Unknown territory.</div>`;
 const t=(fmBackend.crewTerritories||[]).find(x=>x.zone_key===id)||{};
 const c=fmBackend.playerCrew;
 const owned=!!(c&&t.owner_crew_id===c.crew_id);
 const npcOwned=!t.owner_crew_id;
 const cooldown=t.cooldown_minutes||0;
 const hold=t.hold_days||0,claimed=t.claimed_milestones||[];
 const rewardRows=[2,4,6].map(day=>{
  const got=claimed.includes(day);
  return `<div class="reward-step ${got?'claimed':''}"><div><span>HOLD ${day} DAYS</span><strong>${escapeHtml(territoryRewardText(z,day))}</strong></div><span>${got?'CLAIMED':hold>=day&&owned?'READY':'LOCKED'}</span></div>`;
 }).join('');
 const weaponNames=z.weapon_pool.map(w=>WEAPONS[w]?.name||w).join(' / ');
 let action='';
 if(!c)action='<div class="notice warning">Join or create a player crew before fighting for territory.</div>';
 else if(owned){
  action=`<div class="notice good">YOUR CREW CONTROLS THIS ZONE · ${escapeHtml(z.bonus)}</div>
   ${t.retake_pressure>=35?`<div class="notice warning">⚠️ ${escapeHtml(z.gang)} is rebuilding pressure. Retake pressure: ${t.retake_pressure}%.</div>`:''}
   ${t.retake_pressure>=45?btn('Defend Territory',`defendTerritory:${id}`,cooldown?`Battle cooldown ${cooldown}m`:'',cooldown?'':'danger'):''}
   ${[2,4,6].some(d=>hold>=d&&!claimed.includes(d))?btn('Claim Hold Reward',`claimTerritoryReward:${id}`,'','good'):''}`;
 }else{
  action=`<div class="notice ${npcOwned?'':'warning'}">${npcOwned?`${escapeHtml(z.gang)} currently controls this block.`:`Another player crew controls this zone.`}</div>
  ${btn('Battle For Influence',`battleTerritory:${id}`,cooldown?`Battle cooldown ${cooldown}m`:'',cooldown?'':'danger')}`;
 }
 return `${back()}<div class="territory-detail card">
  <div class="territory-title"><div><span>${escapeHtml(z.district)}</span><h2>${escapeHtml(z.name)}</h2></div><div class="gang-badge">${escapeHtml(t.owner_crew_name||z.gang)}</div></div>
  <div class="territory-meter big"><i style="width:${clamp(t.influence||0,0,100)}%"></i></div>
  <div class="dashboard-grid">
   ${profileStat('Control',t.owner_crew_name||z.gang)}
   ${profileStat('Influence',`${t.influence||0}%`)}
   ${profileStat('Hold Streak',`${hold} days`)}
   ${profileStat('Retake Pressure',`${t.retake_pressure||0}%`)}
  </div>
  <div class="section-title">CONTROL BONUS</div><div class="notice good">${escapeHtml(z.bonus)} while your crew controls this area. Holding longer also unlocks the reward track below.</div>
  <div class="section-title">NPC GANG</div><div class="item-meta">${escapeHtml(z.gang)} · Difficulty ${z.difficulty} · Signature product: ${escapeHtml(DRUGS[z.signature_drug]?.name||z.signature_drug)}</div>
  <div class="section-title">HOLD REWARDS</div><div class="reward-track">${rewardRows}</div>
  <div class="muted" style="margin-top:8px">Rare weapon pool: ${escapeHtml(weaponNames)}. Rewards are shown before you fight so there are no hidden drops.</div>
  <div class="section-title">READINESS</div><div class="dashboard-grid">${profileStat('Battle Power',localBattlePower())}${profileStat('Health',`${player.health}/100`)}${profileStat('Weapon',weaponName())}${profileStat('NPC Crew',`${player.crew.length} hired`)}</div>
  <div class="territory-actions">${action}</div>
 </div>`;
}

function renderLeaderboard(){return `${back()}<div class="card"><div class="section-title">ONLINE LEADERBOARD</div><div id="leaderboardBox" class="muted">Loading rankings…</div></div>`}

function travelTime(base){const v=VEHICLES[player.active_vehicle]||VEHICLES.bicycle;return Math.max(10,Math.floor(base*v.speed))}
function travelTo(id){if(id===player.location)return{ok:true};const mins=travelTime(LOCATIONS[id].travel);player.location=id;addSkillXP('driving',Math.max(2,Math.floor(mins/20)));return advanceTime(mins)}
function advanceTime(mins){player.time+=mins;if(player.time>=DAY_END){lateNightEvent();return{ok:false,late:true}}return{ok:true}}
function combatPower(){let p=player.level*3+skillLevel('combat')*2;if(player.equipped_weapon)p+=WEAPONS[player.equipped_weapon].power;if(player.equipped_armor)p+=Math.floor(ARMOR[player.equipped_armor].defense/2);player.crew.forEach(id=>p+=CREW[id].combat);p+=Math.floor(player.respect/3);return p}
function jobRepeatCount(id){return Math.max(0,Number(player.daily?.job_counts?.[id]||0))}
function movePressure(){return Math.max(0,Number(player.daily?.moves_attempted||0))}
function heatPenalty(){return [0,5,12,20,30,42][clamp(player.heat,0,5)]}
function repeatPenalty(id){return Math.min(24,jobRepeatCount(id)*8)}
function fatiguePenalty(){return Math.min(18,Math.max(0,movePressure()-3)*3)}
function currentMovePayout(id,m){
 const repeats=jobRepeatCount(id);
 const mult=Math.max(.5,1-repeats*.15);
 return [Math.max(1,Math.floor(m.cash[0]*mult)),Math.max(1,Math.floor(m.cash[1]*mult))];
}
function prepBreakdown(m,id=''){
 const reqCrew=m.requires_crew||0;
 const extraCrew=Math.max(0,player.crew.length-reqCrew);
 const crewBonus=Math.min(12,extraCrew*4);

 const reqTier=m.weapon_tier||0;
 const equippedTier=player.equipped_weapon?(WEAPONS[player.equipped_weapon]?.tier||0):0;
 const gearBonus=reqTier>0?Math.min(8,Math.max(0,equippedTier-reqTier)*4):0;

 const levelBonus=Math.min(10,Math.floor(player.level*1.5));
 const respectBonus=Math.min(6,Math.floor(player.respect/4));
 const streetBonus=skillLevel('street');
 const heatLoss=heatPenalty();
 const repeatLoss=repeatPenalty(id);
 const fatigueLoss=fatiguePenalty();

 let combatAdj=0;
 if(m.combat){
  const e=(m.enemy[0]+m.enemy[1])/2;
  combatAdj=Math.floor((combatPower()-e)*.5);
 }

 return {
  base:m.base_success,
  crewBonus,
  gearBonus,
  levelBonus,
  respectBonus,
  streetBonus,
  combatAdj,
  heatLoss,
  repeatLoss,
  fatigueLoss
 };
}
function successChance(m,id=''){
 const b=prepBreakdown(m,id);
 let c=b.base+b.crewBonus+b.gearBonus+b.levelBonus+b.respectBonus+b.streetBonus+b.combatAdj-b.heatLoss-b.repeatLoss-b.fatigueLoss+territoryBonusPercent('job');
 return clamp(Math.round(c),5,95)
}
function oddsBreakdownHtml(m,id=''){
 const b=prepBreakdown(m,id);
 const rows=[
  ['Base',b.base],
  ...(b.crewBonus?[['Extra Crew',b.crewBonus]]:[]),
  ...(b.gearBonus?[['Better Gear',b.gearBonus]]:[]),
  ...(b.levelBonus?[['Level',b.levelBonus]]:[]),
  ...(b.respectBonus?[['Respect',b.respectBonus]]:[]),
  ...(b.streetBonus?[['Street Smarts',b.streetBonus]]:[]),
  ...(b.combatAdj?[['Combat Prep',b.combatAdj]]:[]),
  ...(b.heatLoss?[['Heat',-b.heatLoss]]:[]),
  ...(b.repeatLoss?[['Repeat Pressure',-b.repeatLoss]]:[]),
  ...(b.fatigueLoss?[['Fatigue',-b.fatigueLoss]]:[])
 ];
 return rows.map(([label,val])=>`<div class="odds-row"><span>${escapeHtml(label)}</span><strong class="${val<0?'bad':'good-text'}">${val>=0?'+':''}${val}%</strong></div>`).join('');
}
function riskItemsForMove(m){
 const risks=[];
 if(player.cash_on_person>0)risks.push(`Cash on person: ${money(player.cash_on_person)}`);
 if(player.equipped_weapon)risks.push(`Weapon: ${WEAPONS[player.equipped_weapon]?.name||'Equipped weapon'}`);
 if(player.equipped_armor)risks.push(`Armor: ${ARMOR[player.equipped_armor]?.name||'Equipped armor'}`);
 if(m.combat)risks.push('Health / hospital');
 if(m.heat>0)risks.push('Arrest / jail time');
 return risks;
}

function requirement(m){if(player.level<(m.requires_level||1))return `Requires Level ${m.requires_level}`;if(m.requires_weapon&&!player.equipped_weapon)return 'Weapon required';if(m.weapon_tier&&currentWeaponTier()<m.weapon_tier)return `Requires Weapon Tier ${m.weapon_tier}+`;if(player.crew.length<(m.requires_crew||0))return `Requires ${m.requires_crew} crew member(s)`;return''}
function result(title,lines,returnTo=null){
 const origin=(returnTo || actionOriginScreen || (screen && screen!=='result' ? screen : 'home'));
 checkAchievements();
 saveGame();
 screen='result';
 payload={title,lines,returnTo:origin};
 render();
}

function performMove(id){
 const m=MOVES[id],r=requirement(m);if(r){result('LOCKED',[r]);return}
 if(!player.daily.job_counts)player.daily.job_counts={};
 if(!Number.isFinite(player.daily.moves_attempted))player.daily.moves_attempted=0;

 const repeatsBefore=jobRepeatCount(id);
 const chance=successChance(m,id);
 const payRange=currentMovePayout(id,m);

 travelTo(m.location);if(screen==='result')return;
 advanceTime(randInt(...m.minutes));if(screen==='result')return;

 player.daily.job_counts[id]=repeatsBefore+1;
 player.daily.moves_attempted++;
 player.stats.job_counts[id]=(player.stats.job_counts[id]||0)+1;
 player.stats.moves++;
 addSkillXP(m.combat?'combat':'street',m.combat?16:8);
 addSkillXP('endurance',5);

 // Repeated jobs create extra attention. After the third attempt, every repeat adds extra heat pressure.
 if(repeatsBefore>=2){
  player.heat=clamp(player.heat+1,0,5);
  player.trap.attention=clamp(player.trap.attention+6,0,100);
 }

 if(randInt(1,100)<=chance){
  let gross=randInt(...payRange);
  const rawCrewPct=player.crew.reduce((sum,cid)=>sum+(Number(CREW[cid]?.cut)||0),0);
  // Extra crew helps the job, but total crew share is capped so over-prepping
  // never makes a successful score feel worse than failing.
  const crewPctCap=player.crew.length?40:0;
  const effectiveCrewPct=Math.min(rawCrewPct,crewPctCap);
  const cut=Math.floor(gross*effectiveCrewPct/100);
  let payout=Math.max(0,gross-cut);

  player.cash_on_person+=payout;
  player.stats.total_earned+=payout;
  player.stats.biggest_score=Math.max(player.stats.biggest_score||0,payout);
  player.xp+=m.xp;
  player.respect+=m.respect;

  const heatGain=m.heat+(repeatsBefore>=2?1:0)+(player.heat>=4&&m.heat>0?1:0);
  player.heat=clamp(player.heat+heatGain,0,5);
  player.trap.attention=clamp(player.trap.attention+m.heat*6+repeatsBefore*2,0,100);
  player.stats.successful_moves++;
  player.daily.successes++;

  let lines=[`Cash: +${money(payout)}`,`XP: +${m.xp}`,`Respect: +${m.respect}`];
  if(cut)lines.push(`Crew cuts paid: ${money(cut)} (${effectiveCrewPct}% of score)`);
  if(heatGain)lines.push(`Heat: +${heatGain}★`);
  if(repeatsBefore>=1)lines.push('Repeated move pressure reduced the payout and odds.');

  if(id==='house_hit'&&Math.random()<.22){
   const b=randInt(25,90);
   player.cash_on_person+=b;
   player.stats.total_earned+=b;
   lines.push(`Extra score: +${money(b)}`);
  }
  if(id==='rival_trap'&&Math.random()<.65){
   const d=Object.keys(DRUGS)[randInt(0,Object.keys(DRUGS).length-1)],
         g=Math.round((2+Math.random()*10)*10)/10;
   player.carried_drugs[d]+=g;
   lines.push(`Loot: ${g.toFixed(1)}g ${DRUGS[d].name}`);
  }

  // At very high heat, even a successful move can trigger immediate pressure.
  const postBustChance=(player.heat>=4 ? 5+(player.heat-4)*8+m.heat*3 : 0);
  if(postBustChance>0 && randInt(1,100)<=postBustChance){
   lines.push('You got the score, but the pressure caught up immediately.');
   result('MOVE SUCCESSFUL — PRESSURE SPIKE',lines);
   saveGame();
   arrestEvent();
   return;
  }

  const lvl=updateLevel();if(lvl)lines.push(lvl);
  result('MOVE SUCCESSFUL',lines);
 }else{
  player.stats.failed_moves++;
  player.daily.failures++;
  const x=Math.max(8,Math.floor(m.xp/5));
  player.xp+=x;
  let lines=[`XP from experience: +${x}`];

  const failHeat=1+(m.heat>=2?1:0)+(repeatsBefore>=2?1:0);
  player.heat=clamp(player.heat+failHeat,0,5);
  player.trap.attention=clamp(player.trap.attention+8+m.heat*5,0,100);
  lines.push(`Heat: +${failHeat}★`);

  if(m.combat){
   let defense=player.equipped_armor?ARMOR[player.equipped_armor].defense:0,
       enemy=randInt(...m.enemy),
       dmg=Math.max(10,randInt(18,48)+Math.max(0,Math.floor(enemy/9)-Math.floor(defense/8)));
   player.health-=dmg;
   addSkillXP('endurance',12);
   if(player.health<=0){hospitalRespawn();return}
   lines.push(`Health: -${dmg}`);

   const bustChance=Math.min(70,8+player.heat*9+m.heat*6+repeatsBefore*5);
   if(randInt(1,100)<=bustChance){arrestEvent();return}
  }else{
   const bustChance=Math.min(35,player.heat*5+repeatsBefore*4);
   if(randInt(1,100)<=bustChance){arrestEvent();return}
  }

  result(chance>=90?'RARE FAILURE — BAD BREAK':'MOVE FAILED',chance>=90?['You were heavily favored, but the small failure chance hit.',...lines]:lines)
 }
}
function hospitalRespawn(){const cash=player.cash_on_person;player.cash_on_person=0;if(cash>0)queueOwnerLoss(cash,'hospital_downed');player.carried_drugs=emptyDrugInventory();let lost=null;if(player.equipped_weapon){lost=weaponName();const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null}const x=Math.min(player.xp,Math.max(75,Math.floor(player.xp*.15))),days=randInt(2,5);player.xp-=x;player.day+=days;player.time=DAY_START;player.location='hospital';player.health=65;player.stats.hospital_visits++;addSkillXP('endurance',25);resetDaily();result('YOU WENT DOWN',[`Cash lost from your person: ${money(cash)}`,'Carried inventory lost.',lost?`Weapon lost: ${lost}`:'No equipped weapon lost.',`XP lost: ${x}`,`Time passed: ${days} day(s)`,'Your trap stash and stored cash were untouched.'])}
function arrestEvent(){const days=randInt(4,12),cash=Math.floor(player.cash_on_person*(.50+Math.random()*.40));player.cash_on_person-=cash;if(cash>0)queueOwnerLoss(cash,'arrest_seizure');player.carried_drugs=emptyDrugInventory();if(player.equipped_weapon&&Math.random()<.75){const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null}player.day+=days;player.time=DAY_START;player.location='trap';player.heat=Math.max(1,player.heat-2);player.respect=Math.max(0,player.respect-randInt(1,4));player.stats.arrests++;resetDaily();generateMarket();result('BUSTED',[`Jail time: ${days} days`,`Cash seized: ${money(cash)}`,'Carried inventory seized.','Stored trap stash remains separate.'])}
function lateNightEvent(){const severity=Math.max(1,Math.floor((player.time-DAY_END)/30)+1),danger=Math.min(90,25+severity*10+player.heat*8);if(randInt(1,100)>danger){player.location='trap';forcedEndDay(['You got lucky and made it back.']);return}const o=['robbed','arrested','injured'][randInt(0,2)];if(o==='arrested'){arrestEvent();return}if(o==='robbed'){const c=player.cash_on_person;player.cash_on_person=0;if(c>0)queueOwnerLoss(c,'late_night_robbery');player.carried_drugs=emptyDrugInventory();player.location='trap';forcedEndDay([`Caught slipping after 2:00 AM.`,`Lost carried cash: ${money(c)}`,'Lost carried inventory.']);return}player.health-=randInt(25,55);if(player.health<=0){hospitalRespawn();return}player.location='trap';forcedEndDay([`You made it back hurt. Health: ${player.health}/100`])}
function totalTrapValue(){let v=player.trap.cash;Object.entries(player.trap.drug_stash).forEach(([id,g])=>v+=Math.floor(g*DRUGS[id].base_value));player.trap.weapons.forEach(x=>v+=WEAPONS[x.id]?.price||0);return v}
function overnightEventLines(){const s=player.trap.security,a=player.trap.attention,v=totalTrapValue();let risk=5+Math.floor(a/4)+player.heat*5+Math.min(20,Math.floor(v/1000))-s*6;risk=clamp(risk,3,70);if(randInt(1,100)>risk){player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return['Quiet night. Nothing major happened.']}const e=['robbery','pressure','damage'][randInt(0,2)],lines=[];if(e==='robbery'){lines.push('Somebody hit the trap overnight.');const loss=Math.min(player.trap.cash,randInt(0,Math.max(50,Math.floor(player.trap.cash/3)+1)));player.trap.cash-=loss;if(loss){queueOwnerLoss(loss,'trap_robbery');lines.push(`Cash stolen: ${money(loss)}`);}player.trap.condition=Math.max(0,player.trap.condition-1)}else if(e==='pressure'){player.heat=clamp(player.heat+1,0,5);lines.push('Heavy pressure overnight.','Heat: +1★')}else{player.trap.condition=Math.max(0,player.trap.condition-1);lines.push('Something got damaged at the trap.','Trap Condition: -1')}player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return lines}

function takeAvailableCash(amount){
 let need=Math.max(0,Math.floor(amount)),paid=0;
 const pocket=Math.min(need,player.cash_on_person);player.cash_on_person-=pocket;need-=pocket;paid+=pocket;
 const trap=Math.min(need,player.trap.cash);player.trap.cash-=trap;need-=trap;paid+=trap;
 const reserve=Math.min(need,player.bank_cash||0);player.bank_cash-=reserve;need-=reserve;paid+=reserve;
 return {paid,unpaid:need};
}
function collectPropertyIncome(){
 let total=0,lines=[];
 player.properties.forEach(id=>{
  const e=PROPERTY_ECONOMY[id],p=PROPERTIES[id];
  if(!e||!p||e.income[1]<=0)return;
  let amount=randInt(e.income[0],e.income[1]);
  if(player.trap.attention>=75)amount=Math.floor(amount*.65);
  if(player.bills_due>500)amount=Math.floor(amount*.8);
  const zoneBonus=territoryBonusPercent('property');if(zoneBonus>0)amount=Math.floor(amount*(1+zoneBonus/100));
  total+=amount;
  if(amount>0)lines.push(`${p.name}: +${money(amount)}`);
 });
 if(total>0){
  player.bank_cash=(player.bank_cash||0)+total;
  player.stats.total_property_income=(player.stats.total_property_income||0)+total;
  player.stats.total_earned=(player.stats.total_earned||0)+total;
 }
 return {total,lines};
}
function chargeDailyExpenses(){
 const amount=dailyExpenseEstimate();
 if(amount<=0)return{amount:0,paid:0,unpaid:0};
 const x=takeAvailableCash(amount);
 player.stats.total_expenses=(player.stats.total_expenses||0)+x.paid;
 if(x.paid>0)queueOwnerUpkeep(x.paid,'daily_upkeep');
 if(x.unpaid>0)player.bills_due=(player.bills_due||0)+x.unpaid;
 return {amount,paid:x.paid,unpaid:x.unpaid};
}
function cityLifeRandomEvent(){
 const roll=randInt(1,100);
 player.stats.random_events=(player.stats.random_events||0)+1;
 if(roll<=18){
  const a=randInt(25,90);
  player.bank_cash=(player.bank_cash||0)+a;
  player.stats.total_earned+=a;
  return [`CITY EVENT: A small legitimate side opportunity paid ${money(a)}.`,`Reserve: +${money(a)}`];
 }
 if(roll<=33 && player.vehicles.length>1){
  const a=randInt(20,85);
  const x=takeAvailableCash(a);
  player.stats.total_expenses+=x.paid;
  if(x.unpaid)player.bills_due+=x.unpaid;
  return [`CITY EVENT: Vehicle maintenance came due.`,`Cost: ${money(a)}${x.unpaid?` · ${money(x.unpaid)} added to bills`:''}`];
 }
 if(roll<=48 && player.properties.length>1){
  const a=randInt(25,110);
  const x=takeAvailableCash(a);
  player.stats.total_expenses+=x.paid;
  if(x.unpaid)player.bills_due+=x.unpaid;
  return [`CITY EVENT: Property maintenance hit unexpectedly.`,`Cost: ${money(a)}${x.unpaid?` · ${money(x.unpaid)} added to bills`:''}`];
 }
 if(roll<=62 && player.crew.length){
  player.respect+=1;
  return ['CITY EVENT: Crew morale is high after a quiet night.','Respect: +1'];
 }
 if(roll<=78){
  const cool=randInt(4,10);
  player.trap.attention=Math.max(0,player.trap.attention-cool);
  return [`CITY EVENT: The neighborhood stayed quiet.`,`Trap attention: -${cool}%`];
 }
 if(roll<=90){
  const pressure=randInt(5,12);
  player.trap.attention=clamp(player.trap.attention+pressure,0,100);
  return [`CITY EVENT: Extra attention around your property.`,`Trap attention: +${pressure}%`];
 }
 const a=randInt(40,140);
 player.bank_cash=(player.bank_cash||0)+a;
 player.stats.total_earned+=a;
 return [`CITY EVENT: Unexpected money came through from a property connection.`,`Reserve: +${money(a)}`];
}

function endDay(){
 if(player.location!=='trap'){result('CAN’T SLEEP YET',['Return to your trap before sleeping.']);return}
 const cashNow=player.cash_on_person+player.trap.cash+(player.bank_cash||0);
 const summary=[
  `Cash Change Before Bills: ${money(cashNow-player.daily.cash_start)}`,
  `XP Change: ${(player.xp-player.daily.xp_start>=0?'+':'')+(player.xp-player.daily.xp_start)}`,
  `Respect Change: ${(player.respect-player.daily.respect_start>=0?'+':'')+(player.respect-player.daily.respect_start)}`,
  `Heat Change: ${(player.heat-player.daily.heat_start>=0?'+':'')+(player.heat-player.daily.heat_start)}`,
  `Moves: ${player.daily.successes} successful / ${player.daily.failures} failed`,
  `Trap Attention: ${player.trap.attention}%`
 ];
 const missed=processMissedWorkDay();
 const payday=paydayIfDue();
 const temptation=streetTemptationMessage();
 const night=overnightEventLines();
 const income=collectPropertyIncome();
 const expenses=chargeDailyExpenses();
 const event=cityLifeRandomEvent();
 const police=policeCheck('Overnight police pressure');

 player.day++;
 player.time=DAY_START;
 player.location='trap';
 player.stats.days_survived++;
 if(player.heat>0&&Math.random()<.35)player.heat--;
 if(player.bills_due>=500&&player.day%3===0){
  player.respect=Math.max(0,player.respect-1);
  event.push('UNPAID BILLS: Your reputation took a small hit. Respect: -1');
 }
 generateMarket();
 resetDaily();

 const economy=[
  `Property Income: +${money(income.total)}`,
  ...income.lines,
  `Daily Upkeep: -${money(expenses.paid)}`,
  ...(expenses.unpaid?[`Unpaid Today: ${money(expenses.unpaid)}`,`Total Bills Due: ${money(player.bills_due)}`]:[]),
  `Protected Reserve: ${money(player.bank_cash||0)}`
 ];
 result(`DAY ${player.day} — CITY LIFE REPORT`,[
  ...summary,
  ...(missed.length?['--- WORK ---',...missed]:[]),
  ...(payday.length?['--- PAYDAY ---',...payday]:[]),
  ...(temptation?['--- PHONE ---',`Unknown Number: ${temptation}`]:[]),
  '--- PROPERTY & BILLS ---',
  ...economy,
  '--- NIGHT REPORT ---',
  ...night,
  '--- CITY EVENT ---',
  ...event,
  ...(police.length?['--- POLICE PRESSURE ---',...police]:[]),
  `Heat: ${stars(player.heat)}`,
  'The city is moving again.'
 ])
}

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
 if(action==='new'){const name=prompt('Enter player name:','Player')||'Player';player=newPlayer(name);player.tutorial={step:0,completed:false,seen_version:''};generateMarket();resetDaily();saveGame();screen='tutorial';payload=null;render();return}
 if(action==='continue'){player=loadGame();if(!player){screen='start';render();return}if(player.tutorial?.seen_version!=='Alpha 0.8'&&!player.og_reward_claimed)player.og_reward_eligible=true;screen=player.tutorial?.seen_version==='Alpha 0.8'?'home':'whatsnew';render();return}
 if(action==='deleteSave'){if(confirm('Delete your Federal Motion local save?')){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(LEGACY_SAVE_KEY);player=null;screen='start';render()}return}
 if(action==='start'){screen='start';render();return}
 if(action==='home'){screen='home';payload=null;render();return}
 if(action==='resultContinue'){
  const dest=payload?.returnTo||actionOriginScreen||'home';
  screen=dest;
  payload=null;
  render();
  return;
 }
 if(action==='tutorialPrev'){player.tutorial.step=Math.max(0,(player.tutorial.step||0)-1);saveGame();screen='tutorial';render();return}
 if(action==='tutorialNext'){if((player.tutorial.step||0)>=TUTORIAL_STEPS.length-1){player.tutorial.completed=true;player.tutorial.seen_version='Alpha 0.8';saveGame();screen='home';render();return}player.tutorial.step=(player.tutorial.step||0)+1;saveGame();screen='tutorial';render();return}
 if(action==='whatsNewTutorial'){player.tutorial.step=0;screen='tutorial';render();return}
 if(action==='whatsNewDone'){player.tutorial.seen_version='Alpha 0.8';saveGame();screen='home';render();return}
 const direct=['moves','hustles','street','supplier','black','weapons','armor','equip','crew','map','stash','bank','employment','profile','playerCrew','territories','upgrades','hospital','status','market','phone','objectives','achievements','skills','laylow','vehicles','properties','howto','tutorial','whatsnew','patch','activityHistory','leaderboard','licenses','scamCareer','phoneAlerts','dailyWeekly','ownerWallet','ownerDashboard'];
 if(direct.includes(action)){screen=action;payload=null;render();if(action==='leaderboard')setTimeout(loadLeaderboard,0);if(action==='ownerDashboard')setTimeout(loadOwnerDashboard,0);if(action==='playerCrew'||action==='territories')refreshCrewWorld().then(()=>render());return}
 if(action==='phoneShop'){screen='phoneShop';payload=null;app().innerHTML=header()+renderPhoneShop()+`<div class="footer-note">Local + cloud save active.</div>`;return}
 if(action==='phoneMessages'){app().innerHTML=header()+renderMessages()+`<div class="footer-note">Local + cloud save active.</div>`;return}
 if(action==='phoneAlerts'){app().innerHTML=header()+renderAlerts()+`<div class="footer-note">Local + cloud save active.</div>`;return}
 if(action==='save'){saveGame();result('GAME SAVED',['Local save updated.','Cloud sync requested.']);return}
 if(action.startsWith('doHustle:')){performSideHustle(action.split(':')[1]);return}
 if(action==='ownerWithdraw'){
  const amount=Math.floor(Number($('#ownerWithdrawAmount')?.value||0));
  if(amount<=0){result('OWNER WALLET',['Enter a valid amount.']);return}
  withdrawOwnerFunds(amount).then(r=>{
   if(!r.ok){result('OWNER WALLET',[r.error||'Withdrawal failed.']);return}
   result('OWNER WITHDRAWAL',[`Owner Wallet: -${money(amount)}`,`Player Cash: +${money(amount)}`,`Owner Wallet Remaining: ${money(r.new_balance)}`]);
  });
  return;
 }
 if(action==='quickWeapon'){openQuickPicker('weapon');return}
 if(action==='quickVehicle'){openQuickPicker('vehicle');return}
 if(action==='quickClose'){closeQuickPicker();return}
 if(action.startsWith('quickWeaponEquip:')){
  const choice=action.split(':')[1];
  if(choice==='none'){
   player.equipped_weapon=null;
  }else{
   const i=Number(choice);
   if(Number.isInteger(i)&&player.weapon_inventory[i])player.equipped_weapon=player.weapon_inventory[i].id;
  }
  saveGame();
  closeQuickPicker();
  render();
  return;
 }
 if(action.startsWith('quickVehicleEquip:')){
  const id=action.slice('quickVehicleEquip:'.length);
  if(player.vehicles.includes(id))player.active_vehicle=id;
  saveGame();
  closeQuickPicker();
  render();
  return;
 }

 if(action.startsWith('territory:')){
  payload={zoneKey:action.split(':')[1]};
  screen='territoryDetail';
  refreshCrewWorld().then(()=>render());
  return
 }
 if(action==='createPlayerCrew'){
  const name=($('#crewName')?.value||'').trim(),tag=($('#crewTag')?.value||'').trim().toUpperCase(),visibility=$('#crewVisibility')?.value||'public',emblem=$('#crewEmblem')?.value||'◆',color=$('#crewColor')?.value||'Green';
  if(name.length<3||tag.length<2){result('CREW CREATION',['Crew name must be at least 3 characters and tag at least 2.']);return}
  crewRpc('fm_create_crew',{p_name:name,p_tag:tag,p_visibility:visibility,p_emblem:emblem,p_color:color}).then(r=>{
   if(!r.ok){result('CREW CREATION',[r.error]);return}
   result('CREW CREATED',[`${name} [${tag}] is live.`,`Invite code: ${Array.isArray(r.data)?r.data[0]?.invite_code:r.data?.invite_code||'Created'}`]);
  });return
 }
 if(action.startsWith('joinPublicCrew:')){
  const crewId=action.split(':')[1];
  crewRpc('fm_join_public_crew',{p_crew_id:crewId}).then(r=>r.ok?result('CREW JOINED',['You joined the crew.']):result('CREW JOIN',[r.error]));
  return
 }
 if(action==='joinInviteCrew'){
  const code=($('#crewInviteCode')?.value||'').trim().toUpperCase();
  if(!code)return;
  crewRpc('fm_join_crew_by_code',{p_code:code}).then(r=>r.ok?result('CREW JOINED',['Invite accepted. Welcome to the crew.']):result('CREW JOIN',[r.error]));
  return
 }
 if(action==='leavePlayerCrew'){
  if(!confirm('Leave this player crew?'))return;
  crewRpc('fm_leave_crew').then(r=>r.ok?result('LEFT CREW',['You left the player crew.']):result('CREW',[r.error]));
  return
 }
 if(action==='crewBankDeposit'||action==='crewBankWithdraw'){
  const amount=Math.max(0,Math.floor(Number($('#crewBankAmount')?.value||0)));
  if(!amount)return;
  if(action==='crewBankDeposit'){
   const actual=Math.min(amount,player.bank_cash||0);
   if(actual<=0){result('CREW BANK',['You have no protected reserve cash to deposit.']);return}
   crewRpc('fm_crew_bank_deposit',{p_amount:actual}).then(r=>{
    if(!r.ok){result('CREW BANK',[r.error]);return}
    player.bank_cash-=actual;saveGame();result('CREW BANK',[`Deposited ${money(actual)} from your protected reserve.`]);
   });return
  }else{
   crewRpc('fm_crew_bank_withdraw',{p_amount:amount}).then(r=>{
    if(!r.ok){result('CREW BANK',[r.error]);return}
    player.bank_cash=(player.bank_cash||0)+amount;saveGame();result('CREW BANK',[`Withdrew ${money(amount)} into your protected reserve.`]);
   });return
  }
 }
 if(action.startsWith('battleTerritory:')||action.startsWith('defendTerritory:')){
  const id=action.split(':')[1],z=TERRITORY_ZONES[id];
  if(!player.equipped_weapon){result('TERRITORY BATTLE',['Equip a weapon before entering a territory battle.']);return}
  const defend=action.startsWith('defendTerritory:');
  const power=localBattlePower();
  crewRpc(defend?'fm_defend_territory':'fm_battle_territory',{p_zone_key:id,p_player_power:power}).then(r=>{
   if(!r.ok){result('TERRITORY BATTLE',[r.error]);return}
   const d=Array.isArray(r.data)?r.data[0]:r.data;
   const lines=[
    `Your Battle Power: ${power}`,
    `Opponent Power: ${d?.opponent_power||z.difficulty}`,
    `${d?.won?'WIN':'LOSS'} · Influence ${d?.influence_change>=0?'+':''}${d?.influence_change||0}%`,
    d?.captured?'YOUR CREW TOOK CONTROL OF THE ZONE.':'',
    d?.defended?'Territory defense held. Rival pressure dropped.':'',
    d?.crew_rep_gain?`Crew Rep: +${d.crew_rep_gain}`:''
   ].filter(Boolean);
   if(!d?.won){
    const dmg=randInt(8,24);player.health=Math.max(1,player.health-dmg);lines.push(`Health: -${dmg}`);
    if(Math.random()<.12&&player.equipped_weapon){
     const lost=player.equipped_weapon,idx=player.weapon_inventory.findIndex(x=>x.id===lost);
     if(idx>=0){player.weapon_inventory.splice(idx,1);player.equipped_weapon=null;lines.push(`Weapon lost: ${WEAPONS[lost]?.name||lost}`)}
    }
   }else{
    player.respect+=2;player.xp+=45;lines.push('Respect: +2','XP: +45');
   }
   saveGame();
   result(d?.won?'TERRITORY BATTLE WON':'TERRITORY BATTLE LOST',lines);
  });return
 }
 if(action.startsWith('claimTerritoryReward:')){
  const id=action.split(':')[1],z=TERRITORY_ZONES[id];
  crewRpc('fm_claim_territory_reward',{p_zone_key:id}).then(r=>{
   if(!r.ok){result('HOLD REWARD',[r.error]);return}
   const d=Array.isArray(r.data)?r.data[0]:r.data;
   if(d?.drug_id&&d?.grams>0){
    player.trap.drug_stash[d.drug_id]=(player.trap.drug_stash[d.drug_id]||0)+Number(d.grams);
   }
   if(d?.weapon_id){
    player.trap.weapons.push({id:d.weapon_id,condition:100});
   }
   if(d?.personal_cash>0)player.bank_cash=(player.bank_cash||0)+Number(d.personal_cash);
   saveGame();
   const lines=[
    `Hold milestone: Day ${d?.milestone||'?'}`,
    d?.drug_id?`${Number(d.grams).toFixed(1)}g ${DRUGS[d.drug_id]?.name||d.drug_id} added to your trap stash.`:'',
    d?.weapon_id?`RARE DROP: ${WEAPONS[d.weapon_id]?.name||d.weapon_id} added to your trap stash.`:'No rare weapon drop this time.',
    d?.crew_rep_gain?`Crew Rep: +${d.crew_rep_gain}`:''
   ].filter(Boolean);
   result('TERRITORY HOLD REWARD',lines);
  });return
 }

 if(action==='stowWeaponForWork'){if(player.equipped_weapon){player.equipped_weapon=null;saveGame()}screen='employment';payload=null;render();return}
 if(action.startsWith('takeLegitJob:')){const id=action.split(':')[1],j=LEGIT_JOBS[id];if(!j)return;player.employment={...player.employment,current_job:id,shifts_worked:0,week_shifts:0,writeups:0,missed_shifts:0,last_shift_day:0};player.messages.unshift({from:`${j.company} HR`,text:`Welcome aboard. First shift starts at ${formatTime(j.start)}. Try not to make us regret this.`,day:player.day});saveGame();result('YOU GOT THE JOB',[`${j.company} · ${j.title}`,`Shift: ${formatTime(j.start)}–${formatTime(j.start+j.duration)}`,`Starting pay: ${money(j.base_pay)}/shift`,`Payday: weekly`,`Report to work unarmed.`],'employment');return}
 if(action==='quitLegitJob'){const j=workJob();if(!j)return;player.employment.employment_history.unshift({company:j.company,title:currentWorkTier(j)?.title||j.title,shifts:player.employment.shifts_worked,status:'Quit'});player.employment.current_job=null;saveGame();result('JOB ENDED',[`You quit ${j.company}.`,`Pending pay remains scheduled for payday.`],'employment');return}
 if(action==='clockInLegit'){const j=workJob(),c=canClockIn();if(!c.ok){result('CAN’T CLOCK IN',[c.msg]);return}const oldN=player.employment.shifts_worked,pay=workShiftPay(j);player.time=j.start;advanceTime(j.duration);player.location='trap';player.employment.last_shift_day=player.day;player.employment.shifts_worked++;player.employment.week_shifts++;player.employment.pending_pay+=pay;player.stats.legit_shifts=(player.stats.legit_shifts||0)+1;player.daily.legit_shifts=(player.daily.legit_shifts||0)+1;player.weekly.legit_shifts=(player.weekly.legit_shifts||0)+1;player.daily.earned=(player.daily.earned||0)+pay;player.weekly.earned=(player.weekly.earned||0)+pay;player.work_rep=(player.work_rep||0)+1;addSkillXP(j.skill,6);const lines=[`${j.company} · ${currentWorkTier(j).title}`,`Shift completed: ${Math.round(j.duration/60)} hours`,`Pending pay: +${money(pay)}`,`Total pending pay: ${money(player.employment.pending_pay)}`,`Work Rep: ${player.work_rep}`,`WORKPLACE: ${workEvent()}`,...applyWorkMilestone(j,oldN,player.employment.shifts_worked)];if(player.heat>0){player.heat=Math.max(0,player.heat-1);player.daily.heat_reduced=(player.daily.heat_reduced||0)+1;player.weekly.heat_reduced=(player.weekly.heat_reduced||0)+1;lines.push('Clean income cooled Heat: -1★')}if(player.employment.week_shifts>0&&player.employment.week_shifts%5===0){const attendance=Math.max(25,Math.round(pay*.5));player.employment.pending_pay+=attendance;lines.push(`Attendance bonus: +${money(attendance)} pending pay`)}if(Math.random()<.18){player.employment.pending_pay+=18;advanceTime(180);lines.push('OVERTIME: +$18 pending pay · +3 hours')}streetTemptationMessage();saveGame();result('SHIFT COMPLETE',lines,'employment');return}
 if(action==='claimOgReward'){if(player.og_reward_eligible&&!player.og_reward_claimed){player.cash_on_person+=10000;player.stats.total_earned+=10000;player.og_reward_claimed=true;addActivity('Claimed Alpha 0.8 OG appreciation bonus');saveGame();result('OG BONUS CLAIMED',['From the owner: appreciate you riding through the early waves. 😂','Cash: +$10,000','Enjoy it. Spend wisely. Or don’t.'])}return}
 if(action.startsWith('buyLicense:')){const id=action.split(':')[1],x=LICENSES[id];if(!x||player.licenses[id])return;if(player.cash_on_person<x.price){result('LICENSE OFFICE',[`Need ${money(x.price)}.`]);return}player.cash_on_person-=x.price;player.licenses[id]=true;saveGame();result('LICENSE ISSUED',[x.name,`Cost: -${money(x.price)}`],'licenses');return}
 if(action.startsWith('buyScamGear:')){const id=action.split(':')[1],g=SCAM_GEAR[id];if(!g||hasScamGear(id))return;const c=taxedPurchase(g.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`],'scamCareer');return}player.scam.gear.push(id);saveGame();result('TOOL ACQUIRED',[g.name,`Total: -${money(c.total)}`],'scamCareer');return}
 if(action.startsWith('fraudJob:')){const id=action.split(':')[1],j=FRAUD_JOBS[id];if(!j)return;const missing=j.req.filter(x=>!hasScamGear(x));if(missing.length){result('EQUIPMENT REQUIRED',[...missing.map(x=>SCAM_GEAR[x].name)],'scamCareer');return}const chance=clamp(j.success+(player.scam.rep||0)*.35-player.heat*4,20,94);advanceTime(randInt(...j.minutes));if(screen==='result')return;player.scam.jobs++;player.daily.fraud_jobs=(player.daily.fraud_jobs||0)+1;player.weekly.fraud_jobs=(player.weekly.fraud_jobs||0)+1;if(randInt(1,100)<=chance){const pay=randInt(...j.cash);player.cash_on_person+=pay;player.stats.total_earned+=pay;player.daily.earned=(player.daily.earned||0)+pay;player.weekly.earned=(player.weekly.earned||0)+pay;player.scam.rep+=randInt(2,5);player.heat=clamp(player.heat+j.heat,0,5);const police=policeCheck('Scam career');saveGame();result('PLAY HIT',[`${j.name}: +${money(pay)}`,`Scam Rep: ${player.scam.rep}`,`Heat: +${j.heat}★`,...police],'scamCareer')}else{player.heat=clamp(player.heat+j.heat,0,5);const police=policeCheck('Failed scam career job');saveGame();result('PLAY BURNED',[`${j.name} failed.`,`Heat: +${j.heat}★`,...police],'scamCareer')}return}
 if(action.startsWith('claimObj:')){const [,kind,idx]=action.split(':');claimObjective(kind,Number(idx));return}
 if(action==='sleep'){endDay();return}
 if(action.startsWith('doMove:')){
  const id=action.split(':')[1],m=MOVES[id],r=m?requirement(m):'Move unavailable';
  if(r){result('LOCKED',[r]);return}
  payload={moveId:id};
  screen='moveConfirm';
  render();
  return
 }
 if(action.startsWith('confirmMove:')){
  const id=action.split(':')[1];
  payload=null;
  performMove(id);
  return
 }
 if(action.startsWith('supplier:')){const n=action.split(':')[1];if((n==='Doc'&&player.respect<3)||(n==='Ghost'&&player.respect<8)){result('NOT YET',[n==='Doc'?'Doc: Come back when people know your name.':'Ghost isn’t interested yet.']);return}travelTo('supplier');if(screen==='result')return;screen='supplierShop';payload=n;render();return}
 if(action==='buyDrugGo'){const id=$('#buyDrug').value,g=parseFloat($('#buyGrams').value||0),p=supplierUnitPrice(id),cost=Math.floor(g*p),name=payload;if(g<=0)return;const charge=taxedPurchase(cost);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)} including ${money(charge.tax)} City Tax.`]);return}player.carried_drugs[id]+=g;player.supplier_trust[name]++;player.daily.supplier_buys=(player.daily.supplier_buys||0)+1;addSkillXP('charisma',4);advanceTime(30);if(screen==='result')return;result('DEAL COMPLETE',[`${DRUGS[id].name}: +${g.toFixed(1)}g`,`Base: -${money(charge.base)}`,`City Tax: -${money(charge.tax)}`,`Total: -${money(charge.total)}`]);return}
 if(action==='streetGo'){const id=$('#streetDrug').value,g=Math.min(parseFloat($('#streetGrams').value||0),player.carried_drugs[id]);if(g<=0)return;const d=DRUGS[id],zoneStreet=territoryBonusPercent('street'),pay=Math.floor(g*d.base_value*player.market[id]*(.68+Math.random()*.20)*(1+zoneStreet/100)),chance=Math.max(28,92-d.risk*4-heatPenalty()+skillLevel('street'));advanceTime(randInt(35,65));if(screen==='result')return;player.stats.moves++;addSkillXP('street',12);if(randInt(1,100)<=chance){player.carried_drugs[id]-=g;player.cash_on_person+=pay;player.stats.total_earned+=pay;const xp=Math.max(10,Math.floor(g*2));player.xp+=xp;if(randInt(1,100)<=d.risk*8)player.heat=clamp(player.heat+1,0,5);player.stats.successful_moves++;player.daily.successes++;const lvl=updateLevel();result('MOVE SUCCESSFUL',[`Moved: ${g.toFixed(1)}g ${d.name}`,`Cash: +${money(pay)}`,`XP: +${xp}`,...(lvl?[lvl]:[])])}else{player.stats.failed_moves++;player.daily.failures++;player.heat=clamp(player.heat+1,0,5);result('MOVE WENT BAD',['The opportunity fell apart.','No inventory was lost.','Heat: +1★'])}return}
 if(action.startsWith('buyWeapon:')){const id=action.split(':')[1],w=WEAPONS[id],c=taxedPurchase(w.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)} including City Tax.`]);return}player.weapon_inventory.push({id,condition:w.condition,upgrades:0});advanceTime(30);result('PURCHASE COMPLETE',[`Purchased ${w.name}.`,`Base: -${money(c.base)}`,`City Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action.startsWith('buyArmor:')){const id=action.split(':')[1],a=ARMOR[id],c=taxedPurchase(a.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)} including City Tax.`]);return}player.armor_inventory.push(id);advanceTime(25);result('PURCHASE COMPLETE',[`Purchased ${a.name}.`,`City Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action.startsWith('buyPhone:')){const id=action.split(':')[1],p=PHONES[id];if(PHONES[player.phone_id].tier>=p.tier)return;const c=taxedPurchase(p.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.phone_id=id;addSkillXP('business',10);result('PHONE UPGRADED',[`New phone: ${p.name}`,`City Tax: -${money(c.tax)}`,`Apps unlocked: ${p.apps.join(', ')}`]);return}
 if(action==='equipGo'){const wi=$('#equipWeapon').value,ai=$('#equipArmor').value;player.equipped_weapon=wi===''?null:player.weapon_inventory[Number(wi)].id;player.equipped_armor=ai===''?null:player.armor_inventory[Number(ai)];result('GEAR EQUIPPED',[`Weapon: ${weaponName()}`,`Armor: ${armorName()}`],'equip');return}
 if(action.startsWith('hire:')){const id=action.split(':')[1],c=CREW[id];travelTo('crew_spot');if(screen==='result')return;const charge=taxedPurchase(c.price);if(!charge.ok){result('NOT ENOUGH CASH',[`Need ${money(charge.total)}.`]);return}player.crew.push(id);addSkillXP('charisma',15);advanceTime(45);result('CREW UPDATED',[`${c.name} joined as ${c.role}.`,`City Tax: -${money(charge.tax)}`]);return}
 if(action.startsWith('travel:')){const id=action.split(':')[1];if(id===player.location)return;travelTo(id);if(screen==='result')return;result('TRAVEL COMPLETE',[`Arrived at ${LOCATIONS[id].name}.`,`Time: ${formatTime(player.time)}`]);return}
 if(action.startsWith('activeVehicle:')){const id=action.split(':')[1];if(player.vehicles.includes(id)){player.active_vehicle=id;saveGame();screen='vehicles';render()}return}
 if(action.startsWith('repairVehicle:')){const id=action.split(':')[1],cond=player.vehicle_condition?.[id]??100,cost=Math.max(20,Math.round((100-cond)*8));if(player.cash_on_person<cost){result('GARAGE',[`Need ${money(cost)}.`]);return}player.cash_on_person-=cost;player.vehicle_condition[id]=100;saveGame();result('VEHICLE REPAIRED',[`${VEHICLES[id].name} condition restored to 100%.`,`Cost: -${money(cost)}`]);return}
 if(action.startsWith('buyVehicle:')){const id=action.split(':')[1],v=VEHICLES[id],c=taxedPurchase(v.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.vehicles.push(id);player.vehicle_condition[id]=v.reliability;player.active_vehicle=id;result('VEHICLE PURCHASED',[`${v.name} added to your garage.`,`City Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action.startsWith('buyProperty:')){const id=action.split(':')[1],p=PROPERTIES[id],c=taxedPurchase(p.price);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.properties.push(id);result('PROPERTY PURCHASED',[`${p.name} is now yours.`,`City Tax: -${money(c.tax)}`,`Total: -${money(c.total)}`]);return}
 if(action==='bankDeposit'||action==='bankWithdraw'){
  if(player.location!=='trap'){result('CASH RESERVE',['Return to your trap to move reserve cash.']);return}
  let a=Math.max(0,Math.floor(Number($('#bankAmount')?.value||0)));
  if(a<=0)return;
  if(action==='bankDeposit'){
   a=Math.min(a,player.cash_on_person);
   player.cash_on_person-=a;
   player.bank_cash=(player.bank_cash||0)+a;
   player.stats.total_banked=(player.stats.total_banked||0)+a;
  }else{
   a=Math.min(a,player.bank_cash||0);
   player.bank_cash-=a;
   player.cash_on_person+=a;
  }
  saveGame();screen='bank';render();return
 }
 if(action==='payBills'){
  const due=Math.max(0,Math.floor(player.bills_due||0));
  if(!due){screen='bank';render();return}
  const x=takeAvailableCash(due);
  player.bills_due=x.unpaid;
  player.stats.total_expenses=(player.stats.total_expenses||0)+x.paid;
  if(x.paid>0)queueOwnerUpkeep(x.paid,'overdue_bills');
  result('BILLS PAYMENT',[`Paid: ${money(x.paid)}`,`Remaining Due: ${money(x.unpaid)}`]);
  return
 }
 if(action==='depositCash'||action==='withdrawCash'){let a=Math.max(0,Math.floor(Number($('#cashAmount').value||0)));if(action==='depositCash'){a=Math.min(a,player.cash_on_person);player.cash_on_person-=a;player.trap.cash+=a}else{a=Math.min(a,player.trap.cash);player.trap.cash-=a;player.cash_on_person+=a}saveGame();screen='stash';render();return}
 if(action==='storeDrug'||action==='takeDrug'){const id=$('#stashDrug').value;let g=Math.max(0,Number($('#stashGrams').value||0)),src=action==='storeDrug'?player.carried_drugs:player.trap.drug_stash,dst=action==='storeDrug'?player.trap.drug_stash:player.carried_drugs;g=Math.min(g,src[id]);src[id]-=g;dst[id]+=g;saveGame();screen='stash';render();return}
 if(action==='storeWeapons'){player.trap.weapons.push(...player.weapon_inventory);player.weapon_inventory=[];player.equipped_weapon=null;saveGame();screen='stash';render();return}
 if(action==='takeWeaponGo'){const i=Number($('#takeWeapon').value);if(Number.isFinite(i)&&player.trap.weapons[i])player.weapon_inventory.push(player.trap.weapons.splice(i,1)[0]);saveGame();screen='stash';render();return}
 if(action.startsWith('upgrade:')){const k=action.split(':')[1];if(player.trap[k]>=5)return;const base={security:500*(player.trap.security+1),storage:400*(player.trap.storage+1),condition:300*(player.trap.condition+1)}[k],c=taxedPurchase(base);if(!c.ok){result('NOT ENOUGH CASH',[`Need ${money(c.total)}.`]);return}player.trap[k]++;advanceTime(60);result('TRAP UPGRADED',[`${k[0].toUpperCase()+k.slice(1)} upgraded to ${player.trap[k]}/5.`,`City Tax: -${money(c.tax)}`]);return}
 if(action==='treat'){if(player.health>=100)return;travelTo('hospital');if(screen==='result')return;const c=Math.max(50,(100-player.health)*8);if(player.cash_on_person<c){result('NOT ENOUGH CASH',[`Treatment costs ${money(c)}.`]);return}player.cash_on_person-=c;player.health=100;advanceTime(120);addSkillXP('endurance',6);result('TREATMENT COMPLETE',['Health restored to 100/100.',`Cash: -${money(c)}`]);return}
 if(action.startsWith('laylow:')){if(player.location!=='trap')return;const mode=action.split(':')[1];if(player.heat<=0){result('ALREADY COLD',['Heat is already at zero.'],'laylow');return}
  if(mode==='4'){advanceTime(240);const ok=Math.random()<.6;if(ok)player.heat=Math.max(0,player.heat-1);player.trap.attention=Math.max(0,player.trap.attention-8);result('LAY LOW',[ok?'Heat: -1★':'Heat did not drop this time.','Trap attention cooled down.'],'laylow');return}
  if(mode==='8'){advanceTime(480);player.heat=Math.max(0,player.heat-1);player.trap.attention=Math.max(0,player.trap.attention-15);result('LAY LOW',['Heat: -1★','Trap attention cooled down.'],'laylow');return}
  if(mode==='day'){const drop=Math.min(player.heat,2);player.heat-=drop;player.trap.attention=Math.max(0,player.trap.attention-25);player.day++;player.time=DAY_START;player.stats.days_survived++;generateMarket();resetDaily();result('DISAPPEARED FOR THE DAY',[`Heat: -${drop}★`,'A full day passed.','Trap attention dropped.'],'laylow');return}
 }
}

document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');
 if(!b)return;
 const action=b.dataset.action;
 if(!['resultContinue','home','start','continue','new','deleteSave'].includes(action) && screen!=='result'){
  actionOriginScreen=screen||'home';
 }
 handle(action);
});
render();initBackend();
