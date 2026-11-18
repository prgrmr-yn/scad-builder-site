/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* Experimental helpers, not used by the editor. */
function bezierPoint(p0,p1,p2,p3,t){var u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3}
function polygonArea(pts){var a=0;for(var i=0;i<pts.length;i++){var j=(i+1)%pts.length;a+=pts[i][0]*pts[j][1]-pts[j][0]*pts[i][1]}return Math.abs(a)/2}
function regularPolygon(n,r){var o=[];for(var i=0;i<n;i++){var t=2*Math.PI*i/n;o.push([r*Math.cos(t),r*Math.sin(t)])}return o}
