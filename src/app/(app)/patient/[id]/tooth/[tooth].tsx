import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClinicalReviewCard, reviewLabel } from '@/components/dental/ClinicalReviewCard';
import { XaiView } from '@/components/dental/XaiView';
import { ToothViewer } from '@/components/three/ToothViewer';
import type { ViewLayer } from '@/components/three/ToothScene';
import { SimulationBanner } from '@/components/ui/Disclaimer';
import { Expandable } from '@/components/ui/Expandable';
import { Badge, Button, Card, IconButton, MetricBar, SectionHeader, SegmentedControl, StatusBadge } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { AppHeader, MAX_WIDTH, Screen, useLayout } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { adjacentTooth, isValidTooth } from '@/domain/fdi';
import { HEALTH_DIMENSIONS } from '@/domain/health';
import type { Tooth } from '@/domain/models';
import { usePatient, useReview } from '@/state/data';
import { radius, scoreColor, space, usePalette } from '@/theme';


type Section = 'xai' | 'causes' | 'recs';

export default function ToothInspection() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { id, tooth: toothParam } = useLocalSearchParams<{ id: string; tooth: string }>();
  const toothNum = isValidTooth(toothParam) ? toothParam : '46';
  const { data: pt, loading, error, reload } = usePatient(id);
  const { width, height, isWide, gutter } = useLayout();
  const [layer, setLayer] = useState<ViewLayer>('normal');
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<Record<Section, boolean>>({ xai: false, causes: false, recs: false });
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const panelY = useRef(0);

  const tooth = pt?.teeth.find((t) => t.toothNumber === toothNum) ?? null;
  const { data: review } = useReview(tooth?.finding?.id);

  const contentW = Math.min(width - (isWide ? 220 : 0), MAX_WIDTH) - gutter * 2;
  const viewerH = isWide ? Math.min(Math.max(height - 190, 520), 760) : Math.min(Math.max(height * 0.64, 460), 640);
  const panelW = isWide ? contentW * 0.44 : contentW;

  const openSection = (s: Section) => {
    setOpen((o) => ({ ...o, [s]: true }));
    if (!isWide) {
      setTimeout(() => scrollRef.current?.scrollTo({ y: panelY.current + (sectionY.current[s] ?? 0) - 8, animated: true }), 60);
    }
  };

  const go = (n: string) => {
    setLayer('normal');
    setOpen({ xai: false, causes: false, recs: false });
    router.setParams({ tooth: n });
  };

  if (expanded && tooth) {
    return (
      <View style={{ flex: 1, backgroundColor: p.studio, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ToothViewer
          toothNumber={toothNum}
          finding={tooth.finding}
          height={height - insets.top - insets.bottom}
          layer={layer}
          onLayerChange={setLayer}
          expanded
          onToggleExpand={() => setExpanded(false)}
        />
        <View style={[StyleSheet.absoluteFill, { top: insets.top + 56, left: 16, right: undefined, bottom: undefined }]} pointerEvents="none">
          <Text variant="h2" tone="studio">
            Tooth {toothNum}
          </Text>
          <Text variant="bodySm" tone="studioMuted">
            {tooth.name}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Screen
      scrollRef={scrollRef}
      header={
        <AppHeader
          back={{ pathname: '/patient/[id]/mouth', params: { id } }}
          overline={pt ? `Patient ${pt.code} · ${pt.name}` : 'Tooth inspection'}
          title={`Tooth ${toothNum}`}
          subtitle={tooth?.name}
          right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconButton icon="chevron-back" accessibilityLabel="Previous tooth" onPress={() => go(adjacentTooth(toothNum, -1))} testID="prev-tooth" />
              <IconButton icon="chevron-forward" accessibilityLabel="Next tooth" onPress={() => go(adjacentTooth(toothNum, 1))} testID="next-tooth" />
            </View>
          }
        />
      }>
      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading || !pt || !tooth ? (
        !error ? <LoadingState label="Preparing 3D tooth model…" /> : null
      ) : (
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: space.lg, alignItems: 'flex-start' }}>
          {/* 3D viewer */}
          <Animated.View entering={FadeIn.duration(450)} style={{ width: isWide ? contentW - panelW - space.lg : '100%' }}>
            <ToothViewer
              key={toothNum}
              toothNumber={toothNum}
              finding={tooth.finding}
              height={viewerH}
              layer={layer}
              onLayerChange={setLayer}
              onToggleExpand={() => setExpanded(true)}
            />
          </Animated.View>

          {/* Analysis panels */}
          <View style={{ width: isWide ? panelW : '100%', gap: space.lg }} onLayout={(e) => (panelY.current = e.nativeEvent.layout.y)}>
            <HealthPanel tooth={tooth} />
            <StatusPanel tooth={tooth} reviewText={reviewLabel(review)} onOpen={openSection} />

            {tooth.finding ? (
              <>
                <Expandable
                  title="Explain AI"
                  subtitle="Why was this tooth flagged?"
                  icon="bulb-outline"
                  iconColor={p.simulation}
                  open={open.xai}
                  onToggle={() => setOpen((o) => ({ ...o, xai: !o.xai }))}
                  onLayout={(y) => (sectionY.current.xai = y)}
                  testID="section-xai">
                  <Text variant="h2">Why was this tooth flagged?</Text>
                  <XaiView tooth={tooth} teeth={pt.teeth} width={panelW - space.lg * 2 - 2} />
                </Expandable>

                <Expandable
                  title="Why did it happen?"
                  subtitle="Possible contributing factors"
                  icon="git-network-outline"
                  iconColor={p.attention}
                  open={open.causes}
                  onToggle={() => setOpen((o) => ({ ...o, causes: !o.causes }))}
                  onLayout={(y) => (sectionY.current.causes = y)}
                  testID="section-causes">
                  <CausesPanel tooth={tooth} />
                </Expandable>
              </>
            ) : null}

            <Expandable
              title="Recommended Next Steps"
              subtitle="Guidance, follow-up, DOs and DON'Ts"
              icon="list-circle-outline"
              iconColor={p.healthy}
              open={open.recs}
              onToggle={() => setOpen((o) => ({ ...o, recs: !o.recs }))}
              onLayout={(y) => (sectionY.current.recs = y)}
              testID="section-recs">
              <RecommendationsPanel tooth={tooth} />
            </Expandable>

            {tooth.finding ? <ClinicalReviewCard finding={tooth.finding} /> : null}

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button
                label="Back to mouth"
                variant="secondary"
                icon="happy-outline"
                style={{ flex: 1 }}
                onPress={() => router.dismissTo({ pathname: '/patient/[id]/mouth', params: { id, tooth: toothNum } })}
                testID="back-to-mouth"
              />
              <Button label="Next tooth" variant="secondary" iconRight="arrow-forward" style={{ flex: 1 }} onPress={() => go(adjacentTooth(toothNum, 1))} />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

// ------------------------------------------------------------- panels

function HealthPanel({ tooth }: { tooth: Tooth }) {
  const p = usePalette();
  const h = tooth.health;
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <Card style={{ gap: space.lg }} testID="health-panel">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <SectionHeader title="Tooth Health Index" subtitle="Demo Health Index — Simulated" icon="pulse-outline" />
        </View>
        {h ? (
          <View style={{ flexDirection: 'row', gap: space.xl, alignItems: 'center', flexWrap: 'wrap' }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <ScoreRing score={h.overall} size={118} stroke={10} />
              <Text variant="caption" tone="muted">
                Overall
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 190, gap: space.md }}>
              {HEALTH_DIMENSIONS.map((d) => (
                <MetricBar key={d.key} label={d.label} value={h[d.key]} color={scoreColor(p, h[d.key])} />
              ))}
            </View>
          </View>
        ) : (
          <Text variant="body" tone="muted">
            {tooth.note ?? 'Not assessed.'}
          </Text>
        )}
        {h ? (
          <Text variant="caption" tone="faint">
            Overall = mean of the five simulated dimensions ({HEALTH_DIMENSIONS.map((d) => h[d.key]).join(' + ')}) ÷ 5 = {h.overall}. This is a
            demonstration metric, not a validated clinical score.
          </Text>
        ) : null}
      </Card>
    </Animated.View>
  );
}

function StatusPanel({ tooth, reviewText, onOpen }: { tooth: Tooth; reviewText: string; onOpen: (s: Section) => void }) {
  const p = usePalette();
  const f = tooth.finding;
  return (
    <Animated.View entering={FadeInDown.delay(160).duration(400)}>
      <Card style={{ gap: space.md }} testID="status-panel">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeader title="Tooth Status" icon="medical-outline" />
          <Badge label="Simulated AI Finding" color={p.simulation} bg={p.simulationSoft} icon="flask-outline" size="sm" />
        </View>
        {f ? (
          <>
            <View style={{ padding: space.md, borderRadius: radius.md, backgroundColor: p.surfaceAlt, gap: 2 }}>
              <Text variant="overline" tone="faint">
                Finding
              </Text>
              <Text variant="h2" testID="finding-title">
                {f.title}
              </Text>
              <Text variant="bodySm" tone="muted">
                {f.description}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              <Stat label="Affected surface" value={f.affectedSurface} />
              <Stat label="Severity" value={f.severity} color={f.severity === 'Severe' ? p.priority : f.severity === 'Moderate' ? p.attention : p.healthy} />
              <Stat label="Simulation confidence" value={`${Math.round(f.confidence * 100)}%`} />
              <Stat label="Status" value={reviewText === 'Pending Review' ? 'Needs Clinical Review' : reviewText} color={reviewText === 'Pending Review' ? p.attention : p.healthy} />
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Explain AI" icon="bulb-outline" style={{ flex: 1 }} onPress={() => onOpen('xai')} testID="open-xai" />
              <Button label="Recommendations" variant="secondary" icon="list-outline" style={{ flex: 1 }} onPress={() => onOpen('recs')} testID="open-recs" />
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Ionicons name={tooth.healthIndex == null ? 'remove-circle-outline' : 'checkmark-circle'} size={28} color={tooth.healthIndex == null ? p.unknown : p.healthy} />
            <View style={{ flex: 1 }}>
              <Text variant="h3">{tooth.healthIndex == null ? 'Not assessed' : 'No simulated finding'}</Text>
              <Text variant="bodySm" tone="muted">
                {tooth.note ?? 'The simulated analysis did not flag this tooth.'}
              </Text>
            </View>
            <StatusBadge status={tooth.status} />
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const p = usePalette();
  return (
    <View style={{ flexGrow: 1, flexBasis: 130, gap: 2, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: p.border }}>
      <Text variant="overline" tone="faint">
        {label}
      </Text>
      <Text variant="title" style={{ color: color ?? p.text }}>
        {value}
      </Text>
    </View>
  );
}

function CausesPanel({ tooth }: { tooth: Tooth }) {
  const p = usePalette();
  const ctx = tooth.evidenceContext;
  return (
    <>
      <Text variant="h2">Possible Contributing Factors</Text>
      <View style={{ flexDirection: 'row', gap: 8, padding: space.md, borderRadius: radius.md, backgroundColor: p.attentionSoft }}>
        <Ionicons name="information-circle" size={17} color={p.attention} />
        <Text variant="bodySm" style={{ flex: 1 }}>
          The image does not prove these causes. They are general factors commonly associated with this type of simulated finding and must be
          assessed clinically.
        </Text>
      </View>
      <View style={{ gap: space.sm }}>
        {tooth.possibleCauses.map((c, i) => (
          <View key={c} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="label">{i + 1}</Text>
            </View>
            <Text variant="body" style={{ flex: 1 }}>
              {c}
            </Text>
          </View>
        ))}
      </View>
      {ctx ? (
        <View style={{ gap: space.sm }}>
          <Text variant="h3">Evidence context</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <ContextBox kind="Observed image finding" label="Affected region" value={ctx.affectedRegion} color={p.accent} />
            <ContextBox kind="Observed image finding" label="Observed pattern" value={ctx.observedPattern} color={p.accent} />
            <ContextBox kind="Possible contributing factor" label="Potential association" value={ctx.potentialAssociation} color={p.attention} />
          </View>
        </View>
      ) : null}
    </>
  );
}

function ContextBox({ kind, label, value, color }: { kind: string; label: string; value: string; color: string }) {
  const p = usePalette();
  return (
    <View style={{ flexGrow: 1, flexBasis: 170, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: p.border, borderLeftWidth: 3, borderLeftColor: color, gap: 4 }}>
      <Text variant="overline" style={{ color }}>
        {kind}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="title">{value}</Text>
    </View>
  );
}

function RecommendationsPanel({ tooth }: { tooth: Tooth }) {
  const p = usePalette();
  const [tab, setTab] = useState<'dos' | 'donts'>('dos');
  const r = tooth.recommendations;
  const lvl = r.priorityLevel === 'urgent' ? p.priority : r.priorityLevel === 'soon' ? p.attention : p.healthy;
  return (
    <>
      <Text variant="h2">Recommended Next Steps</Text>
      <View style={{ padding: space.md, borderRadius: radius.md, backgroundColor: `${lvl}18`, borderWidth: 1, borderColor: `${lvl}40`, gap: 4 }}>
        <Text variant="overline" style={{ color: lvl }}>
          Priority
        </Text>
        <Text variant="h3">{r.priority}</Text>
      </View>
      <View style={{ gap: space.sm }}>
        <Text variant="h3">Preventive guidance</Text>
        {r.preventive.map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <Ionicons name="ellipse" size={7} color={p.primary} style={{ marginTop: 7 }} />
            <Text variant="body" style={{ flex: 1 }}>
              {x}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 4 }}>
        <Text variant="h3">Follow-up</Text>
        <Text variant="body" tone="muted">
          {r.followUp}
        </Text>
      </View>
      <SegmentedControl
        options={[
          { value: 'dos', label: "DOs", icon: 'checkmark-circle-outline' },
          { value: 'donts', label: "DON'Ts", icon: 'close-circle-outline' },
        ]}
        value={tab}
        onChange={setTab}
        testIDPrefix="recs"
      />
      <Animated.View key={tab} entering={FadeIn.duration(250)} style={{ gap: space.sm }}>
        {(tab === 'dos' ? r.dos : r.donts).map((x) => (
          <View
            key={x}
            style={{
              flexDirection: 'row',
              gap: space.md,
              alignItems: 'center',
              padding: space.md,
              borderRadius: radius.md,
              backgroundColor: tab === 'dos' ? p.healthySoft : p.prioritySoft,
            }}>
            <Ionicons name={tab === 'dos' ? 'checkmark' : 'close'} size={18} color={tab === 'dos' ? p.healthy : p.priority} />
            <Text variant="body" style={{ flex: 1 }}>
              {x}
            </Text>
          </View>
        ))}
      </Animated.View>
      <SimulationBanner label="GENERAL GUIDANCE — NOT A TREATMENT INSTRUCTION" />
    </>
  );
}
