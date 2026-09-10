/* ═══════════════════════════════════════════════════════════════
   AURORA FIELD — raw WebGL, no library.
   Curtains hang from a wavy edge and break into vertical rays,
   which is what makes it read as aurora instead of a smear.
   Renders below device resolution (the field is soft) and idles
   whenever it is scrolled off screen.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cv = document.getElementById('field');
  if (!cv) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false,
                                    powerPreference: 'high-performance' })
        || cv.getContext('experimental-webgl');

  if (!gl) {
    cv.style.background =
      'radial-gradient(ellipse 80% 50% at 34% 30%, rgba(22,224,192,.26), transparent 62%),' +
      'radial-gradient(ellipse 60% 40% at 74% 22%, rgba(22,224,192,.14), transparent 66%),' +
      'linear-gradient(180deg,#07161c 0%,#04060a 76%)';
    return;
  }

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

  var F = [];
  F.push('precision mediump float;');
  F.push('uniform vec2 u_res;');
  F.push('uniform vec2 u_m;');
  F.push('uniform float u_t;');
  F.push('uniform float u_scroll;');
  F.push('uniform float u_in;');
  F.push('uniform vec3 u_ac;');

  F.push('float hash(vec2 p){');
  F.push('  p=fract(p*vec2(233.34,851.73));');
  F.push('  p+=dot(p,p+23.45);');
  F.push('  return fract(p.x*p.y);');
  F.push('}');

  F.push('float vnoise(vec2 p){');
  F.push('  vec2 i=floor(p),f=fract(p);');
  F.push('  vec2 u=f*f*(3.0-2.0*f);');
  F.push('  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),');
  F.push('             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);');
  F.push('}');

  F.push('float fbm2(vec2 p){float v=0.0,a=0.58;');
  F.push('  for(int i=0;i<2;i++){v+=a*vnoise(p);p*=2.03;a*=0.5;}return v;}');
  F.push('float fbm3(vec2 p){float v=0.0,a=0.58;');
  F.push('  for(int i=0;i<3;i++){v+=a*vnoise(p);p*=2.03;a*=0.5;}return v;}');

  /* a curtain: bright lip along a wavy edge, light hanging down, split into rays */
  F.push('float curtain(vec2 uv,float t,float seed,float top,float amp,float len){');
  F.push('  float w =fbm3(vec2(uv.x*1.55+seed,t*0.36+seed));');
  F.push('  float w2=fbm2(vec2(uv.x*4.10-seed,t*0.24));');
  F.push('  float edge=top+(w-0.5)*amp+(w2-0.5)*amp*0.30;');
  F.push('  float below=edge-uv.y;');
  F.push('  if(below<0.0) return 0.0;');
  F.push('  float body=smoothstep(0.0,0.020,below)*(1.0-smoothstep(len*0.12,len,below));');
  F.push('  float lip =smoothstep(0.050,0.0,below);');
  F.push('  float r1=fbm2(vec2(uv.x*24.0+seed*3.1,t*0.80+uv.y*0.55));');
  F.push('  float r2=fbm2(vec2(uv.x*63.0-seed*1.7,t*1.25));');
  F.push('  float ray=pow(r1*0.70+r2*0.40,2.7)*7.2;');
  F.push('  float env=smoothstep(0.0,0.30,uv.x+w*0.25)*smoothstep(1.0,0.70,uv.x-w*0.25);');
  F.push('  return (body*ray+lip*ray*0.9)*env;');
  F.push('}');

  F.push('void main(){');
  F.push('  vec2 uv=gl_FragCoord.xy/u_res;');
  F.push('  float asp=u_res.x/u_res.y;');
  F.push('  float t=u_t;');

  /* pointer bends the field and lights it locally */
  F.push('  vec2 dv=vec2((uv.x-u_m.x)*asp,uv.y-u_m.y);');
  F.push('  float dd=length(dv);');
  F.push('  float pull=exp(-dd*2.5);');
  F.push('  uv.y+=pull*0.075;');
  F.push('  uv.x+=dv.x*pull*0.055;');

  F.push('  float sc=u_scroll;');
  F.push('  uv.y+=sc*0.34;');

  F.push('  float a1=curtain(uv,t, 0.0,0.88,0.22,0.30);');
  F.push('  float a2=curtain(uv,t, 5.3,0.99,0.17,0.22);');
  F.push('  float a3=curtain(uv,t,12.9,0.79,0.27,0.36);');

  F.push('  vec3 core=u_ac;');
  F.push('  vec3 hot =mix(u_ac,vec3(0.82,1.0,0.98),0.70);');
  F.push('  vec3 cool=mix(u_ac,vec3(0.20,0.36,0.92),0.45);');

  F.push('  vec3 col=vec3(0.0);');
  F.push('  col+=mix(core,hot ,clamp(a1,0.0,1.0))*a1*0.98;');
  F.push('  col+=mix(cool,core,clamp(a2,0.0,1.0))*a2*0.64;');
  F.push('  col+=core*a3*0.30;');

  F.push('  col+=hot*pull*0.26;');
  F.push('  col+=core*smoothstep(0.45,1.0,uv.y)*0.030;');

  /* drifting dust */
  F.push('  float st=hash(floor(gl_FragCoord.xy*0.5)+floor(t*0.6));');
  F.push('  col+=vec3(step(0.9988,st))*0.75;');

  /* deep blue-black ground, never flat black */
  F.push('  col+=mix(vec3(0.013,0.019,0.033),vec3(0.020,0.052,0.068),smoothstep(0.10,1.0,uv.y));');

  /* keep the lower band clear so the name reads */
  /* portrait viewports crop the field to a narrow slice, so the same
     curtains fill the whole screen and drown the type — pull them back */
  F.push('  float portrait=smoothstep(1.05,0.55,asp);');
  F.push('  col*=mix(1.0,0.48,portrait);');
  F.push('  col*=smoothstep(0.02+portrait*0.20,0.56+portrait*0.18,uv.y);');
  F.push('  col*=1.0-smoothstep(0.80,1.02,uv.y)*0.62;');
  F.push('  col*=(1.0-sc*0.78)*u_in;');

  /* exponential exposure — holds highlights instead of crushing them */
  F.push('  col=vec3(1.0)-exp(-col*1.6);');
  F.push('  col=pow(col,vec3(0.94));');

  F.push('  gl_FragColor=vec4(col,1.0);');
  F.push('}');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[field]', gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, F.join('\n'));
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, 'u_res'),
    m: gl.getUniformLocation(prog, 'u_m'),
    t: gl.getUniformLocation(prog, 'u_t'),
    scroll: gl.getUniformLocation(prog, 'u_scroll'),
    intro: gl.getUniformLocation(prog, 'u_in'),
    ac: gl.getUniformLocation(prog, 'u_ac')
  };

  /* accent comes from CSS so a crimson page tints its own field */
  var accent = [0.086, 0.878, 0.753];
  try {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--field-rgb').trim();
    if (raw) {
      var n = raw.split(',').map(Number);
      if (n.length === 3 && n.every(function (v) { return !isNaN(v); }))
        accent = [n[0] / 255, n[1] / 255, n[2] / 255];
    }
  } catch (e) {}
  gl.uniform3f(U.ac, accent[0], accent[1], accent[2]);

  var SCALE = 0.62, w = 0, h = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    var cw = cv.clientWidth || innerWidth, ch = cv.clientHeight || innerHeight;
    var nw = Math.max(1, Math.round(cw * dpr * SCALE)), nh = Math.max(1, Math.round(ch * dpr * SCALE));
    if (nw === w && nh === h) return;
    w = nw; h = nh; cv.width = w; cv.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  var mx = 0.5, my = 0.72, tx = 0.5, ty = 0.72;
  addEventListener('pointermove', function (e) {
    tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight;
  }, { passive: true });

  var scroll = 0;
  function readScroll() {
    var r = cv.parentElement.getBoundingClientRect();
    scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  }
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  var visible = true, intro = 0, t0 = performance.now(), raf = 0;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }, { threshold: 0 }).observe(cv);
  }

  window.__fieldReveal = function () { if (intro <= 0) intro = 0.001; };

  function frame(now) {
    raf = 0;
    var t = (now - t0) / 1000;
    mx += (tx - mx) * 0.055;
    my += (ty - my) * 0.055;
    if (intro > 0 && intro < 1) intro = Math.min(1, intro + 0.018);

    gl.uniform2f(U.m, mx, my);
    gl.uniform1f(U.t, reduced ? 14.0 : t);
    gl.uniform1f(U.scroll, scroll);
    gl.uniform1f(U.intro, intro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (reduced && intro >= 1) return;   // paint once, then hold
    if (visible) raf = requestAnimationFrame(frame);
  }

  if (reduced) { intro = 1; requestAnimationFrame(frame); }
  else raf = requestAnimationFrame(frame);

  cv.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0;
  });
})();
