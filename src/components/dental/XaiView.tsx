import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { SimulationBanner } from '@/components/ui/Disclaimer';
import { MetricBar, SegmentedControl } from '@/components/ui/primitives';
import { Text } from '@/components/ui/Text';
import type { Tooth } from '@/domain/models';
import { radius, space, usePalette } from '@/theme';

import { Radiograph } from './Radiograph';

/** "Why was this tooth flagged?" — image region → finding → explanation. */
export function XaiView({ tooth, teeth, width }: { tooth: Tooth; teeth: Tooth[]; width: number }) {
  const p = usePalette();
  const [view, setView] = useState<'split' | 'overlay'>('split');
  const xai = tooth.xai;
  const f = tooth.finding;
  if (!xai || !f) {
    return (
      <Text variant="body" tone="muted">
        No simulated finding on this tooth — nothing to explain.
      </Text>
    );
  }
  const narrow = width < 420;
  const cropW = view === 'split' ? (width - space.md) / 2 : width;

  return (
    <View style={{ gap: space.lg }}>
      <SimulationBanner label="SIMULATED EXPLAINABLE AI OUTPUT" />

      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md }}>
          <Text variant="overline" tone="muted">
            Visual explanation
          </Text>
          <View style={{ width: 200 }}>
            <SegmentedControl
              options={[
                { value: 'split', label: 'Side by side' },
                { value: 'overlay', label: 'Overlay' },
              ]}
              value={view}
              onChange={setView}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {view === 'split' ? (
            <View style={{ gap: 6 }}>
              <View style={{ borderRadius: radius.md, overflow: 'hidden' }}>
                <Radiograph teeth={teeth} width={cropW} focus={tooth.toothNumber} />
              </View>
              <Text variant="caption" tone="muted" align="center">
                Original region (simulated)
              </Text>
            </View>
          ) : null}
          <View style={{ gap: 6 }}>
            <View style={{ borderRadius: radius.md, overflow: 'hidden' }}>
              <Radiograph teeth={teeth} width={cropW} focus={tooth.toothNumber} showHeat />
              <View
                style={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  bottom: 8,
                  backgroundColor: 'rgba(20, 6, 8, 0.82)',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: 'rgba(255,107,107,0.6)',
                }}>
                <Text variant="caption" style={{ color: '#FFD5D5' }} numberOfLines={2}>
                  {xai.annotation}
                </Text>
              </View>
            </View>
            <Text variant="caption" tone="muted" align="center">
              AI attention map (simulated)
            </Text>
          </View>
        </View>
      </View>

      {/* Region → finding → explanation */}
      <View style={{ flexDirection: narrow ? 'column' : 'row', gap: space.sm, alignItems: 'stretch' }}>
        <FlowStep icon="scan-outline" title="Image region" body={tooth.finding?.affectedRegion ?? ''} color={p.accent} grow={!narrow} />
        <FlowArrow vertical={narrow} />
        <FlowStep icon="medical-outline" title="Finding" body={`${f.title} · ${f.severity}`} color={p.attention} grow={!narrow} />
        <FlowArrow vertical={narrow} />
        <FlowStep icon="bulb-outline" title="Explanation" body={xai.summary} color={p.simulation} grow={!narrow} />
      </View>

      <View style={{ gap: space.md }}>
        <Text variant="overline" tone="muted">
          Confidence indicators (simulated)
        </Text>
        {xai.metrics.map((m) => (
          <MetricBar key={m.label} label={m.label} value={m.value * 100} suffix="%" color={p.primary} />
        ))}
      </View>

      <View style={{ gap: space.sm }}>
        <Text variant="overline" tone="muted">
          Evidence
        </Text>
        {xai.evidence.map((e) => (
          <View key={e} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <Ionicons name="ellipse" size={7} color={p.primary} style={{ marginTop: 7 }} />
            <Text variant="body" style={{ flex: 1 }}>
              {e}
            </Text>
          </View>
        ))}
        <Text variant="caption" tone="faint" style={{ marginTop: 4 }}>
          Method: {xai.method}
        </Text>
      </View>
    </View>
  );
}

function FlowStep({
  icon,
  title,
  body,
  color,
  grow,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  color: string;
  grow: boolean;
}) {
  const p = usePalette();
  return (
    <View
      style={{
        flex: grow ? 1 : undefined,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: p.surfaceAlt,
        borderWidth: 1,
        borderColor: p.border,
        gap: 6,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={15} color={color} />
        <Text variant="label" style={{ color }}>
          {title}
        </Text>
      </View>
      <Text variant="bodySm">{body}</Text>
    </View>
  );
}

function FlowArrow({ vertical }: { vertical: boolean }) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={vertical ? 'arrow-down' : 'arrow-forward'} size={16} color={p.textFaint} />
    </View>
  );
}
