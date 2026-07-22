/* Colour and small-math helpers shared by the app and the test suites.
   Moved verbatim out of index.html so tests exercise the same implementation
   the app ships, instead of hand-written copies that can drift. */

function hexToRgb(hex){
  hex = (hex||'#000000').replace('#','');
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  const n = parseInt(hex,16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
function rgbArrToHex(arr){
  if(!Array.isArray(arr)) return '#000000';
  return '#' + [arr[0],arr[1],arr[2]].map(v=>clamp(v||0,0,255).toString(16).padStart(2,'0')).join('');
}
function rgbToCss(rgb, alpha){
  alpha = alpha===undefined?1:alpha;
  const r = rgb[0]|0;
  const g = rgb[1]|0;
  const b = rgb[2]|0;
  if(r===0 && g===0 && b===0){
    return 'rgba(0,0,0,0)';
  }
  return `rgba(${r},${g},${b},${alpha})`;
}
function lerp(a,b,t){ return a+(b-a)*t; }
function lerpRgb(c1,c2,t){
  return [lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t)];
}
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function hash01(x){ const s = Math.sin(x*12.9898)*43758.5453; return s - Math.floor(s); }
function hsl2rgb(h,s,l){
  h = ((h%360)+360)%360;
  s = clamp(s,0,1); l = clamp(l,0,1);
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  return [(r+m)*255,(g+m)*255,(b+m)*255];
}
function sampleGradientStops(stops, pos){
  pos = clamp(pos, 0, 1);
  for(let k=0; k<stops.length-1; k++){
    const [p0, c0] = stops[k], [p1, c1h] = stops[k+1];
    if(pos>=p0 && pos<=p1){
      const span = p1-p0;
      const t = span>0.0001 ? (pos-p0)/span : 0;
      return lerpRgb(hexToRgb(c0), hexToRgb(c1h), t);
    }
  }
  return hexToRgb(stops[stops.length-1][1]);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hexToRgb,
    rgbArrToHex,
    rgbToCss,
    lerp,
    lerpRgb,
    clamp,
    hash01,
    hsl2rgb,
    sampleGradientStops,
  };
}
