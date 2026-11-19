/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* ---- OpenSCAD output ---- */
let useVars=false,names=new Map();
function slug(t){let s=String(t).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!s)s='shape';if(/^[0-9]/.test(s))s='s_'+s;return s}
const vn=(s,k)=>names.get(s.id)+'_'+k;
const esc=t=>String(t).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
const FN={sans:'Liberation Sans',serif:'Liberation Serif',mono:'Liberation Mono'};
const v=(s,k,val,ex=k)=>useVars&&s.ex[ex]?vn(s,k):f(val);
const THREAD_SCAD=`// ---- Helper: simple thread (print-friendly, not ISO-exact) ----
module ts_thread(d, h, p, left=false) {
  R = d/2; rm = max(R - 0.6*p, R*0.3);
  linear_extrude(height=h, twist=(left ? 1 : -1)*360*h/p, slices=max(16, ceil(h/p*24)), convexity=10)
    union() {
      circle(r=rm);
      polygon([[0,0],[rm*cos(55),-rm*sin(55)],[R*cos(20),-R*sin(20)],[R*cos(20),R*sin(20)],[rm*cos(55),rm*sin(55)]]);
    }
}

`;
const GEAR_SCAD=`// ---- Helper: involute spur gears (20 degree pressure angle) ----
function ts_inv(a) = (tan(a) - a*PI/180)*180/PI;
function ts_th(rho, rb, z, pa) = 90/z + ts_inv(pa) - ts_inv(acos(min(1, rb/rho)));
function ts_pt(rho, ang) = [rho*cos(ang), rho*sin(ang)];
module ts_gear2d(m, z, pa=20) {
  r = m*z/2; rb = r*cos(pa); ra = r + m; rf = r - 1.25*m; r0 = max(rb, rf + 0.001); n = 6;
  polygon([for (i=[0:z-1]) let(c = 360*i/z) each concat(
    [ts_pt(rf, c - ts_th(r0, rb, z, pa))],
    [for (k=[0:n]) let(rho = r0 + (ra - r0)*k/n) ts_pt(rho, c - ts_th(rho, rb, z, pa))],
    [for (k=[n:-1:0]) let(rho = r0 + (ra - r0)*k/n) ts_pt(rho, c + ts_th(rho, rb, z, pa))],
    [ts_pt(rf, c + ts_th(r0, rb, z, pa))])]);
}
module ts_gear(m, z, h, b=0) {
  linear_extrude(height=h, center=true) difference() { ts_gear2d(m, z); if (b > 0) circle(d=b); }
}
module ts_ring(m, z, h, w) {
  linear_extrude(height=h, center=true) difference() { circle(r=m*z/2 + m + w); ts_gear2d(m, z); }
}

`;
function preamble(){const u=t=>shapes.some(s=>t.includes(s.type));let o='';if(u(['rod','bolt','nut','tapped']))o+=THREAD_SCAD;if(u(['gear','ringgear']))o+=GEAR_SCAD;return o}
function arrPre(s){
  const a=s.arr;if(!a||!a.t||a.t==='none')return '';
  const A=k=>v(s,'arr_'+k,a[k],'arr_'+k);
  return a.t==='linear'?'for (i=[0:'+A('n')+'-1]) translate([i*'+A('dx')+', i*'+A('dy')+', i*'+A('dz')+']) '
    :'for (i=[0:'+A('n')+'-1]) translate(['+A('cx')+', '+A('cy')+', 0]) rotate([0,0,i*'+A('sw')+'/'+A('n')+']) translate([-('+A('cx')+'), -('+A('cy')+'), 0]) ';
}
function params(){
  let o='',n=0;
  shapes.forEach(s=>{
    const L=[];
    if(s.type==='text'&&s.ex.txt)L.push(vn(s,'text')+' = "'+esc(s.txt)+'";');
    T[s.type].p.forEach(p=>{if(s.ex[p.k])L.push(vn(s,p.v)+' = '+f(s.p[p.k])+';')});
    const AR=s.arr&&s.arr.t&&s.arr.t!=='none'?s.arr:null;
    if(AR)['n','dx','dy','dz','cx','cy','sw'].forEach(k=>{if(s.ex['arr_'+k])L.push(vn(s,'arr_'+k)+' = '+f(AR[k])+';')});
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
    case 'wedge':c='rotate([90,0,90]) linear_extrude(height='+q('x')+', center=true) polygon([[-'+q('y')+'/2,-'+q('z')+'/2], ['+q('y')+'/2,-'+q('z')+'/2], ['+q('y')+'/2,'+q('z')+'/2]]);';break;
    case 'dome':{const R=q('r');c='translate([0,0,-'+R+'/2]) intersection() { sphere(r='+R+'); translate([0,0,'+R+'/2]) cube([2*'+R+', 2*'+R+', '+R+'], center=true); }';break}
    case 'rounded':{const C=q('c');c='hull() { for (sx=[-1,1], sy=[-1,1], sz=[-1,1]) translate([sx*('+q('x')+'/2-'+C+'), sy*('+q('y')+'/2-'+C+'), sz*('+q('z')+'/2-'+C+')]) sphere(r='+C+'); }';break}
    case 'star':{const N=q('n');c='linear_extrude(height='+q('h')+', center=true) polygon([for (i=[0:2*'+N+'-1]) let(a=i*180/'+N+', rr=(i%2==0)?'+q('R')+':'+q('r')+') [rr*cos(a), rr*sin(a)]]);';break}
    case 'capsule':{const R=q('r'),Hh=q('h');c='hull() { translate([0,0,'+Hh+'/2-'+R+']) sphere(r='+R+'); translate([0,0,-'+Hh+'/2+'+R+']) sphere(r='+R+'); }';break}
    case 'text':{const tv=useVars&&s.ex.txt?vn(s,'text'):'"'+esc(s.txt)+'"';c='linear_extrude(height='+q('h')+', center=true) text('+tv+', size='+q('s')+', font="'+FN[s.font||'sans']+(s.bold?':style=Bold':'')+'", halign="'+(s.align||'center')+'", valign="center", spacing='+q('sp')+');';break}
    case 'rod':{const L=s.left?'true':'false';c='translate([0,0,-'+q('h')+'/2]) ts_thread('+q('d')+', '+q('h')+', '+q('pt')+', '+L+');';break}
    case 'tapped':{const L=s.left?'true':'false';c='translate([0,0,-'+q('h')+'/2]) ts_thread('+q('d')+'+2*'+q('c')+', '+q('h')+', '+q('pt')+', '+L+');';break}
    case 'bolt':{const L=s.left?'true':'false',D=q('d'),Hh=q('h'),K='0.65*'+D;c='translate([0,0,-('+Hh+'+'+K+')/2]) { cylinder(h='+K+', r=0.9238*'+D+', $fn=6); translate([0,0,'+K+'-0.01]) ts_thread('+D+', '+Hh+'+0.01, '+q('pt')+', '+L+'); }';break}
    case 'nut':{const L=s.left?'true':'false',D=q('d'),Hh=q('h'),C=q('c');c='difference() { cylinder(h='+Hh+', r=0.9238*'+D+', center=true, $fn=6); translate([0,0,-'+Hh+'/2-0.5]) ts_thread('+D+'+2*'+C+', '+Hh+'+1, '+q('pt')+', '+L+'); }';break}
    case 'gear':c='ts_gear('+q('m')+', '+q('z')+', '+q('h')+', '+q('b')+');';break;
    case 'ringgear':c='ts_ring('+q('m')+', '+q('z')+', '+q('h')+', '+q('w')+');';break;
    default:c='rotate_extrude() translate(['+q('R')+', 0]) circle(r='+q('r')+');';
  }
  let o=ind;const [x,y,z]=s.pos,[a,b,d]=s.rot;
  if(['x','y','z'].some(k=>useVars&&s.ex['pos_'+k])||x||y||z)o+='translate(['+['x','y','z'].map((k,i)=>v(s,'pos_'+k,s.pos[i]))+']) ';
  if(['x','y','z'].some(k=>useVars&&s.ex['rot_'+k])||a||b||d)o+='rotate(['+['x','y','z'].map((k,i)=>v(s,'rot_'+k,s.rot[i]))+']) ';
  let hk=['box','wedge','rounded'].includes(s.type)?'z':['sphere','torus','dome'].includes(s.type)?'r':'h',hd=T[s.type].p.find(x=>x.k===hk).v,hv=v(s,hd,p[hk],hk),half=useVars&&s.ex[hk]?(s.type==='sphere'||s.type==='torus'?hv:hv+'/2'):f(hz(s));
  if(s.type==='bolt')half='('+q('h')+'+0.65*'+q('d')+')/2';
  o+='translate([0,0,'+half+']) '+((s.mir||[0,0,0]).some(x=>x)?'mirror(['+s.mir.map(x=>x?1:0)+']) ':'');
  if(s.color&&s.color!=='#1396a8'&&!s.hole)o+='color("'+s.color+'") ';
  return arrPre(s)+o+c+'  // '+s.name.replace(/[\r\n]/g,' ');
}
function gen(){
  useVars=$('#vars').checked;names=new Map();$('#pc').textContent='';const used=new Set();
  shapes.forEach(s=>{const b=slug(s.name);let n=b,i=2;while(used.has(n))n=b+'_'+i++;used.add(n);names.set(s.id,n)});
  const add=shapes.filter(s=>!s.hole),cut=shapes.filter(s=>s.hole);
  let o='// Made with SCAD Builder\n$fn = '+($('#fn').value||64)+';\n\n';
  if(!add.length)return o+'// Add a solid shape to get started.\n';
  o+=preamble();
  if(useVars)o+=params();
  const un=(l,i)=>l.map(s=>shapeCode(s,i)).join('\n');
  if(!cut.length)return o+'union() {\n'+un(add,'  ')+'\n}\n';
  return o+'difference() {\n  union() {\n'+un(add,'    ')+'\n  }\n  // holes\n  union() {\n'+un(cut,'    ')+'\n  }\n}\n';
}
