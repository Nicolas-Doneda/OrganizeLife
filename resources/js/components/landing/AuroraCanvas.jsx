import { useEffect, useRef, useCallback } from 'react';

/**
 * AuroraCanvas — Raw WebGL generative aurora/fluid background.
 * Reacts to mouse position and fades based on scroll.
 * Uses simplex noise in a fragment shader with the project's emerald palette.
 * Zero dependencies.
 */

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec2  u_mouse;     // normalized 0..1
  uniform float u_scroll;    // 0..1 (0 = top, 1 = scrolled past hero)
  uniform float u_dark;      // 0 = light mode, 1 = dark mode

  // ── Simplex 2D noise (Ashima Arts) ──
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                             + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // ── Fractional Brownian Motion ──
  float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
      f += w * snoise(p);
      p *= 2.0;
      w *= 0.5;
    }
    return f;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    // Mouse influence — subtle warping toward cursor
    vec2 mouse = vec2(u_mouse.x * aspect, u_mouse.y);
    float mouseDist = length(p - mouse);
    vec2 mouseWarp = (p - mouse) * 0.08 / (mouseDist + 0.5);

    // Time
    float t = u_time * 0.12;

    // ── Aurora layers ──
    float n1 = fbm(p * 1.4 + vec2(t * 0.7, t * 0.3) + mouseWarp);
    float n2 = fbm(p * 2.2 - vec2(t * 0.4, t * 0.6) - mouseWarp * 0.5);
    float n3 = fbm(p * 0.8 + vec2(t * 0.2, -t * 0.5));

    // ── Color palette — Emerald Forest ──
    // Light mode: soft, dreamy greens on warm cream
    // Dark mode: deep, vivid aurora on dark slate
    vec3 c1_light = vec3(0.18, 0.52, 0.38);  // emerald-600
    vec3 c2_light = vec3(0.32, 0.62, 0.45);  // emerald-400
    vec3 c3_light = vec3(0.55, 0.72, 0.42);  // warm green accent

    vec3 c1_dark = vec3(0.12, 0.62, 0.45);   // vivid emerald
    vec3 c2_dark = vec3(0.08, 0.42, 0.55);   // teal shift
    vec3 c3_dark = vec3(0.25, 0.75, 0.38);   // bright green accent

    vec3 c1 = mix(c1_light, c1_dark, u_dark);
    vec3 c2 = mix(c2_light, c2_dark, u_dark);
    vec3 c3 = mix(c3_light, c3_dark, u_dark);

    // Mix colors based on noise
    vec3 col = vec3(0.0);
    col += c1 * smoothstep(-0.2, 0.6, n1) * 0.5;
    col += c2 * smoothstep(-0.1, 0.7, n2) * 0.4;
    col += c3 * smoothstep(0.0, 0.8, n3) * 0.3;

    // Vignette — concentrate toward center-top
    float vig = 1.0 - length((uv - vec2(0.5, 0.65)) * vec2(1.2, 1.0));
    vig = smoothstep(0.0, 0.7, vig);
    col *= vig;

    // Opacity — base intensity differs by mode
    float baseAlpha = mix(0.09, 0.18, u_dark);
    float alpha = length(col) * baseAlpha;

    // Mouse glow — soft radial highlight near cursor
    float mouseGlow = exp(-mouseDist * mouseDist * 3.0) * 0.06 * mix(1.0, 1.5, u_dark);
    alpha += mouseGlow;

    // Scroll fade — dissolve as user scrolls past hero
    float scrollFade = 1.0 - smoothstep(0.0, 0.8, u_scroll);
    alpha *= scrollFade;

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function AuroraCanvas({ className = '', style = {} }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const uniformsRef = useRef({});
  const mouseRef = useRef({ x: 0.5, y: 0.4 });
  const scrollRef = useRef(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const isDark = useCallback(() => {
    return document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return; // WebGL not supported — fallback is the CSS background

    glRef.current = gl;

    // ── Compile shaders ──
    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // ── Full-screen quad ──
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // ── Uniforms ──
    uniformsRef.current = {
      time: gl.getUniformLocation(program, 'u_time'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      scroll: gl.getUniformLocation(program, 'u_scroll'),
      dark: gl.getUniformLocation(program, 'u_dark'),
    };

    // ── Blending ──
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── Resize ──
    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // ── Render loop ──
    function render() {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const u = uniformsRef.current;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(u.time, prefersReducedMotion ? 0 : elapsed);
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.uniform2f(u.mouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(u.scroll, scrollRef.current);
      gl.uniform1f(u.dark, isDark());

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }

    render();

    // ── Mouse tracking ──
    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height, // flip Y
      };
    }

    // ── Scroll tracking ──
    function onScroll() {
      const heroHeight = canvas.clientHeight || window.innerHeight;
      scrollRef.current = Math.min(window.scrollY / heroHeight, 1.0);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
