/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* ---- 3D view ---- */
const vp=$('#vp'),R=new THREE.WebGLRenderer({antialias:true,alpha:true}),cv=R.domElement;
R.setPixelRatio(Math.min(devicePixelRatio,2));vp.insertBefore(cv,vp.firstChild);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,1,.1,3000);cam.up.set(0,0,1);
scene.add(new THREE.AmbientLight(0xffffff,.65));
const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(60,-80,120);scene.add(dl);
scene.add(new THREE.AxesHelper(25));
const bedObj=new THREE.Group(),grp=new THREE.Group();scene.add(bedObj,grp);
let th=-.8,ph=1,dist=200;
const tgt=new THREE.Vector3();
function place(){cam.position.set(tgt.x+dist*Math.sin(ph)*Math.cos(th),tgt.y+dist*Math.sin(ph)*Math.sin(th),tgt.z+dist*Math.cos(ph));cam.lookAt(tgt)}
function size(){const w=vp.clientWidth,h=vp.clientHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
const draw=()=>R.render(scene,cam);
function home(view){tgt.set(0,0,0);
  dist=Math.max(...(bed[0]?bed:[200,200]))*.95;
  if(view==='top'){th=-PI/2;ph=.05}else if(view==='front'){th=-PI/2;ph=1.5}else{th=-.8;ph=1}
  place();draw();
}
function drawBed(){
  while(bedObj.children.length)bedObj.remove(bedObj.children[0]);
  const [w,d]=bed[0]?bed:[200,200],gs=Math.ceil(Math.max(w,d)/10)*10;
  const g=new THREE.GridHelper(gs,gs/10,0x7f8d8f,0xb4bfc1);g.rotation.x=PI/2;bedObj.add(g);
  if(bed[0]){
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0x1396a8,transparent:true,opacity:.1}));pl.position.z=-.05;bedObj.add(pl);
    const pts=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(a=>new THREE.Vector3(a[0],a[1],0));
    bedObj.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x1396a8})));
  }
}
function geo(s){
  const p=s.p,t=s.type,fn=Math.min(Math.max(+$('#fn').value|0,8),48);let g;
  if(t==='box')return new THREE.BoxGeometry(p.x,p.y,p.z);
  if(t==='sphere')return new THREE.SphereGeometry(Math.max(p.r,.01),fn,Math.max(8,fn>>1));
  if(t==='torus')return new THREE.TorusGeometry(p.R,Math.max(p.r,.01),16,fn);
  if(t==='tube'){
    const ro=p.r,ri=Math.max(p.r-p.w,.01);
    g=new THREE.LatheGeometry([[ro,-p.h/2],[ro,p.h/2],[ri,p.h/2],[ri,-p.h/2],[ro,-p.h/2]].map(a=>new THREE.Vector2(a[0],a[1])),fn);g.rotateX(PI/2);return g;
  }
  let top=p.r,bot=p.r,seg=fn,extra=0;
  if(t==='cone'){top=p.r2}
  if(t==='pyramid'){top=0;bot=p.s*Math.SQRT2/2;seg=4;extra=PI/4}
  if(t==='prism')seg=Math.round(p.n);
  g=new THREE.CylinderGeometry(top,bot,p.h,seg);g.rotateX(PI/2);g.rotateZ(PI/2+extra);return g;
}
function mesh(s){
  const g=geo(s),on=MS.includes(s.id);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:s.hole?0xe0731a:parseInt((s.color||'#1396a8').slice(1),16),transparent:s.hole,opacity:s.hole?.5:1,roughness:.55,side:THREE.DoubleSide,depthWrite:!s.hole,emissive:on?0x1d6b78:0}));
  m.userData.id=s.id;m.position.set(0,0,hz(s));
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,30),new THREE.LineBasicMaterial({color:0x021c22,transparent:true,opacity:on?1:.25})));
  const o=new THREE.Group();o.add(m);o.userData.id=s.id;o.position.set(...s.pos);o.rotation.order='ZYX';
  o.rotation.set(...s.rot.map(d=>d*PI/180));return o;
}
function checkBed(){
  let bad=0;
  if(bed[0]){
    grp.updateMatrixWorld(true);
    grp.children.forEach((o,i)=>{
      if(shapes[i].hole)return;
      const b=new THREE.Box3().setFromObject(o);
      if(b.min.x<-bed[0]/2-.01||b.max.x>bed[0]/2+.01||b.min.y<-bed[1]/2-.01||b.max.y>bed[1]/2+.01||b.min.z<-.01)bad++;
    });
  }
  const w=$('#warn');w.hidden=!bad;w.textContent=bad?bad+(bad>1?' shapes are':' shape is')+' outside the print bed':'';
}
function update(){
  MS=multiIds();
  while(grp.children.length){const c=grp.children.pop();c.traverse(n=>{if(n.geometry)n.geometry.dispose()})}
  shapes.forEach(s=>grp.add(mesh(s)));
  $('#code').value=gen();checkBed();$('#welcome').hidden=shapes.length>0;draw();
}
/* pointer: drag shapes to move, drag empty space to orbit */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
let mode=null,last=[0,0],off=[0,0],moved=0,pl=null;
function aim(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam)}
cv.onpointerdown=e=>{
  aim(e);last=[e.clientX,e.clientY];moved=0;cv.setPointerCapture(e.pointerId);
  const h=ray.intersectObjects(grp.children.map(o=>o.children[0]),false)[0];
  if(h){
    const s=shapes.find(x=>x.id===h.object.userData.id);sel=s.id;
    pl=new THREE.Plane(new THREE.Vector3(0,0,1),-s.pos[2]);
    const p=new THREE.Vector3(),ok=ray.ray.intersectPlane(pl,p);
    off=ok?[p.x-s.pos[0],p.y-s.pos[1]]:[0,0];mode='move';refresh();
  }else mode='orbit';
};
cv.onpointermove=e=>{
  if(!mode)return;
  moved+=Math.abs(e.clientX-last[0])+Math.abs(e.clientY-last[1]);
  if(mode==='orbit'){th-=(e.clientX-last[0])*.01;ph=Math.min(3,Math.max(.05,ph-(e.clientY-last[1])*.01));place();draw()}
  else if(moved>2){
    aim(e);const p=new THREE.Vector3();
    if(ray.ray.intersectPlane(pl,p)){const s=cur();s.pos[0]=sn(p.x-off[0]);s.pos[1]=sn(p.y-off[1]);renderProps();update()}
  }
  last=[e.clientX,e.clientY];
};
cv.onpointerup=()=>{
  if(mode==='move'&&moved>2)commit();
  if(mode==='orbit'&&moved<4&&sel!=null){sel=null;refresh()}
  mode=null;
};
const zoom=k=>{dist=Math.min(1200,Math.max(30,dist*k));place();draw()};
cv.onwheel=e=>{e.preventDefault();zoom(1+e.deltaY*.001)};
document.querySelectorAll('.views button').forEach(b=>b.onclick=()=>b.dataset.v?home(b.dataset.v):zoom(b.dataset.z==='1'?1.2:1/1.2));
new ResizeObserver(()=>{size();draw()}).observe(vp);
$('#fn').oninput=update;$('#vars').onchange=update;
/* keyboard */
addEventListener('keydown',e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const k=e.key.toLowerCase(),m=e.ctrlKey||e.metaKey,s=cur();
  if(m&&k==='z'){e.preventDefault();go(e.shiftKey?hi+1:hi-1)}
  else if(m&&k==='y'){e.preventDefault();go(hi+1)}
  else if(m&&k==='d'){e.preventDefault();dup()}
  else if(m&&k==='a'){e.preventDefault();if(shapes.length){sel=shapes[0].id;oth={b:sel,s:new Set(shapes.slice(1).map(x=>x.id))};refresh()}}
  else if(m&&k==='c'){const ids=multiIds();if(ids.length){clip=ids.map(id=>JSON.parse(JSON.stringify(shapes.find(x=>x.id===id))));pn=0;toast('Copied '+ids.length)}}
  else if(m&&k==='v'&&clip.length){
    e.preventDefault();pn++;
    const cs=clip.map(o=>{const c=JSON.parse(JSON.stringify(o));c.id=nid++;c.name=o.name+' copy';c.pos[0]=f(c.pos[0]+pn*(snap||5)*2);shapes.push(c);return c.id});
    sel=cs[0];oth={b:sel,s:new Set(cs.slice(1))};refresh();commit();toast('Pasted');
  }
  else if(!s)return;
  else if(k==='delete'||k==='backspace'){e.preventDefault();del()}
  else if(k.startsWith('arrow')){
    e.preventDefault();const d=(snap||1)*(e.shiftKey?10:1);
    multiIds().forEach(id=>{const t=shapes.find(x=>x.id===id);
      if(k==='arrowleft')t.pos[0]=f(t.pos[0]-d);if(k==='arrowright')t.pos[0]=f(t.pos[0]+d);
      if(k==='arrowdown')t.pos[1]=f(t.pos[1]-d);if(k==='arrowup')t.pos[1]=f(t.pos[1]+d)});
    renderProps();update();commit();
  }
});
/* copy / download */
const say=t=>{$('#msg').textContent=t;setTimeout(()=>$('#msg').textContent='',3000)};
$('#copy').onclick=async()=>{
  try{await navigator.clipboard.writeText($('#code').value);say('Copied')}
  catch(e){const t=$('#code');t.select();try{document.execCommand('copy');say('Copied')}catch(_){say('Select the code and copy it')}}
};
$('#dl').onclick=async()=>{
  if(typeof claude==='undefined'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([$('#code').value],{type:'text/plain'}));a.download='model.scad';document.body.appendChild(a);a.click();a.remove();say('Downloaded model.scad');return}
  try{
    const d=await claude.use('downloads');
    if(!d){say('Downloads are not available here. Use Copy.');return}
    await d.save({filename:'model.scad.txt',data:$('#code').value});
    say('Saved. Remove ".txt" to open it in OpenSCAD');
  }catch(e){say(e&&e.code==='declined'?'Save cancelled':'Could not save. Use Copy.')}
};
