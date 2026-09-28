import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { StudyStatusBadge } from '@/components/dental/PatientRow';
import { Radiograph, type ScanOverlay } from '@/components/dental/Radiograph';
import { PatientNav } from '@/components/layout/PatientNav';
import { SimulationBanner } from '@/components/ui/Disclaimer';
import { Button, Card, IconButton, KeyValue, ProgressBar, SectionHeader, SegmentedControl, StatusBadge } from '@/components/ui/primitives';
import { AppHeader, Screen, useLayout } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { repository } from '@/data';
import { useAuth } from '@/state/auth';
import { usePatient, useSampleScans } from '@/state/data';
import { radius, space, usePalette } from '@/theme';
import { formatDateTime } from '@/utils/format';

export default function ScanViewer() {
  const p = usePalette();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pt, loading, error, reload } = usePatient(id);
  const samples = useSampleScans();
  const [overlay, setOverlay] = useState<ScanOverlay>('overlay');
  const [zoom, setZoom] = useState(1);
  const [sample, setSample] = useState('pano-standard');
  const [uploading, setUploading] = useState(0);
  const { width, isWide, gutter } = useLayout();
  const contentW = Math.min(width - (isWide ? 220 : 0), 1120) - gutter * 2;

  const canUpload = user?.role === 'nurse' || user?.role === 'doctor';
  const analyzed = pt && (pt.study.status === 'Analyzed' || pt.study.status === 'Reviewed');
  const hasImage = pt && pt.study.status !== 'Awaiting scan';

  const upload = async () => {
    if (!pt) return;
    setUploading(0.05);
    const iv = setInterval(() => setUploading((u) => Math.min(0.95, u + 0.12)), 120);
    try {
      await repository.uploadScan(pt.id, sample);
      setUploading(1);
    } finally {
      clearInterval(iv);
      setTimeout(() => setUploading(0), 500);
    }
  };

  const openTooth = (n: string) => router.push({ pathname: '/patient/[id]/tooth/[tooth]', params: { id, tooth: n } });

  return (
    <Screen
      header={
        <AppHeader
          back={{ pathname: '/patient/[id]', params: { id } }}
          overline={pt ? `Patient ${pt.code} · ${pt.name}` : 'Patient'}
          title="Scan Viewer"
          subtitle={pt ? `${pt.study.scanType} · ${pt.study.id}` : undefined}
          right={pt ? <StudyStatusBadge status={pt.study.status} /> : null}
        />
      }>
      <PatientNav current="scan" />
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading || !pt ? (
        !error ? <LoadingState label="Loading study…" /> : null
      ) : (
        <>
          {!hasImage ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              <Card style={{ gap: space.lg }} testID="upload-card">
                <SectionHeader title="Upload / select simulated scan" subtitle="Choose a sample study to attach (POST /scan)" icon="cloud-upload-outline" />
                {(samples.data ?? []).map((s) => {
                  const active = sample === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      testID={`sample-${s.key}`}
                      onPress={() => setSample(s.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.md,
                        padding: space.md,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? p.primary : p.border,
                        backgroundColor: active ? p.primarySoft : p.surface,
                      }}>
                      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? p.primary : p.textFaint} />
                      <View style={{ flex: 1 }}>
                        <Text variant="title">{s.label}</Text>
                        <Text variant="caption" tone="muted">
                          {s.description}
                        </Text>
                      </View>
                      <Text variant="caption" tone="faint">
                        {s.size}
                      </Text>
                    </Pressable>
                  );
                })}
                {uploading > 0 ? (
                  <View style={{ gap: 6 }}>
                    <Text variant="caption" tone="muted">
                      Uploading scan… {Math.round(uploading * 100)}%
                    </Text>
                    <ProgressBar value={uploading * 100} color={p.primary} />
                  </View>
                ) : null}
                {canUpload ? (
                  <Button label="Upload selected scan" icon="cloud-upload-outline" size="lg" onPress={upload} loading={uploading > 0} testID="upload-scan" />
                ) : (
                  <Text variant="caption" tone="muted">
                    Scan upload is performed by nursing / clinical staff.
                  </Text>
                )}
              </Card>
            </Animated.View>
          ) : (
            <>
              <Card padded={false} variant="studio" style={{ overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md, gap: space.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="overline" tone="studioMuted">
                      {pt.study.scanType} · {formatDateTime(pt.study.date)}
                    </Text>
                    <Text variant="caption" tone="studioMuted">
                      {analyzed ? `${32 - pt.counts.unknown} teeth detected · ${pt.findings.length} simulated findings` : 'Not analysed yet'}
                    </Text>
                  </View>
                  <IconButton tone="studio" size={34} icon="remove" accessibilityLabel="Zoom out" onPress={() => setZoom((z) => Math.max(1, z - 0.5))} />
                  <IconButton tone="studio" size={34} icon="add" accessibilityLabel="Zoom in" onPress={() => setZoom((z) => Math.min(3, z + 0.5))} />
                </View>
                <ScrollView horizontal scrollEnabled={zoom > 1} showsHorizontalScrollIndicator={zoom > 1}>
                  <Animated.View key={overlay} entering={FadeIn.duration(300)}>
                    <Radiograph
                      teeth={analyzed ? pt.teeth : null}
                      overlay={analyzed ? overlay : 'original'}
                      width={contentW * zoom}
                      onSelectTooth={analyzed ? openTooth : undefined}
                    />
                  </Animated.View>
                </ScrollView>
                <View style={{ padding: space.md, gap: space.sm }}>
                  <SegmentedControl<ScanOverlay>
                    tone="studio"
                    options={[
                      { value: 'original', label: 'Original', icon: 'image-outline' },
                      { value: 'overlay', label: 'AI Overlay', icon: 'layers-outline' },
                      { value: 'findings', label: 'Findings', icon: 'flame-outline' },
                    ]}
                    value={overlay}
                    onChange={setOverlay}
                    testIDPrefix="overlay"
                  />
                  <Text variant="caption" tone="studioMuted" align="center">
                    {analyzed ? 'Tap a tooth on the image to open its 3D inspection' : 'Run the analysis to enable AI overlays'}
                  </Text>
                </View>
              </Card>

              <Button
                label={analyzed ? 'Re-run Analyze Scan' : 'Analyze Scan'}
                icon="sparkles"
                size="lg"
                variant={analyzed ? 'secondary' : 'primary'}
                onPress={() => router.push({ pathname: '/analyze/[id]', params: { id: pt.id } })}
                testID="analyze-scan"
              />

              {analyzed ? (
                <>
                  <SimulationBanner />
                  <Card style={{ gap: space.md }}>
                    <SectionHeader title="Detected findings" subtitle="Scan → Dental Chart → 3D Tooth → XAI → Recommendations" icon="flame-outline" />
                    {pt.findings.map((f) => (
                      <Pressable
                        key={f.findingId}
                        onPress={() => openTooth(f.toothNumber)}
                        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
                        <Text variant="h3" style={{ width: 34 }}>
                          {f.toothNumber}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text variant="title">{f.title}</Text>
                          <Text variant="caption" tone="muted">
                            {f.severity} · {Math.round(f.confidence * 100)}% simulated confidence
                          </Text>
                        </View>
                        <StatusBadge status={f.status} size="sm" />
                        <Ionicons name="chevron-forward" size={16} color={p.textFaint} />
                      </Pressable>
                    ))}
                    <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                      <Button label="Dental chart" variant="secondary" size="sm" icon="grid-outline" onPress={() => router.replace({ pathname: '/patient/[id]/chart', params: { id } })} />
                      <Button label="Mouth overview" variant="secondary" size="sm" icon="happy-outline" onPress={() => router.replace({ pathname: '/patient/[id]/mouth', params: { id } })} />
                    </View>
                  </Card>
                </>
              ) : null}
            </>
          )}

          <Card style={{ gap: space.md }}>
            <SectionHeader title="Study information" icon="information-circle-outline" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
              <KeyValue label="Patient" value={`${pt.name} (${pt.id})`} />
              <KeyValue label="Study" value={pt.study.id} />
              <KeyValue label="Scan type" value={pt.study.scanType} />
              <KeyValue label="Modality" value={pt.study.modality} />
              <KeyValue label="Device" value={pt.study.device} />
              <KeyValue label="Resolution" value={pt.study.resolution} />
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}
