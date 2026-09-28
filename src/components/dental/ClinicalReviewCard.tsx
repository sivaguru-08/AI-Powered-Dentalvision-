import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Badge, Button, Card, SectionHeader, SegmentedControl } from '@/components/ui/primitives';
import { Text } from '@/components/ui/Text';
import { repository } from '@/data';
import { CONDITION_LABELS } from '@/data/mock/conditions';
import type { ClinicalReview, Finding, Severity } from '@/domain/models';
import { useAuth } from '@/state/auth';
import { useReview } from '@/state/data';
import { fonts, radius, space, usePalette } from '@/theme';
import { formatDateTime } from '@/utils/format';

export function reviewLabel(r: ClinicalReview | null | undefined): string {
  if (!r || r.decision === 'pending') return 'Pending Review';
  if (r.decision === 'approved') return `Reviewed by ${r.reviewer}`;
  if (r.decision === 'modified') return `Modified by ${r.reviewer}`;
  return `Marked incorrect by ${r.reviewer}`;
}

/** Clinician-in-the-loop review of a simulated finding (POST /clinical-review). */
export function ClinicalReviewCard({ finding }: { finding: Finding }) {
  const p = usePalette();
  const { user } = useAuth();
  const { data: review } = useReview(finding.id);
  const [busy, setBusy] = useState<string | null>(null);
  const [modifying, setModifying] = useState(false);
  const [condition, setCondition] = useState<string>(finding.shortTitle);
  const [severity, setSeverity] = useState<Severity>(finding.severity);
  const [note, setNote] = useState('');
  const canReview = user?.role === 'doctor';
  const decided = review && review.decision !== 'pending';

  const submit = async (decision: 'approved' | 'modified' | 'rejected') => {
    if (!user) return;
    setBusy(decision);
    try {
      await repository.submitReview({
        findingId: finding.id,
        decision,
        reviewer: user.name,
        note: note || undefined,
        modifiedCondition: decision === 'modified' ? condition : undefined,
        modifiedSeverity: decision === 'modified' ? severity : undefined,
      });
      setModifying(false);
    } finally {
      setBusy(null);
    }
  };

  const tone =
    review?.decision === 'approved'
      ? { c: p.healthy, bg: p.healthySoft, icon: 'checkmark-circle' as const }
      : review?.decision === 'modified'
        ? { c: p.primary, bg: p.primarySoft, icon: 'create' as const }
        : review?.decision === 'rejected'
          ? { c: p.priority, bg: p.prioritySoft, icon: 'close-circle' as const }
          : { c: p.attention, bg: p.attentionSoft, icon: 'time' as const };

  return (
    <Card style={{ gap: space.lg }} testID="clinical-review">
      <SectionHeader title="Clinical Review" subtitle="A qualified clinician must confirm every simulated finding" icon="shield-checkmark-outline" />
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
          <Text variant="bodySm" tone="muted">
            AI finding
          </Text>
          <Text variant="title">{finding.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md }}>
          <Text variant="bodySm" tone="muted">
            Status
          </Text>
          <Badge label={reviewLabel(review)} color={tone.c} bg={tone.bg} icon={tone.icon} />
        </View>
      </View>

      {decided ? (
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={{ padding: space.md, borderRadius: radius.md, backgroundColor: tone.bg, gap: 4 }}
          testID="review-result">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={tone.icon} size={20} color={tone.c} />
            <Text variant="h3" style={{ color: tone.c }}>
              {reviewLabel(review)}
            </Text>
          </View>
          <Text variant="bodySm" tone="muted">
            {formatDateTime(review!.reviewedAt!)}
          </Text>
          {review!.decision === 'modified' ? (
            <Text variant="bodySm">
              Updated finding: {review!.modifiedCondition} · {review!.modifiedSeverity}
            </Text>
          ) : null}
          {review!.note ? <Text variant="bodySm">Note: {review!.note}</Text> : null}
        </Animated.View>
      ) : null}

      {!canReview ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Ionicons name="lock-closed-outline" size={15} color={p.textFaint} />
          <Text variant="caption" tone="muted">
            Only doctors can approve or modify findings. You have read-only access.
          </Text>
        </View>
      ) : modifying ? (
        <Animated.View entering={FadeIn.duration(250)} style={{ gap: space.md }}>
          <Text variant="label" tone="muted">
            Corrected condition
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {[...Object.values(CONDITION_LABELS).filter((c) => c !== 'Healthy'), 'No abnormality'].map((c) => (
              <Pressable
                key={c}
                onPress={() => setCondition(c)}
                style={{
                  paddingHorizontal: 12,
                  height: 32,
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: condition === c ? p.primary : p.border,
                  backgroundColor: condition === c ? p.primarySoft : p.surface,
                }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 12.5, color: condition === c ? p.primary : p.textMuted }}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <Text variant="label" tone="muted">
            Severity
          </Text>
          <SegmentedControl<Severity>
            options={[
              { value: 'Mild', label: 'Mild' },
              { value: 'Moderate', label: 'Moderate' },
              { value: 'Severe', label: 'Severe' },
            ]}
            value={severity}
            onChange={setSeverity}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Clinical note (optional)"
            placeholderTextColor={p.textFaint}
            multiline
            style={[
              {
                minHeight: 70,
                padding: space.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: p.border,
                backgroundColor: p.surface,
                color: p.text,
                fontFamily: fonts.body,
                fontSize: 14,
                textAlignVertical: 'top',
              },
              { outlineStyle: 'none' } as object,
            ]}
          />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Cancel" variant="secondary" onPress={() => setModifying(false)} style={{ flex: 1 }} />
            <Button label="Save modification" icon="save-outline" onPress={() => submit('modified')} loading={busy === 'modified'} style={{ flex: 1.4 }} testID="save-modify" />
          </View>
        </Animated.View>
      ) : (
        <View style={{ gap: space.sm }}>
          <Button
            label={decided ? 'Approve Finding (update)' : 'Approve Finding'}
            variant="success"
            icon="checkmark-circle-outline"
            onPress={() => submit('approved')}
            loading={busy === 'approved'}
            size="lg"
            testID="approve-finding"
          />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Modify Finding" variant="secondary" icon="create-outline" onPress={() => setModifying(true)} style={{ flex: 1 }} testID="modify-finding" />
            <Button
              label="Mark as Incorrect"
              variant="danger"
              icon="close-circle-outline"
              onPress={() => submit('rejected')}
              loading={busy === 'rejected'}
              style={{ flex: 1 }}
              testID="reject-finding"
            />
          </View>
        </View>
      )}
    </Card>
  );
}
