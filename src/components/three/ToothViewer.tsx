/* eslint-disable react-hooks/refs, react-hooks/preserve-manual-memoization --
 * The camera state lives in a mutable ref shared with the three.js render loop
 * (the recommended react-three-fiber pattern). Refs are only read/written inside
 * gesture and press callbacks, never during render. */
import { Ionicons } from '@expo/vector-icons';
import { Canvas } from '@react-three/fiber';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { IconButton, SegmentedControl, SimulationBadge, type IconName } from '@/components/ui/primitives';
import { Text } from '@/components/ui/Text';
import type { Finding, ToothNumber } from '@/domain/models';
import { fonts, radius, space, usePalette } from '@/theme';

import {
  buccalView,
  createViewState,
  DEFAULT_VIEW,
  focusOnLesion,
  resetView,
  ToothScene,
  type ViewLayer,
  type ViewState,
} from './ToothScene';

type DragMode = 'rotate' | 'zoom' | 'pan';

const LAYERS: { value: ViewLayer; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'lesion', label: 'Lesion' },
  { value: 'anatomy', label: 'Anatomy' },
  { value: 'bone', label: 'Bone' },
  { value: 'full', label: 'Full' },
];

const LEGENDS: Record<ViewLayer, { color: string; label: string }[]> = {
  normal: [],
  lesion: [],
  anatomy: [
    { color: '#F5EFE4', label: 'Enamel' },
    { color: '#EFCB8A', label: 'Dentin' },
    { color: '#D9475A', label: 'Pulp' },
    { color: '#E2CC9F', label: 'Root / cementum' },
  ],
  bone: [
    { color: '#D9C7A2', label: 'Alveolar bone' },
    { color: '#E27C8A', label: 'Gingiva' },
  ],
  full: [
    { color: '#EFCB8A', label: 'Dentin' },
    { color: '#D9475A', label: 'Pulp' },
    { color: '#D9C7A2', label: 'Bone' },
    { color: '#FF3B30', label: 'Simulated lesion' },
  ],
};

export function ToothViewer({
  toothNumber,
  finding,
  height,
  layer,
  onLayerChange,
  expanded,
  onToggleExpand,
}: {
  toothNumber: ToothNumber;
  finding: Finding | null;
  height: number;
  layer: ViewLayer;
  onLayerChange: (l: ViewLayer) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const p = usePalette();
  const view = useRef<ViewState>(createViewState());
  const [dragMode, setDragMode] = useState<DragMode>('rotate');
  const [autoRotate, setAutoRotate] = useState(false);
  const [focused, setFocused] = useState(true);
  const overlayRef = useRef<View>(null);
  const pinchStart = useRef(1);
  const dragModeRef = useRef<DragMode>('rotate');
  useEffect(() => {
    dragModeRef.current = dragMode;
  }, [dragMode]);

  // Pause rendering when the screen is not focused (saves battery / GPU).
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  // Intro swing when a new tooth is opened.
  useEffect(() => {
    const v = view.current;
    v.yaw = DEFAULT_VIEW.yaw - 1.6;
    v.pitch = 0.5;
    v.zoom = 0.8;
    resetView(v);
    v.wake?.();
  }, [toothNumber]);

  useEffect(() => {
    view.current.autoRotate = autoRotate;
    view.current.wake?.();
  }, [autoRotate]);

  /** Mutate the shared view state from UI events, then request a frame. */
  const act = (fn: (v: ViewState) => void) => {
    fn(view.current);
    view.current.wake?.();
  };

  const selectLayer = (l: ViewLayer) => {
    onLayerChange(l);
    if ((l === 'lesion' || l === 'full') && finding) {
      act((v) => focusOnLesion(v, toothNumber, finding));
      setAutoRotate(false);
    } else if (l === 'bone') {
      act(buccalView);
      setAutoRotate(false);
    }
  };

  // Mouse-wheel zoom on web.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = overlayRef.current as unknown as HTMLElement | null;
    if (!node || !node.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      view.current.tZoom *= Math.exp(-e.deltaY * 0.0015);
      view.current.wake?.();
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const gesture = useMemo(() => {
    const ROT = 0.0105;
    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(1)
      .onBegin(() => {
        const v = view.current;
        v.dragging = true;
        v.velYaw = 0;
        v.velPitch = 0;
        v.wake?.();
      })
      .onChange((e) => {
        const v = view.current;
        if (e.numberOfPointers >= 2 || dragModeRef.current === 'pan') {
          v.tPanX += e.changeX * 0.0065 / v.zoom;
          v.tPanY -= e.changeY * 0.0065 / v.zoom;
        } else if (dragModeRef.current === 'zoom') {
          v.tZoom *= Math.exp(-e.changeY * 0.008);
        } else {
          v.tYaw += e.changeX * ROT;
          v.tPitch += e.changeY * ROT;
        }
        v.wake?.();
      })
      .onFinalize((e) => {
        const v = view.current;
        v.dragging = false;
        if (dragModeRef.current === 'rotate' && e.numberOfPointers <= 1) {
          v.velYaw = Math.max(-8, Math.min(8, e.velocityX * ROT * 0.9));
          v.velPitch = Math.max(-4, Math.min(4, e.velocityY * ROT * 0.5));
        }
        v.wake?.();
      });
    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onBegin(() => {
        pinchStart.current = view.current.tZoom;
      })
      .onUpdate((e) => {
        view.current.tZoom = pinchStart.current * e.scale;
        view.current.wake?.();
      });
    const doubleTap = Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(2)
      .onEnd(() => {
        resetView(view.current);
        view.current.wake?.();
      });
    return Gesture.Simultaneous(pan, pinch, doubleTap);
  }, []);

  const legend = LEGENDS[layer];
  const hasLesion = !!finding;

  return (
    <View
      testID="tooth-viewer"
      style={{
        height,
        borderRadius: expanded ? 0 : radius.xl,
        overflow: 'hidden',
        backgroundColor: p.studio,
        borderWidth: expanded ? 0 : 1,
        borderColor: p.studioBorder,
      }}>
      <LinearGradient
        colors={['#0B1A30', '#07111F', '#050B16']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft radial glow behind the tooth */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: height * 0.18,
          width: height * 0.7,
          height: height * 0.7,
          borderRadius: height,
          backgroundColor: 'rgba(56, 142, 255, 0.10)',
          boxShadow: '0px 0px 80px 40px rgba(56, 142, 255, 0.10)',
        }}
      />

      <View style={StyleSheet.absoluteFill}>
        <Canvas
          frameloop={focused ? 'demand' : 'never'}
          dpr={Platform.OS === 'web' ? [1, 2] : Math.min(PixelRatio.get(), 1.5)}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 34, near: 0.1, far: 100, position: [0, 0, 7] }}
          onCreated={({ gl }) => {
            gl.localClippingEnabled = true;
          }}
          style={{ flex: 1 }}>
          <ToothScene toothNumber={toothNumber} finding={finding} layer={layer} view={view} />
        </Canvas>
      </View>

      {/* Gesture capture layer (keeps three.js free of touch handling) */}
      <GestureDetector gesture={gesture}>
        <View
          ref={overlayRef}
          testID="tooth-viewer-gesture"
          collapsable={false}
          style={[
            StyleSheet.absoluteFill,
            Platform.OS === 'web' ? ({ cursor: 'grab', touchAction: 'none', userSelect: 'none' } as object) : null,
          ]}
        />
      </GestureDetector>

      {/* Top overlay */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: space.md, left: space.md, right: space.md, flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
        <View pointerEvents="none" style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#5FD4FF' }} />
            <Text variant="overline" tone="studioMuted">
              360° Interactive · {LAYERS.find((l) => l.value === layer)?.label} view
            </Text>
          </View>
          <Text variant="caption" tone="studioMuted" style={{ opacity: 0.75 }}>
            {Platform.OS === 'web' ? 'Drag to rotate · scroll to zoom · double-click to reset' : 'Drag to rotate · pinch to zoom · two fingers to pan'}
          </Text>
        </View>
        <SimulationBadge tone="studio" label="SIMULATED" />
      </View>

      {/* Right rail */}
      <View pointerEvents="box-none" style={{ position: 'absolute', right: space.md, top: 64, gap: space.sm }}>
        <IconButton tone="studio" size={38} icon="add" accessibilityLabel="Zoom in" onPress={() => act((v) => (v.tZoom *= 1.25))} />
        <IconButton tone="studio" size={38} icon="remove" accessibilityLabel="Zoom out" onPress={() => act((v) => (v.tZoom /= 1.25))} />
        {hasLesion ? (
          <IconButton
            tone="studio"
            size={38}
            icon="locate"
            testID="viewer-focus"
            accessibilityLabel="Focus affected region"
            onPress={() => {
              act((v) => focusOnLesion(v, toothNumber, finding));
              setAutoRotate(false);
              if (layer === 'normal') onLayerChange('lesion');
            }}
          />
        ) : null}
        {onToggleExpand ? (
          <IconButton
            tone="studio"
            size={38}
            icon={expanded ? 'contract' : 'expand'}
            testID="viewer-expand"
            accessibilityLabel={expanded ? 'Exit full screen' : 'Full screen'}
            onPress={onToggleExpand}
          />
        ) : null}
      </View>

      {/* Bottom overlay */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: space.md, right: space.md, bottom: space.md, gap: space.sm }}>
        {layer === 'lesion' ? (
          <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', ...chip }}>
            <Text variant="caption" tone="studioMuted">
              Low
            </Text>
            <LinearGradient
              colors={['#FFE14D', '#FF9A1F', '#FF3B30', '#B0102B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 84, height: 6, borderRadius: 3 }}
            />
            <Text variant="caption" tone="studioMuted">
              High attention
            </Text>
          </View>
        ) : legend.length ? (
          <View pointerEvents="none" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {legend.map((l) => (
              <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, ...chip }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
                <Text variant="caption" tone="studio">
                  {l.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <ControlButton icon="sync" label="Rotate" active={dragMode === 'rotate'} onPress={() => setDragMode('rotate')} testID="ctl-rotate" />
          <ControlButton icon="search" label="Zoom" active={dragMode === 'zoom'} onPress={() => setDragMode('zoom')} testID="ctl-zoom" />
          <ControlButton icon="move" label="Pan" active={dragMode === 'pan'} onPress={() => setDragMode('pan')} testID="ctl-pan" />
          <ControlButton
            icon="refresh"
            label="Reset"
            onPress={() => {
              act(resetView);
              setAutoRotate(false);
            }}
            testID="ctl-reset"
          />
          <ControlButton
            icon="infinite"
            label="Auto"
            active={autoRotate}
            onPress={() => setAutoRotate((a) => !a)}
            testID="ctl-auto"
          />
        </View>
        <SegmentedControl tone="studio" options={LAYERS} value={layer} onChange={selectLayer} testIDPrefix="layer" />
      </View>
    </View>
  );
}

const chip = {
  backgroundColor: 'rgba(8, 16, 30, 0.72)',
  borderColor: 'rgba(148, 176, 214, 0.16)',
  borderWidth: 1,
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 5,
} as const;

function ControlButton({
  icon,
  label,
  active,
  onPress,
  testID,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        height: 50,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        backgroundColor: active ? 'rgba(75, 141, 248, 0.22)' : 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: active ? 'rgba(95, 160, 255, 0.7)' : p.studioBorder,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Ionicons name={icon} size={17} color={active ? '#8FBCFF' : p.studioText} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 10.5, color: active ? '#8FBCFF' : p.studioMuted }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
