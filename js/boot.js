/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
let clip=[],pn=0,tt,restored=false;
function toast(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,1400)}
function fit(){
  const ids=multiIds(),bb=new THREE.Box3();
  (ids.length?ids:shapes.map(s=>s.id)).forEach(id=>{const o=grp.children.find(c=>c.userData.id===id);if(o)bb.union(new THREE.Box3().setFromObject(o))});
  if(bb.isEmpty())return;
  const sp=bb.getBoundingSphere(new THREE.Sphere());tgt.copy(sp.center);dist=Math.max(60,sp.radius*3);place();draw();
}
$('[data-f]').onclick=fit;$('#qbtn').onclick=()=>{$('#keys').hidden=!$('#keys').hidden};
cv.oncontextmenu=e=>e.preventDefault();
try{
  const o=JSON.parse(localStorage.getItem('scadbuilder1')||'null');
  if(o&&o.shapes&&o.shapes.length){
    shapes=o.shapes;nid=o.nid||nid;
    if(o.bed&&[...$('#bedsel').options].some(x=>x.value===o.bed.join(','))){bed=o.bed;$('#bedsel').value=o.bed.join(',')}
    if(o.snap!=null){snap=o.snap;$('#snap').value=String(snap)}
    restored=true;
  }
}catch(e){}
size();drawBed();home();hist=[snapJ()];hi=0;refresh();
if(restored){$('#saved').textContent='Autosaved in this browser';toast('Restored your last design')}
