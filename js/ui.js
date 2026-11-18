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
  const g1=document.createElement('div');g1.className='grp';g1.appendChild(gh('Size (mm)',T[s.type].p.map(p=>p.k)));
  T[s.type].p.forEach(p=>g1.appendChild(row(p.l,()=>s.p[p.k],v=>{v=Math.max(p.a,v);s.p[p.k]=p.k==='n'?Math.round(v):v},p.a,p.b,p.k==='n'?1:snap||1,p.k)));
  el.appendChild(g1);
  const g2=document.createElement('div');g2.className='grp';g2.appendChild(gh('Position (mm)',['pos_x','pos_y','pos_z']));
  ['X','Y','Z'].forEach((a,i)=>g2.appendChild(row(a==='Z'?'Z (base)':a,()=>s.pos[i],v=>s.pos[i]=f(v),-150,150,snap||1,'pos_'+a.toLowerCase())));el.appendChild(g2);
  const g3=document.createElement('div');g3.className='grp';g3.appendChild(gh('Rotation (degrees)',['rot_x','rot_y','rot_z']));
  ['X','Y','Z'].forEach((a,i)=>g3.appendChild(row(a,()=>s.rot[i],v=>s.rot[i]=f(v),-180,180,5,'rot_'+a.toLowerCase())));el.appendChild(g3);
  const tp=document.createElement('p');tp.className='help';tp.style.marginTop='10px';tp.textContent='Position is where the shape\u2019s bottom centre sits, so Z = 0 rests it on the workplane. Tick a box to make a value an editable variable in the exported code.';el.appendChild(tp);
}
