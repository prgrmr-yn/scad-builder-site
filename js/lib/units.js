/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* Unit helpers, reserved for a future inches mode. */
var MM_PER_INCH=25.4;
function mmToInch(v){return v/MM_PER_INCH}
function inchToMm(v){return v*MM_PER_INCH}
function formatLength(v,unit){return unit==='in'?mmToInch(v).toFixed(3)+' in':v.toFixed(2)+' mm'}
