"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const DEFAULT_SHEETS: readonly string[] = [
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214908_972ea009-91d2-42a4-977a-ed382291fd28.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214908_de043f21-7922-4703-a5c9-82046204cc89.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214909_66badb95-f635-4a07-9c15-c67f5d88d0f7.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214909_5507f81c-80cd-47a0-983d-4345ddeb8612.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214909_606ced4c-e1f6-421f-b4e2-9bd156d968ce.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214910_218c82bf-b1c3-4c6f-a423-5b3636edcc17.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_215016_855d2215-f3f5-4580-8a0f-9ba6087fc97f.png&w=1536&q=82",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261112_214908_feb56792-db60-49c5-9158-c19319c26fc0.png&w=1536&q=82",
];

const DEG = Math.PI / 180;
const BAND_HEIGHTS_DEG = [11, 14, 17, 21, 24, 21, 17, 14, 11];
const GAP_DEG = 2.1;
const SEED = 20261113;

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying float vFacing;

  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vec3 vNormal = normalize(normalMatrix * normal);
    vec3 vViewDir = normalize(-mvPos.xyz);
    vFacing = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec4 uRect;
  uniform float uAspect;
  uniform float uOpacity;
  uniform vec3 uRimColor;

  varying vec2 vUv;
  varying float vFacing;

  void main() {
    float r = 0.085;
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 b = vec2(uAspect, 1.0) * 0.5 - vec2(r);
    vec2 q = abs(p) - b;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

    float fw = max(fwidth(d), 0.001);
    float mask = 1.0 - smoothstep(-1.2 * fw, 1.2 * fw, d);

    vec2 sampleUv = uRect.xy + vUv * uRect.zw;
    vec3 texCol = texture2D(uTex, sampleUv).rgb;

    float rim = pow(1.0 - vFacing, 2.2) * 0.55;
    vec3 col = mix(texCol, uRimColor, rim);

    float alpha = mask * uOpacity;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

interface TileMeta {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  delay: number;
  done: boolean;
}

interface PhotoGlobeProps {
  /** رنگ محوشدگی لبه‌های کره (برای پس‌زمینه تیره بنر) */
  rimColor?: string;
  /** آرایه ۸ تصویر شیت ۲×۲ */
  sheets?: readonly string[];
  className?: string;
}

function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function easeOutCubic(t: number): number {
  const k = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - k, 3);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export default function PhotoGlobe({
  rimColor = "#0b0f14",
  sheets = DEFAULT_SHEETS,
  className = "",
}: PhotoGlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const fov = ((2 * Math.asin(1 / 3.7) * 180) / Math.PI) * 1.015;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 20);
    camera.position.set(0, 0, 3.7);

    const group = new THREE.Group();
    group.rotation.x = 0.2;
    group.rotation.y = -0.6;
    scene.add(group);

    const rand = createPRNG(SEED);
    const rimCol = new THREE.Color(rimColor);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    let loadedCount = 0;
    let introStarted = false;
    let introStartTime = 0;

    const triggerIntro = () => {
      if (introStarted) return;
      introStarted = true;
      introStartTime = performance.now();
    };

    const textures: THREE.Texture[] = sheets.map((url) => {
      const tex = loader.load(
        url,
        () => {
          loadedCount += 1;
          if (loadedCount >= sheets.length) triggerIntro();
        },
        undefined,
        () => {
          loadedCount += 1;
          if (loadedCount >= sheets.length) triggerIntro();
        }
      );
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });

    const safetyTimeout = window.setTimeout(triggerIntro, 4000);

    const totalBandDeg =
      BAND_HEIGHTS_DEG.reduce((sum, h) => sum + h, 0) +
      GAP_DEG * (BAND_HEIGHTS_DEG.length - 1);
    let cursorDeg = (180 - totalBandDeg) / 2;

    const tiles: TileMeta[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.ShaderMaterial[] = [];

    let tileIndex = 0;
    let maxDelay = 0;

    for (let bandIdx = 0; bandIdx < BAND_HEIGHTS_DEG.length; bandIdx++) {
      const bandDeg = BAND_HEIGHTS_DEG[bandIdx];
      const bandStartRad = cursorDeg * DEG;
      const bandHeightRad = bandDeg * DEG;
      const bandMidRad = bandStartRad + bandHeightRad * 0.5;
      const sinMid = Math.sin(bandMidRad);

      const gapPhi = (GAP_DEG * DEG) / sinMid;
      const rawWidths: number[] = [];
      let sumSpan = 0;

      while (sumSpan < Math.PI * 2) {
        const w = (bandHeightRad * (0.82 + rand() * 0.62)) / sinMid;
        rawWidths.push(w);
        sumSpan += w + gapPhi;
      }

      const scaleFactor = (Math.PI * 2) / sumSpan;
      const scaledGap = gapPhi * scaleFactor;
      const startPhi = rand() * Math.PI * 2;

      interface RingEntry {
        phiStart: number;
        phiLen: number;
        thetaStart: number;
        thetaLen: number;
        normPhi: number;
      }

      const ringEntries: RingEntry[] = [];
      let phiCursor = startPhi;

      for (let i = 0; i < rawWidths.length; i++) {
        const phiLen = rawWidths[i] * scaleFactor;
        let thetaStart = bandStartRad;
        let thetaLen = bandHeightRad;

        if (rand() < 0.45) {
          const trim = rand() * 0.2 * bandHeightRad;
          thetaLen = bandHeightRad - trim;
          if (rand() < 0.5) {
            thetaStart = bandStartRad + trim;
          }
        }

        const normPhi =
          ((phiCursor % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        ringEntries.push({
          phiStart: phiCursor,
          phiLen,
          thetaStart,
          thetaLen,
          normPhi,
        });

        phiCursor += phiLen + scaledGap;
      }

      const sortedIndices = ringEntries
        .map((entry, idx) => ({ idx, normPhi: entry.normPhi }))
        .sort((a, b) => a.normPhi - b.normPhi);

      const rankInRing = new Map<number, number>();
      sortedIndices.forEach((item, rank) => rankInRing.set(item.idx, rank));

      const ringFromBottom = BAND_HEIGHTS_DEG.length - 1 - bandIdx;

      for (let i = 0; i < ringEntries.length; i++) {
        const entry = ringEntries[i];
        const segPhi = Math.max(6, Math.round(entry.phiLen / DEG / 3));
        const segTheta = Math.max(6, Math.round(entry.thetaLen / DEG / 3));

        const geom = new THREE.SphereGeometry(
          1,
          segPhi,
          segTheta,
          entry.phiStart,
          entry.phiLen,
          entry.thetaStart,
          entry.thetaLen
        );
        geometries.push(geom);

        const sheetIdx = tileIndex % sheets.length;
        const quadIdx = Math.floor(tileIndex / sheets.length) % 4;
        tileIndex += 1;

        const qCol = quadIdx % 2;
        const qRow = Math.floor(quadIdx / 2);
        const baseU = qCol * 0.5;
        const baseV = qRow === 0 ? 0.5 : 0.0;

        const inset = 0.035 * 0.5;
        let u0 = baseU + inset;
        let v0 = baseV + inset;
        let uSpan = 0.5 - inset * 2;
        let vSpan = 0.5 - inset * 2;

        const tileMidTheta = entry.thetaStart + entry.thetaLen * 0.5;
        const aspect = (entry.phiLen * Math.sin(tileMidTheta)) / entry.thetaLen;

        if (aspect > 1) {
          const croppedV = vSpan / aspect;
          v0 += (vSpan - croppedV) * 0.5;
          vSpan = croppedV;
        } else if (aspect < 1) {
          const croppedU = uSpan * aspect;
          u0 += (uSpan - croppedU) * 0.5;
          uSpan = croppedU;
        }

        const mat = new THREE.ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthWrite: true,
          side: THREE.FrontSide,
          premultipliedAlpha: true,
          uniforms: {
            uTex: { value: textures[sheetIdx] },
            uRect: { value: new THREE.Vector4(u0, v0, uSpan, vSpan) },
            uAspect: { value: aspect },
            uOpacity: { value: reducedMotion ? 1.0 : 0.0 },
            uRimColor: { value: rimCol },
          },
        });
        materials.push(mat);

        const mesh = new THREE.Mesh(geom, mat);
        if (!reducedMotion) {
          mesh.scale.setScalar(0.9);
        }
        group.add(mesh);

        const rank = rankInRing.get(i) ?? 0;
        const delay =
          ringFromBottom * 0.2 + (rank / ringEntries.length) * 0.42;
        if (delay > maxDelay) maxDelay = delay;

        tiles.push({
          mesh,
          material: mat,
          delay,
          done: reducedMotion,
        });
      }

      cursorDeg += bandDeg + GAP_DEG;
    }

    const totalBuildDuration = maxDelay + 0.5;
    let buildFinished = reducedMotion;

    if (!reducedMotion) {
      group.scale.set(0.42, 0.42 * 0.22, 0.42);
      group.position.y = -0.62;
    }

    const updateSize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(wrap);

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "120px" }
    );
    visibilityObserver.observe(wrap);

    let velocity = 0;
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      if (!reducedMotion) {
        velocity = clamp(velocity + delta * 0.0042, -6, 6);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let isDragging = false;
    let activePointerId: number | null = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPointerTime = 0;
    let dragVel = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      activePointerId = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      velocity = 0;
      dragVel = 0;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastPointerTime = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== activePointerId) return;
      const now = performance.now();
      const dt = Math.max((now - lastPointerTime) / 1000, 0.004);
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastPointerTime = now;

      const wrapWidth = Math.max(1, wrap.getBoundingClientRect().width);
      const factor = 2.6 / wrapWidth;

      group.rotation.y += dx * factor;
      group.rotation.x = clamp(
        group.rotation.x + dy * factor * 0.8,
        -0.55,
        0.75
      );

      const instVel = (dx * factor) / dt;
      dragVel = 0.6 * dragVel + 0.4 * instVel;
    };

    const endDrag = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== activePointerId) return;
      isDragging = false;
      activePointerId = null;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      velocity = clamp(dragVel, -6, 6);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    let rafId = 0;
    let prevTime = performance.now();

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      const inIntro = !reducedMotion && (!introStarted || !buildFinished);
      if (!isVisible && !inIntro) return;

      if (!reducedMotion && introStarted && !buildFinished) {
        const elapsed = (now - introStartTime) / 1000;

        if (elapsed <= 1.1) {
          const p = easeOutCubic(elapsed / 1.1);
          const s = 0.42 + 0.58 * p;
          group.scale.set(s, s * (0.22 + 0.78 * p), s);
          group.position.y = -(1 - p) * 0.62;
          group.rotation.y += Math.pow(1 - p, 2) * 2.6 * dt;
        } else {
          group.scale.set(1, 1, 1);
          group.position.y = 0;
        }

        if (elapsed >= totalBuildDuration) {
          for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            if (!t.done) {
              t.material.uniforms.uOpacity.value = 1.0;
              t.mesh.scale.setScalar(1.0);
              t.done = true;
            }
          }
          group.scale.set(1, 1, 1);
          group.position.y = 0;
          buildFinished = true;
        } else {
          for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            if (t.done) continue;
            const local = elapsed - t.delay;
            if (local <= 0) continue;
            if (local >= 0.5) {
              t.material.uniforms.uOpacity.value = 1.0;
              t.mesh.scale.setScalar(1.0);
              t.done = true;
            } else {
              const tp = easeOutCubic(local / 0.5);
              t.material.uniforms.uOpacity.value = tp;
              t.mesh.scale.setScalar(0.9 + 0.1 * tp);
            }
          }
        }
      }

      if (!isDragging) {
        if (Math.abs(velocity) > 0.0001) {
          group.rotation.y += velocity * dt;
          velocity *= Math.exp(-2.6 * dt);
        } else {
          velocity = 0;
        }
        group.rotation.x +=
          (0.2 - group.rotation.x) * (1 - Math.exp(-2.2 * dt));
      }

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(safetyTimeout);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [rimColor, sheets]);

  return (
    <div ref={wrapRef} className={`relative w-full aspect-square ${className}`}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-pan-y cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="Interactive 3D globe of dishes. Drag to spin."
      />
    </div>
  );
}