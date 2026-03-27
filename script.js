const DS_SHORT=['Mo','Di','Mi','Do','Fr','Sa','So'];
const DS_LONG=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const JS2D=[6,0,1,2,3,4,5];
const ICONS = ['🍎','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🍍','🥝','🥑','🥦','🥕','🌽','🥐','🍞','🥞','🧀','🥩','🍗','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🍫','🍬','🍭','🍮','🍯','🥤','🧃','🥛','☕','🍵','🧉','🏋️','🏃','🚶','🚴','🚵','🏊','🤽','🚣','🏄','🧗','🧘','🤸','🤺','🥊','🥋','💪','👟','⚽','🏀','🏈','⚾','🎾','🏐','🏉','🏓','🏸','🏒','🏏','⛳','🏹','🎿','🏂','⛸️','🛹','🛼'];
const MONTH_DE=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

let cfg={water:{goalMl:2000,glassMl:250,icon:'🫙',statUnit:'pct'},steps:{goal:10000,statUnit:'pct'},teeth:{goal:2},groups:[],exercises:[],meals:[],smoke:{goal:20},widgetOrder:null,hiddenWidgets:['wsmk','wtb'],sortMode:'default'};
let logs={};
let sortMode='default';
let ipt=null;

let activeDate = new Date();
activeDate.setHours(0,0,0,0);
let calViewYear,calViewMonth;
let pendIco={glass:'🥤',nex:'🏋️',nml:'🥗',ch:'🍩'};
let cheatKey=null;
let editExIdx = -1;
let editMlIdx = -1;
let editCmName = null;

const WIDGET_DEFS = [
  {id:'ws',label:'Schritte',icon:'👟'},
  {id:'ww',label:'Wasser',icon:'💧'},
  {id:'wf',label:'Übungen',icon:'🏋️'},
  {id:'wm',label:'Mahlzeiten',icon:'🥗'},
  {id:'wg',label:'Gewicht',icon:'⚖️'},
  {id:'wsmk',label:'Rauchen',icon:'🚬'},
  {id:'wtb',label:'Zähneputzen',icon:'🦷'},
];
function resetAllData() {
  const conf = confirm("Bist du sicher? Alle Daten und Einstellungen werden gelöscht!");
  if (conf) {
    const doubleConf = confirm("Wirklich alles löschen? Diese Aktion kann nicht rückgängig gemacht werden!");
    if (doubleConf) {
      localStorage.removeItem('dtc');
      localStorage.removeItem('dtl');
      location.reload();
    }
  }
}
function openWVis(){
  if(!cfg.hiddenWidgets)cfg.hiddenWidgets=['wsmk','wtb'];
  const el=document.getElementById('wvis-list');
  el.innerHTML=WIDGET_DEFS.map(w=>{
    const vis=!cfg.hiddenWidgets.includes(w.id);
    return `<div class="wvis-item ${vis?'active':''}" onclick="toggleWidgetVis('${w.id}',this)">
      <span style="font-size:22px">${w.icon}</span>
      <span style="font-size:14px;font-weight:600;flex:1">${w.label}</span>
      <div class="wvis-check">${vis?'✓':''}</div>
    </div>`;
  }).join('');
  document.getElementById('wvis-ov').classList.add('open');
}
function closeWVis(){
  document.getElementById('wvis-ov').classList.remove('open');
  saveCfg();
  renderThreePages();
}
function toggleWidgetVis(wid,el){
  if(!cfg.hiddenWidgets)cfg.hiddenWidgets=['wsmk','wtb'];
  const idx=cfg.hiddenWidgets.indexOf(wid);
  if(idx>=0){cfg.hiddenWidgets.splice(idx,1);el.classList.add('active');el.querySelector('.wvis-check').textContent='✓';}
  else{cfg.hiddenWidgets.push(wid);el.classList.remove('active');el.querySelector('.wvis-check').textContent='';}
}
function isWidgetHidden(prefix){
  return cfg.hiddenWidgets&&cfg.hiddenWidgets.includes(prefix);
}

function initItemSwipes() {
  let sx=0, sy=0, sEl=null, sLocked=false;
  document.addEventListener('touchstart', e => {
    const el = e.target.closest('.sit-content');
    if(!el) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    sEl = el;
    sLocked = false;
    sEl.classList.add('swiping');
  }, {passive: true});
  document.addEventListener('touchmove', e => {
    if(!sEl) return;
    const dx = e.touches[0].clientX - sx;
    const dy = e.touches[0].clientY - sy;
    if(!sLocked) {
      if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) { sLocked = 'h'; }
      else if(Math.abs(dy) > 10) { sLocked = 'v'; sEl.classList.remove('swiping'); sEl = null; return; }
    }
    if(sLocked === 'h') {
      if(e.cancelable) e.preventDefault();
      const wrap = sEl.parentElement;
      const hasDel = !!sEl.dataset.del;
      const hasEdit = !!sEl.dataset.edit;
      let moveX = dx;
      if(dx > 0 && !hasDel) moveX = 0;
      if(dx < 0 && !hasEdit) moveX = 0;
      sEl.style.transform = `translateX(${moveX}px)`;
      if(moveX > 0) {
        wrap.style.background = '#ff3b30';
        wrap.querySelector('.sit-bg-l').style.display='flex';
        if(wrap.querySelector('.sit-bg-r')) wrap.querySelector('.sit-bg-r').style.display='none';
      } else if (moveX < 0) {
        wrap.style.background = '#34c759';
        wrap.querySelector('.sit-bg-l').style.display='none';
        if(wrap.querySelector('.sit-bg-r')) wrap.querySelector('.sit-bg-r').style.display='flex';
      } else {
        wrap.style.background='';
        if(wrap.querySelector('.sit-bg-l')) wrap.querySelector('.sit-bg-l').style.display='none';
        if(wrap.querySelector('.sit-bg-r')) wrap.querySelector('.sit-bg-r').style.display='none';
      }
    }
  }, {passive: false});
  document.addEventListener('touchend', e => {
    if(!sEl) return;
    const dx = e.changedTouches[0].clientX - sx;
    sEl.classList.remove('swiping');
    if(sLocked === 'h') {
      if(dx > 80 && sEl.dataset.del) { new Function(sEl.dataset.del)(); sEl.style.transform = 'translateX(0)'; }
      else if(dx < -80 && sEl.dataset.edit) { new Function(sEl.dataset.edit)(); sEl.style.transform = 'translateX(0)'; }
      else { sEl.style.transform = 'translateX(0)'; }
      const wrap=sEl?sEl.parentElement:null;
      if(wrap){wrap.style.background='';if(wrap.querySelector('.sit-bg-l'))wrap.querySelector('.sit-bg-l').style.display='none';if(wrap.querySelector('.sit-bg-r'))wrap.querySelector('.sit-bg-r').style.display='none';}
    }
    sEl = null; sLocked = false;
  }, {passive: true});
}

function initSwipe(){
  const wrap=document.getElementById('swipe-wrap');
  const inner=document.getElementById('swipe-inner');
  let sx=0,sy=0,locked=null,moved=false;
  wrap.addEventListener('touchstart',e=>{
    if(e.target.closest('.sit-content')||e.target.closest('.drgh')||e.target.closest('.step-inp')||e.target.closest('.exlist')||e.target.closest('.mlist'))return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;locked=null;moved=false;inner.classList.remove('no-anim');
  },{passive:true});
  wrap.addEventListener('touchmove',e=>{
    if(e.target.closest('.sit-content')||e.target.closest('.drgh')||e.target.closest('.step-inp')||e.target.closest('.exlist')||e.target.closest('.mlist'))return;
    const dx=e.touches[0].clientX-sx;const dy=e.touches[0].clientY-sy;
    if(!locked){if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8)locked='h';else if(Math.abs(dy)>8)locked='v';}
    if(locked==='h'){if(e.cancelable)e.preventDefault();inner.classList.add('no-anim');inner.style.transform=`translateX(calc(-33.333% + ${dx}px))`;moved=true;}
  },{passive:false});
  wrap.addEventListener('touchend',e=>{
    if(!moved)return;
    const dx=e.changedTouches[0].clientX-sx;inner.classList.remove('no-anim');
    if(dx<-50){inner.style.transform=`translateX(-66.666%)`;setTimeout(()=>shiftDays(1),280);}
    else if(dx>50){inner.style.transform=`translateX(0%)`;setTimeout(()=>shiftDays(-1),280);}
    else{inner.style.transform=`translateX(-33.333%)`;}
    locked=null;moved=false;
  },{passive:true});
}

function initCalSwipe(){
  const inner=document.getElementById('cal-swipe-inner');
  const ov=document.getElementById('ov-cal');
  let sx=0,sy=0,locked=null,moved=false;
  ov.addEventListener('touchstart',e=>{
    if(!e.target.closest('#cal-swipe-inner'))return;
    if(e.target.closest('.cal-navbtn'))return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;locked=null;moved=false;
    inner.style.transition='none';
  },{passive:true});
  ov.addEventListener('touchmove',e=>{
    const dx=e.touches[0].clientX-sx;const dy=e.touches[0].clientY-sy;
    if(!locked){if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8)locked='h';else if(Math.abs(dy)>8)locked='v';}
    if(locked==='h'){if(e.cancelable)e.preventDefault();inner.style.transform=`translateX(calc(-33.333% + ${dx}px))`;moved=true;}
  },{passive:false});
  ov.addEventListener('touchend',e=>{
    if(!moved){inner.style.transition='';inner.style.transform='translateX(-33.333%)';return;}
    const dx=e.changedTouches[0].clientX-sx;
    inner.style.transition='transform .28s cubic-bezier(.4,0,.2,1)';
    if(dx<-50){inner.style.transform='translateX(-66.666%)';setTimeout(()=>{calMove(1);inner.style.transition='none';inner.style.transform='translateX(-33.333%)';setTimeout(()=>inner.style.transition='',50);},280);}
    else if(dx>50){inner.style.transform='translateX(0%)';setTimeout(()=>{calMove(-1);inner.style.transition='none';inner.style.transform='translateX(-33.333%)';setTimeout(()=>inner.style.transition='',50);},280);}
    else{inner.style.transform='translateX(-33.333%)';}
    locked=null;moved=false;
  },{passive:true});
}

function openCheat(key) {
  cheatKey = key;
  editCmName = null;
  pendIco.ch = '🍩';
  document.getElementById('ch-ico').textContent = '🍩';
  document.getElementById('ch-name').value = '';
  document.getElementById('ch-cals').value = '';
  document.getElementById('ch-desc').value = '';
  document.getElementById('ch-type').value = 'Snack';
  document.getElementById('btn-save-cheat').textContent = '+ Eintragen';

  const seen=new Map();
  Object.values(logs).forEach(l=>{if(l.cm)l.cm.forEach(c=>{if(c.name&&!seen.has(c.name))seen.set(c.name,c);});});
  const prevList=document.getElementById('cm-prev-list');
  const prevSection=document.getElementById('cm-prev-section');

  if(seen.size){
    prevSection.style.display='';
    prevList.style.maxHeight='220px';
    prevList.style.overflowY='auto';
    prevList.style.overflowX='hidden';
    prevList.innerHTML=[...seen.values()].map(c=>`
      <div class="sit-wrap">
        <div class="sit-bg sit-bg-l">🗑</div>
        <div class="sit-bg sit-bg-r">✏️</div>
        <div class="sit-content cm-prev-item" style="margin-bottom:0" data-del="delPrevCheat('${c.name.replace(/'/g,"\\'")}')" data-edit="editPrevCheat('${c.name.replace(/'/g,"\\'")}')" onclick="pickPrevCheat(${JSON.stringify(c).replace(/"/g,'&quot;')})">
          <span style="font-size:18px">${c.icon||'🍩'}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${c.name}</div>
            ${c.cals?`<div style="font-size:11px;color:var(--muted)">${c.cals} kcal · ${c.type||'Snack'}</div>`:''}
          </div>
        </div>
      </div>`).join('');
  } else {
    prevSection.style.display='none';
    prevList.innerHTML='';
  }
  document.getElementById('ov-cheat').classList.add('open');
}
function pickPrevCheat(c){
  if (editCmName) return;
  document.getElementById('ch-name').value=c.name||'';
  document.getElementById('ch-cals').value=c.cals||'';
  document.getElementById('ch-desc').value=c.desc||'';
  document.getElementById('ch-type').value=c.type||'Snack';
  pendIco.ch=c.icon||'🍩';
  document.getElementById('ch-ico').textContent=pendIco.ch;
  document.querySelectorAll('.cm-prev-item').forEach(el=>el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}
function editPrevCheat(name) {
  const seen=new Map();
  Object.values(logs).forEach(l=>{if(l.cm)l.cm.forEach(c=>{if(c.name&&!seen.has(c.name))seen.set(c.name,c);});});
  const c = seen.get(name);
  if(!c) return;
  editCmName = name;
  document.getElementById('ch-name').value = c.name || '';
  document.getElementById('ch-cals').value = c.cals || '';
  document.getElementById('ch-desc').value = c.desc || '';
  document.getElementById('ch-type').value = c.type || 'Snack';
  pendIco.ch = c.icon || '🍩';
  document.getElementById('ch-ico').textContent = pendIco.ch;
  document.querySelectorAll('.cm-prev-item').forEach(el=>el.classList.remove('selected'));
  document.getElementById('btn-save-cheat').textContent = '💾 Speichern';
}
function delPrevCheat(name) {
  if(!confirm('Dieses Cheat Meal aus dem Verlauf löschen?')) return;
  Object.values(logs).forEach(l => {
    if(l.cm) l.cm = l.cm.filter(c => c.name !== name);
  });
  saveLogs();
  buildPage('page-curr', activeDate);
  openCheat(cheatKey);
}
function saveCheat() {
  const name = document.getElementById('ch-name').value.trim();
  const cals = parseInt(document.getElementById('ch-cals').value) || 0;
  const desc = document.getElementById('ch-desc').value.trim();
  const type = document.getElementById('ch-type').value;
  if (!name) { showToast('⚠️ Name fehlt'); return; }
  if (editCmName) {
    Object.values(logs).forEach(l => {
      if (l.cm) {
        l.cm.forEach(c => {
          if (c.name === editCmName) {
            c.name = name;
            c.cals = cals;
            c.desc = desc;
            c.type = type;
            c.icon = pendIco.ch;
          }
        });
      }
    });
    showToast('🍩 Cheat Meal aktualisiert!');
    editCmName = null;
  } else {
    const log = glog(cheatKey);
    if (!log.cm) log.cm = [];
    log.cm.push({ id: 'c' + Date.now(), icon: pendIco.ch, name, cals, desc, type });
    showToast('🍩 Cheat Meal eingetragen!');
  }
  saveLogs();
  closeCheat();
  buildPage('page-curr', activeDate);
}
function closeCheat(){
  document.getElementById('ov-cheat').classList.remove('open');
  editCmName = null;
}
function tglRep(exId, si, maxReps, key) {
  const log = glog(key);
  if(!log.ed[exId]) log.ed[exId] = [];
  const cur = Number(log.ed[exId][si]) || 0;
  log.ed[exId][si] = cur > 0 ? 0 : maxReps;
  saveLogs();
  patchFitness(log, key);
}

function delCheat(id,key){
  if(!confirm('Cheat-Meal löschen?')) return;
  const log=glog(key);
  if(log.cm){log.cm=log.cm.filter(c=>c.id!==id);saveLogs();buildPage('page-curr', activeDate);}
}

function toKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function getOffsetDate(d, off){const nd = new Date(d);nd.setDate(nd.getDate() + off);return nd;}
function shiftDays(off){activeDate.setDate(activeDate.getDate()+off);renderThreePages();}
function jumpToDate(d){activeDate=new Date(d);activeDate.setHours(0,0,0,0);renderThreePages();}

function saveCfg(){localStorage.setItem('dtc',JSON.stringify(cfg));}
function saveLogs(){localStorage.setItem('dtl',JSON.stringify(logs));}
function loadAll(){
  try {
    const c = localStorage.getItem('dtc');
    if(c) {
      const parsed = JSON.parse(c);
      cfg = {...cfg, ...parsed};
      if(!cfg.hiddenWidgets) cfg.hiddenWidgets = ['wsmk', 'wtb'];
      
      // WICHTIG: Den globalen sortMode auf den gespeicherten Wert setzen
      if(cfg.sortMode) {
        sortMode = cfg.sortMode;
      }
    }
  } catch(e) { console.error("Cfg load error", e); }
  
  try {
    const l = localStorage.getItem('dtl');
    if(l) logs = JSON.parse(l);
  } catch(e) { console.error("Logs load error", e); }
}

function glog(key){
  if(!logs[key])logs[key]={wf:[],ed:{},md:{},sc:0,order:[],open:[],smokedArr:[],ew:{},tb:[]};
  if(!logs[key].smokedArr){
    const n=logs[key].smoked||0;
    logs[key].smokedArr=Array.from({length:n},()=>true);
    delete logs[key].smoked;
  }
  if(!logs[key].ew)logs[key].ew={};
  if(!logs[key].tb)logs[key].tb=[];
  return logs[key];
}

function getGlobalOrder(){
  return cfg.widgetOrder && cfg.widgetOrder.length ? cfg.widgetOrder : ['ws','ww','wf','wm','wg','wsmk','wtb'];
}
function saveGlobalOrder(widgets){
  cfg.widgetOrder=[...widgets].map(w=>{
    const id=w.id;
    const prefix=id.split('-')[0];
    return prefix;
  });
  saveCfg();
}

function renderThreePages(){
  const inner=document.getElementById('swipe-inner');
  inner.classList.add('no-anim');
  inner.style.transform='translateX(-33.333%)';
  const p = getOffsetDate(activeDate,-1);
  const c = activeDate;
  const n = getOffsetDate(activeDate,1);
  buildPage('page-prev', p);
  buildPage('page-curr', c);
  buildPage('page-next', n);
  const todayStr = toKey(new Date());
  const isToday = toKey(c) === todayStr;
  document.getElementById('hdr-title').textContent = isToday ? 'Heute' : DS_LONG[JS2D[c.getDay()]];
  document.getElementById('hdr-date').textContent = c.getDate()+'. '+MONTH_DE[c.getMonth()]+' '+c.getFullYear();
  setTimeout(()=>inner.classList.remove('no-anim'),50);
}

function buildPage(cid, d){
  const c = document.getElementById(cid);
  if(!c) return;
  c.innerHTML = '';
  const key = toKey(d);
  const log = glog(key);
  const wlist = document.createElement('div');
  wlist.id = 'wlist-' + key;
  wlist.className = 'wlist';

  const ng = Math.ceil(cfg.water.goalMl / cfg.water.glassMl);
  while(log.wf.length < ng) log.wf.push(false);
  
  const tbGoal = cfg.teeth ? cfg.teeth.goal || 2 : 2;
  while(log.tb.length < tbGoal) log.tb.push(false);

  const dayExs = forDayKey(cfg.exercises, key);
  const dayMls = forDayKey(cfg.meals, key);

  const widgetMap = {};
  widgetMap['ws'] = mkSteps(log, key);
  widgetMap['ww'] = mkWater(log, ng, key);
  widgetMap['wtb'] = mkTeeth(log, key);
  widgetMap['wf'] = dayExs.length ? mkFitness(log, dayExs, key) : null;
  widgetMap['wm'] = (dayMls.length || (log.cm && log.cm.length)) ? mkMeals(log, dayMls, key) : null;
  widgetMap['wg'] = mkWeight(log, key);
  widgetMap['wsmk'] = mkSmoke(log, key);

  const order = getGlobalOrder();
  order.forEach(prefix=>{
    const w = widgetMap[prefix];
    if(!w) return;
    if(isWidgetHidden(prefix)){w.classList.add('hidden-widget');}
    wlist.appendChild(w);
  });
  Object.keys(widgetMap).forEach(prefix=>{
    if(!order.includes(prefix)&&widgetMap[prefix]){
      if(isWidgetHidden(prefix))widgetMap[prefix].classList.add('hidden-widget');
      wlist.appendChild(widgetMap[prefix]);
    }
  });

  c.appendChild(wlist);

  const openIds = log.open.length ? log.open : ['ws-'+key, 'ww-'+key, 'wf-'+key, 'wm-'+key, 'wg-'+key, 'wsmk-'+key, 'wtb-'+key];
  wlist.querySelectorAll('.widget').forEach(w => w.classList.toggle('open', openIds.includes(w.id)));

  applySort(key);
  initDrag(log, key);
}

function dowFromDate(d){return JS2D[d.getDay()];}

function forDayKey(arr, key) {
  const d = new Date(key);
  const dow = JS2D[d.getDay()];
  const todayKey = toKey(new Date());
  return arr.filter(it => {
    if(it.addedAt && key < it.addedAt) return false;
    if (!it.groupId) return true;
    const g = cfg.groups.find(g => g.id === it.groupId);
    if (!g) return true;
    if (g.inactive) return false;
    return !g.days || g.days.length === 0 || g.days.includes(dow);
  });
}

function mkWater(log,ng,key){
  const f=log.wf.filter(Boolean).length;
  const ml=f*cfg.water.glassMl;
  const pct=Math.min(100,Math.round(ml/cfg.water.goalMl*100));
  const w=document.createElement('div');
  w.className='widget open'+(pct>=100?' done':'');w.id='ww-'+key;w.dataset.o=0;
  w.innerHTML=`<div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('ww-${key}','${key}')">
      <div class="wico wt" style="background:rgba(96,200,240,0.2)">💧</div>
      <div class="wtit"><b>Wasser</b><small>${f}/${ng} Gläser · ${pct}%</small></div>
      <div class="wchev">▾</div></div>
    <div class="wbody">
      <div class="prog"><div class="pbar"><div class="pfill w" style="width:${pct}%"></div></div>
        <div class="plbl"><span>${ml} ml</span><span>${cfg.water.goalMl} ml</span></div></div>
      <div class="glasses">${log.wf.map((v,i)=>`
        <div class="gbtn ${v?'on':''}" onclick="tgl(${i},'${key}')">
          <span>${v?'💧':'🥤'}</span><small>${cfg.water.glassMl}ml</small>
        </div>`).join('')}<div class="gbtn extra-add" onclick="addExtraGlass('${key}')"><span>＋</span><small>extra</small></div>
      </div></div>`;
  return w;
}
function tgl(i,key){
  const l=glog(key);
  const ng=Math.ceil(cfg.water.goalMl/cfg.water.glassMl);
  if(i >= ng) {
    l.wf[i] = !l.wf[i];
    if(!l.wf[i]) l.wf.splice(i, 1);
  } else {
    const lastActive = l.wf.slice(0, ng).lastIndexOf(true);
    if(lastActive === i) {
      for(let x=0;x<ng;x++) l.wf[x]=false;
    } else {
      for(let x=0;x<ng;x++) l.wf[x]=x<=i;
    }
  }
  saveLogs();buildPage('page-curr',activeDate);
}
function addExtraGlass(key){
  const l=glog(key);
  l.wf.push(true);
  saveLogs();buildPage('page-curr',activeDate);
}

function mkTeeth(log, key) {
  const goal = cfg.teeth ? cfg.teeth.goal || 2 : 2;
  if(!log.tb) log.tb = [];
  const arr = log.tb;
  const doneCount = arr.filter(Boolean).length;
  const pct = Math.min(100, Math.round(doneCount / goal * 100));
  const isDone = doneCount >= goal;
  const w = document.createElement('div');
  w.className = 'widget open' + (isDone ? ' done' : ''); w.id = 'wtb-' + key; w.dataset.o = 5;
  let html = '';
  for(let i = 0; i < arr.length || i < goal; i++) {
    const isBrushed = !!arr[i];
    if(i < goal) {
      html += `<div class="gbtn ${isBrushed ? 'on tb-on' : ''}" onclick="tglTeeth(${i},'${key}')">
        <span>${isBrushed ? '😁' : '🦷'}</span><small>${i+1}</small>
      </div>`;
    } else {
      html += `<div class="gbtn on tb-on" onclick="tglTeeth(${i},'${key}')">
        <span>🦷</span><small>+${i-goal+1}</small>
      </div>`;
    }
  }
  w.innerHTML = `<div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('wtb-${key}','${key}')">
      <div class="wico" style="background:rgba(96,240,200,0.2)">🦷</div>
      <div class="wtit"><b>Zähneputzen</b><small>${doneCount}/${goal} mal · ${pct}%</small></div>
      <div class="wchev">▾</div></div>
    <div class="wbody">
      <div class="prog"><div class="pbar"><div class="pfill tb" style="width:${pct}%"></div></div>
        <div class="plbl"><span>${doneCount} erledigt</span><span>Ziel: ${goal}</span></div></div>
      <div class="glasses tb-grid">${html}<div class="gbtn extra-add" onclick="addExtraTeeth('${key}')"><span>＋</span><small>extra</small></div></div>
    </div>`;
  return w;
}
function tglTeeth(i, key) {
  const log = glog(key);
  const goal = cfg.teeth ? cfg.teeth.goal || 2 : 2;
  if(!log.tb) log.tb = [];
  const arr = log.tb;
  if(i >= goal) {
    if(i < arr.length) {
      arr[i] = !arr[i];
      if(!arr[i]) arr.splice(i, 1);
    }
  } else {
    while(arr.length < goal) arr.push(false);
    const lastActive = arr.slice(0, goal).lastIndexOf(true);
    if(lastActive === i) {
      for(let x=0;x<goal;x++) arr[x]=false;
    } else {
      for(let x=0;x<goal;x++) arr[x]=x<=i;
    }
  }
  saveLogs(); buildPage('page-curr', activeDate);
}
function addExtraTeeth(key) {
  const log = glog(key);
  if(!log.tb) log.tb = [];
  const goal = cfg.teeth ? cfg.teeth.goal || 2 : 2;
  const arr = log.tb;
  while(arr.length < goal) arr.push(false);
  arr.push(true);
  saveLogs(); buildPage('page-curr', activeDate);
}

function mkSteps(log,key){
  const sc=log.sc||0;const goal=cfg.steps.goal||10000;const pct=Math.min(100,Math.round(sc/goal*100));
  const w=document.createElement('div');
  w.className='widget open'+(pct>=100?' done':'');w.id='ws-'+key;w.dataset.o=-1;
  w.innerHTML=`<div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('ws-${key}','${key}')">
      <div class="wico" style="background:rgba(240,208,96,0.2)">👟</div>
      <div class="wtit"><b>Schritte</b><small>${sc.toLocaleString('de')} / ${goal.toLocaleString('de')} · ${pct}%</small></div>
      <div class="wchev">▾</div></div>
    <div class="wbody">
      <div class="prog"><div class="pbar"><div class="pfill s" style="width:${pct}%"></div></div>
        <div class="plbl"><span>${sc.toLocaleString('de')} Schritte</span><span>${goal.toLocaleString('de')}</span></div></div>
      <input class="step-inp" type="number" value="${sc||''}" placeholder="0" min="0"
        oninput="setSteps(this.value,'${key}')" inputmode="numeric">
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px;background:rgba(255,255,255,0.05);border-radius:var(--rsm);padding:10px 12px">
        <span style="font-size:20px">🗺️</span>
        <span style="font-size:13px;color:var(--muted);flex:1">Gegangene km</span>
        <span class="km-txt" style="font-size:15px;font-weight:700;color:var(--text)">${sc>0?(sc*0.000762).toFixed(1):'-'} km</span>
      </div>
    </div>`;
  return w;
}

function patchSteps(log,key){
  const sc=log.sc||0;const goal=cfg.steps.goal||10000;const pct=Math.min(100,Math.round(sc/goal*100));
  const ws=document.getElementById('ws-'+key);if(!ws)return;
  ws.querySelector('.wtit small').textContent=`${sc.toLocaleString('de')} / ${goal.toLocaleString('de')} · ${pct}%`;
  const pf=ws.querySelector('.pfill');if(pf)pf.style.width=pct+'%';
  ws.querySelector('.plbl').children[0].textContent=sc.toLocaleString('de')+' Schritte';
  const kmEl=ws.querySelector('.km-txt');if(kmEl)kmEl.textContent=sc>0?(sc*0.000762).toFixed(1)+' km':'- km';
  ws.classList.toggle('done',pct>=100);
}
function setSteps(val,key){const log=glog(key);log.sc=Math.max(0,parseInt(val)||0);saveLogs();patchSteps(log,key);}

function setWeight(val, key) {
  let num = parseFloat(val.replace(',', '.')) || 0;
  num = Math.round(num * 100) / 100;
  const log = glog(key);
  log.wg = num;
  saveLogs();
  const wg = document.getElementById('wg-'+key);
  if(wg){
    wg.classList.toggle('done', num > 0);
    const sub = wg.querySelector('.wtit small');
    if(sub) sub.textContent = num > 0 ? num.toLocaleString('de-DE') + ' kg' : 'Eintragen...';
  }
}

function mkWeight(log, key) {
  const curWeight = log.wg || 0;
  const d = new Date(key);d.setDate(d.getDate() - 7);
  const oldKey = toKey(d);const oldLog = logs[oldKey];
  const oldWeight = (oldLog && oldLog.wg) ? oldLog.wg : 0;
  let diffText = "Kein Vergleich", diffClass = "";
  if (curWeight > 0 && oldWeight > 0) {
    const diff = (curWeight - oldWeight).toFixed(2);
    if (diff > 0){diffText=`+${diff} kg`;diffClass="plus";}
    else if (diff < 0){diffText=`${diff} kg`;diffClass="minus";}
    else{diffText="±0 kg";}
  }
  const isDone = curWeight > 0;
  const w = document.createElement('div');
  w.className = 'widget open'+(isDone?' done':'');w.id = 'wg-' + key;w.dataset.o = 3;
  w.innerHTML = `
    <div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('wg-${key}','${key}')">
      <div class="wico" style="background:rgba(160, 96, 240, 0.2)">⚖️</div>
      <div class="wtit"><b>Gewicht</b><small>${curWeight > 0 ? curWeight.toLocaleString('de-DE') + ' kg' : 'Eintragen...'}</small></div>
      <div class="wchev">▾</div>
    </div>
    <div class="wbody">
      <div class="weight-row">
        <input class="weight-inp" type="number" step="0.01" value="${curWeight || ''}" 
          placeholder="0,00" 
          onchange="setWeight(this.value, '${key}')" 
          onfocus="if(this.value=='0')this.value=''"
          inputmode="decimal">
        <div class="weight-stats">
          <div style="margin-bottom:2px">Vor 7 Tagen: ${oldWeight > 0 ? oldWeight.toLocaleString('de-DE') + ' kg' : '-'}</div>
          <div class="weight-diff ${diffClass}">${diffText}</div>
        </div>
      </div>
    </div>`;
  return w;
}

function mkSmoke(log, key) {
  if(!cfg.smoke) cfg.smoke = {goal:20};
  const goal = cfg.smoke.goal || 20;
  if(!log.smokedArr) log.smokedArr = [];
  const arr = log.smokedArr;
  const smoked = arr.filter(Boolean).length;
  const remaining = Math.max(0, goal - smoked);
  const pct = Math.round(remaining / goal * 100);
  const isDone = smoked >= goal;
  const w = document.createElement('div');
  w.className = 'widget open' + (isDone ? ' done' : ''); w.id = 'wsmk-' + key; w.dataset.o = 4;
  let cigHtml = '';
  for(let i = 0; i < arr.length || i < goal; i++) {
    const isSmoked = !!arr[i];
    if(i < goal) {
      cigHtml += `<div class="gbtn ${isSmoked ? 'on smk-on' : ''}" onclick="tglSmoke(${i},'${key}')">
        <span>${isSmoked ? '🚬' : '🚭'}</span><small>${i+1}</small>
      </div>`;
    } else {
      cigHtml += `<div class="gbtn on smk-on" onclick="tglSmoke(${i},'${key}')">
        <span>🚬</span><small>+${i-goal+1}</small>
      </div>`;
    }
  }
  const extra = arr.length > goal ? arr.filter(Boolean).length - Math.min(smoked, goal) : 0;
  const subtitle = smoked === 0 ? `Keine geraucht · 100%`
    : arr.length > goal ? `${smoked} geraucht (+${arr.length-goal} extra) · 0%`
    : `${smoked}/${goal} geraucht · ${pct}%`;
  w.innerHTML = `<div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('wsmk-${key}','${key}')">
      <div class="wico" style="background:rgba(200,120,60,0.2)">🚬</div>
      <div class="wtit"><b>Rauchen</b><small>${subtitle}</small></div>
      <div class="wchev">▾</div></div>
    <div class="wbody">
      <div class="prog"><div class="pbar"><div class="pfill smk" style="width:${pct}%"></div></div>
        <div class="plbl"><span>${remaining} übrig</span><span>Limit: ${goal}</span></div></div>
      <div class="glasses smk-grid">${cigHtml}<div class="gbtn extra-add" onclick="addExtraSmoke('${key}')"><span>＋</span><small>extra</small></div></div>
    </div>`;
  return w;
}
function tglSmoke(i, key) {
  const log = glog(key);
  const goal = cfg.smoke ? cfg.smoke.goal||20 : 20;
  if(!log.smokedArr) log.smokedArr = [];
  const arr = log.smokedArr;
  if(i >= goal) {
    if(i < arr.length) {
      arr[i] = !arr[i];
      if(!arr[i]) arr.splice(i, 1);
    }
  } else {
    while(arr.length < goal) arr.push(false);
    const lastActive = arr.slice(0, goal).lastIndexOf(true);
    if(lastActive === i) {
      for(let x=0;x<goal;x++) arr[x]=false;
    } else {
      for(let x=0;x<goal;x++) arr[x]=x<=i;
    }
  }
  saveLogs(); patchSmoke(log, key);
}
function addSmoke(n, key) {
  const log = glog(key);
  log.smoked = Math.max(0, (log.smoked||0) + n);
  saveLogs(); patchSmoke(log, key);
}
function setSmokeDirect(val, key) {
  const log = glog(key);
  log.smoked = Math.max(0, val);
  saveLogs(); patchSmoke(log, key);
}
function addExtraSmoke(key) {
  const log = glog(key);
  if(!log.smokedArr) log.smokedArr = [];
  const goal = cfg.smoke ? cfg.smoke.goal||20 : 20;
  const arr = log.smokedArr;
  while(arr.length < goal) arr.push(false);
  arr.push(true);
  saveLogs(); patchSmoke(log, key);
}
function patchSmoke(log, key) {
  const goal = cfg.smoke ? cfg.smoke.goal||20 : 20;
  if(!log.smokedArr) log.smokedArr = [];
  const arr = log.smokedArr;
  const smoked = arr.filter(Boolean).length;
  const remaining = Math.max(0, goal - smoked);
  const pct = Math.round(remaining / goal * 100);
  const wsmk = document.getElementById('wsmk-'+key); if(!wsmk) return;
  const subtitle = smoked === 0 ? `Keine geraucht · 100%`
    : arr.length > goal ? `${smoked} geraucht (+${arr.length-goal} extra) · 0%`
    : `${smoked}/${goal} geraucht · ${pct}%`;
  wsmk.querySelector('.wtit small').textContent = subtitle;
  const pf = wsmk.querySelector('.pfill.smk'); if(pf) pf.style.width = pct+'%';
  const plbl = wsmk.querySelector('.plbl');
  if(plbl){ plbl.children[0].textContent = remaining+' übrig'; plbl.children[1].textContent = 'Limit: '+goal; }
  wsmk.classList.toggle('done', smoked >= goal);
  const grid = wsmk.querySelector('.smk-grid');
  if(grid){
    let cigHtml = '';
    for(let i = 0; i < arr.length || i < goal; i++) {
      const isSmoked = !!arr[i];
      if(i < goal) {
        cigHtml += `<div class="gbtn ${isSmoked ? 'on smk-on' : ''}" onclick="tglSmoke(${i},'${key}')">
          <span>${isSmoked ? '🚬' : '🚭'}</span><small>${i+1}</small>
        </div>`;
      } else {
        cigHtml += `<div class="gbtn on smk-on" onclick="tglSmoke(${i},'${key}')">
          <span>🚬</span><small>+${i-goal+1}</small>
        </div>`;
      }
    }
    cigHtml += `<div class="gbtn extra-add" onclick="addExtraSmoke('${key}')"><span>＋</span><small>extra</small></div>`;
    grid.innerHTML = cigHtml;
  }
}

function countDone(log,ex){return(log.ed[ex.id]||[]).filter(v=>Number(v)>0).length;}
function countDoneEx(log,ex){return(log.ed[ex.id]||[]).filter(v=>Number(v)>0).length;}

function mkFitness(log, exs, key) {
  let tot = 0, done = 0;
  exs.forEach(ex => {
    const effectiveSets = ex.oneArm ? ex.sets * 2 : ex.sets;
    tot += effectiveSets;
    done += countDoneEx(log, ex);
  });
  const pct = tot > 0 ? Math.round(done / tot * 100) : 0;
  const dex = exs.filter(ex => countDoneEx(log, ex) >= (ex.oneArm ? ex.sets*2 : ex.sets)).length;
  let html = '';
  exs.forEach(ex => {
    const effectiveSets = ex.oneArm ? ex.sets * 2 : ex.sets;
    const vals = log.ed[ex.id] || [];
    const exWeight = (log.ew && log.ew[ex.id]) || '';
    const d = countDoneEx(log, ex);
    let sh = '';
    if(ex.oneArm){
      let rH='<div class="srow" style="margin-bottom:6px">';
      let lH='<div class="srow">';
      for(let s=0;s<ex.sets;s++){
        const rI=s*2,lI=s*2+1;
        const rV=vals[rI]??'',rD=Number(rV)>0;
        const lV=vals[lI]??'',lD=Number(lV)>0;
        rH+=`<div class="spill ${rD?'done':''}" data-si="${rI}"><span>R${s+1}:</span><input type="number" value="${rV}" placeholder="0" min="0" max="999" oninput="setRep('${ex.id}',${rI},this.value,'${key}')" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'" style="color:inherit;width:28px;background:transparent;border:none;text-align:right;font-weight:bold;font-size:14px;outline:none;padding:0" inputmode="numeric"><span>/${ex.maxReps}</span></div>`;
        lH+=`<div class="spill ${lD?'done':''}" data-si="${lI}"><span>L${s+1}:</span><input type="number" value="${lV}" placeholder="0" min="0" max="999" oninput="setRep('${ex.id}',${lI},this.value,'${key}')" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'" style="color:inherit;width:28px;background:transparent;border:none;text-align:right;font-weight:bold;font-size:14px;outline:none;padding:0" inputmode="numeric"><span>/${ex.maxReps}</span></div>`;
      }
      rH+='</div>';lH+='</div>';
      sh=rH+lH;
    }else{
      sh='<div class="srow">';
      for(let s=0;s<ex.sets;s++){
        const v=vals[s]??'',iD=Number(v)>0;
        sh+=`<div class="spill ${iD?'done':''}" data-si="${s}"><span>S${s+1}:</span><input type="number" value="${v}" placeholder="0" min="0" max="999" oninput="setRep('${ex.id}',${s},this.value,'${key}')" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'" style="color:inherit;width:28px;background:transparent;border:none;text-align:right;font-weight:bold;font-size:14px;outline:none;padding:0" inputmode="numeric"><span>/${ex.maxReps}</span></div>`;
      }
      sh+='</div>';
    }
    const g = ex.groupId ? cfg.groups.find(g => g.id === ex.groupId) : null;
    html += `<div class="exitem">
      <div class="extop">
        <span style="font-size:16px">${ex.icon || '🏋️'}</span>
        <span class="exname">${ex.name}${ex.oneArm ? ' <span style="font-size:9px;padding:1px 5px;border-radius:99px;background:rgba(96,200,240,.15);color:var(--accent2)">einarmig</span>' : ''}</span>
        <span class="exbadge">${d}/${effectiveSets} ✓</span>
        ${g ? `<span style="font-size:10px;padding:2px 6px;border-radius:99px;background:${g.color}22;color:${g.color};font-weight:600">${g.name}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:11px;color:var(--muted)">⚖️ Gewicht:</span>
        <input type="number" step="0.5" value="${exWeight}" placeholder="kg" min="0"
          oninput="setExWeight('${ex.id}',this.value,'${key}')"
          style="width:60px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px 7px;color:var(--text);font-size:12px;font-family:inherit;outline:none;text-align:center" inputmode="decimal">
        <span style="font-size:11px;color:var(--muted)">kg</span>
      </div>
      <div>${sh}</div></div>`;
  });
  const w = document.createElement('div');
  w.className = 'widget open' + (pct >= 100 ? ' done' : ''); w.id = 'wf-' + key; w.dataset.o = 1;
  w.style.background = 'rgba(240, 96, 96, 0.12)';
  w.style.border = '1px solid rgba(240, 96, 96, 0.2)';
  w.innerHTML = `<div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('wf-${key}','${key}')">
      <div class="wico wf" style="background:rgba(240, 96, 96, 0.2)">🏋️</div>
      <div class="wtit"><b>Übungen</b><small>${dex}/${exs.length} Einheiten · ${done}/${tot} Sätze</small></div>
      <div class="wchev">▾</div></div>
    <div class="wbody">
      <div class="prog"><div class="pbar"><div class="pfill f" style="width:${pct}%"></div></div>
        <div class="plbl"><span>${done} erledigt</span><span>${tot} Sätze</span></div></div>
      <div class="exlist">${html || '<div class="empty">Keine Übungen für heute.</div>'}</div></div>`;
  return w;
}
function setRep(exId, si, val, key) {
  const log = glog(key);
  if (!log.ed[exId]) log.ed[exId] = [];
  
  const num = parseInt(val) || 0;
  log.ed[exId][si] = num;
  
  saveLogs();
  patchFitness(log, key);
}

function setExWeight(exId, val, key) {
  const log = glog(key);
  if (!log.ew) log.ew = {};
  
  let num = parseFloat(val.replace(',', '.')) || 0;
  log.ew[exId] = num;
  
  saveLogs();
}
function patchFitness(log,key){
  const dayExs=forDayKey(cfg.exercises,key);
  let tot=0,done=0;
  dayExs.forEach(ex=>{
    const eff = ex.oneArm ? ex.sets*2 : ex.sets;
    tot+=eff;
    done+=countDoneEx(log,ex);
  });
  const pct=tot>0?Math.round(done/tot*100):0;
  const wf=document.getElementById('wf-'+key);if(!wf)return;
  const doneEx=dayExs.filter(ex=>countDoneEx(log,ex)>=(ex.oneArm?ex.sets*2:ex.sets)).length;
  const sub=wf.querySelector('.wtit small');if(sub)sub.textContent=`${doneEx}/${dayExs.length} Einheiten · ${done}/${tot} Sätze`;
  const pf=wf.querySelector('.pfill.f');if(pf)pf.style.width=pct+'%';
  const pl=wf.querySelector('.plbl');if(pl)pl.children[0].textContent=done+' erledigt';
  wf.querySelectorAll('.exitem').forEach((item,ei)=>{
    const ex=dayExs[ei];if(!ex)return;
    const eff=ex.oneArm?ex.sets*2:ex.sets;
    const d=countDoneEx(log,ex);
    const badge=item.querySelector('.exbadge');if(badge)badge.textContent=`${d}/${eff} ✓`;
    const vals=log.ed[ex.id]||[];
    item.querySelectorAll('.spill').forEach(p => {
      const si = p.getAttribute('data-si');
      p.classList.toggle('done', Number(vals[si]) > 0);
    });
  });
  wf.classList.toggle('done',pct>=100);
}
function mkMeals(log, meals, key) {
  if (!cfg.calories) cfg.calories = { goal: 2000 };
  if (!log.cm) log.cm = [];
  let chkCals = 0;
  meals.forEach(m => {
    const ts = m.types && m.types.length ? m.types : (m.type ? [m.type] : ['Snack']);
    ts.forEach(t => { if (log.md[m.id + '_' + t]) chkCals += (m.cals || 0); });
  });
  log.cm.forEach(c => { chkCals += (c.cals || 0); });
  const goal = cfg.calories.goal;
  const pct = Math.min(100, Math.round(chkCals / goal * 100));
  const order = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'];
  const grouped = {};
  order.forEach(o => grouped[o] = []);
  meals.forEach(m => {
    const ts = m.types && m.types.length ? m.types : (m.type ? [m.type] : ['Snack']);
    ts.forEach(t => { if (grouped[t]) grouped[t].push({ ...m, currentType: t, isCheat: false }); });
  });
  log.cm.forEach(c => {
    const t = c.type || 'Snack';
    if (grouped[t]) grouped[t].push({ ...c, currentType: t, isCheat: true });
  });
  let html = '';
  order.forEach(t => {
    if (!grouped[t] || !grouped[t].length) return;
    html += `<div style="font-size:11px;color:var(--muted);margin:12px 0 6px 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${t}</div>`;
    grouped[t].forEach(m => {
      if (m.isCheat) {
        html += `<div class="mitem cheat" onclick="delCheat('${m.id}','${key}')" style="cursor:pointer;border-left:3px solid #c8f060;padding-left:10px;background:rgba(255,255,255,0.03);margin-bottom:4px;">
            <div class="minf">
              <div class="mtim" style="color:#c8f060;font-weight:bold;">${(m.cals||0).toLocaleString('de')} kcal</div>
              <div class="mnam">${m.icon||'🍩'} ${m.name}</div>
              ${m.desc?`<div class="mdsc">${m.desc}</div>`:''}
            </div></div>`;
      } else {
        const itemKey = m.id + '_' + m.currentType;
        const on = !!log.md[itemKey];
        html += `<div class="mitem" onclick="tglM('${itemKey}','${key}')" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:4px;">
            <div class="minf">
              <div class="mtim">${(m.cals||0).toLocaleString('de')} kcal</div>
              <div class="mnam" style="${on?'text-decoration:line-through;opacity:.6':''}">${m.icon||''} ${m.name}</div>
              ${m.desc?`<div class="mdsc">${m.desc}</div>`:''}
            </div>
            <div class="mchk ${on?'on':''}" style="margin-left:10px;flex-shrink:0;">${on?'✓':''}</div>
          </div>`;
      }
    });
  });
  const w = document.createElement('div');
  w.className = 'widget open' + (pct >= 100 ? ' done' : ''); w.id = 'wm-' + key; w.dataset.o = 2;
  w.style.background = 'rgba(200, 240, 96, 0.12)';
  w.style.border = '1px solid rgba(200, 240, 96, 0.2)';
  w.innerHTML = `<div class="drgh"><span>⠿</span></div>
    <div class="whdr" onclick="twid('wm-${key}','${key}')">
      <div class="wico wm" style="background:rgba(200, 240, 96, 0.2)">🥗</div>
      <div class="wtit"><b>Mahlzeiten</b><small>${chkCals.toLocaleString('de')} / ${goal.toLocaleString('de')} kcal · ${pct}%</small></div>
      <div class="wchev">▾</div></div>
    <div class="wbody">
      <div class="prog"><div class="pbar"><div class="pfill m" style="width:${pct}%"></div></div>
        <div class="plbl"><span>${chkCals.toLocaleString('de')} kcal</span><span>${goal.toLocaleString('de')} kcal</span></div></div>
      <div class="mlist">${html || '<div class="empty">Keine Einträge für heute.</div>'}</div>
      <button class="btn gy full" style="margin-top:12px;background:rgba(255,255,255,0.05)" onclick="openCheat('${key}')">+ Ungeplantes Essen</button>
    </div>`;
  return w;
}

function tglM(itemKey, key){
  const log = glog(key);log.md[itemKey] = !log.md[itemKey];saveLogs();buildPage('page-curr', activeDate);
}

function twid(id,key){
  const el=document.getElementById(id);if(!el)return;
  el.classList.toggle('open');
  const log=glog(key);
  log.open=[...document.querySelectorAll('#wlist-'+key+' .widget.open')].map(w=>w.id);
  saveLogs();
}

function setSort(m,el){
  sortMode=m;
  cfg.sortMode=m;
  saveCfg();
  document.querySelectorAll('.bbar-sort .schip').forEach(c=>c.classList.remove('active'));
  if(el){
    el.classList.add('active');
  }else{
    const chips=document.querySelectorAll('.bbar-sort .schip');
    if(m==='pending'&&chips[1])chips[1].classList.add('active');
    else if(m==='done'&&chips[2])chips[2].classList.add('active');
    else if(chips[0])chips[0].classList.add('active');
  }
  applySort(toKey(activeDate));
}

function applySort(key){
  const c = document.getElementById('wlist-' + key);
  if(!c) return;
  const ws = [...c.querySelectorAll('.widget')];
  
  if(sortMode === 'pending') {
    ws.sort((a,b) => a.classList.contains('done') - b.classList.contains('done'));
  } else if(sortMode === 'done') {
    ws.sort((a,b) => b.classList.contains('done') - a.classList.contains('done'));
  } else {
    // Standard-Modus nutzt die gespeicherte widgetOrder
    const order = getGlobalOrder();
    ws.sort((a,b) => {
      let aId = a.id.split('-')[0];
      let bId = b.id.split('-')[0];
      let aIdx = order.indexOf(aId); if(aIdx === -1) aIdx = 99;
      let bIdx = order.indexOf(bId); if(bIdx === -1) bIdx = 99;
      return aIdx - bIdx;
    });
  }
  
  ws.forEach(w => c.appendChild(w));
}

function initDrag(log,key){
  const c=document.getElementById('wlist-'+key);if(!c)return;
  let drag=null,ph=null,oy=0,sy=0;
  c.querySelectorAll('.drgh').forEach(h=>{
    h.addEventListener('touchstart',st,{passive:true});
    h.addEventListener('mousedown',st);
  });
  function gy(e){return e.touches?e.touches[0].clientY:e.clientY;}
  function st(e){
    drag=e.currentTarget.closest('.widget');
    const r=drag.getBoundingClientRect();
    sy=gy(e);oy=r.top;
    ph=document.createElement('div');
    ph.style.cssText=`height:${r.height}px;border-radius:18px;background:var(--border);opacity:.2;`;
    c.insertBefore(ph,drag);
    drag.classList.add('dragging');
    drag.style.cssText=`position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;z-index:999;pointer-events:none;margin:0;opacity:.95;box-shadow:0 8px 24px rgba(0,0,0,.3);`;
    document.addEventListener('touchmove',mv,{passive:false});document.addEventListener('mousemove',mv);
    document.addEventListener('touchend',en);document.addEventListener('mouseup',en);
  }
  function mv(e){
    if(!drag)return;if(e.cancelable)e.preventDefault();
    const y=gy(e);
    drag.style.top=(oy+y-sy)+'px';
    const ss=[...c.querySelectorAll('.widget:not(.dragging)')];let ins=false;
    for(const s of ss){if(s===ph)continue;const r=s.getBoundingClientRect();if(y<r.top+r.height/2){c.insertBefore(ph,s);ins=true;break;}}
    if(!ins)c.appendChild(ph);
  }
  function en(){
    if(!drag)return;
    if(ph.parentNode)c.insertBefore(drag,ph);
    if(ph.parentNode)ph.remove();
    drag.classList.remove('dragging');drag.style.cssText='';
    saveGlobalOrder(c.querySelectorAll('.widget'));
    drag=null;ph=null;
    document.removeEventListener('touchmove',mv);document.removeEventListener('mousemove',mv);
    document.removeEventListener('touchend',en);document.removeEventListener('mouseup',en);
  }
}

function exportData(){
  const blob=new Blob([JSON.stringify({cfg,logs},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`daytracker.json`;a.click();URL.revokeObjectURL(url);
  showToast('📤 Exportiert!');
}
function importData(inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    try{const d=JSON.parse(e.target.result);if(d.cfg)cfg=d.cfg;if(d.logs)logs=d.logs;saveCfg();saveLogs();renderThreePages();showToast('📥 Importiert!');}
    catch{showToast('❌ Import fehlgeschlagen');}
    inp.value='';
  };r.readAsText(f);
}

function moveEx(idx, dir) {
  const to = idx + dir;
  if (to < 0 || to >= cfg.exercises.length) return;
  const el = cfg.exercises.splice(idx, 1)[0];
  cfg.exercises.splice(to, 0, el);
  saveCfg();renderExList();renderThreePages();
}
function moveMl(idx, dir) {
  const to = idx + dir;
  if (to < 0 || to >= cfg.meals.length) return;
  const el = cfg.meals.splice(idx, 1)[0];
  cfg.meals.splice(to, 0, el);
  saveCfg();renderMlList();renderThreePages();
}

function openCal(){
  calViewYear=activeDate.getFullYear();calViewMonth=activeDate.getMonth();
  renderCal();
  document.getElementById('ov-cal').classList.add('open');
}
function closeCal(){document.getElementById('ov-cal').classList.remove('open');}
function calMove(dir){
  calViewMonth+=dir;
  if(calViewMonth<0){calViewMonth=11;calViewYear--;}
  if(calViewMonth>11){calViewMonth=0;calViewYear++;}
  renderCal();
}

function renderCalPage(pageId, year, month){
  const page = document.getElementById(pageId);
  if(!page) return;
  page.innerHTML='';

  const hdr=document.createElement('div');
  hdr.className='cal-grid';
  hdr.style.cssText='margin-bottom:2px;grid-auto-rows:auto;flex:none';
  ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(d=>{
    const h=document.createElement('div');h.className='cal-dh';h.textContent=d;hdr.appendChild(h);
  });
  page.appendChild(hdr);

  const grid=document.createElement('div');
  grid.className='cal-grid';
  grid.style.flex='1';

  const firstDay=new Date(year,month,1);
  let startDow=firstDay.getDay()-1;if(startDow<0)startDow=6;
  const daysInMonth=new Date(year,month+1,0).getDate();
  for(let i=0;i<startDow;i++){
    const e=document.createElement('div');e.className='cal-day empty';grid.appendChild(e);
  }
  const todayNorm=new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());
  for(let d=1;d<=daysInMonth;d++){
    const date=new Date(year,month,d);
    const k=toKey(date);
    const isFuture=date>todayNorm;
    const isToday=date.getTime()===todayNorm.getTime();
    const log=logs[k];
    const el=document.createElement('div');
    el.className='cal-day'+(isFuture?' future':'')+(isToday?' today':'');
    if(k===toKey(activeDate))el.classList.add('selected');
    const cdn=document.createElement('div');cdn.className='cdn';cdn.textContent=d;el.appendChild(cdn);
    if(log){
      const wPct=()=>{const f=log.wf?log.wf.filter(Boolean).length:0;const ng=Math.ceil(cfg.water.goalMl/cfg.water.glassMl);return ng?Math.min(100,Math.round(f/ng*100)):0;};
      const sPct=()=>{const sc=log.sc||0;return cfg.steps.goal?Math.min(100,Math.round(sc/cfg.steps.goal*100)):0;};
      const fPct=()=>{
        const dayExs=forDayKey(cfg.exercises,k);
        let tot=0,done=0;
        dayExs.forEach(ex=>{const eff=ex.oneArm?ex.sets*2:ex.sets;tot+=eff;done+=(log.ed&&log.ed[ex.id]?log.ed[ex.id].filter(v=>Number(v)>0).length:0);});
        return tot?Math.min(100,Math.round(done/tot*100)):0;
      };
      const mPct=()=>{
        if(!cfg.calories)cfg.calories={goal:2000};
        let c=0;
        const dayMls=forDayKey(cfg.meals,k);
        dayMls.forEach(m=>{if(log.md&&log.md[m.id])c+=(m.cals||0);});
        if(log.cm)log.cm.forEach(ch=>{c+=(ch.cals||0);});
        return cfg.calories.goal?Math.min(100,Math.round(c/cfg.calories.goal*100)):0;
      };
      const smkPct=()=>{
        const goal=cfg.smoke?cfg.smoke.goal||20:20;
        const arr=log.smokedArr||[];
        const smoked=arr.filter(Boolean).length;
        const remaining=Math.max(0,goal-smoked);
        return Math.round(remaining/goal*100);
      };
      const wgDone=()=>log.wg>0;
      const tbPct=()=>{
        const goal = cfg.teeth ? cfg.teeth.goal || 2 : 2;
        const arr = log.tb || [];
        const count = arr.filter(Boolean).length;
        return Math.min(100, Math.round(count / goal * 100));
      };

      const showW = !isWidgetHidden('ww');
      const showS = !isWidgetHidden('ws');
      const showF = !isWidgetHidden('wf');
      const showM = !isWidgetHidden('wm');
      const showWg = !isWidgetHidden('wg');
      const showSmk = !isWidgetHidden('wsmk');
      const showTb = !isWidgetHidden('wtb');

      const wp=showW?wPct():0;
      const sp=showS?sPct():0;
      const fp=showF?fPct():0;
      const mp=showM?mPct():0;
      const smkp=showSmk?smkPct():0;
      const wgp=showWg&&wgDone()?100:0;
      const tbp=showTb?tbPct():0;

      const dayExs2=forDayKey(cfg.exercises,k);
      const hasExs=dayExs2.length>0;
      const dayMls2=forDayKey(cfg.meals,k);
      const hasMls=dayMls2.length>0;

      const wIsDone = !showW || wp>=100;
      const sIsDone = !showS || sp>=100;
      const fIsDone = !showF || (!hasExs || fp>=100);
      const mIsDone = !showM || (!hasMls || mp>=100);
      const wgIsDone = !showWg || wgDone();
      const tbIsDone = !showTb || tbp>=100;
      const smkActualDone = (log.smokedArr||[]).filter(Boolean).length >= (cfg.smoke?cfg.smoke.goal||20:20);
      const smkIsDone2 = !showSmk || smkActualDone;

      if(showW || showS || showF || showM || showWg || showSmk || showTb){
        if(wIsDone && sIsDone && fIsDone && mIsDone && wgIsDone && smkIsDone2 && tbIsDone){
          el.classList.add('all-done');
        }
      }

      const bars=[];
      if(showW && wp>0)bars.push({p:wp,c:'#60c8f0'});
      if(showS && sp>0)bars.push({p:sp,c:'#f0d060'});
      if(showF && fp>0)bars.push({p:fp,c:'#f06060'});
      if(showM && mp>0)bars.push({p:mp,c:'#c8f060'});
      if(showWg && wgp>0)bars.push({p:wgp,c:'#a060f0'});
      if(showSmk && smkp>0)bars.push({p:smkp,c:'#e08040'});
      if(showTb && tbp>0)bars.push({p:tbp,c:'#60f0c8'});

      if(bars.length){
        const stats=document.createElement('div');stats.className='cal-day-stats';
        bars.forEach(b=>{
          const bar=document.createElement('div');bar.className='cal-stat-bar';
          const fill=document.createElement('div');fill.className='cal-stat-fill';
          fill.style.cssText=`width:${b.p}%;background:${b.c}`;
          bar.appendChild(fill);stats.appendChild(bar);
        });
        el.appendChild(stats);el.classList.add('has-data');
      }
    }
    el.onclick=()=>{jumpToDate(date);closeCal();};
    grid.appendChild(el);
  }
  page.appendChild(grid);
}

function renderCal(){
  document.getElementById('cal-title').textContent=MONTH_DE[calViewMonth]+' '+calViewYear;
  let pm=calViewMonth-1,py=calViewYear;if(pm<0){pm=11;py--;}
  let nm=calViewMonth+1,ny=calViewYear;if(nm>11){nm=0;ny++;}
  renderCalPage('cal-page-prev',py,pm);
  renderCalPage('cal-page-curr',calViewYear,calViewMonth);
  renderCalPage('cal-page-next',ny,nm);
  
  document.getElementById('cal-legend').innerHTML=
    (!isWidgetHidden('ww')?'<div class="cl-item"><div class="cl-dot" style="background:#60c8f0"></div>Wasser</div>':'')+
    (!isWidgetHidden('ws')?'<div class="cl-item"><div class="cl-dot" style="background:#f0d060"></div>Schritte</div>':'')+
    (!isWidgetHidden('wtb')?'<div class="cl-item"><div class="cl-dot" style="background:#60f0c8"></div>Zähne</div>':'')+
    (!isWidgetHidden('wf')?'<div class="cl-item"><div class="cl-dot" style="background:#f06060"></div>Übungen</div>':'')+
    (!isWidgetHidden('wm')?'<div class="cl-item"><div class="cl-dot" style="background:#c8f060"></div>Mahlzeiten</div>':'')+
    (!isWidgetHidden('wg')?'<div class="cl-item"><div class="cl-dot" style="background:#a060f0"></div>Gewicht</div>':'')+
    (!isWidgetHidden('wsmk')?'<div class="cl-item"><div class="cl-dot" style="background:#e08040"></div>Rauchen</div>':'');
}

function openMenu(){document.getElementById('ov-menu').classList.add('open');}
function closeMenu(){document.getElementById('ov-menu').classList.remove('open');renderThreePages();}
function goSub(id){
  document.getElementById('ov-menu').classList.remove('open');
  if(id==='ov-water')initWater();
  else if(id==='ov-steps')initSteps();
  else if(id==='ov-groups')initGroups();
  else if(id==='ov-ex')initEx();
  else if(id==='ov-meals')initMls();
  else if(id==='ov-smoke')initSmoke();
  else if(id==='ov-teeth')initTeeth();
  document.getElementById(id).classList.add('open');
}
function backSub(id){document.getElementById(id).classList.remove('open');document.getElementById('ov-menu').classList.add('open');}

function initWater(){
  document.getElementById('s-goal').value=cfg.water.goalMl;
  document.getElementById('s-gml').value=cfg.water.glassMl;
  document.getElementById('s-water-unit').value=cfg.water.statUnit || 'pct';
  updWNote();
}
function onWC(){
  cfg.water.goalMl=parseInt(document.getElementById('s-goal').value)||2000;
  cfg.water.glassMl=parseInt(document.getElementById('s-gml').value)||250;
  cfg.water.statUnit=document.getElementById('s-water-unit').value;
  saveCfg();updWNote();
}
function updWNote(){
  const g=parseInt(document.getElementById('s-goal').value)||cfg.water.goalMl;
  const m=parseInt(document.getElementById('s-gml').value)||cfg.water.glassMl;
  const n=Math.ceil(g/m);
  document.getElementById('wnote').textContent=`→ ${n} Gläser à ${m} ml = ${n*m} ml`;
}
function initSteps(){
  document.getElementById('s-steps-goal').value=cfg.steps.goal||10000;
  document.getElementById('s-steps-unit').value=cfg.steps.statUnit || 'pct';
}
function onStepsC(){
  cfg.steps.goal=parseInt(document.getElementById('s-steps-goal').value)||10000;
  cfg.steps.statUnit=document.getElementById('s-steps-unit').value;
  saveCfg();
}

function initTeeth(){
  document.getElementById('s-teeth-goal').value = cfg.teeth ? cfg.teeth.goal || 2 : 2;
}
function onTeethC(){
  if(!cfg.teeth) cfg.teeth = {goal: 2};
  cfg.teeth.goal = parseInt(document.getElementById('s-teeth-goal').value) || 2;
  saveCfg();
}

function initSmoke(){
  if(!cfg.smoke)cfg.smoke={goal:20};
  document.getElementById('s-smoke-goal').value=cfg.smoke.goal||20;
}
function onSmokeC(){
  if(!cfg.smoke)cfg.smoke={goal:20};
  cfg.smoke.goal=parseInt(document.getElementById('s-smoke-goal').value)||20;
  saveCfg();
}

function initGroups(){renderGrpList();renderDChips('ng-days',[]);}
function renderGrpList(){
  const el=document.getElementById('grp-list');
  if(!cfg.groups.length){el.innerHTML='<div class="empty">Noch keine Gruppen.</div>';return;}
  el.innerHTML=cfg.groups.map((g,i)=>`
    <div class="sit-wrap">
      <div class="sit-bg sit-bg-l">🗑</div>
      <div class="sit-bg sit-bg-r">✏️</div>
      <div class="sit-content crow" data-del="delGrp('${g.id}')" data-edit="editGrp(${i})">
        <div class="ctop">
          <div class="gdot" style="background:${g.color}"></div>
          <span class="cname">${g.name}${g.inactive?'<span class="grp-inactive-badge">inaktiv</span>':''}</span>
          <span class="gdays" style="font-size:11px;color:var(--muted)">${g.days&&g.days.length?g.days.map(d=>DS_SHORT[d]).join(', '):'alle Tage'}</span>
          <span onclick="toggleGrpActive('${g.id}');event.stopPropagation()" style="font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--border);cursor:pointer;background:var(--surface);margin-left:4px">${g.inactive?'aktivieren':'deaktiv.'}</span>
        </div>
      </div>
    </div>`).join('');
}
let editGrpIdx=-1;
function editGrp(i){
  const g=cfg.groups[i];
  editGrpIdx=i;
  document.getElementById('ng-name').value=g.name||'';
  document.getElementById('ng-col').value=g.color||'#c8f060';
  renderDChips('ng-days',g.days||[]);
  document.getElementById('ng-name').scrollIntoView({behavior:'smooth'});
  document.querySelector('#ov-groups .btn.gr').textContent='💾 Gruppe speichern';
}
function toggleGrpActive(id){
  const g=cfg.groups.find(g=>g.id===id);
  if(!g)return;
  g.inactive=!g.inactive;
  saveCfg();renderGrpList();renderThreePages();
  showToast(g.inactive?'🚫 Gruppe deaktiviert':'✅ Gruppe aktiviert');
}
function renderDChips(cid,sel){
  const el=document.getElementById(cid);if(!el)return;
  el.innerHTML=DS_SHORT.map((d,i)=>`<div class="dchip ${sel.includes(i)?'on':''}" data-d="${i}">${d}</div>`).join('');
  el.querySelectorAll('.dchip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
}
function getSelD(cid){return[...document.querySelectorAll(`#${cid} .dchip.on`)].map(c=>+c.dataset.d);}

let _tt;
function showToast(msg){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt=setTimeout(()=>t.classList.remove('show'),2100);
}

function openIP(target){
  ipt=target;
  const igrid = document.getElementById('igrid');
  if(igrid) igrid.innerHTML=ICONS.map(ic=>`<div class="iopt" onclick="pickIC('${ic}')">${ic}</div>`).join('');
  document.getElementById('ipov').classList.add('open');
}

function closeIP(){
  document.getElementById('ipov').classList.remove('open');
  ipt=null;
}

const ipovEl = document.getElementById('ipov');
if(ipovEl) {
  ipovEl.addEventListener('click', function(e){
    if(e.target===this) closeIP();
  });
}

function pickIC(ic){
  if(!ipt){closeIP();return;}
  if(ipt==='nex'){pendIco.nex=ic;document.getElementById('nex-ico').textContent=ic;}
  else if(ipt==='nml'){pendIco.nml=ic;document.getElementById('nml-ico').textContent=ic;}
  else if(ipt==='ch'){pendIco.ch=ic;document.getElementById('ch-ico').textContent=ic;}
  else if(ipt.startsWith('ex_')){const i=+ipt.split('_')[1];cfg.exercises[i].icon=ic;saveCfg();renderExList();renderThreePages();}
  else if(ipt.startsWith('ml_')){const i=+ipt.split('_')[1];cfg.meals[i].icon=ic;saveCfg();renderMlList();renderThreePages();}
  closeIP();
}

function addGroup(){
  const name=document.getElementById('ng-name').value.trim();
  const color=document.getElementById('ng-col').value;
  const days=getSelD('ng-days');
  if(!name){showToast('⚠️ Name fehlt');return;}
  if(editGrpIdx>=0){
    cfg.groups[editGrpIdx]={...cfg.groups[editGrpIdx],name,color,days};
    editGrpIdx=-1;
    document.querySelector('#ov-groups .btn.gr').textContent='+ Gruppe hinzufügen';
    showToast('🗂 Gruppe gespeichert');
  } else {
    cfg.groups.push({id:'g'+Date.now(),name,color,days});
    showToast('🗂 Gruppe hinzugefügt');
  }
  saveCfg();
  document.getElementById('ng-name').value='';
  renderGrpList();renderDChips('ng-days',[]);refreshGrpSels();
  renderThreePages(); // <- dashboard direkt aktualisieren
}

function delGrp(id){
  if(!confirm('Gruppe wirklich löschen?'))return;
  cfg.groups=cfg.groups.filter(g=>g.id!==id);
  cfg.exercises.forEach(e=>{if(e.groupId===id)e.groupId=null;});
  cfg.meals.forEach(m=>{if(m.groupId===id)m.groupId=null;});
  saveCfg();renderGrpList();refreshGrpSels();
  renderThreePages();
}

function refreshGrpSels(){
  buildGSel('nex-grp');buildGSel('nml-grp');
  if(document.getElementById('ov-ex').classList.contains('open'))renderExList();
  if(document.getElementById('ov-meals').classList.contains('open'))renderMlList();
}
function buildGSel(id){
  const el=document.getElementById(id);if(!el)return;
  const cur=el.value;
  el.innerHTML='<option value="">Keine Gruppe</option>'+
    cfg.groups.map(g=>`<option value="${g.id}">${g.name}${g.inactive?' (inaktiv)':''}</option>`).join('');
  el.value=cur;
}

function initEx(){renderExList();buildGSel('nex-grp');document.getElementById('nex-ico').textContent=pendIco.nex;}
function renderExList(){
  const el=document.getElementById('ex-list');if(!el)return;
  if(!cfg.exercises.length){el.innerHTML='<div class="empty">Noch keine Übungen.</div>';return;}
  el.innerHTML=cfg.exercises.map((ex,i)=>`<div class="sit-wrap">
  <div class="sit-bg sit-bg-l">🗑</div>
  <div class="sit-bg sit-bg-r">✏️</div>
  <div class="sit-content crow" data-del="delEx(${i})" data-edit="editEx(${i})">
    <div class="ctop">
      <span class="cico" onclick="openIP('ex_${i}'); event.stopPropagation()">${ex.icon||'🏋️'}</span>
      <span class="cname">${ex.name}${ex.oneArm?' <span style="font-size:9px;padding:1px 5px;border-radius:99px;background:rgba(96,200,240,.15);color:var(--accent2)">einarmig</span>':''}</span>
      <div class="sort-controls">
        <span class="sort-btn" onclick="event.stopPropagation();moveEx(${i},-1)">▲</span>
        <span class="sort-btn" onclick="event.stopPropagation();moveEx(${i},1)">▼</span>
      </div>
    </div>
    </div>
</div>`).join('');
}
function editEx(i){
  const ex=cfg.exercises[i];
  editExIdx=i;
  document.getElementById('nex-name').value=ex.name||'';
  document.getElementById('nex-sets').value=ex.sets||3;
  document.getElementById('nex-max').value=ex.maxReps||10;
  document.getElementById('nex-grp').value=ex.groupId||'';
  document.getElementById('nex-onearm').checked=!!ex.oneArm;
  pendIco.nex=ex.icon||'🏋️';
  document.getElementById('nex-ico').textContent=pendIco.nex;
  document.getElementById('btn-add-ex').textContent='💾 Speichern';
  document.getElementById('ex-form-title').textContent='Übung bearbeiten';
  document.getElementById('ex-form-title').scrollIntoView({behavior:'smooth'});
}
function addEx(){
  const name=document.getElementById('nex-name').value.trim();
  const sets=parseInt(document.getElementById('nex-sets').value)||3;
  const maxReps=parseInt(document.getElementById('nex-max').value)||10;
  const groupId=document.getElementById('nex-grp').value||null;
  const oneArm=document.getElementById('nex-onearm').checked;
  if(!name){showToast('⚠️ Name fehlt');return;}
  if(editExIdx>=0){
    cfg.exercises[editExIdx]={...cfg.exercises[editExIdx],icon:pendIco.nex,name,sets,maxReps,groupId,oneArm};
    editExIdx=-1;
    document.getElementById('btn-add-ex').textContent='+ Übung hinzufügen';
    document.getElementById('ex-form-title').textContent='Übung hinzufügen';
    showToast('🏋️ Übung gespeichert');
  }else{
    cfg.exercises.push({id:'ex'+Date.now(),icon:pendIco.nex,name,sets,maxReps,groupId,oneArm,addedAt:toKey(new Date())});
    showToast('🏋️ Übung hinzugefügt');
  }
  saveCfg();
  document.getElementById('nex-name').value='';document.getElementById('nex-sets').value='';document.getElementById('nex-max').value='';
  document.getElementById('nex-onearm').checked=false;
  pendIco.nex='🏋️';document.getElementById('nex-ico').textContent='🏋️';
  renderExList();
  renderThreePages(); // <- dashboard direkt aktualisieren
}

function delEx(i){
  if(!confirm('Übung wirklich löschen?'))return;
  cfg.exercises.splice(i,1);saveCfg();renderExList();
  renderThreePages();
}

function initMls(){
  if(!cfg.calories)cfg.calories={goal:2000};
  document.getElementById('s-cal-goal').value=cfg.calories.goal;
  renderMlList();
  document.getElementById('nml-ico').textContent=pendIco.nml;
  const types=document.querySelectorAll('#nml-types .dchip');
  types.forEach(c=>{c.onclick=()=>c.classList.toggle('on');});
}
function onCalC(){
  if(!cfg.calories)cfg.calories={goal:2000};
  cfg.calories.goal=parseInt(document.getElementById('s-cal-goal').value)||2000;
  saveCfg();
}
function renderMlList(){
  const el=document.getElementById('ml-list');if(!el)return;
  if(!cfg.meals.length){el.innerHTML='<div class="empty">Noch keine Einträge.</div>';return;}
  el.innerHTML=cfg.meals.map((m,i)=>{
    const ts=m.types&&m.types.length?m.types:(m.type?[m.type]:['Snack']);
    return `<div class="sit-wrap">
  <div class="sit-bg sit-bg-l">🗑</div>
  <div class="sit-bg sit-bg-r">✏️</div>
  <div class="sit-content crow" data-del="delMl(${i})" data-edit="editMl(${i})">
    <div class="ctop" style="margin-bottom:0">
      <span class="cico" onclick="openIP('ml_${i}'); event.stopPropagation()">${m.icon||'🥗'}</span>
      <span class="cname">${ts.join(', ')} · ${m.name}</span>
      <div class="sort-controls">
        <span class="sort-btn" onclick="event.stopPropagation();moveMl(${i},-1)">▲</span>
        <span class="sort-btn" onclick="event.stopPropagation();moveMl(${i},1)">▼</span>
      </div>
    </div>
  </div>
</div>`;
  }).join('');
}
function editMl(i){
  const m=cfg.meals[i];
  editMlIdx=i;
  document.getElementById('nml-name').value=m.name||'';
  document.getElementById('nml-cals').value=m.cals||'';
  document.getElementById('nml-desc').value=m.desc||'';
  pendIco.nml=m.icon||'🥗';
  document.getElementById('nml-ico').textContent=pendIco.nml;
  const ts=m.types&&m.types.length?m.types:(m.type?[m.type]:['Snack']);
  document.querySelectorAll('#nml-types .dchip').forEach(c=>{c.classList.toggle('on', ts.includes(c.dataset.t));});
  document.getElementById('btn-add-ml').textContent='💾 Speichern';
  document.getElementById('ml-form-title').textContent='Eintrag bearbeiten';
  document.getElementById('ml-form-title').scrollIntoView({behavior:'smooth'});
}
function addMl(){
  const name=document.getElementById('nml-name').value.trim();
  const types=[...document.querySelectorAll('#nml-types .dchip.on')].map(c=>c.dataset.t);
  const cals=parseInt(document.getElementById('nml-cals').value)||0;
  const desc=document.getElementById('nml-desc').value.trim();
  if(!name){showToast('⚠️ Name fehlt');return;}
  if(!types.length){showToast('⚠️ Typ wählen');return;}
  if(editMlIdx>=0){
    cfg.meals[editMlIdx]={...cfg.meals[editMlIdx],icon:pendIco.nml,types,cals,name,desc};
    editMlIdx=-1;
    document.getElementById('btn-add-ml').textContent='+ Hinzufügen';
    document.getElementById('ml-form-title').textContent='Eintrag hinzufügen';
    showToast('🥗 Eintrag gespeichert');
  }else{
    cfg.meals.push({id:'m'+Date.now(),icon:pendIco.nml,types,cals,name,desc,addedAt:toKey(new Date())});
    showToast('🥗 Eintrag hinzugefügt');
  }
  saveCfg();
  document.getElementById('nml-name').value='';document.getElementById('nml-cals').value='';document.getElementById('nml-desc').value='';
  document.querySelectorAll('#nml-types .dchip').forEach(c=>c.classList.remove('on'));
  pendIco.nml='🥗';document.getElementById('nml-ico').textContent='🥗';
  renderMlList();
  renderThreePages(); // <- dashboard direkt aktualisieren
}

function delMl(i){
  if(!confirm('Mahlzeit wirklich löschen?'))return;
  cfg.meals.splice(i,1);saveCfg();renderMlList();
  renderThreePages();
}

function getStatMetricsBase(){
  const wUnit = cfg.water.statUnit || 'pct';
  const wLabel = wUnit === 'ml' ? ' ml' : wUnit === 'l' ? ' L' : '%';
  const sUnit = cfg.steps.statUnit || 'pct';
  const sLabel = sUnit === 'steps' ? ' Sch.' : sUnit === 'km' ? ' km' : '%';
  return [
    {id:'water', label:'Wasser', color:'#60c8f0', unit: wLabel},
    {id:'steps', label:'Schritte', color:'#f0d060', unit: sLabel},
    {id:'teeth', label:'Zähne', color:'#60f0c8', unit:'%'},
    {id:'fitness',label:'Übungen', color:'#f06060', unit:'%'},
    {id:'meals',  label:'Mahlzeiten',color:'#c8f060',unit:'%'},
    {id:'weight', label:'Gewicht',  color:'#a060f0', unit:'kg'},
    {id:'smoke',  label:'Rauchen',  color:'#e08040', unit:'Zig.'},
  ];
}
function getExerciseMetrics(){
  if(!cfg.exercises||!cfg.exercises.length) return [];
  const exColors=['#f06060','#f09060','#f0c060','#a0f060','#60f0b0','#60c8f0','#a060f0','#f060b0'];
  return cfg.exercises.map((ex,i)=>({
    id:'ex_'+ex.id,
    label:(ex.icon||'🏋️')+' '+ex.name,
    color:exColors[i%exColors.length],
    unit:'reps',
    exId:ex.id,
    isExercise:true,
  }));
}
let statsExVisible = new Set();
let statsPeriod = 7;
let statsVisible = new Set(['water','steps','teeth','fitness','meals','weight','smoke']);

function openStats(){
  if(cfg.statsVisible) statsVisible=new Set(cfg.statsVisible);
  if(cfg.statsExVisible) statsExVisible=new Set(cfg.statsExVisible);
  if(cfg.statsPeriod) statsPeriod=cfg.statsPeriod;
  [7,14,30, 365].forEach(n=>{
    const el=document.getElementById('sp-'+n);
    if(el) el.classList.toggle('active', n===statsPeriod);
  });
  renderStatsChips();
  document.getElementById('stats-ov').classList.add('open');
  requestAnimationFrame(()=>requestAnimationFrame(()=>renderStatsCharts()));
}
function closeStats(){ document.getElementById('stats-ov').classList.remove('open'); }

function setStatsPeriod(n, el){
  statsPeriod = n;
  cfg.statsPeriod = n;
  saveCfg();
  document.querySelectorAll('#stats-ov .schip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderStatsCharts();
}

function renderStatsChips(){
  const el = document.getElementById('stats-metric-chips');
  const base = getStatMetricsBase().map(m=>`
    <div class="schip ${statsVisible.has(m.id)?'active':''}"
      style="${statsVisible.has(m.id)?`border-color:${m.color};color:${m.color};background:${m.color}18`:''}"
      onclick="toggleStatMetric('${m.id}',this,'${m.color}')">${m.label}</div>
  `).join('');
  el.innerHTML = base;
  const exMets = getExerciseMetrics();
  if(!exMets.length) return;
  const exWrap = document.createElement('div');
  exWrap.style.cssText='width:100%;margin-top:6px;border:1px solid var(--border);border-radius:10px;overflow:hidden;';
  exWrap.innerHTML=`
    <div id="ex-acc-hdr" onclick="toggleExAccordion()"
      style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;background:var(--surface2,var(--surface));user-select:none">
      <span style="font-size:12px;font-weight:700;color:var(--accent2)">🏋️ Übungen <span style="font-weight:400;color:var(--muted)">${statsExVisible.size} aktiv</span></span>
      <span id="ex-acc-arrow" style="font-size:11px;color:var(--muted);transition:transform .2s">${cfg.exAccOpen?'▴':'▾'}</span>
    </div>
    <div id="ex-acc-body" style="display:${cfg.exAccOpen?'block':'none'};padding:8px 10px 10px;border-top:1px solid var(--border);max-height:260px;overflow-y:auto">
      ${exMets.map(m=>`
        <label style="display:flex;align-items:center;gap:8px;padding:5px 2px;cursor:pointer;border-radius:6px">
          <input type="checkbox" ${statsExVisible.has(m.id)?'checked':''} onchange="toggleExMetric('${m.id}')"
            style="width:15px;height:15px;accent-color:${m.color};cursor:pointer;flex-shrink:0">
          <span style="font-size:12px;color:${statsExVisible.has(m.id)?m.color:'var(--text)'};font-weight:${statsExVisible.has(m.id)?'600':'400'}">${m.label}</span>
        </label>
      `).join('')}
    </div>`;
  el.appendChild(exWrap);
}

function toggleExAccordion(){
  cfg.exAccOpen = !cfg.exAccOpen;
  saveCfg();
  const body = document.getElementById('ex-acc-body');
  const arrow = document.getElementById('ex-acc-arrow');
  if(body) body.style.display = cfg.exAccOpen ? 'block' : 'none';
  if(arrow) arrow.textContent = cfg.exAccOpen ? '▴' : '▾';
}

function toggleExMetric(id){
  if(statsExVisible.has(id)) statsExVisible.delete(id);
  else statsExVisible.add(id);
  cfg.statsExVisible=[...statsExVisible];
  saveCfg();
  renderStatsChips();
  renderStatsCharts();
}

function toggleStatMetric(id, el, color){
  if(statsVisible.has(id)){
    statsVisible.delete(id);
    el.classList.remove('active');
    el.style.borderColor=''; el.style.color=''; el.style.background='';
  } else {
    statsVisible.add(id);
    el.classList.add('active');
    el.style.borderColor=color; el.style.color=color; el.style.background=color+'18';
  }
  cfg.statsVisible=[...statsVisible];
  saveCfg();
  renderStatsCharts();
}

function getStatValue(key, metricId){
  const log = logs[key];
  if(!log) return null;
  if(metricId==='water'){
    const ng=Math.ceil(cfg.water.goalMl/cfg.water.glassMl)||8;
    const f=(log.wf||[]).filter(Boolean).length;
    const unit=cfg.water.statUnit||'pct';
    if (unit === 'ml') return f * cfg.water.glassMl;
    if (unit === 'l') return (f * cfg.water.glassMl) / 1000;
    return Math.round(f/ng*100);
  }
  if(metricId==='steps'){
    const goal=cfg.steps&&cfg.steps.goal||10000;
    const sc=log.sc||0;
    const unit=cfg.steps.statUnit||'pct';
    if (unit === 'steps') return sc;
    if (unit === 'km') return sc * 0.000762;
    return Math.min(100,Math.round(sc/goal*100));
  }
  if(metricId==='teeth'){
    const goal=cfg.teeth?cfg.teeth.goal||2:2;
    const arr=log.tb||[];
    const c=arr.filter(Boolean).length;
    return Math.min(100,Math.round(c/goal*100));
  }
  if(metricId==='fitness'){
    const dayExs=forDayKey(cfg.exercises,key);
    if(!dayExs.length) return null;
    let tot=0,done=0;
    dayExs.forEach(ex=>{const eff=ex.oneArm?ex.sets*2:ex.sets;tot+=eff;done+=(log.ed&&log.ed[ex.id]?log.ed[ex.id].filter(v=>Number(v)>0).length:0);});
    return tot?Math.round(done/tot*100):0;
  }
  if(metricId==='meals'){
    const dayMls=forDayKey(cfg.meals,key);
    if(!dayMls.length&&!(log.cm&&log.cm.length)) return null;
    const goal=cfg.calories&&cfg.calories.goal||2000;
    let c=0;
    dayMls.forEach(m=>{const ts=m.types&&m.types.length?m.types:(m.type?[m.type]:['Snack']);ts.forEach(t=>{if(log.md&&log.md[m.id+'_'+t])c+=(m.cals||0);});});
    if(log.cm)log.cm.forEach(ch=>c+=(ch.cals||0));
    return Math.min(100,Math.round(c/goal*100));
  }
  if(metricId==='weight') return log.wg>0?log.wg:null;
  if(metricId.startsWith('ex_')){
    const exId=metricId.slice(3);
    const ex=cfg.exercises&&cfg.exercises.find(e=>e.id===exId);
    if(!ex) return null;
    const kg=log.ew&&log.ew[exId]!==undefined&&log.ew[exId]!==''&&Number(log.ew[exId])>0?Number(log.ew[exId]):null;
    const vals=log.ed&&log.ed[exId]?log.ed[exId]:[];
    const avg=v=>{const d=v.filter(x=>Number(x)>0).map(Number);return d.length?Math.round(d.reduce((a,b)=>a+b,0)/d.length):null;};
    if(ex.oneArm){
      const R=avg(vals.filter((_,i2)=>i2%2===0));
      const L=avg(vals.filter((_,i2)=>i2%2===1));
      return (R!==null||L!==null||kg!==null)?{R,L,kg,oneArm:true}:null;
    }
    const reps=avg(vals);
    return (reps!==null||kg!==null)?{reps,kg,oneArm:false}:null;
  }
  if(metricId==='smoke'){
    const arr=log.smokedArr||[];
    const smoked=arr.filter(Boolean).length;
    return smoked>0?smoked:null;
  }
  return null;
}

function renderStatsCharts(){
  const container = document.getElementById('stats-charts');
  container.innerHTML='';
  const today = new Date(); today.setHours(0,0,0,0);
  const days=[];
  for(let i=statsPeriod-1;i>=0;i--){
    const d=new Date(today); d.setDate(d.getDate()-i);
    days.push({key:toKey(d), label:d.getDate()+'.'+(d.getMonth()+1)+'.'});
  }

  function drawLine(ctx,pts,color,xOf,yOf,dpr,showDots,dashed,padT,ch,fillUnder){
    if(pts.length===1&&showDots){ctx.beginPath();ctx.arc(xOf(pts[0].i),yOf(pts[0].v),3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();return;}
    if(pts.length<2) return;
    if(dashed) ctx.setLineDash([4,3]); else ctx.setLineDash([]);
    if(fillUnder){
      ctx.beginPath();ctx.moveTo(xOf(pts[0].i),yOf(pts[0].v));
      pts.forEach((p,pi)=>{if(pi===0)return;const prev=pts[pi-1];const cpx=(xOf(prev.i)+xOf(p.i))/2;ctx.bezierCurveTo(cpx,yOf(prev.v),cpx,yOf(p.v),xOf(p.i),yOf(p.v));});
      ctx.lineTo(xOf(pts[pts.length-1].i),padT+ch);ctx.lineTo(xOf(pts[0].i),padT+ch);ctx.closePath();
      const grad=ctx.createLinearGradient(0,padT,0,padT+ch);grad.addColorStop(0,color+'44');grad.addColorStop(1,color+'00');ctx.fillStyle=grad;ctx.fill();
    }
    ctx.beginPath();ctx.moveTo(xOf(pts[0].i),yOf(pts[0].v));
    pts.forEach((p,pi)=>{if(pi===0)return;const prev=pts[pi-1];const cpx=(xOf(prev.i)+xOf(p.i))/2;ctx.bezierCurveTo(cpx,yOf(prev.v),cpx,yOf(p.v),xOf(p.i),yOf(p.v));});
    ctx.strokeStyle=color;ctx.lineWidth=dashed?1.5:2;ctx.stroke();
    ctx.setLineDash([]);
    if(showDots) pts.forEach(p=>{ctx.beginPath();ctx.arc(xOf(p.i),yOf(p.v),3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.stroke();});
  }

  function makeCanvas(wrap,W,H,dpr){
    const c=document.createElement('canvas');
    c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px';
    wrap.appendChild(c);return c;
  }

  function addXLabels(wrap,days,step){
    const lw=document.createElement('div');lw.style.cssText='display:flex;justify-content:space-between;margin-top:3px;padding:0 2px';
    days.forEach((d,i)=>{const sp=document.createElement('span');sp.style.cssText='font-size:8px;color:var(--muted);flex:1;text-align:center;';sp.textContent=(i%step===0||i===days.length-1)?d.label:'';lw.appendChild(sp);});
    wrap.appendChild(lw);
  }

  const step=statsPeriod<=14?1:statsPeriod<=30?3:statsPeriod<=90?7:30;
  const dpr=window.devicePixelRatio||1;
  const showDots=statsPeriod<=30;

  getStatMetricsBase().forEach(m=>{
    if(!statsVisible.has(m.id)) return;
    const vals=days.map(d=>({label:d.label,val:getStatValue(d.key,m.id)}));
    const nonNull=vals.filter(v=>v.val!==null);
    const hasData=nonNull.length>0;
    
    let avg = null;
    if(nonNull.length){
      const sum = nonNull.reduce((a,b)=>a+b.val,0);
      avg = sum / nonNull.length;
      if (m.unit.includes('km') || m.unit.includes('L')) avg = avg.toFixed(1);
      else avg = Math.round(avg);
    }
    
    let maxVal = null;
    if(nonNull.length){
      maxVal = Math.max(...nonNull.map(v=>v.val));
      if (m.unit.includes('km') || m.unit.includes('L')) maxVal = maxVal.toFixed(1);
      else maxVal = Math.round(maxVal);
    }

    const wrap=document.createElement('div');
    wrap.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 14px 10px;';
    const hdr=document.createElement('div');hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';
    hdr.innerHTML=`<span style="font-size:13px;font-weight:700;color:${m.color}">${m.label}</span>
      <span style="font-size:11px;color:var(--muted)">${avg!==null?`Ø ${avg}${m.unit} · Max ${maxVal}${m.unit}`:'Keine Daten'}</span>`;
    wrap.appendChild(hdr);

    if(!hasData){const e=document.createElement('div');e.style.cssText='text-align:center;padding:20px 0;font-size:12px;color:var(--muted)';e.textContent='Keine Daten für diesen Zeitraum';wrap.appendChild(e);container.appendChild(wrap);return;}

    const W=container.clientWidth-60,H=90;
    const canvas=makeCanvas(wrap,W,H,dpr);
    addXLabels(wrap,days,step);
    container.appendChild(wrap);

    const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    const padL=4,padR=4,padT=8,padB=4,cw=W-padL-padR,ch=H-padT-padB;
    const numVals=vals.map(v=>v.val!==null?v.val:null);
    const all=numVals.filter(v=>v!==null);
    let vMin=0,vMax=100;
    if(m.unit!=='%'){
      vMin=Math.max(0,Math.min(...all)-(m.id==='weight'?5:0));
      vMax=Math.max(...all)+(m.id==='weight'?5:(m.id==='smoke'?2:0));
    }
    const range=vMax-vMin||1;
    const xOf=i=>padL+i/(days.length-1||1)*cw;
    const yOf=v=>padT+ch-(v-vMin)/range*ch;

    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    if(m.unit==='%'){
      [25,50,75,100].forEach(pct=>{if(pct<vMin||pct>vMax)return;const y=yOf(pct);ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(padL+cw,y);ctx.stroke();});
    }
    
    if(m.id==='smoke'){const sg=cfg.smoke&&cfg.smoke.goal||20;if(sg>=vMin&&sg<=vMax){const gy=yOf(sg);ctx.setLineDash([4,3]);ctx.strokeStyle=m.color+'88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(padL,gy);ctx.lineTo(padL+cw,gy);ctx.stroke();ctx.setLineDash([]);}}

    const pts=[];numVals.forEach((v,i)=>{if(v!==null)pts.push({i,v});});
    drawLine(ctx,pts,m.color,xOf,yOf,dpr,showDots,false,padT,ch,true);
    if(pts.length){
      const p=pts[pts.length-1];
      ctx.fillStyle=m.color;ctx.font='bold 8px sans-serif';ctx.textAlign='right';
      let dispV = p.v;
      if (m.unit.includes('km') || m.unit.includes('L')) dispV = dispV.toFixed(1);
      else dispV = Math.round(dispV);
      ctx.fillText(dispV+m.unit,xOf(p.i),yOf(p.v)-6);
    }
  });

  getExerciseMetrics().forEach(m=>{
    if(!statsExVisible.has(m.id)) return;
    const ex=cfg.exercises&&cfg.exercises.find(e=>e.id===m.exId);
    if(!ex) return;

    const rawVals=days.map(d=>({label:d.label,val:getStatValue(d.key,m.id)}));
    const hasData=rawVals.some(v=>v.val!==null);

    const wrap=document.createElement('div');
    wrap.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 14px 10px;';

    const lastV=(rawVals.filter(v=>v.val!==null).slice(-1)[0]||{}).val;
    let summaryHtml='Keine Daten';
    if(lastV){
      if(ex.oneArm) summaryHtml=`R: ${lastV.R??'–'} · L: ${lastV.L??'–'}${lastV.kg?' · '+lastV.kg+'kg':''}`;
      else summaryHtml=`Reps: ${lastV.reps??'–'}${lastV.kg?' · '+lastV.kg+' kg':''}`;
    }
    const hdr=document.createElement('div');hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px';
    hdr.innerHTML=`<span style="font-size:13px;font-weight:700;color:${m.color}">${m.label}</span>
      <span style="font-size:11px;color:var(--muted)">${summaryHtml}</span>`;
    wrap.appendChild(hdr);

    const leg=document.createElement('div');leg.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px';
    const hasKg=rawVals.some(v=>v.val&&v.val.kg!==null);
    if(ex.oneArm){
      leg.innerHTML=`<span style="font-size:10px;color:${m.color};font-weight:600">● Reps R</span>
        <span style="font-size:10px;color:${m.color+'99'};font-weight:600">● Reps L</span>
        ${hasKg?`<span style="font-size:10px;color:#999;font-weight:600">- - - kg</span>`:''}`;
    } else {
      leg.innerHTML=`<span style="font-size:10px;color:${m.color};font-weight:600">● Reps (Ø)</span>
        ${hasKg?`<span style="font-size:10px;color:#999;font-weight:600">- - - kg</span>`:''}`;
    }
    wrap.appendChild(leg);

    if(!hasData){const e=document.createElement('div');e.style.cssText='text-align:center;padding:20px 0;font-size:12px;color:var(--muted)';e.textContent='Keine Daten für diesen Zeitraum';wrap.appendChild(e);container.appendChild(wrap);return;}

    const W=container.clientWidth-60,H=110;
    const canvas=makeCanvas(wrap,W,H,dpr);
    addXLabels(wrap,days,step);
    container.appendChild(wrap);

    const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    const padL=4,padR=4,padT=8,padB=4,cw=W-padL-padR,ch=H-padT-padB;
    const xOf=i=>padL+i/(days.length-1||1)*cw;

    const repsRvals=ex.oneArm?rawVals.map(v=>v.val!==null?v.val.R:null):rawVals.map(v=>v.val!==null?v.val.reps:null);
    const repsLvals=ex.oneArm?rawVals.map(v=>v.val!==null?v.val.L:null):null;
    const kgVals=rawVals.map(v=>v.val!==null?v.val.kg:null);

    const allReps=[...repsRvals,...(repsLvals||[])].filter(v=>v!==null);
    const allKg=kgVals.filter(v=>v!==null);

    const rMin=allReps.length?Math.max(0,Math.min(...allReps)-2):0;
    const rMax=allReps.length?Math.max(...allReps)+3:20;
    const rRange=rMax-rMin||1;
    const yReps=v=>padT+ch-(v-rMin)/rRange*ch;

    const kMin=allKg.length?Math.max(0,Math.min(...allKg)-5):0;
    const kMax=allKg.length?Math.max(...allKg)+5:50;
    const kRange=kMax-kMin||1;
    const yKg=v=>padT+ch-(v-kMin)/kRange*ch;

    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    if(allReps.length){
      [0,0.33,0.66,1].forEach(f=>{const y=yReps(rMin+rRange*f);ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(padL+cw,y);ctx.stroke();});
    }

    const ptsR=[];repsRvals.forEach((v,i)=>{if(v!==null)ptsR.push({i,v});});
    drawLine(ctx,ptsR,m.color,xOf,yReps,dpr,showDots,false,padT,ch,true);

    if(ex.oneArm&&repsLvals){
      const ptsL=[];repsLvals.forEach((v,i)=>{if(v!==null)ptsL.push({i,v});});
      drawLine(ctx,ptsL,m.color+'99',xOf,yReps,dpr,showDots,false,padT,ch,false);
    }

    if(allKg.length){
      const ptsKg=[];kgVals.forEach((v,i)=>{if(v!==null)ptsKg.push({i,v});});
      drawLine(ctx,ptsKg,'#888888',xOf,yKg,dpr,false,true,padT,ch,false);
      if(ptsKg.length){const p=ptsKg[ptsKg.length-1];ctx.fillStyle='#888888';ctx.font='bold 8px sans-serif';ctx.textAlign='left';ctx.fillText(p.v+'kg',xOf(p.i)+4,yKg(p.v)+3);}
    }

    if(ptsR.length){const p=ptsR[ptsR.length-1];ctx.fillStyle=m.color;ctx.font='bold 8px sans-serif';ctx.textAlign='right';ctx.fillText(p.v,xOf(p.i),yReps(p.v)-6);}
  });
}

loadAll();
const chips = document.querySelectorAll('.bbar-sort .schip');
if(chips.length > 0) {
  chips.forEach(c => c.classList.remove('active'));
  if(sortMode === 'pending' && chips[1]) chips[1].classList.add('active');
  else if(sortMode === 'done' && chips[2]) chips[2].classList.add('active');
  else if(chips[0]) chips[0].classList.add('active');
}

renderThreePages();
initSwipe();
initItemSwipes();
initCalSwipe();