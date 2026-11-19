/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* ---- on-screen handles, rotation rings, workplane ---- */
const gz=new THREE.Group(),wpm=new THREE.Group();scene.add(gz,wpm);
let hnd=[],rings=[],gc=new THREE.Vector3(),drag=null;
const AX=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
const V=a=>new THREE.Vector3(...a);
const Q=s=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...s.rot.map(d=>d*PI/180),'ZYX'));
const ctr=s=>V([0,0,hz(s)]).applyQuaternion(Q(s)).add(V(s.pos));
const setC=(s,c)=>{s.pos=c.sub(V([0,0,hz(s)]).applyQuaternion(Q(s))).toArray().map(f)};
const hitP=(n,c)=>{const p=new THREE.Vector3();return ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n,c),p)?p:null};
const ang=(p,i)=>{const d=p.clone().sub(gc);return Math.atan2(d.dot(AX[(i+2)%3]),d.dot(AX[(i+1)%3]))};
function tip(t,e){const el=$('#tip');el.hidden=!t;if(t){const r=vp.getBoundingClientRect();el.textContent=t;el.style.left=(e.clientX-r.left+14)+'px';el.style.top=(e.clientY-r.top+14)+'px'}}
/* handle spec: q = local position, a = outward axis, k = parameter, m = side (one-sided), rad (radius) or half (base) */
function hs(s){
  const p=s.p,t=s.type,L=[],H=(q,a,k,m,o)=>L.push({q,a,k,m,o:o||0});
  if(t==='box'||t==='wedge'||t==='rounded'){
    H([p.x/2,0,0],[1,0,0],'x','side');H([-p.x/2,0,0],[-1,0,0],'x','side');
    H([0,p.y/2,0],[0,1,0],'y','side');H([0,-p.y/2,0],[0,-1,0],'y','side');
    H([0,0,p.z/2],[0,0,1],'z','side');H([0,0,-p.z/2],[0,0,-1],'z','side');
  }else if(t==='sphere')H([p.r,0,0],[1,0,0],'r','rad');
  else if(t==='dome')H([p.r,0,-p.r/2],[1,0,0],'r','rad');
  else if(t==='star'){H([0,0,p.h/2],[0,0,1],'h','side');H([0,0,-p.h/2],[0,0,-1],'h','side');H([p.R,0,0],[1,0,0],'R','rad')}
  else if(t==='text'){H([0,0,p.h/2],[0,0,1],'h','side');H([0,0,-p.h/2],[0,0,-1],'h','side')}
  else if(t==='rod'||t==='tapped'){H([0,0,p.h/2],[0,0,1],'h','side');H([0,0,-p.h/2],[0,0,-1],'h','side');H([p.d/2,0,0],[1,0,0],'d','half')}
  else if(t==='bolt'||t==='nut'||t==='gear'||t==='ringgear'){}
  else if(t==='torus'){H([p.R,0,0],[1,0,0],'R','rad');H([p.R+p.r,0,0],[1,0,0],'r','rad',p.R)}
  else{
    H([0,0,p.h/2],[0,0,1],'h','side');H([0,0,-p.h/2],[0,0,-1],'h','side');
    if(t==='pyramid')H([p.s/2,0,-p.h/2],[1,0,0],'s','half');
    else{
      H([p.r,0,t==='cone'?-p.h/2:0],[1,0,0],'r','rad');
      if(t==='cone')H([Math.max(p.r2,3),0,p.h/2],[1,0,0],'r2','rad');
    }
  }
  return L;
}
function buildGizmo(){
  while(gz.children.length)gz.remove(gz.children[0]);hnd=[];rings=[];
  const s=cur(),o=s&&grp.children.find(c=>c.userData.id===s.id);if(!o||MS.length>1)return;
  o.updateMatrixWorld(true);gc=ctr(s);gz.position.copy(gc);
  const bs=new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere()).radius,rg=bs*1.15+4;
  [0xe03a3a,0x3aa04a,0x3a6fe0].forEach((c,i)=>{
    const g=new THREE.TorusGeometry(rg,Math.max(1,bs*.035),6,64);
    if(i===0)g.rotateY(PI/2);if(i===1)g.rotateX(PI/2);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.6,depthTest:false}));
    m.renderOrder=9;m.userData.axis=i;gz.add(m);rings.push(m);
  });
  hs(s).forEach(h=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));
    const l=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0x021c22,depthTest:false}));
    l.renderOrder=11;m.add(l);m.renderOrder=10;m.userData.spec=h;
    m.position.copy(o.localToWorld(V([h.q[0],h.q[1],h.q[2]+hz(s)]))).sub(gc);gz.add(m);hnd.push(m);
  });
}
function scaleGizmo(){hnd.forEach(m=>m.scale.setScalar(dist*.014))}
const _update=update;update=function(){_update();buildGizmo();scaleGizmo();dimTxt();draw()};
function dimTxt(){
  const ids=multiIds(),bb=new THREE.Box3();
  ids.forEach(id=>{const o=grp.children.find(c=>c.userData.id===id);if(o)bb.union(new THREE.Box3().setFromObject(o))});
  let t='';if(!bb.isEmpty()){const z=bb.getSize(new THREE.Vector3());t=(ids.length>1?ids.length+' shapes':cur().name)+'  \u00b7  '+[z.x,z.y,z.z].map(f).join(' \u00d7 ')+' mm'}
  $('#dims').textContent=t;
}
const _place=place;place=function(){_place();scaleGizmo()};
/* workplane: new shapes land on it, and shapes slide along it */
function drawWP(){
  while(wpm.children.length)wpm.remove(wpm.children[0]);
  const on=wp.label!=='Bed'||wp.n[2]<.999||wp.o[0]||wp.o[1];
  $('#wp').classList.toggle('on',wpMode);
  $('#wp').textContent=wpMode?'Click a surface…':wp.label==='Bed'?'Workplane':'Workplane: '+wp.label;
  if(on){
    const g=new THREE.PlaneGeometry(40,40),m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x3a6fe0,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:0x3a6fe0})));
    const n=V(wp.n);m.quaternion.setFromUnitVectors(AX[2],n);m.position.copy(V(wp.o)).addScaledVector(n,.05);wpm.add(m);
  }
  draw();
}
function setWP(on){wpMode=on;cv.style.cursor=on?'crosshair':'grab';drawWP()}
function pickWP(){
  const h=ray.intersectObjects(grp.children.map(o=>o.children[0]),false)[0];
  if(h){
    const n=h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize();
    wp={o:h.point.toArray().map(f),n:n.toArray().map(f),label:shapes.find(x=>x.id===h.object.userData.id).name};
  }else{
    const p=hitP(AX[2],new THREE.Vector3());
    wp={o:p?[f(p.x),f(p.y),0]:[0,0,0],n:[0,0,1],label:'Bed'};
  }
  setWP(false);
}
$('#wp').onclick=()=>setWP(!wpMode);
/* pointer: handles resize, rings rotate, shapes move, empty space orbits */
const meshes=()=>grp.children.map(o=>o.children[0]);
cv.onpointerdown=e=>{
  aim(e);last=[e.clientX,e.clientY];moved=0;cv.setPointerCapture(e.pointerId);
  if(e.button===1||e.button===2){drag={t:'pan'};return}
  if(wpMode){pickWP();return}
  const s=cur();
  if(s){
    const o=grp.children.find(c=>c.userData.id===s.id),hh=ray.intersectObjects(hnd,false)[0];
    if(hh){
      const sp=hh.object.userData.spec;
      drag={t:'size',sp,D:V(sp.a).applyQuaternion(o.quaternion).normalize(),c0:ctr(s),size0:s.p[sp.k]};return;
    }
    const rr=ray.intersectObjects(rings,false)[0];
    if(rr){
      const i=rr.object.userData.axis,p0=hitP(AX[i],gc);
      drag={t:'rot',i,a0:p0?ang(p0,i):0,q0:Q(s),c0:ctr(s)};return;
    }
  }
  const h=ray.intersectObjects(meshes(),false)[0];
  if(h&&e.shiftKey){toggleSel(h.object.userData.id);refresh();return}
  if(h){
    const t=shapes.find(x=>x.id===h.object.userData.id),ids=multiIds(),gm=ids.length>1&&ids.includes(t.id);
    if(!gm)sel=t.id;
    const c=V(t.pos),p=hitP(V(wp.n),c)||c;
    drag={t:'move',off:p.clone().sub(c),n:V(wp.n),c,id:t.id,starts:gm?ids.map(id=>[id,[...shapes.find(x=>x.id===id).pos]]):null};refresh();
  }else drag={t:'orbit'};
};
cv.onpointermove=e=>{
  const d=drag;if(!d)return;
  moved+=Math.abs(e.clientX-last[0])+Math.abs(e.clientY-last[1]);
  const s=cur();let msg=null;aim(e);
  if(d.t==='pan'){const k=dist*.0016,r=new THREE.Vector3().setFromMatrixColumn(cam.matrix,0),u=new THREE.Vector3().setFromMatrixColumn(cam.matrix,1);tgt.addScaledVector(r,-(e.clientX-last[0])*k).addScaledVector(u,(e.clientY-last[1])*k);place();draw()}
  else if(d.t==='orbit'){th-=(e.clientX-last[0])*.01;ph=Math.min(3,Math.max(.05,ph-(e.clientY-last[1])*.01));place();draw()}
  else if(d.t==='move'&&moved>2){
    const p=hitP(d.n,d.c);
    if(p){
      const q=p.sub(d.off),m0=shapes.find(x=>x.id===d.id),z0=m0.pos[2];
      m0.pos=wp.n[2]>.999?[sn(q.x),sn(q.y),z0]:q.toArray().map(f);
      if(d.starts){const s0=d.starts.find(a=>a[0]===d.id)[1],dl=m0.pos.map((v,i)=>v-s0[i]);d.starts.forEach(([id,p0])=>{if(id!==d.id)shapes.find(x=>x.id===id).pos=p0.map((v,i)=>f(v+dl[i]))})}
      msg='X '+f(m0.pos[0])+'  Y '+f(m0.pos[1])+'  Z '+f(m0.pos[2]);
    }
  }else if(d.t==='size'){
    const D=d.D,B=ray.ray.direction,w0=d.c0.clone().sub(ray.ray.origin),b=D.dot(B),den=1-b*b;
    if(den>1e-4){
      const t=(b*B.dot(w0)-D.dot(w0))/den,sp=d.sp,def=T[s.type].p.find(x=>x.k===sp.k);
      let nv=sp.m==='side'?t+d.size0/2:sp.m==='half'?2*t:t-sp.o;
      nv=Math.max(def.a,sn(nv));if(sp.k==='n'||sp.k==='z')nv=Math.round(nv);
      s.p[sp.k]=nv;fixS(s);
      setC(s,sp.m==='side'?d.c0.clone().addScaledVector(D,(nv-d.size0)/2):d.c0.clone());
      msg=def.l+' '+f(nv)+' mm';
    }
  }else if(d.t==='rot'){
    const p=hitP(AX[d.i],gc);
    if(p){
      let deg=(ang(p,d.i)-d.a0)*180/PI;if(snap)deg=Math.round(deg/15)*15;
      const q=new THREE.Quaternion().setFromAxisAngle(AX[d.i],deg*PI/180).multiply(d.q0),eu=new THREE.Euler().setFromQuaternion(q,'ZYX');
      s.rot=[eu.x,eu.y,eu.z].map(r=>f(r*180/PI));setC(s,d.c0.clone());msg='Turned '+f(deg)+'°';
    }
  }
  if(msg!==null){renderProps();update()}
  tip(msg,e);last=[e.clientX,e.clientY];
};
cv.onpointerup=()=>{
  const d=drag;drag=null;tip(0);if(!d)return;
  if(d.t==='orbit'){if(moved<4&&sel!=null){sel=null;refresh()}}
  else if(moved>2)commit();
};
addEventListener('keydown',e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||!$('#mlib').hidden)return;
  const k=e.key.toLowerCase();
  if(k==='w')setWP(!wpMode);else if(k==='escape'&&wpMode)setWP(false);else if(k==='f')fit();else if(k==='?')$('#keys').hidden=!$('#keys').hidden;
});
drawWP();
/* ---- model library ---- */
const hasT=t=>typeof t==='string'&&Object.prototype.hasOwnProperty.call(T,t);
const cleanArr=a=>{if(!a||!['linear','circular'].includes(a.t))return undefined;const g=(k,d)=>Number.isFinite(+a[k])?Math.max(-1000,Math.min(1000,+a[k])):d;return{t:a.t,n:Math.min(60,Math.max(1,Math.round(g('n',3)))),dx:g('dx',30),dy:g('dy',0),dz:g('dz',0),cx:g('cx',0),cy:g('cy',0),sw:g('sw',360)}};
function cleanModel(o){
  if(!o||!Array.isArray(o.shapes)||!o.shapes.length||o.shapes.length>200)return null;
  const num=(v,d)=>Number.isFinite(+v)&&v!==null&&v!==''?+v:d,v3=a=>Array.isArray(a)&&a.length===3?a.map(x=>num(x,0)):[0,0,0],out=[];
  for(const s of o.shapes){
    if(!s||!hasT(s.type))continue;
    const t=T[s.type],p={};
    Object.keys(t.d).forEach(k=>p[k]=Math.min(Math.max(num(s.p&&s.p[k],t.d[k]),0),1000));
    out.push({type:s.type,name:String(s.name||t.l).slice(0,60),hole:!!s.hole,p,pos:v3(s.pos),rot:v3(s.rot),color:/^#[0-9a-f]{6}$/i.test(s.color||'')?s.color:undefined,txt:s.type==='text'?String(s.txt==null?'Hello':s.txt).slice(0,80):undefined,font:['sans','serif','mono'].includes(s.font)?s.font:undefined,left:!!s.left,mir:Array.isArray(s.mir)&&s.mir.length===3?s.mir.map(x=>x?1:0):undefined,arr:cleanArr(s.arr),bold:!!s.bold,align:['left','center','right'].includes(s.align)?s.align:undefined});
  }
  return out.length?{name:String(o.name||'Untitled').slice(0,60),category:String(o.category||'Other').slice(0,30),shapes:out}:null;
}
const BUILTIN=[
 {name:'Pen cup',category:'Desk',shapes:[{type:'cylinder',name:'Cup',p:{h:90,r:35},pos:[0,0,0]},{type:'cylinder',name:'Hollow',hole:true,p:{h:90,r:30},pos:[0,0,5]}]},
 {name:'Hex pencil holder',category:'Desk',shapes:[{type:'prism',name:'Body',p:{h:80,r:32,n:6},pos:[0,0,0]},{type:'prism',name:'Hollow',hole:true,p:{h:80,r:28,n:6},pos:[0,0,5]}]},
 {name:'Coaster',category:'Home',shapes:[{type:'cylinder',name:'Disc',p:{h:5,r:45},pos:[0,0,0]},{type:'cylinder',name:'Dip',hole:true,p:{h:3,r:40},pos:[0,0,3]}]},
 {name:'Planter',category:'Home',shapes:[{type:'cone',name:'Pot',p:{h:60,r:25,r2:35},pos:[0,0,0]},{type:'cone',name:'Soil space',hole:true,p:{h:60,r:21,r2:31},pos:[0,0,4]}]},
 {name:'Napkin ring',category:'Home',shapes:[{type:'tube',name:'Ring',p:{h:25,r:30,w:4},pos:[0,0,0]}]},
 {name:'Key tag',category:'Keychains',shapes:[{type:'rounded',name:'Tag',p:{x:60,y:28,z:4,c:6},pos:[0,0,0]},{type:'cylinder',name:'Key ring hole',hole:true,p:{h:10,r:4},pos:[-22,0,-3]}]},
 {name:'Name tag',category:'Keychains',shapes:[{type:'rounded',name:'Plate',p:{x:70,y:26,z:3,c:6},pos:[0,0,0]},{type:'text',name:'Name',txt:'NAME',p:{s:10,h:1.5,sp:1},pos:[0,0,3]},{type:'cylinder',name:'Key ring hole',hole:true,p:{h:10,r:3},pos:[-30,0,-3]}]},
 {name:'Engraved plaque',category:'Home',shapes:[{type:'box',name:'Plaque',p:{x:80,y:30,z:5},pos:[0,0,0]},{type:'text',name:'Engraving',hole:true,txt:'WELCOME',p:{s:9,h:3,sp:1},pos:[0,0,3.5]}]},
 {name:'Bolt and nut (M8)',category:'Hardware',shapes:[{type:'bolt',name:'Bolt',p:{d:8,pt:1.25,h:20},pos:[0,0,0]},{type:'nut',name:'Nut',p:{d:8,pt:1.25,h:6.4,c:.2},pos:[24,0,0]}]},
 {name:'Gear pair',category:'Hardware',shapes:[{type:'gear',name:'Gear A',p:{m:2,z:20,h:6,b:5},pos:[0,0,0]},{type:'gear',name:'Gear B',p:{m:2,z:12,h:6,b:4},pos:[32,0,0],rot:[0,0,15]}]},
 {name:'Star ornament',category:'Fun',shapes:[{type:'star',name:'Star',p:{h:4,R:30,r:14,n:5},pos:[0,0,0]},{type:'cylinder',name:'Hanging hole',hole:true,p:{h:10,r:2},pos:[22,0,-3]}]},
 {name:'Snowman',category:'Fun',shapes:[{type:'sphere',name:'Body',p:{r:20},pos:[0,0,0]},{type:'sphere',name:'Head',p:{r:13},pos:[0,0,35]},{type:'cone',name:'Nose',p:{h:12,r:3,r2:0},pos:[0,-9,48],rot:[90,0,0]}]}
];
let lcat='All',hosted=[];
const lmsg=t=>{$('#lmsg').textContent=t};
const mine=()=>{try{return (JSON.parse(localStorage.getItem('scadbuilder-models')||'[]')||[]).map(cleanModel).filter(Boolean)}catch(e){return []}};
const saveMine=a=>{try{localStorage.setItem('scadbuilder-models',JSON.stringify(a));return true}catch(e){return false}};
async function loadHosted(){
  try{
    const r=await fetch('models/index.json');if(!r.ok)return;
    const j=await r.json();
    hosted=(Array.isArray(j)?j:j.models||[]).filter(m=>m&&/^[\w.-]+\.json$/.test(m.file||'')).slice(0,2000)
      .map(m=>({file:m.file,name:String(m.name||m.file).slice(0,60),category:String(m.category||'Other').slice(0,30),types:(Array.isArray(m.types)?m.types:[]).filter(hasT).slice(0,4)}));
  }catch(e){}
}
async function saveFile(name,text){
  if(typeof claude!=='undefined'){
    try{const d=await claude.use('downloads');if(d){await d.save({filename:name,data:text});return true}}catch(e){}
    return false;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();return true;
}
function useModel(model,replace){
  const bb0=new THREE.Box3();grp.children.forEach(o=>bb0.union(new THREE.Box3().setFromObject(o)));
  const oldMax=!replace&&shapes.length&&!bb0.isEmpty()?bb0.max.x:null;
  if(replace)shapes=[];
  const ns=model.shapes.map(o=>mk(o.type,{name:o.name,hole:o.hole,p:o.p,pos:[...o.pos],rot:[...o.rot],color:o.color,txt:o.txt,font:o.font,bold:o.bold,align:o.align,left:o.left,mir:o.mir,arr:o.arr}));
  shapes=shapes.concat(ns);sel=ns[0].id;oth={b:sel,s:new Set(ns.slice(1).map(x=>x.id))};refresh();
  if(oldMax!==null){
    const bb=new THREE.Box3();ns.forEach(s=>{const o=grp.children.find(c=>c.userData.id===s.id);bb.union(new THREE.Box3().setFromObject(o))});
    const dx=oldMax+10-bb.min.x;ns.forEach(s=>s.pos[0]=f(s.pos[0]+dx));refresh();
  }
  commit();closeLib();fit();toast((replace?'Opened ':'Added ')+model.name);
}
function renderLib(){
  const q=$('#lq').value.trim().toLowerCase();
  const all=[...BUILTIN.map(cleanModel).map(m=>({m,src:'built'})),...hosted.map(m=>({m,src:'host'})),...mine().map((m,i)=>({m:Object.assign({},m,{category:'My models'}),src:'mine',i}))];
  const cats=['All',...new Set(all.map(x=>x.m.category))];if(!cats.includes(lcat))lcat='All';
  const ch=$('#lchips');ch.innerHTML='';
  cats.forEach(c=>{const b=document.createElement('button');b.textContent=c;b.className=c===lcat?'on':'';b.onclick=()=>{lcat=c;renderLib()};ch.appendChild(b)});
  const list=all.filter(x=>(lcat==='All'||x.m.category===lcat)&&(!q||(x.m.name+' '+x.m.category).toLowerCase().includes(q)));
  const g=$('#lgrid');g.innerHTML='';
  if(!list.length){g.innerHTML='<p class="empty">No models found.</p>';return}
  list.forEach(x=>{
    const types=x.m.shapes?[...new Set(x.m.shapes.map(s=>s.type))]:(x.m.types.length?x.m.types:['box']);
    const d=document.createElement('div');d.className='mcard';
    d.innerHTML='<div class="mic">'+types.slice(0,4).map(svg).join('')+'</div><b></b><small></small><div class="macts"><button data-o>Open</button><button data-a>Add</button></div>';
    d.querySelector('b').textContent=x.m.name;
    d.querySelector('small').textContent=x.m.category+(x.m.shapes?' \u00b7 '+x.m.shapes.length+(x.m.shapes.length===1?' shape':' shapes'):'');
    const get=async()=>{
      if(x.src!=='host')return cleanModel(x.m);
      try{const r=await fetch('models/'+x.m.file);if(!r.ok)throw 0;const t=await r.text();if(t.length>1e6)throw 0;const m=cleanModel(JSON.parse(t));if(m)return m}catch(e){}
      lmsg('Could not load that model.');return null;
    };
    d.querySelector('[data-o]').onclick=async()=>{const m=await get();if(m)useModel(m,true)};
    d.querySelector('[data-a]').onclick=async()=>{const m=await get();if(m)useModel(m,false)};
    if(x.src==='mine'){const b=document.createElement('button');b.textContent='Delete';b.onclick=()=>{const a=mine();a.splice(x.i,1);saveMine(a);renderLib()};d.querySelector('.macts').appendChild(b)}
    g.appendChild(d);
  });
}
function openLib(){$('#mlib').hidden=false;lmsg('');renderLib();$('#lq').focus()}
function closeLib(){$('#mlib').hidden=true}
$('#libbtn').onclick=openLib;$('#libbtn2').onclick=openLib;$('#lx').onclick=closeLib;
$('#mlib').onclick=e=>{if(e.target.id==='mlib')closeLib()};
$('#lq').oninput=renderLib;
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#mlib').hidden)closeLib()});
$('#lsave').onclick=()=>{
  if(!shapes.length){lmsg('Add some shapes first.');return}
  const m=cleanModel({name:$('#lname').value.trim()||'My design',category:'My models',shapes}),a=mine();
  a.unshift(m);lmsg(saveMine(a)?'Saved to My models.':'Could not save in this browser.');lcat='My models';renderLib();
};
$('#lexp').onclick=async()=>{
  if(!shapes.length){lmsg('Add some shapes first.');return}
  const name=$('#lname').value.trim()||'My design',m=cleanModel({name,category:$('#lcatin').value.trim()||'Other',shapes});
  lmsg(await saveFile(slug(name)+'.json',JSON.stringify(m,null,1))?'Exported. Share the file or add it to the models folder.':'Not saved.');
};
$('#limp').onclick=()=>$('#lfile').click();
$('#lfile').onchange=async e=>{
  const fl=e.target.files[0];e.target.value='';if(!fl)return;
  if(fl.size>1e6){lmsg('That file is too large.');return}
  try{const m=cleanModel(JSON.parse(await fl.text()));if(!m)throw 0;const a=mine();m.category='My models';a.unshift(m);saveMine(a);lcat='My models';renderLib();lmsg('Imported '+m.name+'.')}
  catch(err){lmsg('That file is not a valid model.')}
};
loadHosted().then(()=>{if(!$('#mlib').hidden)renderLib()});
