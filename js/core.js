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
 torus:{l:'Torus',p:[P('R','Ring radius','ring_radius',2,80),P('r','Tube radius','tube_radius',1,30)],d:{R:14,r:4}}
};
const ICON={
 box:'<path d="M4 9l8-4 8 4v8l-8 4-8-4zM4 9l8 4 8-4M12 13v8"/>',
 cylinder:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6"/>',
 sphere:'<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="8" ry="3"/>',
 cone:'<path d="M12 3L5 18c0 1.7 3 3 7 3s7-1.3 7-3z"/>',
 pyramid:'<path d="M12 3l9 16-9 2-9-2zM12 3v18"/>',
 prism:'<path d="M8 5h8l4 5v6l-4 5H8l-4-5v-6zM4 10h16"/>',
 tube:'<ellipse cx="12" cy="6" rx="7" ry="3"/><ellipse cx="12" cy="6" rx="3.5" ry="1.4"/><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6"/>',
 torus:'<ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="3.5" ry="1.8"/>'
};
const svg=t=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[t]+'</svg>';
let shapes=[],sel=null,nid=1,snap=1,bed=[220,220],hist=[],hi=-1,wp={o:[0,0,0],n:[0,0,1],label:'Bed'},wpMode=false;
const cur=()=>shapes.find(s=>s.id===sel);
const f=n=>+(+n).toFixed(3);
const sn=v=>f(snap?Math.round(v/snap)*snap:v);
const hz=s=>{const p=s.p;return s.type==='box'?p.z/2:s.type==='sphere'||s.type==='torus'?p.r:p.h/2};
function mk(type,o={}){
  const t=T[type],n=shapes.filter(s=>s.type===type).length+1;
  const s=Object.assign({id:nid++,type,name:t.l+' '+n,hole:false,pos:null,rot:[0,0,0]},o);
  s.p=Object.assign({},t.d,o.p||{});
  s.ex=o.ex||Object.fromEntries(t.p.map(p=>[p.k,true]));
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
