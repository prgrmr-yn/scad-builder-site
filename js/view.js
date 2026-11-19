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
const TH_PRESETS=[['M3',3,.5],['M4',4,.7],['M5',5,.8],['M6',6,1],['M8',8,1.25],['M10',10,1.5],['M12',12,1.75]];
function threadGeo(R,rm,h,pt,left){
  const N=40,S=Math.min(700,Math.max(8,Math.ceil(h/pt*16))),pos=[],idx=[],prof=[];
  for(let k=0;k<N;k++){const a=k/N*360,aa=a>180?360-a:a,rho=aa<=20?R:aa>=55?rm:R-(R-rm)*(aa-20)/35;prof.push([a*PI/180,rho])}
  for(let s=0;s<=S;s++){const z=-h/2+h*s/S,tw=(left?-1:1)*2*PI*(z+h/2)/pt;prof.forEach(([a,r])=>pos.push(r*Math.cos(a+tw),r*Math.sin(a+tw),z))}
  for(let s=0;s<S;s++)for(let k=0;k<N;k++){const a=s*N+k,b=s*N+(k+1)%N,c=a+N,d=b+N;idx.push(a,b,d,a,d,c)}
  [[0,-h/2,0],[S*N,h/2,1]].forEach(([o,z,top])=>{const ci=pos.length/3;pos.push(0,0,z);for(let k=0;k<N;k++){const a=o+k,b=o+(k+1)%N;idx.push(ci,top?a:b,top?b:a)}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function mergeG(a,b){
  const A=a.toNonIndexed().attributes.position.array,B=b.toNonIndexed().attributes.position.array,p=new Float32Array(A.length+B.length);
  p.set(A);p.set(B,A.length);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.computeVertexNormals();return g;
}
function gearPts(m,z){
  const pa=20*PI/180,r=m*z/2,rb=r*Math.cos(pa),ra=r+m,rf=r-1.25*m,r0=Math.max(rb,rf+.001),inv=a=>Math.tan(a)-a,pts=[],n=6;
  const th=rho=>PI/(2*z)+inv(pa)-inv(Math.acos(Math.min(1,rb/rho)));
  for(let i=0;i<z;i++){
    const c=2*PI*i/z,P=(rho,a)=>pts.push([rho*Math.cos(a),rho*Math.sin(a)]);
    P(rf,c-th(r0));
    for(let k=0;k<=n;k++){const rho=r0+(ra-r0)*k/n;P(rho,c-th(rho))}
    for(let k=n;k>=0;k--){const rho=r0+(ra-r0)*k/n;P(rho,c+th(rho))}
    P(rf,c+th(r0));
  }
  return pts;
}
function addClones(s,o,m){
  const a=s.arr;if(!a||!a.t||a.t==='none')return;
  const n=Math.max(1,Math.min(60,Math.round(a.n)));o.updateMatrix();const inv=o.matrix.clone().invert();
  for(let i=1;i<n;i++){
    const M=new THREE.Matrix4();
    if(a.t==='linear')M.makeTranslation(i*a.dx,i*a.dy,i*a.dz);
    else M.makeTranslation(a.cx,a.cy,0).multiply(new THREE.Matrix4().makeRotationZ(i*a.sw/n*PI/180)).multiply(new THREE.Matrix4().makeTranslation(-a.cx,-a.cy,0));
    const c=m.clone();c.applyMatrix4(inv.clone().multiply(M).multiply(o.matrix));o.add(c);
  }
}
function geoX(s,fn){
  const p=s.p,t=s.type;let g;
  if(t==='wedge'){
    const a=p.x/2,b=p.y/2,c=p.z/2,Vs=[[-a,-b,-c],[-a,b,-c],[-a,b,c],[a,-b,-c],[a,b,-c],[a,b,c]];
    g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(Vs.flat(),3));
    g.setIndex([0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,0,2,5,0,5,3]);g=g.toNonIndexed();g.computeVertexNormals();return g;
  }
  if(t==='dome'){
    const r=Math.max(p.r,.01),pts=[new THREE.Vector2(0,0),new THREE.Vector2(r,0)];
    for(let i=1;i<=12;i++){const a=i/12*PI/2;pts.push(new THREE.Vector2(r*Math.cos(a),r*Math.sin(a)))}
    g=new THREE.LatheGeometry(pts,fn);g.rotateX(PI/2);g.translate(0,0,-r/2);return g;
  }
  if(t==='rounded'){
    const c=Math.min(p.c,Math.min(p.x,p.y,p.z)/2),n=12;g=new THREE.BoxGeometry(p.x,p.y,p.z,n,n,n);
    const q=g.attributes.position,ix=p.x/2-c,iy=p.y/2-c,iz=p.z/2-c,v=new THREE.Vector3(),w=new THREE.Vector3();
    for(let i=0;i<q.count;i++){
      v.fromBufferAttribute(q,i);w.set(Math.max(-ix,Math.min(ix,v.x)),Math.max(-iy,Math.min(iy,v.y)),Math.max(-iz,Math.min(iz,v.z)));
      v.sub(w);if(v.length()>1e-6)v.setLength(c);q.setXYZ(i,w.x+v.x,w.y+v.y,w.z+v.z);
    }
    g.computeVertexNormals();return g;
  }
  if(t==='star'){
    const n=Math.round(p.n),sh=new THREE.Shape();
    for(let i=0;i<2*n;i++){const a=i*PI/n,r=i%2?p.r:p.R,x=r*Math.cos(a),y=r*Math.sin(a);if(i)sh.lineTo(x,y);else sh.moveTo(x,y)}
    sh.closePath();g=new THREE.ExtrudeGeometry(sh,{depth:p.h,bevelEnabled:false});g.translate(0,0,-p.h/2);return g;
  }
  if(t==='capsule'){
    const r=p.r,h2=Math.max(p.h,2*r)/2-r,pts=[];
    for(let i=0;i<=8;i++){const a=-PI/2+i/8*PI/2;pts.push(new THREE.Vector2(r*Math.cos(a),-h2+r*Math.sin(a)))}
    for(let i=0;i<=8;i++){const a=i/8*PI/2;pts.push(new THREE.Vector2(r*Math.cos(a),h2+r*Math.sin(a)))}
    g=new THREE.LatheGeometry(pts,fn);g.rotateX(PI/2);return g;
  }
  if(t==='text'){
    const fam={sans:'"Liberation Sans",Arial,Helvetica,sans-serif',serif:'"Liberation Serif","Times New Roman",serif',mono:'"Liberation Mono","Courier New",monospace'}[s.font||'sans'];
    const txt=String(s.txt||'').slice(0,80),sp=p.sp||1,est=Math.max(1,txt.length*p.s*.75*sp);
    const PX=Math.max(.6,Math.min(4,1000/est)),fs=Math.max(4,p.s*1.4*PX),cn=document.createElement('canvas'),cx=cn.getContext('2d'),fnt=(s.bold?'bold ':'')+fs+'px '+fam;
    cx.font=fnt;
    const chars=[...txt],adv=chars.map(ch=>cx.measureText(ch).width*sp),Wd=Math.max(8,Math.ceil(adv.reduce((a,b)=>a+b,0))+8),Hc=Math.ceil(fs*1.7);
    cn.width=Wd;cn.height=Hc;cx.font=fnt;cx.fillStyle='#000';cx.textBaseline='alphabetic';
    let px=4;chars.forEach((ch,i)=>{cx.fillText(ch,px,fs*1.15);px+=adv[i]});
    const d=cx.getImageData(0,0,Wd,Hc).data,on=(x,y)=>d[(y*Wd+x)*4+3]>110;
    let x0=1e9,x1=-1,y0=1e9,y1=-1;
    for(let y=0;y<Hc;y++)for(let x=0;x<Wd;x++)if(on(x,y)){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    if(x1<0)return new THREE.BoxGeometry(.2,.2,p.h);
    const ox=s.align==='left'?x0:s.align==='right'?x1+1:(x0+x1+1)/2,oy=(y0+y1+1)/2,z0=-p.h/2,z1=p.h/2,pos=[];
    const quad=(a,b,c,e)=>pos.push(...a,...b,...c,...a,...c,...e);
    const flush=(a,b,ya,yb)=>{
      const X0=(a-ox)/PX,X1=(b+1-ox)/PX,Y1=(oy-ya)/PX,Y0=(oy-yb)/PX;
      const v=[[X0,Y0,z0],[X1,Y0,z0],[X1,Y1,z0],[X0,Y1,z0],[X0,Y0,z1],[X1,Y0,z1],[X1,Y1,z1],[X0,Y1,z1]];
      quad(v[0],v[3],v[2],v[1]);quad(v[4],v[5],v[6],v[7]);quad(v[0],v[1],v[5],v[4]);quad(v[3],v[7],v[6],v[2]);quad(v[0],v[4],v[7],v[3]);quad(v[1],v[2],v[6],v[5]);
    };
    let open=new Map();
    for(let y=y0;y<=y1+1;y++){
      const next=new Map();
      if(y<=y1){let x=x0;while(x<=x1){if(on(x,y)){let e=x;while(e+1<=x1&&on(e+1,y))e++;const k=x+','+e;next.set(k,open.get(k)||[x,e,y]);x=e+1}else x++}}
      open.forEach((v,k)=>{if(!next.has(k))flush(v[0],v[1],v[2],y)});
      open=next;
    }
    g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
  }
  if(t==='rod'||t==='tapped'){const R=p.d/2+(t==='tapped'?p.c:0);return threadGeo(R,Math.max(R-.6*p.pt,R*.3),p.h,p.pt,s.left)}
  if(t==='bolt'){
    const R=p.d/2,k=.65*p.d,tot=p.h+k,sh=threadGeo(R,Math.max(R-.6*p.pt,R*.3),p.h,p.pt,s.left),hd=new THREE.CylinderGeometry(.9238*p.d,.9238*p.d,k,6);
    hd.rotateX(PI/2);hd.rotateZ(PI/2);hd.translate(0,0,-tot/2+k/2);sh.translate(0,0,-tot/2+k+p.h/2);return mergeG(sh,hd);
  }
  if(t==='nut'){
    const R=.9238*p.d,sh=new THREE.Shape();
    for(let i=0;i<6;i++){const a=i*PI/3;if(i)sh.lineTo(R*Math.cos(a),R*Math.sin(a));else sh.moveTo(R,0)}
    sh.closePath();const ho=new THREE.Path();ho.absarc(0,0,p.d/2-.3*p.pt,0,2*PI,true);sh.holes.push(ho);
    g=new THREE.ExtrudeGeometry(sh,{depth:p.h,bevelEnabled:false,curveSegments:24});g.translate(0,0,-p.h/2);return g;
  }
  if(t==='gear'||t==='ringgear'){
    const pts=gearPts(p.m,p.z),sh=new THREE.Shape();
    if(t==='gear'){
      pts.forEach((q,i)=>i?sh.lineTo(q[0],q[1]):sh.moveTo(q[0],q[1]));sh.closePath();
      if(p.b>0){const ho=new THREE.Path();ho.absarc(0,0,p.b/2,0,2*PI,true);sh.holes.push(ho)}
    }else{
      sh.absarc(0,0,p.m*p.z/2+p.m+p.w,0,2*PI,false);
      const ho=new THREE.Path();pts.forEach((q,i)=>i?ho.lineTo(q[0],q[1]):ho.moveTo(q[0],q[1]));ho.closePath();sh.holes.push(ho);
    }
    g=new THREE.ExtrudeGeometry(sh,{depth:p.h,bevelEnabled:false,curveSegments:32});g.translate(0,0,-p.h/2);return g;
  }
  return null;
}
function geo(s){
  const p=s.p,t=s.type,fn=Math.min(Math.max(+$('#fn').value|0,8),48);let g;
  const gx=geoX(s,fn);if(gx)return gx;
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
  m.userData.id=s.id;m.position.set(0,0,hz(s));const mr=s.mir||[0,0,0];m.scale.set(mr[0]?-1:1,mr[1]?-1:1,mr[2]?-1:1);
  if(s.type!=='text')m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,30),new THREE.LineBasicMaterial({color:0x021c22,transparent:true,opacity:on?1:.25})));
  const o=new THREE.Group();o.add(m);o.userData.id=s.id;o.position.set(...s.pos);o.rotation.order='ZYX';
  o.rotation.set(...s.rot.map(d=>d*PI/180));addClones(s,o,m);return o;
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
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||!$('#mlib').hidden)return;
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
