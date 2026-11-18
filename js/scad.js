/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* ---- OpenSCAD output ---- */
let useVars=false,names=new Map();
function slug(t){let s=String(t).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!s)s='shape';if(/^[0-9]/.test(s))s='s_'+s;return s}
const vn=(s,k)=>names.get(s.id)+'_'+k;
const v=(s,k,val,ex=k)=>useVars&&s.ex[ex]?vn(s,k):f(val);
function params(){
  let o='',n=0;
  shapes.forEach(s=>{
    const L=[];
    T[s.type].p.forEach(p=>{if(s.ex[p.k])L.push(vn(s,p.v)+' = '+f(s.p[p.k])+';')});
    ['x','y','z'].forEach((a,i)=>{if(s.ex['pos_'+a])L.push(vn(s,'pos_'+a)+' = '+f(s.pos[i])+';');if(s.ex['rot_'+a])L.push(vn(s,'rot_'+a)+' = '+f(s.rot[i])+';')});
    if(L.length){n+=L.length;o+='\n// '+s.name.replace(/[\r\n]/g,' ')+(s.hole?' (hole)':'')+'\n'+L.join('\n')+'\n'}
  });
  $('#pc').textContent=n?n+(n===1?' parameter':' parameters')+' exported':'Tick values in Settings to export them';
  return n?'// ---- Parameters: change these to adjust the model ----\n'+o+'\n// ---- Model ----\n':'';
}
function shapeCode(s,ind){
  const p=s.p,q=k=>v(s,T[s.type].p.find(x=>x.k===k).v,p[k],k);let c;
  switch(s.type){
    case 'box':c='cube(['+['x','y','z'].map(q)+'], center=true);';break;
    case 'cylinder':c='cylinder(h='+q('h')+', r='+q('r')+', center=true);';break;
    case 'sphere':c='sphere(r='+q('r')+');';break;
    case 'cone':c='cylinder(h='+q('h')+', r1='+q('r')+', r2='+q('r2')+', center=true);';break;
    case 'pyramid':c='rotate([0,0,45]) cylinder(h='+q('h')+', r1='+q('s')+'*sqrt(2)/2, r2=0, center=true, $fn=4);';break;
    case 'prism':c='cylinder(h='+q('h')+', r='+q('r')+', center=true, $fn='+q('n')+');';break;
    case 'tube':c='difference() { cylinder(h='+q('h')+', r='+q('r')+', center=true); cylinder(h='+q('h')+'+2, r='+q('r')+'-'+q('w')+', center=true); }';break;
    default:c='rotate_extrude() translate(['+q('R')+', 0]) circle(r='+q('r')+');';
  }
  let o=ind;const [x,y,z]=s.pos,[a,b,d]=s.rot;
  if(['x','y','z'].some(k=>useVars&&s.ex['pos_'+k])||x||y||z)o+='translate(['+['x','y','z'].map((k,i)=>v(s,'pos_'+k,s.pos[i]))+']) ';
  if(['x','y','z'].some(k=>useVars&&s.ex['rot_'+k])||a||b||d)o+='rotate(['+['x','y','z'].map((k,i)=>v(s,'rot_'+k,s.rot[i]))+']) ';
  const hk=s.type==='box'?'z':s.type==='sphere'||s.type==='torus'?'r':'h',hd=T[s.type].p.find(x=>x.k===hk).v,hv=v(s,hd,p[hk],hk),half=useVars&&s.ex[hk]?(s.type==='sphere'||s.type==='torus'?hv:hv+'/2'):f(hz(s));
  o+='translate([0,0,'+half+']) ';
  if(s.color&&s.color!=='#1396a8'&&!s.hole)o+='color("'+s.color+'") ';
  return o+c+'  // '+s.name.replace(/[\r\n]/g,' ');
}
function gen(){
  useVars=$('#vars').checked;names=new Map();$('#pc').textContent='';const used=new Set();
  shapes.forEach(s=>{const b=slug(s.name);let n=b,i=2;while(used.has(n))n=b+'_'+i++;used.add(n);names.set(s.id,n)});
  const add=shapes.filter(s=>!s.hole),cut=shapes.filter(s=>s.hole);
  let o='// Made with SCAD Builder\n$fn = '+($('#fn').value||64)+';\n\n';
  if(!add.length)return o+'// Add a solid shape to get started.\n';
  if(useVars)o+=params();
  const un=(l,i)=>l.map(s=>shapeCode(s,i)).join('\n');
  if(!cut.length)return o+'union() {\n'+un(add,'  ')+'\n}\n';
  return o+'difference() {\n  union() {\n'+un(add,'    ')+'\n  }\n  // holes\n  union() {\n'+un(cut,'    ')+'\n  }\n}\n';
}
