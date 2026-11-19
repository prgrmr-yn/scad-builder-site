/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
const $=s=>document.querySelector(s),PI=Math.PI;
const P=(k,l,v,a,b)=>({k,l,v,a,b});
const H=P('h','Height','height',1,150),RR=P('r','Radius','radius',1,80);
const T={
 box:{l:'Box',p:[P('x','Width','width',1,150),P('y','Depth','depth',1,150),P('z','Height','height',1,150)],d:{x:20,y:20,z:20}},
 cylinder:{l:'Cylinder',p:[H,RR],d:{h:20,r:10}},
 sphere:{l:'Sphere',p:[RR],d:{r:12}},
 cone:{l:'Cone',p:[H,P('r','Bottom radius','bottom_radius',0,80),P('r2','Top radius','top_radius',0,80)],d:{h:25,r:12,r2:0}},
 pyramid:{l:'Pyramid',p:[P('s','Base','base',1,150),H],d:{s:24,h:20}},
 prism:{l:'Prism',p:[H,RR,P('n','Sides','sides',3,24)],d:{h:20,r:12,n:6}},
 tube:{l:'Tube',p:[H,P('r','Outer radius','outer_radius',1,80),P('w','Wall','wall',.5,40)],d:{h:20,r:12,w:3}},
 torus:{l:'Torus',p:[P('R','Ring radius','ring_radius',2,80),P('r','Tube radius','tube_radius',1,30)],d:{R:14,r:4}},
 wedge:{l:'Wedge',p:[P('x','Width','width',1,150),P('y','Depth','depth',1,150),P('z','Height','height',1,150)],d:{x:30,y:20,z:20}},
 dome:{l:'Dome',p:[RR],d:{r:14}},
 rounded:{l:'Rounded box',p:[P('x','Width','width',1,150),P('y','Depth','depth',1,150),P('z','Height','height',1,150),P('c','Corner radius','corner_radius',.5,40)],d:{x:24,y:24,z:20,c:4}},
 star:{l:'Star',p:[H,P('R','Outer radius','outer_radius',2,80),P('r','Inner radius','inner_radius',1,60),P('n','Points','points',3,12)],d:{h:6,R:18,r:8,n:5}},
 capsule:{l:'Capsule',p:[H,RR],d:{h:30,r:8}},
 rod:{l:'Threaded rod',p:[P('d','Diameter','diameter',2,40),P('pt','Pitch','pitch',.3,4),P('h','Length','length',1,150)],d:{d:8,pt:1.25,h:30}},
 bolt:{l:'Bolt',p:[P('d','Diameter','diameter',2,40),P('pt','Pitch','pitch',.3,4),P('h','Shaft length','length',1,150)],d:{d:8,pt:1.25,h:20}},
 nut:{l:'Nut',p:[P('d','Diameter','diameter',2,40),P('pt','Pitch','pitch',.3,4),P('h','Thickness','thickness',1,40),P('c','Clearance','clearance',0,1)],d:{d:8,pt:1.25,h:6.4,c:.2}},
 tapped:{l:'Tapped hole',p:[P('d','Diameter','diameter',2,40),P('pt','Pitch','pitch',.3,4),P('h','Depth','depth',1,150),P('c','Clearance','clearance',0,1)],d:{d:8,pt:1.25,h:15,c:.2}},
 gear:{l:'Gear',p:[P('m','Module','module',.5,6),P('z','Teeth','teeth',8,100),P('h','Thickness','thickness',1,60),P('b','Bore','bore',0,40)],d:{m:2,z:20,h:6,b:5}},
 ringgear:{l:'Ring gear',p:[P('m','Module','module',.5,6),P('z','Teeth','teeth',8,100),P('h','Thickness','thickness',1,60),P('w','Rim','rim',2,30)],d:{m:2,z:30,h:6,w:5}},
 text:{l:'Text',p:[P('s','Size','size',2,100),P('h','Thickness','thickness',.5,50),P('sp','Spacing','spacing',.5,3)],d:{s:10,h:3,sp:1}}
};
const ICON={
 box:'<path d="M4 9l8-4 8 4v8l-8 4-8-4zM4 9l8 4 8-4M12 13v8"/>',
 cylinder:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6"/>',
 sphere:'<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="8" ry="3"/>',
 cone:'<path d="M12 3L5 18c0 1.7 3 3 7 3s7-1.3 7-3z"/>',
 pyramid:'<path d="M12 3l9 16-9 2-9-2zM12 3v18"/>',
 prism:'<path d="M8 5h8l4 5v6l-4 5H8l-4-5v-6zM4 10h16"/>',
 tube:'<ellipse cx="12" cy="6" rx="7" ry="3"/><ellipse cx="12" cy="6" rx="3.5" ry="1.4"/><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6"/>',
 torus:'<ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="3.5" ry="1.8"/>',
 wedge:'<path d="M3 18L17 8v10zM17 8l4 2v10l-4-2M3 18l4 2h14"/>',
 dome:'<path d="M4 16a8 8 0 0116 0zM4 16c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
 rounded:'<rect x="4" y="5" width="16" height="14" rx="5"/>',
 star:'<path d="M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.2 1.4-6.3L3 9.6l6.4-.6z"/>',
 capsule:'<rect x="8" y="3" width="8" height="18" rx="4"/>',
 rod:'<path d="M9 3h6v18H9zM9 7h6M9 11h6M9 15h6"/>',
 bolt:'<path d="M7 3h10v4H7zM10 7v14h4V7M10 11h4M10 15h4"/>',
 nut:'<path d="M12 3l7 4v10l-7 4-7-4V7z"/><circle cx="12" cy="12" r="3"/>',
 tapped:'<circle cx="12" cy="12" r="7" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="3"/>',
 gear:'<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 ringgear:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
 text:'<path d="M5 6h14M12 6v13M9 19h6"/>'
};
const svg=t=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[t]+'</svg>';
let shapes=[],sel=null,nid=1,snap=1,bed=[220,220],hist=[],hi=-1,wp={o:[0,0,0],n:[0,0,1],label:'Bed'},wpMode=false;
const cur=()=>shapes.find(s=>s.id===sel);
const f=n=>+(+n).toFixed(3);
const sn=v=>f(snap?Math.round(v/snap)*snap:v);
const hz=s=>{const p=s.p,t=s.type;return t==='box'||t==='wedge'||t==='rounded'?p.z/2:t==='sphere'||t==='torus'?p.r:t==='dome'?p.r/2:t==='bolt'?(p.h+.65*p.d)/2:p.h/2};
function fixS(s){const p=s.p;if(s.type==='rounded')p.c=Math.min(p.c,Math.min(p.x,p.y,p.z)/2);if(s.type==='capsule')p.h=Math.max(p.h,2*p.r);if(s.type==='star')p.r=Math.min(p.r,p.R-.5);if(s.type==='gear')p.b=Math.max(0,Math.min(p.b,p.m*(p.z-2.5)-4))}
function mk(type,o={}){
  const t=T[type],n=shapes.filter(s=>s.type===type).length+1;
  const s=Object.assign({id:nid++,type,name:t.l+' '+n,hole:false,pos:null,rot:[0,0,0]},o);
  s.p=Object.assign({},t.d,o.p||{});
  s.ex=o.ex||Object.fromEntries(t.p.map(p=>[p.k,true]));
  s.mir=s.mir||[0,0,0];s.arr=s.arr||{t:'none',n:3,dx:30,dy:0,dz:0,cx:0,cy:0,sw:360};s.left=!!s.left;if(type==='tapped'&&o.hole===undefined)s.hole=true;
  if(type==='text'){if(s.txt==null)s.txt='Hello';s.font=s.font||'sans';s.bold=!!s.bold;s.align=s.align||'center';if(!o.ex)s.ex.txt=true}
  if(!s.pos){
    const n=new THREE.Vector3(...wp.n);
    s.pos=wp.o.map(f);
    if(!o.rot&&wp.n[2]<.999){const e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n),'ZYX');s.rot=[e.x,e.y,e.z].map(r=>f(r*180/PI))}
  }
  return s;
}
const STARTS={
 'Pen cup':()=>[mk('cylinder',{name:'Cup',p:{h:90,r:35},pos:[0,0,0]}),mk('cylinder',{name:'Hollow',hole:true,p:{h:90,r:30},pos:[0,0,5]})],
 'Key tag':()=>[mk('box',{name:'Tag',p:{x:60,y:28,z:4},pos:[0,0,0]}),mk('cylinder',{name:'Key ring hole',hole:true,p:{h:10,r:4},pos:[-22,0,-3]})],
 'Snowman':()=>[mk('sphere',{name:'Body',p:{r:20},pos:[0,0,0]}),mk('sphere',{name:'Head',p:{r:13},pos:[0,0,35]}),mk('cone',{name:'Nose',p:{h:12,r:3,r2:0},pos:[0,-9,48],rot:[90,0,0]})]
};
/* ---- history ---- */
const snapJ=()=>JSON.stringify({shapes,sel,nid});
function commit(){const j=snapJ();if(hist[hi]===j)return;hist=hist.slice(0,hi+1);hist.push(j);hi=hist.length-1;if(hist.length>100){hist.shift();hi--}syncBtns();try{localStorage.setItem('scadbuilder1',JSON.stringify({shapes,nid,bed,snap}));$('#saved').textContent='Autosaved in this browser'}catch(e){}}
function go(i){if(i<0||i>=hist.length)return;toast(i<hi?'Undone':'Redone');hi=i;const o=JSON.parse(hist[i]);shapes=o.shapes;sel=o.sel;nid=o.nid;refresh()}
function syncBtns(){const s=cur();$('#undo').disabled=hi<1;$('#redo').disabled=hi>=hist.length-1;['dup','del','drop'].forEach(i=>$('#'+i).disabled=!s);$('#clear').disabled=!shapes.length;$('#alignbtn').disabled=shapes.length<2}
function refresh(){renderList();renderProps();update()}
/* ---- actions ---- */
function add(t){const s=mk(t);shapes.push(s);sel=s.id;refresh();commit()}
function dup(){
  const ids=multiIds();if(!ids.length)return;
  const cs=ids.map(id=>{const c=JSON.parse(JSON.stringify(shapes.find(x=>x.id===id)));c.id=nid++;c.name=c.name+' copy';c.pos[0]=f(c.pos[0]+(snap||5)*2);shapes.push(c);return c.id});
  sel=cs[0];oth={b:sel,s:new Set(cs.slice(1))};refresh();commit();
}
function del(){const ids=multiIds();if(!ids.length)return;shapes=shapes.filter(x=>!ids.includes(x.id));sel=null;refresh();commit()}
function drop(){multiIds().forEach(id=>dropOne(shapes.find(x=>x.id===id)));refresh();commit()}
function dropOne(s){
  const o=grp.children.find(c=>c.userData.id===s.id),m=o.children[0],pos=m.geometry.attributes.position,n=V(wp.n),c=V(wp.o),w=new THREE.Vector3();
  o.updateMatrixWorld(true);let mn=1e9;
  for(let i=0;i<pos.count;i++){w.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);mn=Math.min(mn,w.sub(c).dot(n))}
  s.pos=V(s.pos).addScaledVector(n,-mn).toArray().map(f);
}
$('#lib').innerHTML=Object.keys(T).map(k=>'<button data-add="'+k+'" title="Add a '+T[k].l.toLowerCase()+'">'+svg(k)+T[k].l+'</button>').join('');
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{shapes=STARTS[b.dataset.s]();sel=shapes[0].id;refresh();commit()});
$('#undo').onclick=()=>go(hi-1);$('#redo').onclick=()=>go(hi+1);$('#dup').onclick=dup;$('#del').onclick=del;$('#drop').onclick=drop;
$('#clear').onclick=()=>{shapes=[];sel=null;refresh();commit()};
$('#getcode').onclick=()=>$('#codebox').scrollIntoView({behavior:'smooth'});
$('#snap').onchange=e=>{snap=+e.target.value;renderProps()};
$('#bedsel').onchange=e=>{bed=e.target.value.split(',').map(Number);drawBed();home();update()};
