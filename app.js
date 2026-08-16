'use strict';

const SAVE_KEY = 'federal_motion_web_save_v1';
const DAY_START = 8 * 60;
const WARNING_TIME = 24 * 60;
const DAY_END = 26 * 60;
const MAX_HEAT = 5;
const MAX_HEALTH = 100;

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
  trap:{name:'Your Trap',area:'Southside',travel:0}, corner_store:{name:'Corner Store',area:'Southside',travel:20},
  apartments:{name:'Apartments',area:'Southside',travel:25}, hospital:{name:'County Hospital',area:'Southside',travel:30},
  supplier:{name:'Supplier Spot',area:'Southside',travel:30}, black_market:{name:'Black Market',area:'Southside',travel:35},
  shopping_strip:{name:'Shopping Strip',area:'Midtown',travel:55}, warehouse:{name:'Warehouse District',area:'Midtown',travel:70},
  garage:{name:'Garage',area:'Midtown',travel:60}, bank:{name:'Bank District',area:'Midtown',travel:75},
  crew_spot:{name:'Crew Hangout',area:'Midtown',travel:65}, rival_territory:{name:'Rival Territory',area:'Outskirts',travel:100},
  freight_yard:{name:'Freight Yard',area:'Outskirts',travel:115}, secure_warehouse:{name:'Secure Warehouse',area:'Outskirts',travel:125},
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

let player = null;
let screen = 'start';
let payload = null;

const $ = s => document.querySelector(s);
const app = () => document.getElementById('app');
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const money = n => `$${Math.round(n).toLocaleString()}`;
const stars = h => '★'.repeat(clamp(h,0,5)) + '☆'.repeat(5-clamp(h,0,5));
const formatTime = m => { const x=((m%(24*60))+(24*60))%(24*60); const h=Math.floor(x/60), min=x%60, ap=h<12?'AM':'PM'; return `${h%12||12}:${String(min).padStart(2,'0')} ${ap}`; };
const escapeHtml = s => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function emptyDrugInventory(){ return Object.fromEntries(Object.keys(DRUGS).map(k=>[k,0])); }
function newPlayer(name='Player'){
  return {name,day:1,time:DAY_START,level:1,xp:0,respect:0,heat:0,health:100,cash_on_person:0,location:'trap',
    transport:{name:'Bicycle',speed_bonus:0,condition:100},phone:'Basic Phone',equipped_weapon:null,equipped_armor:null,
    weapon_inventory:[],armor_inventory:[],crew:[],carried_drugs:emptyDrugInventory(),
    trap:{cash:0,drug_stash:emptyDrugInventory(),weapons:[],armor:[],security:0,storage:1,condition:1,attention:0},
    market:Object.fromEntries(Object.keys(DRUGS).map(k=>[k,1])),supplier_trust:{Smoke:0,Doc:0,Ghost:0},
    stats:{moves:0,successful_moves:0,failed_moves:0,hospital_visits:0,arrests:0,days_survived:1},daily:{}};
}
function resetDaily(){ player.daily={cash_start:player.cash_on_person+player.trap.cash,xp_start:player.xp,respect_start:player.respect,heat_start:player.heat,successes:0,failures:0}; }
function saveGame(){ localStorage.setItem(SAVE_KEY,JSON.stringify(player)); }
function loadGame(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch{return null;} }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
function generateMarket(){ Object.keys(DRUGS).forEach(k=>player.market[k]=Math.round((0.8+Math.random()*0.5)*100)/100); }
function updateLevel(){ const n=1+Math.floor(player.xp/500); if(n>player.level){ const old=player.level; player.level=n; return `LEVEL UP: ${old} → ${n}`;} return null; }
function weaponName(){ return player.equipped_weapon?WEAPONS[player.equipped_weapon].name:'Unarmed'; }
function armorName(){ return player.equipped_armor?ARMOR[player.equipped_armor].name:'None'; }

function header(){
  if(!player) return `<div class="logo">FEDERAL MOTION</div><div class="sublogo">WEB TEST BUILD</div>`;
  return `<div class="logo">FEDERAL MOTION</div><div class="sublogo">WEB TEST BUILD</div>
  <div class="card"><div class="status-grid">
    ${stat('DAY',player.day)}${stat('TIME',formatTime(player.time))}${stat('LOCATION',LOCATIONS[player.location].name)}${stat('CASH',money(player.cash_on_person))}
    ${stat('LEVEL',player.level)}${stat('XP',player.xp)}${stat('RESPECT',player.respect)}${stat('HEAT',stars(player.heat))}
    ${stat('HEALTH',`${player.health}/100`)}${stat('WEAPON',weaponName())}${stat('ARMOR',armorName())}${stat('RIDE',player.transport.name)}
  </div></div>`;
}
function stat(k,v){ return `<div class="stat"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`; }
function btn(label,action,small='',cls=''){ return `<button class="btn ${cls}" data-action="${action}">${label}${small?`<small>${small}</small>`:''}</button>`; }
function back(){ return btn('← Back','home','','back'); }
function render(){
  let html=header();
  if(screen==='start') html+=renderStart();
  else if(screen==='home') html+=renderHome();
  else if(screen==='result') html+=renderResult();
  else if(screen==='moves') html+=renderMoves();
  else if(screen==='street') html+=renderStreet();
  else if(screen==='supplier') html+=renderSupplier();
  else if(screen==='supplierShop') html+=renderSupplierShop(payload);
  else if(screen==='black') html+=renderBlack();
  else if(screen==='weapons') html+=renderWeapons();
  else if(screen==='armor') html+=renderArmor();
  else if(screen==='equip') html+=renderEquip();
  else if(screen==='crew') html+=renderCrew();
  else if(screen==='map') html+=renderMap();
  else if(screen==='stash') html+=renderStash();
  else if(screen==='upgrades') html+=renderUpgrades();
  else if(screen==='hospital') html+=renderHospital();
  else if(screen==='status') html+=renderStatus();
  else if(screen==='market') html+=renderMarket();
  app().innerHTML=html+`<div class="footer-note">Save data stays in this browser on this device.</div>`;
}

function renderStart(){
  return `<div class="card"><div class="section-title">START</div><div class="actions">
    ${hasSave()?btn('Continue Game','continue','','primary'):''}
    ${btn('New Game','new','','primary')}
    ${hasSave()?btn('Delete Save','deleteSave','Erase this browser save','danger'):''}
  </div></div>`;
}
function renderHome(){
  const late=player.time>=WARNING_TIME?`<div class="notice">⚠ LATE NIGHT — get back to the trap soon. 2:00 AM is the danger window.</div>`:'';
  return `${late}<div class="section-title">WHAT'S THE MOVE?</div><div class="actions">
    ${btn('Make a Move','moves','Jobs, robberies & heists')}
    ${btn('Street Move','street','Move carried inventory')}
    ${btn('Supplier','supplier','Buy inventory from contacts')}
    ${btn('Black Market','black','Weapons, armor & gear')}
    ${btn('Crew','crew','Hire crew members')}
    ${btn('City Map','map','Travel around the city')}
    ${btn('Trap Stash','stash','Cash, inventory & weapons')}
    ${btn('Trap Upgrades','upgrades','Security, storage, condition')}
    ${btn('Hospital','hospital','Treatment and recovery')}
    ${btn('Status','status','Full player/trap status')}
    ${btn('End Day / Sleep','sleep','Must be at your trap','good')}
    ${btn('Save Game','save','Save in this browser')}
  </div>`;
}
function renderResult(){
  const lines=(payload?.lines||[]).map(x=>`<div class="result-line">${escapeHtml(x)}</div>`).join('');
  return `<div class="card"><div class="result-title">${escapeHtml(payload?.title||'RESULT')}</div><div class="result-lines">${lines}</div><hr>
  <div class="status-grid">${stat('Cash',money(player.cash_on_person))}${stat('XP',player.xp)}${stat('Respect',player.respect)}${stat('Heat',stars(player.heat))}${stat('Health',`${player.health}/100`)}${stat('Time',formatTime(player.time))}</div>
  <div style="margin-top:12px">${btn('Continue','home','','primary')}</div></div>`;
}
function renderMoves(){
  const items=Object.entries(MOVES).map(([id,m])=>{ const r=requirement(m); const chance=successChance(m); return `<div class="item"><div class="item-head"><span>${m.name}</span><span>${chance}%</span></div><div class="item-meta">Payout ${money(m.cash[0])}–${money(m.cash[1])} · Heat +${m.heat}★ · ${m.minutes[0]}–${m.minutes[1]} min${r?`<br><span class="bad-text">LOCKED: ${r}</span>`:''}</div><div style="margin-top:9px">${btn(r?'Locked':'Do Move',`doMove:${id}`,r||LOCATIONS[m.location].name,r?'':'primary')}</div></div>`; }).join('');
  return `${back()}<div class="section-title">AVAILABLE MOVES</div><div class="list">${items}</div>`;
}
function renderStreet(){
  const av=Object.entries(player.carried_drugs).filter(([,g])=>g>.001);
  if(!av.length) return `${back()}<div class="card">You don't have any inventory on you.</div>`;
  return `${back()}<div class="card"><div class="section-title">STREET MOVE</div><label>Product</label><select id="streetDrug">${av.map(([id,g])=>`<option value="${id}">${DRUGS[id].name} (${g.toFixed(1)}g)</option>`).join('')}</select><label>Amount (game grams)</label><input id="streetGrams" type="number" min="0.1" step="0.1" value="1"><div style="margin-top:10px">${btn('Make Street Move','streetGo','','primary')}</div></div>`;
}
function renderSupplier(){
  return `${back()}<div class="section-title">SUPPLIER SPOT</div><div class="list">
    <div class="item"><div class="item-head"><span>Smoke</span><span>Trust ${player.supplier_trust.Smoke}</span></div><div class="item-meta">Weed / Shrooms · “Keep it simple. Money straight, business straight.”</div>${btn('Meet Smoke','supplier:Smoke','','primary')}</div>
    <div class="item"><div class="item-head"><span>Doc</span><span>Respect 3+</span></div><div class="item-meta">Pills / Lean · “Quality costs. Complaining costs extra.”</div>${btn('Meet Doc','supplier:Doc',player.respect<3?'Locked until Respect 3':'','primary')}</div>
    <div class="item"><div class="item-head"><span>Ghost</span><span>Respect 8+</span></div><div class="item-meta">Cocaine / Meth / Heroin · “You got money or conversation?”</div>${btn('Meet Ghost','supplier:Ghost',player.respect<8?'Locked until Respect 8':'','primary')}</div>
  </div>`;
}
function supplierProducts(name){ return name==='Smoke'?['weed','shrooms']:name==='Doc'?['pills','lean']:['cocaine','meth','heroin']; }
function renderSupplierShop(name){ const products=supplierProducts(name); return `${btn('← Suppliers','supplier','','back')}<div class="card"><div class="section-title">${name.toUpperCase()}</div><div class="muted">Cash: ${money(player.cash_on_person)}</div><label>Product</label><select id="buyDrug">${products.map(id=>{const p=Math.max(1,Math.floor(DRUGS[id].base_value*.65));return `<option value="${id}" data-price="${p}">${DRUGS[id].name} — ${money(p)}/game gram</option>`}).join('')}</select><label>Amount (game grams)</label><input id="buyGrams" type="number" min="0.1" step="0.1" value="3.5"><div style="margin-top:10px">${btn('Buy','buyDrugGo','','primary')}</div></div>`; }
function renderBlack(){ return `${back()}<div class="section-title">BLACK MARKET</div><div class="actions">${btn('Weapons','weapons','Buy weapons')}${btn('Armor','armor','Buy armor')}${btn('Equip Gear','equip','Choose weapon and armor')}</div>`; }
function renderWeapons(){ return `${btn('← Black Market','black','','back')}<div class="list">${Object.entries(WEAPONS).map(([id,w])=>`<div class="item"><div class="item-head"><span>${w.name}</span><span>${money(w.price)}</span></div><div class="item-meta">Power ${w.power} · Starting condition ${w.condition}%</div>${btn('Buy',`buyWeapon:${id}`,'','primary')}</div>`).join('')}</div>`; }
function renderArmor(){ return `${btn('← Black Market','black','','back')}<div class="list">${Object.entries(ARMOR).map(([id,a])=>`<div class="item"><div class="item-head"><span>${a.name}</span><span>${money(a.price)}</span></div><div class="item-meta">Defense ${a.defense}</div>${btn('Buy',`buyArmor:${id}`,'','primary')}</div>`).join('')}</div>`; }
function renderEquip(){ const ws=player.weapon_inventory.map((x,i)=>`<option value="${i}">${WEAPONS[x.id].name} · ${x.condition}%</option>`).join(''); const as=player.armor_inventory.map((id,i)=>`<option value="${i}">${ARMOR[id].name}</option>`).join(''); return `${btn('← Black Market','black','','back')}<div class="card"><div class="section-title">EQUIP GEAR</div><label>Weapon</label><select id="equipWeapon"><option value="">Unarmed</option>${ws}</select><label>Armor</label><select id="equipArmor"><option value="">None</option>${as}</select><div style="margin-top:10px">${btn('Equip','equipGo','','primary')}</div></div>`; }
function renderCrew(){ return `${back()}<div class="card"><div class="section-title">YOUR CREW</div>${player.crew.length?player.crew.map(id=>`<div class="item">${CREW[id].name} · Combat ${CREW[id].combat} · Driving ${CREW[id].driving} · Cut ${CREW[id].cut}%</div>`).join(''):'<div class="muted">Nobody yet.</div>'}</div><div class="section-title">AVAILABLE</div><div class="list">${Object.entries(CREW).filter(([id])=>!player.crew.includes(id)).map(([id,c])=>`<div class="item"><div class="item-head"><span>${c.name}</span><span>${money(c.price)}</span></div><div class="item-meta">Combat ${c.combat} · Driving ${c.driving} · Loyalty ${c.loyalty}% · Cut ${c.cut}%</div>${btn('Hire',`hire:${id}`,'','primary')}</div>`).join('')||'<div class="card">Everybody available is already with you.</div>'}</div>`; }
function renderMap(){ const areas=['Southside','Midtown','Outskirts']; return `${back()}${areas.map(area=>`<div class="section-title">${area.toUpperCase()}</div><div class="list">${Object.entries(LOCATIONS).filter(([,l])=>l.area===area).map(([id,l])=>`<div class="item"><div class="item-head"><span>${l.name}</span><span>${travelTime(l.travel)} min</span></div>${btn(player.location===id?'You Are Here':'Travel',`travel:${id}`,'',player.location===id?'':'primary')}</div>`).join('')}</div>`).join('')}`; }
function drugList(inv){ const x=Object.entries(inv).filter(([,g])=>g>.001); return x.length?x.map(([id,g])=>`<div class="stat"><span>${DRUGS[id].name}</span><strong>${g.toFixed(1)}g</strong></div>`).join(''):'<div class="muted">Empty</div>'; }
function renderStash(){ if(player.location!=='trap') return `${back()}<div class="card">You need to be at your trap to manage the stash.</div>`; const takeWeapons=player.trap.weapons.map((x,i)=>`<option value="${i}">${WEAPONS[x.id].name}</option>`).join(''); return `${back()}<div class="card"><div class="section-title">CASH</div>${stat('On Person',money(player.cash_on_person))}${stat('Stored',money(player.trap.cash))}<div class="row"><input id="cashAmount" type="number" min="1" value="100">${btn('Deposit','depositCash')}${btn('Withdraw','withdrawCash')}</div></div><div class="card"><div class="section-title">ON PERSON</div>${drugList(player.carried_drugs)}<div class="section-title">TRAP STASH</div>${drugList(player.trap.drug_stash)}<hr><label>Drug</label><select id="stashDrug">${Object.keys(DRUGS).map(id=>`<option value="${id}">${DRUGS[id].name}</option>`).join('')}</select><label>Amount</label><input id="stashGrams" type="number" min="0.1" step="0.1" value="3.5"><div class="row" style="margin-top:8px">${btn('Store','storeDrug')}${btn('Take','takeDrug')}</div></div><div class="card"><div class="section-title">WEAPONS</div><div class="muted">On person: ${player.weapon_inventory.length} · Stored: ${player.trap.weapons.length}</div><div class="row" style="margin-top:8px">${btn('Store All Carried Weapons','storeWeapons')}</div>${player.trap.weapons.length?`<label>Stored weapon</label><select id="takeWeapon">${takeWeapons}</select>${btn('Take Weapon','takeWeaponGo')}`:''}</div>`; }
function renderUpgrades(){ if(player.location!=='trap') return `${back()}<div class="card">You need to be at your trap.</div>`; const opts=[['security',500*(player.trap.security+1)],['storage',400*(player.trap.storage+1)],['condition',300*(player.trap.condition+1)]]; return `${back()}<div class="list">${opts.map(([k,c])=>`<div class="item"><div class="item-head"><span>${k[0].toUpperCase()+k.slice(1)} ${player.trap[k]}/5</span><span>${money(c)}</span></div>${btn(player.trap[k]>=5?'MAXED':'Upgrade',`upgrade:${k}`,player.trap[k]>=5?'':'Uses 60 minutes',player.trap[k]>=5?'':'primary')}</div>`).join('')}</div>`; }
function renderHospital(){ const miss=100-player.health,cost=Math.max(50,miss*8); return `${back()}<div class="card"><div class="section-title">COUNTY HOSPITAL</div>${stat('Health',`${player.health}/100`)}${stat('Full Treatment',money(cost))}<div style="margin-top:10px">${btn(player.health>=100?'Already Full Health':'Get Treatment','treat',player.health>=100?'':'Takes 120 minutes',player.health>=100?'':'primary')}</div></div>`; }
function renderStatus(){ return `${back()}<div class="card"><div class="section-title">PLAYER</div><div class="status-grid">${stat('Player',player.name)}${stat('Day',player.day)}${stat('Time',formatTime(player.time))}${stat('Location',LOCATIONS[player.location].name)}${stat('Level',player.level)}${stat('XP',player.xp)}${stat('Respect',player.respect)}${stat('Heat',stars(player.heat))}${stat('Health',`${player.health}/100`)}${stat('Cash on Person',money(player.cash_on_person))}${stat('Cash in Trap',money(player.trap.cash))}${stat('Weapon',weaponName())}${stat('Armor',armorName())}${stat('Transport',player.transport.name)}</div></div><div class="card"><div class="section-title">TRAP</div><div class="status-grid">${stat('Security',`${player.trap.security}/5`)}${stat('Storage',`${player.trap.storage}/5`)}${stat('Condition',`${player.trap.condition}/5`)}${stat('Attention',`${player.trap.attention}%`)}</div></div>`; }
function renderMarket(){ return `${back()}<div class="card"><div class="section-title">MORNING MARKET</div>${Object.entries(DRUGS).map(([id,d])=>{const m=player.market[id];const txt=m>=1.18?'HIGH ↑':m<=.9?'LOW ↓':'NORMAL →';const cls=m>=1.18?'market-high':m<=.9?'market-low':'';return `<div class="stat"><span>${d.name}</span><strong class="${cls}">${txt}</strong></div>`}).join('')}</div>`; }

function travelTime(base){ const mult={Bicycle:1,'Cheap Car':.65,Sedan:.5,'Fast Car':.38}[player.transport.name]||1; return Math.max(10,Math.floor(base*mult)); }
function travelTo(id){ if(id===player.location) return {ok:true}; const mins=travelTime(LOCATIONS[id].travel); player.location=id; return advanceTime(mins); }
function advanceTime(mins){ player.time+=mins; if(player.time>=DAY_END){ lateNightEvent(); return {ok:false,late:true}; } return {ok:true}; }
function combatPower(){ let p=player.level*3; if(player.equipped_weapon)p+=WEAPONS[player.equipped_weapon].power; if(player.equipped_armor)p+=Math.floor(ARMOR[player.equipped_armor].defense/2); player.crew.forEach(id=>p+=CREW[id].combat); p+=Math.floor(player.respect/3); return p; }
function successChance(m){ let c=m.base_success-player.heat*4+Math.min(12,player.level*2)+Math.min(8,Math.floor(player.respect/3)); if(m.combat){const e=(m.enemy[0]+m.enemy[1])/2;c+=Math.floor((combatPower()-e)*.6);} return clamp(c,10,95); }
function requirement(m){ if(player.level<(m.requires_level||1))return `Requires Level ${m.requires_level}`; if(m.requires_weapon&&!player.equipped_weapon)return 'Weapon required'; if(player.crew.length<(m.requires_crew||0))return `Requires ${m.requires_crew} crew member(s)`; return ''; }
function result(title,lines){ saveGame(); screen='result'; payload={title,lines}; render(); }

function performMove(id){ const m=MOVES[id],r=requirement(m); if(r){result('LOCKED',[r]);return;} travelTo(m.location); if(screen==='result')return; const chance=successChance(m); advanceTime(randInt(...m.minutes)); if(screen==='result')return; player.stats.moves++;
  if(randInt(1,100)<=chance){ let payout=randInt(...m.cash), cut=0; player.crew.forEach(cid=>cut+=Math.floor(payout*CREW[cid].cut/100)); payout=Math.max(0,payout-cut); player.cash_on_person+=payout; player.xp+=m.xp; player.respect+=m.respect; player.heat=clamp(player.heat+m.heat,0,5); player.trap.attention=clamp(player.trap.attention+m.heat*4,0,100); player.stats.successful_moves++; player.daily.successes++; let lines=[`Cash: +${money(payout)}`,`XP: +${m.xp}`,`Respect: +${m.respect}`]; if(cut)lines.push(`Crew cuts paid: ${money(cut)}`); if(m.heat)lines.push(`Heat: +${m.heat}★`); if(id==='house_hit'&&Math.random()<.35){const b=randInt(40,180);player.cash_on_person+=b;lines.push(`Stolen goods fenced: +${money(b)}`);} if(id==='rival_trap'){const d=Object.keys(DRUGS)[randInt(0,Object.keys(DRUGS).length-1)],g=Math.round((3.5+Math.random()*24.5)*10)/10;player.carried_drugs[d]+=g;lines.push(`Loot: ${g.toFixed(1)}g ${DRUGS[d].name}`); if(Math.random()<.25){const ids=['cheap_handgun','handgun','shotgun'];const wid=ids[randInt(0,2)];player.weapon_inventory.push({id:wid,condition:randInt(45,80),upgrades:0});lines.push(`Loot: ${WEAPONS[wid].name}`);}} if(id==='restricted_warehouse'){const b=randInt(1000,4000);player.cash_on_person+=b;lines.push(`Rare equipment value: +${money(b)}`);} const lvl=updateLevel();if(lvl)lines.push(lvl);result('MOVE SUCCESSFUL',lines);
  } else { player.stats.failed_moves++;player.daily.failures++;const x=Math.max(10,Math.floor(m.xp/4));player.xp+=x;let lines=[`XP from experience: +${x}`]; if(m.combat){let defense=player.equipped_armor?ARMOR[player.equipped_armor].defense:0;const enemy=randInt(...m.enemy);let dmg=Math.max(8,randInt(15,45)+Math.max(0,Math.floor(enemy/10)-Math.floor(defense/8)));player.health-=dmg;if(player.health<=0){hospitalRespawn();return;} lines.push(`Health: -${dmg}`);if(Math.random()<.3){player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★');}} else {player.heat=clamp(player.heat+1,0,5);lines.push('Heat: +1★');} result('MOVE FAILED',lines); }
}

function hospitalRespawn(){ const cash=player.cash_on_person;player.cash_on_person=0;player.carried_drugs=emptyDrugInventory();let lost=null;if(player.equipped_weapon){lost=weaponName();const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null;}const x=Math.min(player.xp,Math.max(50,Math.floor(player.xp/10)));player.xp-=x;const days=randInt(1,3);player.day+=days;player.time=DAY_START;player.location='hospital';player.health=65;player.stats.hospital_visits++;resetDaily();result('YOU WENT DOWN',[`Cash lost from your person: ${money(cash)}`,'Carried inventory lost.',lost?`Weapon lost: ${lost}`:'No equipped weapon lost.',`XP lost: ${x}`,`Time passed: ${days} day(s)`,'Your trap stash and stored cash were untouched.']);}
function arrestEvent(){ const days=randInt(2,10),cash=Math.floor(player.cash_on_person*(.25+Math.random()*.45));player.cash_on_person-=cash;player.carried_drugs=emptyDrugInventory();if(player.equipped_weapon&&Math.random()<.75){const i=player.weapon_inventory.findIndex(x=>x.id===player.equipped_weapon);if(i>=0)player.weapon_inventory.splice(i,1);player.equipped_weapon=null;}player.day+=days;player.time=DAY_START;player.location='trap';player.heat=Math.max(1,player.heat-1);player.respect=Math.max(0,player.respect-randInt(0,2));player.stats.arrests++;resetDaily();generateMarket();result('BUSTED',[`Jail time: ${days} days`,`Cash seized: ${money(cash)}`,'Carried inventory seized.','Stored trap stash remains separate.']);}
function lateNightEvent(){ const severity=Math.max(1,Math.floor((player.time-DAY_END)/30)+1), danger=Math.min(90,25+severity*10+player.heat*8); if(randInt(1,100)>danger){player.location='trap'; forcedEndDay(['You got lucky and made it back without losing anything.']);return;} const o=['robbed','arrested','injured'][randInt(0,2)]; if(o==='arrested'){arrestEvent();return;} if(o==='robbed'){const c=player.cash_on_person;player.cash_on_person=0;player.carried_drugs=emptyDrugInventory();player.location='trap';forcedEndDay([`Caught slipping after 2:00 AM.`,`Lost carried cash: ${money(c)}`,'Lost carried inventory.']);return;} player.health-=randInt(25,55); if(player.health<=0){hospitalRespawn();return;}player.location='trap';forcedEndDay([`You made it back hurt. Health: ${player.health}/100`]);}
function totalTrapValue(){let v=player.trap.cash;Object.entries(player.trap.drug_stash).forEach(([id,g])=>v+=Math.floor(g*DRUGS[id].base_value));player.trap.weapons.forEach(x=>v+=WEAPONS[x.id].price);return v;}
function overnightEventLines(){const s=player.trap.security,a=player.trap.attention,v=totalTrapValue();let risk=5+Math.floor(a/4)+player.heat*5+Math.min(20,Math.floor(v/1000))-s*6;risk=clamp(risk,3,70);if(randInt(1,100)>risk){player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return ['Quiet night. Nothing major happened.'];}const e=['robbery','pressure','damage'][randInt(0,2)],lines=[];if(e==='robbery'){lines.push('Somebody hit the trap overnight.');const loss=Math.min(player.trap.cash,randInt(0,Math.max(50,Math.floor(player.trap.cash/3)+1)));player.trap.cash-=loss;if(loss)lines.push(`Cash stolen: ${money(loss)}`);const ds=Object.keys(DRUGS).filter(id=>player.trap.drug_stash[id]>0);if(ds.length){const d=ds[randInt(0,ds.length-1)],amt=Math.round(Math.min(player.trap.drug_stash[d],1+Math.random()*13)*10)/10;player.trap.drug_stash[d]-=amt;lines.push(`Stash lost: ${amt.toFixed(1)}g ${DRUGS[d].name}`);}player.trap.condition=Math.max(0,player.trap.condition-1);}else if(e==='pressure'){player.heat=clamp(player.heat+1,0,5);lines.push('Heavy pressure around the neighborhood overnight.','Heat: +1★');}else{player.trap.condition=Math.max(0,player.trap.condition-1);lines.push('Something got damaged at the trap.','Trap Condition: -1');}player.trap.attention=Math.max(0,player.trap.attention-randInt(3,8));return lines;}
function endDay(){ if(player.location!=='trap'){result('CAN’T SLEEP YET',['You need to return to your trap before sleeping.']);return;} const cashNow=player.cash_on_person+player.trap.cash;const summary=[`Cash Change: ${money(cashNow-player.daily.cash_start)}`,`XP Change: ${(player.xp-player.daily.xp_start>=0?'+':'')+(player.xp-player.daily.xp_start)}`,`Respect Change: ${(player.respect-player.daily.respect_start>=0?'+':'')+(player.respect-player.daily.respect_start)}`,`Heat Change: ${(player.heat-player.daily.heat_start>=0?'+':'')+(player.heat-player.daily.heat_start)}`,`Moves: ${player.daily.successes} successful / ${player.daily.failures} failed`,`Trap Attention: ${player.trap.attention}%`];const night=overnightEventLines();player.day++;player.time=DAY_START;player.location='trap';player.stats.days_survived++;if(player.heat>0&&Math.random()<.35)player.heat--;generateMarket();resetDaily();saveGame();result(`DAY ${player.day} — MORNING REPORT`,[...summary,'--- NIGHT REPORT ---',...night,`Heat: ${stars(player.heat)}`,'The city is moving again.']);}
function forcedEndDay(extra){const night=overnightEventLines();player.day++;player.time=DAY_START;player.location='trap';player.stats.days_survived++;if(player.heat>0&&Math.random()<.35)player.heat--;generateMarket();resetDaily();saveGame();result(`DAY ${player.day} — MORNING REPORT`,[...extra,'--- NIGHT REPORT ---',...night,`Heat: ${stars(player.heat)}`]);}

function handle(action){
  if(action==='new'){ const name=prompt('Enter player name:','Player')||'Player';player=newPlayer(name);generateMarket();resetDaily();saveGame();screen='market';payload=null;render();return; }
  if(action==='continue'){player=loadGame();if(!player){screen='start';render();return;}screen='home';render();return;}
  if(action==='deleteSave'){if(confirm('Delete your Federal Motion browser save?')){localStorage.removeItem(SAVE_KEY);player=null;screen='start';render();}return;}
  if(action==='home'){screen='home';payload=null;render();return;}
  if(['moves','street','supplier','black','weapons','armor','equip','crew','map','stash','upgrades','hospital','status','market'].includes(action)){screen=action;payload=null;render();return;}
  if(action==='save'){saveGame();result('GAME SAVED',['Your progress was saved in this browser.']);return;}
  if(action==='sleep'){endDay();return;}
  if(action.startsWith('doMove:')){performMove(action.split(':')[1]);return;}
  if(action.startsWith('supplier:')){const n=action.split(':')[1];if((n==='Doc'&&player.respect<3)||(n==='Ghost'&&player.respect<8)){result('NOT YET',[n==='Doc'?'Doc: Come back when people actually know your name.':'Ghost isn’t interested yet.']);return;}travelTo('supplier');if(screen==='result')return;screen='supplierShop';payload=n;render();return;}
  if(action==='buyDrugGo'){const id=$('#buyDrug').value,g=parseFloat($('#buyGrams').value||0),p=Math.max(1,Math.floor(DRUGS[id].base_value*.65)),cost=Math.floor(g*p),name=payload;if(g<=0)return;if(cost>player.cash_on_person){result('NOT ENOUGH CASH',[`Need ${money(cost)}.`]);return;}player.cash_on_person-=cost;player.carried_drugs[id]+=g;player.supplier_trust[name]++;advanceTime(30);if(screen==='result')return;result('DEAL COMPLETE',[`${DRUGS[id].name}: +${g.toFixed(1)}g`,`Cash: -${money(cost)}`]);return;}
  if(action==='streetGo'){const id=$('#streetDrug').value,g=Math.min(parseFloat($('#streetGrams').value||0),player.carried_drugs[id]);if(g<=0)return;const d=DRUGS[id],pay=Math.floor(g*d.base_value*player.market[id]*(.85+Math.random()*.3)),chance=Math.max(40,96-(d.risk+player.heat)*4);advanceTime(randInt(35,65));if(screen==='result')return;player.stats.moves++;if(randInt(1,100)<=chance){player.carried_drugs[id]-=g;player.cash_on_person+=pay;const xp=Math.max(10,Math.floor(g*2));player.xp+=xp;if(randInt(1,100)<=d.risk*8)player.heat=clamp(player.heat+1,0,5);player.stats.successful_moves++;player.daily.successes++;const lvl=updateLevel();result('MOVE SUCCESSFUL',[`Moved: ${g.toFixed(1)}g ${d.name}`,`Cash: +${money(pay)}`,`XP: +${xp}`,...(lvl?[lvl]:[])]);}else{player.stats.failed_moves++;player.daily.failures++;player.heat=clamp(player.heat+1,0,5);result('MOVE WENT BAD',['The opportunity fell apart.','No inventory was lost.','Heat: +1★']);}return;}
  if(action.startsWith('buyWeapon:')){const id=action.split(':')[1],w=WEAPONS[id];if(player.cash_on_person<w.price){result('NOT ENOUGH CASH',[`Need ${money(w.price)}.`]);return;}player.cash_on_person-=w.price;player.weapon_inventory.push({id,condition:w.condition,upgrades:0});advanceTime(30);if(screen==='result')return;result('PURCHASE COMPLETE',[`Purchased ${w.name}.`,`Cash: -${money(w.price)}`]);return;}
  if(action.startsWith('buyArmor:')){const id=action.split(':')[1],a=ARMOR[id];if(player.cash_on_person<a.price){result('NOT ENOUGH CASH',[`Need ${money(a.price)}.`]);return;}player.cash_on_person-=a.price;player.armor_inventory.push(id);advanceTime(25);if(screen==='result')return;result('PURCHASE COMPLETE',[`Purchased ${a.name}.`,`Cash: -${money(a.price)}`]);return;}
  if(action==='equipGo'){const wi=$('#equipWeapon').value,ai=$('#equipArmor').value;player.equipped_weapon=wi===''?null:player.weapon_inventory[Number(wi)].id;player.equipped_armor=ai===''?null:player.armor_inventory[Number(ai)];saveGame();result('GEAR EQUIPPED',[`Weapon: ${weaponName()}`,`Armor: ${armorName()}`]);return;}
  if(action.startsWith('hire:')){const id=action.split(':')[1],c=CREW[id];travelTo('crew_spot');if(screen==='result')return;if(player.cash_on_person<c.price){result('NOT ENOUGH CASH',[`Need ${money(c.price)}.`]);return;}player.cash_on_person-=c.price;player.crew.push(id);advanceTime(45);if(screen==='result')return;result('CREW UPDATED',[`${c.name} joined the crew.`]);return;}
  if(action.startsWith('travel:')){const id=action.split(':')[1];if(id===player.location)return;travelTo(id);if(screen==='result')return;result('TRAVEL COMPLETE',[`Arrived at ${LOCATIONS[id].name}.`,`Time: ${formatTime(player.time)}`]);return;}
  if(action==='depositCash'||action==='withdrawCash'){let a=Math.max(0,Math.floor(Number($('#cashAmount').value||0)));if(action==='depositCash'){a=Math.min(a,player.cash_on_person);player.cash_on_person-=a;player.trap.cash+=a;}else{a=Math.min(a,player.trap.cash);player.trap.cash-=a;player.cash_on_person+=a;}saveGame();screen='stash';render();return;}
  if(action==='storeDrug'||action==='takeDrug'){const id=$('#stashDrug').value;let g=Math.max(0,Number($('#stashGrams').value||0));const src=action==='storeDrug'?player.carried_drugs:player.trap.drug_stash,dst=action==='storeDrug'?player.trap.drug_stash:player.carried_drugs;g=Math.min(g,src[id]);src[id]-=g;dst[id]+=g;saveGame();screen='stash';render();return;}
  if(action==='storeWeapons'){player.trap.weapons.push(...player.weapon_inventory);player.weapon_inventory=[];player.equipped_weapon=null;saveGame();screen='stash';render();return;}
  if(action==='takeWeaponGo'){const i=Number($('#takeWeapon').value);if(Number.isFinite(i)&&player.trap.weapons[i])player.weapon_inventory.push(player.trap.weapons.splice(i,1)[0]);saveGame();screen='stash';render();return;}
  if(action.startsWith('upgrade:')){const k=action.split(':')[1];if(player.trap[k]>=5)return;const costs={security:500*(player.trap.security+1),storage:400*(player.trap.storage+1),condition:300*(player.trap.condition+1)},c=costs[k];if(player.cash_on_person<c){result('NOT ENOUGH CASH',[`Need ${money(c)}.`]);return;}player.cash_on_person-=c;player.trap[k]++;advanceTime(60);if(screen==='result')return;result('TRAP UPGRADED',[`${k[0].toUpperCase()+k.slice(1)} upgraded to ${player.trap[k]}/5.`]);return;}
  if(action==='treat'){if(player.health>=100)return;travelTo('hospital');if(screen==='result')return;const c=Math.max(50,(100-player.health)*8);if(player.cash_on_person<c){result('NOT ENOUGH CASH',[`Treatment costs ${money(c)}.`]);return;}player.cash_on_person-=c;player.health=100;advanceTime(120);if(screen==='result')return;result('TREATMENT COMPLETE',['Health restored to 100/100.',`Cash: -${money(c)}`]);return;}
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handle(b.dataset.action);});
render();
