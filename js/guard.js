/* (c) 2026 SCAD Builder. All rights reserved. Do not copy or redistribute without permission. */
/* Optional: restrict where this page runs. Put your domains in the list, e.g. ['example.com'].
   An empty list allows every host. localhost is always allowed. */
(function(){
  var allowed=[],h=location.hostname;
  if(allowed.length&&h!=='localhost'&&h!==''&&!allowed.some(function(d){return h===d||h.endsWith('.'+d)})){
    document.body.innerHTML='<p style="font:16px sans-serif;padding:2rem">This copy is not authorised. Please visit the original site.</p>';
  }
})();
