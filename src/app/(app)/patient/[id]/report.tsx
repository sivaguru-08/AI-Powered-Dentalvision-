import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PatientNav } from '@/components/layout/PatientNav';
import { LogoMark } from '@/components/ui/Logo';
import { Disclaimer, SimulationBanner } from '@/components/ui/Disclaimer';
import { Button, Card, Divider, KeyValue, StatusBadge } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { AppHeader, Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/state/auth';
import { usePatient, useReviews } from '@/state/data';
import { radius, space, usePalette } from '@/theme';
import { formatDate, formatDateTime } from '@/utils/format';
import { buildReportHtml, reviewText } from '@/utils/reportHtml';

export default function Report() {
  const p = usePalette();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pt, loading, error, reload } = usePatient(id);
  const reviews = useReviews();
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const findings = pt?.teeth.filter((t) => t.finding) ?? [];
  const reviewFor = (fid: string) => reviews.data?.find((r) => r.findingId === fid);
  const allReviewed = findings.length > 0 && findings.every((t) => reviewFor(t.finding!.id)?.decision !== 'pending');
  const reviewer = pt?.doctor ?? 'Dr. Demo';

  const exportReport = async () => {
    if (!pt) return;
    setExporting(true);
    setExportMsg(null);
    try {
      const html = buildReportHtml(pt, reviews.data ?? [], reviewer);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        setExportMsg('Print dialog opened — choose "Save as PDF".');
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `DentalVision report — Patient ${pt.code}` });
        }
        setExportMsg('PDF generated.');
      }
    } catch (e) {
      setExportMsg(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          back={{ pathname: '/patient/[id]', params: { id } }}
          overline={pt ? `Patient ${pt.code} · ${pt.name}` : 'Patient'}
          title="Assessment Report"
          subtitle="Simulated clinical report preview"
          right={<Button label="Export" icon="download-outline" size="sm" onPress={exportReport} loading={exporting} testID="export-report" />}
        />
      }>
      <PatientNav current="report" />
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading || !pt ? (
        !error ? <LoadingState label="Generating report…" /> : null
      ) : (
        <Animated.View entering={FadeInDown.duration(450)}>
          <Card style={{ gap: space.lg, padding: space.xl }} testID="report-document">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <LogoMark size={40} />
              <View style={{ flex: 1 }}>
                <Text variant="overline" tone="muted">
                  DentalVision 3D
                </Text>
                <Text variant="h1">DentalVision 3D Assessment</Text>
              </View>
            </View>
            <SimulationBanner />

            <Section title="Patient details">
              <KeyValue label="Patient" value={`Demo Patient ${pt.code}`} />
              <KeyValue label="Name" value={pt.name} />
              <KeyValue label="Age / Gender" value={`${pt.age} · ${pt.gender}`} />
              <KeyValue label="Patient ID" value={pt.id} />
            </Section>
            <Section title="Study details">
              <KeyValue label="Study ID" value={pt.study.id} />
              <KeyValue label="Scan type" value={pt.study.scanType} />
              <KeyValue label="Study date" value={formatDate(pt.study.date)} />
              <KeyValue label="Doctor" value={pt.doctor} />
            </Section>

            <Divider />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, flexWrap: 'wrap' }}>
              <ScoreRing score={pt.dentalHealthIndex} size={104} stroke={9} />
              <View style={{ flex: 1, minWidth: 180, gap: 4 }}>
                <Text variant="overline" tone="muted">
                  Overall Dental Health Index
                </Text>
                <Text variant="h2">{pt.dentalHealthIndex} / 100</Text>
                <Text variant="bodySm" tone="muted">
                  Healthy {pt.counts.healthy} · Attention {pt.counts.attention} · Priority {pt.counts.priority} · Not assessed {pt.counts.unknown}
                </Text>
              </View>
            </View>
            <Divider />

            <Text variant="h3">Affected teeth</Text>
            {findings.length === 0 ? (
              <Text variant="body" tone="muted">
                No simulated findings.
              </Text>
            ) : (
              findings.map((t) => {
                const r = reviewFor(t.finding!.id);
                return (
                  <Pressable
                    key={t.toothNumber}
                    onPress={() => router.push({ pathname: '/patient/[id]/tooth/[tooth]', params: { id: pt.id, tooth: t.toothNumber } })}
                    style={({ pressed }) => ({ padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: p.border, gap: 6, opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <Text variant="h2" style={{ width: 40 }}>
                        {t.toothNumber}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text variant="title">
                          {t.finding!.title} — {t.healthIndex} / 100
                        </Text>
                        <Text variant="caption" tone="muted">
                          {t.name} · {t.finding!.affectedRegion} · {t.finding!.severity} · {Math.round(t.finding!.confidence * 100)}% sim. confidence
                        </Text>
                      </View>
                      <StatusBadge status={t.status} size="sm" />
                    </View>
                    <Text variant="caption" tone="muted">
                      Possible contributing factors: {t.possibleCauses.slice(0, 3).join(' · ')}
                    </Text>
                    <Text variant="caption">Recommendation: {t.recommendations.priority}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={r && r.decision !== 'pending' ? 'checkmark-circle' : 'time-outline'}
                        size={13}
                        color={r && r.decision !== 'pending' ? p.healthy : p.attention}
                      />
                      <Text variant="caption" style={{ color: r && r.decision !== 'pending' ? p.healthy : p.attention }}>
                        {reviewText(r)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            <Text variant="h3">Recommendations</Text>
            {findings.length ? (
              <View style={{ gap: 6 }}>
                {Array.from(new Set(findings.flatMap((t) => t.recommendations.preventive))).slice(0, 7).map((x) => (
                  <Text key={x} variant="body">
                    • {x}
                  </Text>
                ))}
              </View>
            ) : (
              <Text variant="body">• Continue routine oral hygiene and recall.</Text>
            )}

            <Divider />
            <Section title="Clinical review">
              <KeyValue label="Reviewer" value={reviewer} />
              <KeyValue label="Status" value={allReviewed ? 'Simulation / Clinical Review Complete' : 'Simulation / Clinical Review Pending'} />
              <KeyValue label="Generated" value={formatDateTime(new Date().toISOString())} />
            </Section>
            <Disclaimer />
          </Card>
        </Animated.View>
      )}
      {pt ? (
        <View style={{ gap: space.sm }}>
          <Button label="Export Report" icon="download-outline" size="lg" onPress={exportReport} loading={exporting} />
          {exportMsg ? (
            <Text variant="caption" tone="muted" align="center" testID="export-msg">
              {exportMsg}
            </Text>
          ) : null}
          {user?.role === 'doctor' && !allReviewed && findings.length ? (
            <Text variant="caption" tone="muted" align="center">
              Tip: approve findings from the tooth inspection screen to complete the review.
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="overline" tone="primary">
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>{children}</View>
    </View>
  );
}
