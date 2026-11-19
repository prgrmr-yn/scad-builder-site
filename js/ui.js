/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* ---- multi-select and align ---- */
let oth={b:null,s:new Set()},MS=[],alRef='group';
function multiIds(){
  if(sel==null)return [];
  if(oth.b!==sel)oth={b:sel,s:new Set()};
  return [sel,...[...oth.s].filter(id=>id!==sel&&shapes.some(x=>x.id===id))];
}
function toggleSel(id){
  const ids=multiIds();if(!ids.length){sel=id;return}
  const set=new Set(ids);if(set.has(id))set.delete(id);else set.add(id);
  const a=[...set];sel=a.length?a[0]:null;oth={b:sel,s:new Set(a.slice(1))};
}
function alignSel(ax,m){
  const ids=multiIds(),k=['x','y','z'][ax];
  const bx=ids.map(id=>{const o=grp.children.find(c=>c.userData.id===id);o.updateMatrixWorld(true);return new THREE.Box3().setFromObject(o)});
  const at=(b)=>m===0?b.min[k]:m===2?b.max[k]:(b.min[k]+b.max[k])/2;
  const ref=alRef==='main'?bx[0]:bx.reduce((a,b)=>a.clone().union(b));
  ids.forEach((id,i)=>{const s=shapes.find(x=>x.id===id);s.pos[ax]=f(s.pos[ax]+at(ref)-at(bx[i]))});
  refresh();commit();
}
function renderAlign(el){
  const ids=multiIds(),w=document.createElement('div');
  w.innerHTML='<h2></h2><p class="help"></p><label class="help" style="display:block;margin:12px 0 6px">Align to <select id="alref"><option value="group">Outer edges of the group</option><option value="main">Main shape</option></select></label>';
  w.querySelector('h2').textContent=ids.length+' shapes selected';
  w.querySelector('p').textContent='Main shape: '+cur().name+'. Shift+click shapes to add or remove them.';
  const sl=w.querySelector('select');sl.value=alRef;sl.onchange=()=>alRef=sl.value;
  [['X',['Left','Center','Right']],['Y',['Front','Center','Back']],['Z',['Bottom','Middle','Top']]].forEach(([a,L],i)=>{
    const r=document.createElement('div');r.className='alrow';r.innerHTML='<span></span>';r.firstChild.textContent=a;
    L.forEach((t,m)=>{const b=document.createElement('button');b.textContent=t;b.title='Line up the '+t.toLowerCase()+' ('+a+')';b.onclick=()=>alignSel(i,m);r.appendChild(b)});
    w.appendChild(r);
  });
  const gs=ids.map(id=>shapes.find(x=>x.id===id));
  if(gs.length===2&&gs.every(g=>g.type==='gear')&&gs[0].p.m===gs[1].p.m){
    const dist=f(gs[0].p.m*(gs[0].p.z+gs[1].p.z)/2),mb=document.createElement('div');mb.className='grp';
    mb.innerHTML='<h2>Gears</h2><p class="help"></p><button>Mesh them</button>';
    mb.querySelector('p').textContent='Centers should be '+dist+' mm apart.';
    mb.querySelector('button').onclick=()=>{const a=gs[0],b=gs[1];b.pos=[f(a.pos[0]+dist),a.pos[1],a.pos[2]];b.rot=[0,0,b.p.z%2?0:f(180/b.p.z)];refresh();commit()};
    w.appendChild(mb);
  }
  el.appendChild(w);
}
$('#alignbtn').onclick=()=>{
  if(shapes.length<2)return;
  if(multiIds().length<2){sel=shapes[0].id;oth={b:sel,s:new Set(shapes.slice(1).map(x=>x.id))}}
  refresh();
};
/* ---- panels ---- */
function renderList(){
  const el=$('#items');el.innerHTML='';
  if(!shapes.length){el.innerHTML='<p class="empty">Nothing yet. Add a shape above.</p>';return}
  shapes.forEach(s=>{
    const d=document.createElement('div');d.className='item'+(s.hole?' hole':'')+(multiIds().includes(s.id)?' on':'');
    d.innerHTML=svg(s.type)+'<span></span>'+(s.hole?'<small>Hole</small>':'');d.querySelector('span').textContent=s.name;
    d.onclick=e=>{if(e.shiftKey)toggleSel(s.id);else sel=s.id;refresh()};el.appendChild(d);
  });
}
function num(t,fb){t=String(t).replace(/,/g,'.').trim();if(!/^[-+*/().\d\s]+$/.test(t))return fb;try{const v=Function('"use strict";return ('+t+')')();return isFinite(v)?v:fb}catch(e){return fb}}
function row(label,get,set,a,b,step,ek){
  const w=document.createElement('div');w.className='row';
  w.innerHTML='<input type="checkbox" title="Export as an editable variable"><label></label><input type="range"><input type="text" inputmode="decimal">';
  w.querySelector('label').textContent=label;
  const [c,r,t]=w.querySelectorAll('input'),sh=cur();c.checked=!!sh.ex[ek];c.setAttribute('aria-label','Export '+label+' as variable');c.onchange=()=>{sh.ex[ek]=c.checked;renderProps();update();commit()};r.min=a;r.max=b;r.step=step;r.value=get();t.value=f(get());t.setAttribute('aria-label',label);
  const put=v=>{set(v);t.value=f(get());r.value=get();update()};
  r.oninput=()=>put(+r.value);r.onchange=commit;
  t.onchange=()=>{put(num(t.value,get()));commit()};
  t.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();put(num(t.value,get())+(e.key==='ArrowUp'?1:-1)*step*(e.shiftKey?10:1));commit()}};
  return w;
}
function gh(title,keys){
  const s=cur(),e=document.createElement('h2');e.innerHTML='<label class="gh"><input type="checkbox"><span></span></label>';e.querySelector('span').textContent=title;
  const c=e.querySelector('input'),n=keys.filter(k=>s.ex[k]).length;c.checked=n===keys.length;c.indeterminate=n>0&&n<keys.length;c.title='Export all of these as variables';
  c.onchange=()=>{keys.forEach(k=>s.ex[k]=c.checked);renderProps();update();commit()};return e;
}
function renderProps(){
  const el=$('#props');el.innerHTML='';const s=cur();syncBtns();
  if(multiIds().length>1){renderAlign(el);return}
  if(!s){el.innerHTML='<h2>Settings</h2><p class="empty">Click a shape in the 3D view or your list to change its size, position and rotation. Fields accept sums like 140/2+3.</p>';return}
  const h=document.createElement('div');
  h.innerHTML='<h2>'+T[s.type].l+'</h2><input type="text" id="nm" aria-label="Shape name"><div class="seg" role="group" aria-label="Solid or hole"><button data-h="0">Solid</button><button data-h="1">Hole</button></div><p class="help"></p>';
  el.appendChild(h);
  const nm=h.querySelector('#nm');nm.value=s.name;nm.oninput=()=>{s.name=nm.value;renderList();update()};nm.onchange=commit;
  h.querySelector('.help').textContent=s.hole?'Cuts this shape out of your solids.':'Adds material to your design.';
  if(!s.hole){const cw=document.createElement('label');cw.className='help';cw.style.cssText='display:flex;gap:8px;align-items:center;margin-top:8px';cw.innerHTML='Color <input type="color" style="width:44px;height:26px;padding:0;border:1px solid var(--line);background:none">';const ci=cw.querySelector('input');ci.value=s.color||'#1396a8';ci.oninput=()=>{s.color=ci.value;update()};ci.onchange=commit;h.appendChild(cw)}
  h.querySelectorAll('.seg button').forEach(b=>{b.classList.toggle('on',(b.dataset.h==='1')===s.hole);b.onclick=()=>{s.hole=b.dataset.h==='1';refresh();commit()}});
  if(s.type==='text'){
    const tw=document.createElement('div');tw.className='grp';
    tw.innerHTML='<h2>Text</h2><div class="row" style="grid-template-columns:16px 1fr"><input type="checkbox" id="txex" title="Export the words as an editable variable"><input type="text" id="txt" maxlength="80" aria-label="Text to write"></div><div class="trow"><select id="tfont" aria-label="Font"><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option></select><label class="gh"><input type="checkbox" id="tbold"> Bold</label></div><div class="seg" role="group" aria-label="Alignment"><button data-a="left">Left</button><button data-a="center">Center</button><button data-a="right">Right</button></div>';
    el.appendChild(tw);
    const tx=tw.querySelector('#txt'),ex=tw.querySelector('#txex');tx.value=s.txt||'';ex.checked=!!s.ex.txt;
    tx.oninput=()=>{s.txt=tx.value;update()};tx.onchange=commit;
    ex.onchange=()=>{s.ex.txt=ex.checked;update();commit()};
    const tf=tw.querySelector('#tfont');tf.value=s.font||'sans';tf.onchange=()=>{s.font=tf.value;update();commit()};
    const tb=tw.querySelector('#tbold');tb.checked=!!s.bold;tb.onchange=()=>{s.bold=tb.checked;update();commit()};
    tw.querySelectorAll('.seg button').forEach(b=>{b.classList.toggle('on',b.dataset.a===(s.align||'center'));b.onclick=()=>{s.align=b.dataset.a;renderProps();update();commit()}});
  }
  if(['rod','bolt','nut','tapped'].includes(s.type)){
    const th=document.createElement('div');th.className='grp';
    th.innerHTML='<h2>Thread</h2><div class="trow"><select id="tpre" aria-label="Thread size"></select><label class="gh"><input type="checkbox" id="tleft"> Left-hand</label></div>';
    const sl=th.querySelector('#tpre'),cu=TH_PRESETS.find(q=>q[1]===s.p.d&&q[2]===s.p.pt);
    sl.innerHTML='<option value="">Custom</option>'+TH_PRESETS.map(q=>'<option value="'+q[0]+'">'+q[0]+' (pitch '+q[2]+')</option>').join('');
    sl.value=cu?cu[0]:'';
    sl.onchange=()=>{const q=TH_PRESETS.find(x=>x[0]===sl.value);if(q){s.p.d=q[1];s.p.pt=q[2];if(s.type==='nut')s.p.h=f(.8*q[1]);renderProps();update();commit()}};
    const lf=th.querySelector('#tleft');lf.checked=!!s.left;lf.onchange=()=>{s.left=lf.checked;update();commit()};
    el.appendChild(th);
  }
  if(s.type==='gear'||s.type==='ringgear'){const gi=document.createElement('p');gi.className='help';gi.style.marginTop='10px';gi.textContent='Pitch diameter '+f(s.p.m*s.p.z)+' mm. A matching gear needs the same module.';el.appendChild(gi)}
  const g1=document.createElement('div');g1.className='grp';g1.appendChild(gh('Size (mm)',T[s.type].p.map(p=>p.k)));
  T[s.type].p.forEach(p=>g1.appendChild(row(p.l,()=>s.p[p.k],v=>{v=Math.max(p.a,v);s.p[p.k]=(p.k==='n'||p.k==='z')?Math.round(v):v;fixS(s)},p.a,p.b,(p.k==='n'||p.k==='z')?1:(p.k==='sp'||p.k==='pt'||p.k==='c')?.05:p.k==='m'?.25:snap||1,p.k)));
  el.appendChild(g1);
  const g2=document.createElement('div');g2.className='grp';g2.appendChild(gh('Position (mm)',['pos_x','pos_y','pos_z']));
  ['X','Y','Z'].forEach((a,i)=>g2.appendChild(row(a==='Z'?'Z (base)':a,()=>s.pos[i],v=>s.pos[i]=f(v),-150,150,snap||1,'pos_'+a.toLowerCase())));el.appendChild(g2);
  const g3=document.createElement('div');g3.className='grp';g3.appendChild(gh('Rotation (degrees)',['rot_x','rot_y','rot_z']));
  ['X','Y','Z'].forEach((a,i)=>g3.appendChild(row(a,()=>s.rot[i],v=>s.rot[i]=f(v),-180,180,5,'rot_'+a.toLowerCase())));el.appendChild(g3);
  const gt=document.createElement('div');gt.className='grp';
  gt.innerHTML='<h2>Flip and repeat</h2><div class="seg" role="group" aria-label="Flip"><button data-f="0">Flip X</button><button data-f="1">Flip Y</button><button data-f="2">Flip Z</button></div><div class="trow"><select id="arrt" aria-label="Repeat"><option value="none">No repeat</option><option value="linear">Repeat in a line</option><option value="circular">Repeat in a circle</option></select></div>';
  el.appendChild(gt);
  s.mir=s.mir||[0,0,0];s.arr=s.arr||{t:'none',n:3,dx:30,dy:0,dz:0,cx:0,cy:0,sw:360};
  gt.querySelectorAll('.seg button').forEach(b=>{const i=+b.dataset.f;b.classList.toggle('on',!!s.mir[i]);b.onclick=()=>{s.mir[i]=s.mir[i]?0:1;renderProps();update();commit()}});
  const AR=s.arr,at=gt.querySelector('#arrt');at.value=AR.t;at.onchange=()=>{AR.t=at.value;renderProps();update();commit()};
  const ar=(l,k,a,b,st)=>gt.appendChild(row(l,()=>AR[k],v=>{AR[k]=k==='n'?Math.round(v):v},a,b,st,'arr_'+k));
  if(AR.t==='linear'){ar('Copies','n',2,30,1);ar('Gap X','dx',-150,150,snap||1);ar('Gap Y','dy',-150,150,snap||1);ar('Gap Z','dz',-150,150,snap||1)}
  if(AR.t==='circular'){ar('Copies','n',2,60,1);ar('Sweep','sw',10,360,5);ar('Center X','cx',-150,150,snap||1);ar('Center Y','cy',-150,150,snap||1)}
  const tp=document.createElement('p');tp.className='help';tp.style.marginTop='10px';tp.textContent='Position is where the shape\u2019s bottom centre sits, so Z = 0 rests it on the workplane. Tick a box to make a value an editable variable in the exported code.';el.appendChild(tp);
}
