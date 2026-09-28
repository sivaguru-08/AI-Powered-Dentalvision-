/* eslint-disable react-hooks/immutability --
 * useFrame mutates three.js objects (camera, groups) and the shared view-state
 * ref every frame; this is how react-three-fiber animations are meant to work. */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { Finding, ToothNumber } from '@/domain/models';

import { getToothModel } from './geometry';

export type ViewLayer = 'normal' | 'lesion' | 'anatomy' | 'bone' | 'full';

/** Mutable camera/controls state shared between gestures and the render loop. */
export interface ViewState {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
  tYaw: number;
  tPitch: number;
  tZoom: number;
  tPanX: number;
  tPanY: number;
  velYaw: number;
  velPitch: number;
  dragging: boolean;
  autoRotate: boolean;
  /** Requests a frame (the canvas renders on demand, not continuously). */
  wake?: () => void;
}

export const DEFAULT_VIEW = { yaw: -0.5, pitch: 0.18, zoom: 1, panX: 0, panY: 0 };

export function createViewState(): ViewState {
  return {
    ...DEFAULT_VIEW,
    tYaw: DEFAULT_VIEW.yaw,
    tPitch: DEFAULT_VIEW.pitch,
    tZoom: DEFAULT_VIEW.zoom,
    tPanX: 0,
    tPanY: 0,
    velYaw: 0,
    velPitch: 0,
    dragging: false,
    autoRotate: false,
  };
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Rotate the model so that the lesion faces the camera. */
export function focusOnLesion(v: ViewState, toothNumber: ToothNumber, finding: Finding | null) {
  if (!finding) return;
  const m = getToothModel(toothNumber, finding);
  const upper = m.shape.upper;
  const p = m.lesion.point.clone();
  const nrm = m.lesion.normal.clone();
  if (m.lesion.kind === 'band') nrm.set(-1, 0, 0.35).normalize();
  if (upper) {
    p.set(-p.x, -p.y, p.z);
    nrm.set(-nrm.x, -nrm.y, nrm.z);
  }
  const yaw = Math.atan2(-nrm.x, nrm.z);
  let pitch = 0.15;
  if (m.lesion.kind === 'point' && Math.abs(nrm.y) > 0.6) pitch = nrm.y > 0 ? 0.95 : -0.8;
  if (m.lesion.kind === 'apex') pitch = upper ? 0.35 : -0.35;
  v.tYaw = v.yaw + wrap(yaw - v.yaw);
  v.tPitch = pitch;
  v.tZoom = 1.25;
  // Pan so the lesion ends up near the centre of the viewer: replicate the
  // scene transform (centre offset → upper-arch flip → user rotation).
  const mid = (m.maxY + m.minY) / 2;
  const q = m.lesion.point.clone().add(new THREE.Vector3(0, -mid, 0));
  if (upper) q.set(-q.x, -q.y, q.z);
  q.applyEuler(new THREE.Euler(pitch, yaw, 0, 'XYZ'));
  v.tPanX = -q.x * 0.85;
  v.tPanY = -q.y * 0.85 + (m.maxY - m.minY) * 0.06;
  v.velYaw = 0;
  v.velPitch = 0;
  v.autoRotate = false;
}

/** Buccal side view — best viewpoint for the bone cutaway. */
export function buccalView(v: ViewState) {
  v.tYaw = v.yaw + wrap(0 - v.yaw);
  v.tPitch = 0.12;
  v.tZoom = 1;
  v.tPanX = 0;
  v.tPanY = 0;
  v.velYaw = 0;
  v.velPitch = 0;
}

export function resetView(v: ViewState) {
  v.tYaw = v.yaw + wrap(DEFAULT_VIEW.yaw - v.yaw);
  v.tPitch = DEFAULT_VIEW.pitch;
  v.tZoom = 1;
  v.tPanX = 0;
  v.tPanY = 0;
  v.velYaw = 0;
  v.velPitch = 0;
}

const COLORS = {
  dentin: '#EFCB8A',
  pulp: '#D9475A',
  bone: '#E6D6B4',
  gum: '#E27C8A',
  marker: '#FF4D4F',
  ghost: '#9FB3CC',
  ring: '#5FD4FF',
};

export function ToothScene({
  toothNumber,
  finding,
  layer,
  view,
}: {
  toothNumber: ToothNumber;
  finding: Finding | null;
  layer: ViewLayer;
  view: React.RefObject<ViewState>;
}) {
  const model = useMemo(() => getToothModel(toothNumber, finding), [toothNumber, finding]);
  const spin = useRef<THREE.Group>(null);
  const turntable = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const pulse2 = useRef<THREE.Mesh>(null);
  const { camera, size, gl, scene, invalidate } = useThree();

  // Gestures live outside the canvas; give them a way to request frames.
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    v.wake = invalidate;
    invalidate();
    return () => {
      v.wake = undefined;
    };
  }, [view, invalidate]);

  // Compile every layer's shaders once up front so switching layers never
  // stalls the render loop (hidden objects are skipped by three otherwise).
  useEffect(() => {
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    try {
      gl.compile(scene, camera);
    } finally {
      hidden.forEach((o) => (o.visible = false));
    }
  }, [model, gl, scene, camera]);

  useEffect(() => invalidate(), [layer, invalidate]);

  const showLesion = layer === 'lesion' || layer === 'full';
  const xray = layer === 'anatomy' || layer === 'full';
  const showBone = layer === 'bone' || layer === 'full';

  // Separate geometries share positions/normals/index; only the colour attribute differs.
  const crownGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', model.crown.getAttribute('position'));
    g.setAttribute('normal', model.crown.getAttribute('normal'));
    g.setIndex(model.crown.getIndex());
    g.setAttribute('color', new THREE.BufferAttribute(model.crownColors.normal, 3));
    return g;
  }, [model]);
  const rootGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', model.roots.getAttribute('position'));
    g.setAttribute('normal', model.roots.getAttribute('normal'));
    g.setIndex(model.roots.getIndex());
    g.setAttribute('color', new THREE.BufferAttribute(model.rootColors.normal, 3));
    return g;
  }, [model]);

  useEffect(() => {
    crownGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(showLesion ? model.crownColors.lesion : model.crownColors.normal, 3)
    );
    rootGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(showLesion ? model.rootColors.lesion : model.rootColors.normal, 3)
    );
  }, [showLesion, crownGeo, rootGeo, model]);

  useEffect(
    () => () => {
      crownGeo.dispose();
      rootGeo.dispose();
    },
    [crownGeo, rootGeo]
  );

  const minY = showBone ? Math.min(model.minY, -model.shape.rootLen - 0.3) : model.minY;
  const height = model.maxY - minY;
  const mid = (model.maxY + minY) / 2;
  // Camera-facing cutaway plane for the bone (keeps the half away from the viewer).
  const cutaway = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.02)], []);
  const fov = 34;
  const aspect = size.width / Math.max(1, size.height);
  const fitH = (height / 2 / Math.tan(((fov / 2) * Math.PI) / 180)) * 1.55;
  const tanHalf = Math.tan(((fov / 2) * Math.PI) / 180);
  const radiusXZ = showBone ? model.shape.halfW * 1.75 : Math.hypot(model.shape.halfW, model.shape.halfD) * 1.55;
  const fitW = (radiusXZ / (tanHalf * aspect)) * 1.12;
  const baseDist = Math.max(fitH, fitW, 3);

  useFrame((_, dtRaw) => {
    const v = view.current;
    if (!v) return;
    const dt = Math.min(dtRaw, 0.05);
    if (!v.dragging) {
      if (Math.abs(v.velYaw) > 1e-4 || Math.abs(v.velPitch) > 1e-4) {
        v.tYaw += v.velYaw * dt;
        v.tPitch += v.velPitch * dt;
        const damp = Math.exp(-3.2 * dt);
        v.velYaw *= damp;
        v.velPitch *= damp;
      }
      if (v.autoRotate) v.tYaw += 0.55 * dt;
    }
    v.tPitch = Math.max(-1.35, Math.min(1.35, v.tPitch));
    v.tZoom = Math.max(0.55, Math.min(3.2, v.tZoom));
    const k = 1 - Math.exp(-10 * dt);
    v.yaw += (v.tYaw - v.yaw) * k;
    v.pitch += (v.tPitch - v.pitch) * k;
    v.zoom += (v.tZoom - v.zoom) * k;
    v.panX += (v.tPanX - v.panX) * k;
    v.panY += (v.tPanY - v.panY) * k;

    if (spin.current) {
      spin.current.rotation.set(v.pitch, v.yaw, 0);
      spin.current.position.set(v.panX, v.panY, 0);
    }
    if (turntable.current) turntable.current.rotation.y = v.yaw;
    camera.position.set(0, 0, baseDist / v.zoom);
    camera.lookAt(0, -height * 0.11, 0);

    const t = performance.now() / 1000;
    if (pulse.current) {
      const ph = (t * 0.9) % 1;
      pulse.current.scale.setScalar(1 + ph * (model.lesion.kind === 'apex' ? 0.7 : 1.6));
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - ph);
    }
    if (pulse2.current) {
      const ph = ((t * 0.9) + 0.5) % 1;
      pulse2.current.scale.setScalar(1 + ph * 1.6);
      (pulse2.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - ph);
    }

    // On-demand rendering: keep requesting frames only while something moves.
    const settling =
      Math.abs(v.tYaw - v.yaw) > 1e-4 ||
      Math.abs(v.tPitch - v.pitch) > 1e-4 ||
      Math.abs(v.tZoom - v.zoom) > 1e-4 ||
      Math.abs(v.tPanX - v.panX) > 1e-4 ||
      Math.abs(v.tPanY - v.panY) > 1e-4 ||
      Math.abs(v.velYaw) > 1e-3 ||
      Math.abs(v.velPitch) > 1e-3;
    if (settling || v.dragging || v.autoRotate || (showLesion && lesionKind !== 'none')) invalidate();
  });

  const markerQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), model.lesion.normal.clone().normalize());
    return q;
  }, [model]);

  const tilt = (model.tiltDeg * Math.PI) / 180;
  const flip = model.shape.upper ? Math.PI : 0;
  const lesionKind = model.lesion.kind;
  const markerR = Math.max(0.1, model.lesion.sigma * 0.75);

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#E8F0FF', '#1B2233', 0.9]} />
      <directionalLight position={[3.5, 5, 5]} intensity={2.4} />
      <directionalLight position={[-5, 1.5, 3]} intensity={0.9} color="#DCE8FF" />
      <directionalLight position={[0, 3, -6]} intensity={1.6} color="#9CC8FF" />
      <pointLight position={[0, -4, 3]} intensity={6} distance={12} color="#5FD4FF" />

      {/* Holographic turntable */}
      <group ref={turntable} position={[0, -height / 2 - 0.25, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 1.27, 96]} />
          <meshBasicMaterial color={COLORS.ring} transparent opacity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.55, 1.56, 96]} />
          <meshBasicMaterial color={COLORS.ring} transparent opacity={0.18} />
        </mesh>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.41, 0, Math.sin(a) * 1.41]} rotation={[-Math.PI / 2, 0, -a]}>
              <planeGeometry args={[i % 6 === 0 ? 0.16 : 0.08, 0.012]} />
              <meshBasicMaterial color={COLORS.ring} transparent opacity={i % 6 === 0 ? 0.6 : 0.3} />
            </mesh>
          );
        })}
      </group>

      {/*
        Every layer stays mounted; switching layers only toggles visibility,
        opacity and depthWrite. That keeps shader programs stable (no
        recompiles when the user taps a layer), which matters on mobile GPUs.
      */}
      <group ref={spin}>
        <group rotation={[0, 0, flip]}>
          <group position={[0, -mid, 0]}>
            {/* Tooth (tilted when impacted) */}
            <group rotation={[0, 0, tilt]} position={[tilt ? model.shape.halfW * 0.2 : 0, 0, 0]}>
              {/* Enamel crown + root trunk */}
              <mesh geometry={crownGeo} renderOrder={4}>
                <meshStandardMaterial
                  vertexColors
                  roughness={0.3}
                  metalness={0.02}
                  transparent
                  opacity={xray ? 0.2 : 1}
                  depthWrite={!xray}
                />
              </mesh>
              {/* Root / cementum */}
              <mesh geometry={rootGeo} renderOrder={3}>
                <meshStandardMaterial vertexColors roughness={0.62} transparent opacity={xray ? 0.3 : 1} depthWrite={!xray} />
              </mesh>
              <mesh geometry={model.dentin} renderOrder={2} visible={xray}>
                <meshStandardMaterial color={COLORS.dentin} roughness={0.5} transparent opacity={0.5} depthWrite={false} />
              </mesh>
              <mesh geometry={model.pulp} renderOrder={1} visible={xray}>
                <meshStandardMaterial color={COLORS.pulp} roughness={0.4} emissive={COLORS.pulp} emissiveIntensity={0.35} />
              </mesh>

              {/* Lesion markers */}
              {lesionKind === 'apex' ? (
                <group position={model.lesion.point} visible={showLesion}>
                  <mesh renderOrder={7}>
                    <sphereGeometry args={[0.3, 32, 20]} />
                    <meshBasicMaterial color={COLORS.marker} transparent opacity={0.22} depthWrite={false} />
                  </mesh>
                  <mesh ref={pulse} renderOrder={8}>
                    <sphereGeometry args={[0.3, 18, 10]} />
                    <meshBasicMaterial color={COLORS.marker} transparent opacity={0.4} depthWrite={false} wireframe />
                  </mesh>
                </group>
              ) : lesionKind !== 'none' ? (
                <group position={model.lesion.point} quaternion={markerQuat} visible={showLesion}>
                  <mesh position={[0, 0, 0.02]} renderOrder={8}>
                    <ringGeometry args={[markerR, markerR + 0.025, 48]} />
                    <meshBasicMaterial color={COLORS.marker} transparent opacity={0.95} side={THREE.DoubleSide} depthTest={false} />
                  </mesh>
                  <mesh ref={pulse} position={[0, 0, 0.03]} renderOrder={8}>
                    <ringGeometry args={[markerR, markerR + 0.02, 48]} />
                    <meshBasicMaterial color={COLORS.marker} transparent opacity={0.5} side={THREE.DoubleSide} depthTest={false} />
                  </mesh>
                  <mesh ref={pulse2} position={[0, 0, 0.03]} renderOrder={8}>
                    <ringGeometry args={[markerR, markerR + 0.02, 48]} />
                    <meshBasicMaterial color={COLORS.marker} transparent opacity={0.5} side={THREE.DoubleSide} depthTest={false} />
                  </mesh>
                  <mesh position={[0, 0, 0.36]} renderOrder={9}>
                    <cylinderGeometry args={[0.006, 0.006, 0.66, 6]} />
                    <meshBasicMaterial color={COLORS.marker} depthTest={false} transparent opacity={0.9} />
                  </mesh>
                  <mesh position={[0, 0, 0.7]} renderOrder={9}>
                    <sphereGeometry args={[0.035, 16, 12]} />
                    <meshBasicMaterial color={COLORS.marker} depthTest={false} transparent opacity={0.95} />
                  </mesh>
                </group>
              ) : null}
            </group>

            {/* Surrounding bone and gingiva (camera-facing cutaway) */}
            <group visible={showBone}>
              <mesh geometry={model.bone} renderOrder={0}>
                <meshStandardMaterial
                  color={COLORS.bone}
                  roughness={0.95}
                  side={THREE.DoubleSide}
                  clippingPlanes={cutaway}
                  emissive="#3A2E1C"
                  emissiveIntensity={0.25}
                />
              </mesh>
              <mesh geometry={model.gum} renderOrder={0}>
                <meshStandardMaterial color={COLORS.gum} roughness={0.5} side={THREE.DoubleSide} clippingPlanes={cutaway} />
              </mesh>
              {lesionKind === 'apex' ? (
                <mesh position={model.lesion.point} renderOrder={6}>
                  <sphereGeometry args={[0.26, 24, 16]} />
                  <meshStandardMaterial color="#3A1F1F" roughness={1} clippingPlanes={cutaway} side={THREE.DoubleSide} />
                </mesh>
              ) : null}
            </group>

            {/* Adjacent second molar for impaction context */}
            {model.neighbor ? (
              <mesh geometry={model.neighbor} position={[-model.shape.halfW * 2.05, 0.1, 0]} renderOrder={2} visible={layer === 'bone'}>
                <meshStandardMaterial color={COLORS.ghost} transparent opacity={0.28} depthWrite={false} />
              </mesh>
            ) : null}
          </group>
        </group>
      </group>
    </>
  );
}
