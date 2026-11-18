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
  if(t==='box'){
    H([p.x/2,0,0],[1,0,0],'x','side');H([-p.x/2,0,0],[-1,0,0],'x','side');
    H([0,p.y/2,0],[0,1,0],'y','side');H([0,-p.y/2,0],[0,-1,0],'y','side');
    H([0,0,p.z/2],[0,0,1],'z','side');H([0,0,-p.z/2],[0,0,-1],'z','side');
  }else if(t==='sphere')H([p.r,0,0],[1,0,0],'r','rad');
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
      nv=Math.max(def.a,sn(nv));if(sp.k==='n')nv=Math.round(nv);
      s.p[sp.k]=nv;
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
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey)return;
  const k=e.key.toLowerCase();
  if(k==='w')setWP(!wpMode);else if(k==='escape'&&wpMode)setWP(false);else if(k==='f')fit();else if(k==='?')$('#keys').hidden=!$('#keys').hidden;
});
drawWP();
