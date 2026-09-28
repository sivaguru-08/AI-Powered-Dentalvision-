import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radiograph } from '@/components/dental/Radiograph';
import { Button, ProgressBar, SimulationBadge } from '@/components/ui/primitives';
import { useLayout } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { repository } from '@/data';
import { usePatient } from '@/state/data';
import { fonts, radius, space, usePalette } from '@/theme';

const STAGES = [
  'Validating scan',
  'Detecting dental structures',
  'Identifying teeth',
  'Mapping FDI tooth numbers',
  'Detecting simulated findings',
  'Generating explainability maps',
  'Preparing 3D visualisation & report',
];
const STAGE_MS = 900;

/** Simulated AI pipeline (POST /analyze) with a staged progress animation. */
export default function Analyze() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { width } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pt } = usePatient(id);
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState(0);
  const started = useRef(false);

  const studyId = pt?.study.id;
  useEffect(() => {
    // Keyed on the study id only: the patient object re-fetches when the
    // repository emits after POST /analyze, which must not cancel the run.
    if (!studyId || started.current) return;
    started.current = true;
    let cancelled = false;
    (async () => {
      try {
        for (let i = 0; i < STAGES.length; i++) {
          if (cancelled) return;
          setStage(i);
          if (i === 4) await repository.analyzeStudy(studyId);
          await new Promise((r) => setTimeout(r, STAGE_MS));
        }
        if (!cancelled) {
          setStage(STAGES.length);
          setDone(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studyId]);

  // Scan-line animation
  useEffect(() => {
    if (done) return;
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      setScan(((Date.now() - t0) / 1600) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  const progress = Math.min(1, stage / STAGES.length);
  const imgW = Math.min(width - 40, 620);

  return (
    <View style={{ flex: 1 }} testID="analyze-screen">
      <LinearGradient colors={[p.studio, '#0A1830', p.studio]} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, paddingHorizontal: 20, alignItems: 'center', gap: space.xl }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <SimulationBadge tone="studio" label="SIMULATED AI PIPELINE" />
          <Text variant="h1" tone="studio" align="center">
            {done ? 'Analysis Complete' : error ? 'Analysis failed' : 'Analyzing dental study…'}
          </Text>
          <Text variant="bodySm" tone="studioMuted" align="center">
            {pt ? `Patient ${pt.code} · ${pt.name} · ${pt.study.scanType}` : 'Loading study…'}
          </Text>
        </View>

        <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: p.studioBorder }}>
          <Radiograph teeth={done && pt ? pt.teeth : null} overlay={done ? 'overlay' : 'original'} width={imgW} scanning={done ? undefined : scan} />
          {!done ? (
            <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(4,10,20,0.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#37D4FF' }} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: '#BFEFFF' }}>{STAGES[Math.min(stage, STAGES.length - 1)]}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ width: '100%', maxWidth: 520, gap: space.md }}>
          <ProgressBar value={progress * 100} color="#37D4FF" track="rgba(255,255,255,0.08)" height={6} />
          {STAGES.map((s, i) => {
            const state = i < stage ? 'done' : i === stage && !done ? 'active' : 'todo';
            return (
              <Animated.View key={s} entering={FadeInDown.delay(i * 60).duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: state === 'done' ? 'rgba(52,209,122,0.18)' : state === 'active' ? 'rgba(55,212,255,0.18)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: state === 'done' ? '#34D17A' : state === 'active' ? '#37D4FF' : p.studioBorder,
                  }}>
                  {state === 'done' ? (
                    <Ionicons name="checkmark" size={15} color="#34D17A" />
                  ) : (
                    <Text style={{ fontFamily: fonts.bold, fontSize: 10.5, color: state === 'active' ? '#37D4FF' : p.studioMuted }}>
                      {String(i + 1).padStart(2, '0')}
                    </Text>
                  )}
                </View>
                <Text style={{ flex: 1, fontFamily: state === 'todo' ? fonts.medium : fonts.semibold, fontSize: 14, color: state === 'todo' ? p.studioMuted : p.studioText }}>
                  {s}
                </Text>
                {state === 'active' ? (
                  <Animated.View entering={FadeIn}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: '#37D4FF' }}>running…</Text>
                  </Animated.View>
                ) : null}
              </Animated.View>
            );
          })}
        </View>

        {error ? (
          <View style={{ gap: space.md, alignItems: 'center' }}>
            <Text variant="bodySm" style={{ color: '#FF8A8A' }}>
              {error}
            </Text>
            <Button label="Back to scan" variant="studio" onPress={() => router.back()} />
          </View>
        ) : null}

        {done && pt ? (
          <Animated.View entering={ZoomIn.duration(350)} style={{ width: '100%', maxWidth: 520, gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: 'rgba(52,209,122,0.12)', borderWidth: 1, borderColor: 'rgba(52,209,122,0.4)' }}>
              <Ionicons name="checkmark-circle" size={26} color="#34D17A" />
              <View style={{ flex: 1 }}>
                <Text variant="title" tone="studio">
                  {32 - pt.counts.unknown} teeth mapped · {pt.findings.length} simulated findings
                </Text>
                <Text variant="caption" tone="studioMuted">
                  Demo Dental Health Index {pt.dentalHealthIndex}/100 — requires clinical review
                </Text>
              </View>
            </View>
            <Button
              label="View Results"
              size="lg"
              icon="happy-outline"
              onPress={() => router.replace({ pathname: '/patient/[id]/mouth', params: { id: pt.id } })}
              testID="view-results"
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
