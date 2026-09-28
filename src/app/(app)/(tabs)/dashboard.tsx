import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, PatientRow, StudyStatusBadge } from '@/components/dental/PatientRow';
import { TabHeader } from '@/components/layout/TabHeader';
import { BarChart, HBarList } from '@/components/ui/BarChart';
import { Badge, Button, Card, SectionHeader, StatTile, StatusBadge } from '@/components/ui/primitives';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Screen, useLayout } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import type { ClinicStats, Patient } from '@/domain/models';
import { useAuth } from '@/state/auth';
import { useClinicStats, usePatients, useRecentScans, useReviews, useStaff } from '@/state/data';
import { radius, space, usePalette } from '@/theme';
import { formatDate, greeting, relativeDay } from '@/utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useClinicStats();
  const patients = usePatients();
  const role = user?.role ?? 'doctor';

  return (
    <Screen
      header={
        <TabHeader
          overline={`${greeting()}, ${user?.name ?? ''} · ${formatDate(new Date().toISOString())}`}
          title={role === 'admin' ? 'Hospital Overview' : role === 'nurse' ? 'Nursing Station' : 'Clinical Dashboard'}
        />
      }>
      {stats.error ? <ErrorState error={stats.error} onRetry={stats.reload} /> : null}
      {!stats.data || !patients.data ? (
        <LoadingState label="Loading clinic data…" />
      ) : role === 'admin' ? (
        <AdminDashboard stats={stats.data} patients={patients.data} />
      ) : role === 'nurse' ? (
        <NurseDashboard stats={stats.data} patients={patients.data} />
      ) : (
        <DoctorDashboard stats={stats.data} patients={patients.data} />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- shared

function HealthHero({ stats, patients }: { stats: ClinicStats; patients: Patient[] }) {
  const p = usePalette();
  const analyzed = patients.filter((x) => x.study.status === 'Analyzed' || x.study.status === 'Reviewed');
  const totals = analyzed.reduce(
    (a, x) => ({ healthy: a.healthy + x.counts.healthy, attention: a.attention + x.counts.attention, priority: a.priority + x.counts.priority }),
    { healthy: 0, attention: 0, priority: 0 }
  );
  return (
    <Animated.View entering={FadeInDown.duration(450)}>
      <View style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
        <LinearGradient colors={p.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl, flexWrap: 'wrap' }}>
            <ScoreRing score={stats.averageDentalHealthIndex} size={124} stroke={11} tone="studio" color="#5FD4FF" />
            <View style={{ flex: 1, minWidth: 180, gap: space.sm }}>
              <Text variant="overline" tone="studioMuted">
                Overall dental health summary
              </Text>
              <Text variant="h2" tone="studio">
                Average Dental Health Index
              </Text>
              <Text variant="bodySm" tone="studioMuted">
                Across {analyzed.length} analysed demo studies · simulated metric
              </Text>
              <View style={{ flexDirection: 'row', gap: space.lg, marginTop: 4, flexWrap: 'wrap' }}>
                {[
                  { l: 'Healthy', v: totals.healthy, c: '#34D17A' },
                  { l: 'Attention', v: totals.attention, c: '#FFB020' },
                  { l: 'Priority', v: totals.priority, c: '#FF5A5F' },
                ].map((x) => (
                  <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: x.c }} />
                    <Text variant="label" tone="studio">
                      {x.v}
                    </Text>
                    <Text variant="caption" tone="studioMuted">
                      {x.l} teeth
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

function StatsGrid({ items }: { items: React.ComponentProps<typeof StatTile>[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
      {items.map((it, i) => (
        <Animated.View key={it.label} entering={FadeInDown.delay(80 * i).duration(400)} style={{ flexGrow: 1, flexBasis: 150 }}>
          <StatTile {...it} />
        </Animated.View>
      ))}
    </View>
  );
}

function PendingReviews({ patients, limit = 6 }: { patients: Patient[]; limit?: number }) {
  const p = usePalette();
  const reviews = useReviews();
  const pendingIds = new Set((reviews.data ?? []).filter((r) => r.decision === 'pending').map((r) => r.findingId));
  const items = patients
    .filter((x) => x.study.status === 'Analyzed')
    .flatMap((x) => x.findings.filter((f) => pendingIds.has(f.findingId)).map((f) => ({ patient: x, f })))
    .sort((a, b) => a.f.healthIndex - b.f.healthIndex)
    .slice(0, limit);
  return (
    <Card style={{ gap: space.md }}>
      <SectionHeader title="Pending clinical reviews" subtitle="Simulated AI findings awaiting a clinician" icon="clipboard-outline" />
      {items.length === 0 ? (
        <Text variant="bodySm" tone="muted">
          All simulated findings have been reviewed.
        </Text>
      ) : (
        items.map(({ patient, f }) => (
          <Pressable
            key={f.findingId}
            testID={`pending-${f.findingId}`}
            onPress={() =>
              router.push({ pathname: '/patient/[id]/tooth/[tooth]', params: { id: patient.id, tooth: f.toothNumber } })
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.sm,
              marginHorizontal: -space.sm,
              borderRadius: radius.md,
              backgroundColor: pressed ? p.surfaceAlt : 'transparent',
            })}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: f.status === 'priority' ? p.prioritySoft : p.attentionSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text variant="title" style={{ color: f.status === 'priority' ? p.priority : p.attention }}>
                {f.toothNumber}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="title" numberOfLines={1}>
                {f.shortTitle} · {f.severity}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                Patient {patient.code} · {patient.name} · {Math.round(f.confidence * 100)}% sim. confidence
              </Text>
            </View>
            <Text variant="label">{f.healthIndex}</Text>
            <Ionicons name="chevron-forward" size={16} color={p.textFaint} />
          </Pressable>
        ))
      )}
    </Card>
  );
}

function FindingsBreakdown({ stats }: { stats: ClinicStats }) {
  const p = usePalette();
  const colors = [p.attention, p.priority, p.simulation, p.accent];
  return (
    <Card style={{ gap: space.lg, flex: 1 }}>
      <SectionHeader title="Findings by condition" subtitle="Simulated, across demo studies" icon="pie-chart-outline" />
      <HBarList data={stats.findingsByCondition.map((f, i) => ({ label: f.label, value: f.count, color: colors[i] }))} />
    </Card>
  );
}

// ---------------------------------------------------------------- doctor

function DoctorDashboard({ stats, patients }: { stats: ClinicStats; patients: Patient[] }) {
  const p = usePalette();
  const { isWide } = useLayout();
  return (
    <>
      <StatsGrid
        items={[
          { label: 'Patients', value: stats.totalPatients, icon: 'people-outline', color: p.primary, onPress: () => router.push('/patients'), testID: 'stat-patients' },
          { label: "Today's scans", value: stats.todaysScans, icon: 'scan-outline', color: p.accent, onPress: () => router.push('/scans') },
          { label: 'Pending reviews', value: stats.pendingReviews, icon: 'time-outline', color: p.attention, testID: 'stat-pending' },
          { label: 'Affected teeth', value: stats.affectedTeeth, icon: 'alert-circle-outline', color: p.priority },
        ]}
      />
      <HealthHero stats={stats} patients={patients} />
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: space.lg, alignItems: 'flex-start' }}>
        <View style={{ flex: isWide ? 1.35 : undefined, width: isWide ? undefined : '100%', gap: space.md }}>
          <SectionHeader
            title="Recent patients"
            subtitle="Tap a patient to open the dental overview"
            action={<Button label="View all" variant="ghost" size="sm" iconRight="chevron-forward" onPress={() => router.push('/patients')} />}
          />
          {patients
            .filter((x) => x.doctor === 'Dr. Demo')
            .slice(0, 4)
            .map((pt, i) => (
              <Animated.View key={pt.id} entering={FadeInDown.delay(120 + i * 70).duration(400)}>
                <PatientRow patient={pt} />
              </Animated.View>
            ))}
        </View>
        <View style={{ flex: isWide ? 1 : undefined, width: isWide ? undefined : '100%', gap: space.lg }}>
          <PendingReviews patients={patients} />
          <FindingsBreakdown stats={stats} />
        </View>
      </View>
    </>
  );
}

// ----------------------------------------------------------------- admin

function AdminDashboard({ stats, patients }: { stats: ClinicStats; patients: Patient[] }) {
  const p = usePalette();
  const { isWide } = useLayout();
  const staff = useStaff();
  const scans = useRecentScans();
  const onDuty = (staff.data ?? []).filter((s) => s.status !== 'Off duty').length;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = (new Date().getDay() + 6) % 7;
  return (
    <>
      <StatsGrid
        items={[
          { label: 'Registered patients', value: stats.totalPatients, icon: 'people-outline', color: p.primary, onPress: () => router.push('/patients') },
          { label: "Today's scans", value: stats.todaysScans, icon: 'scan-outline', color: p.accent, onPress: () => router.push('/scans') },
          { label: 'Pending reviews', value: stats.pendingReviews, icon: 'time-outline', color: p.attention },
          { label: 'Staff on duty', value: `${onDuty}/${staff.data?.length ?? 0}`, icon: 'id-card-outline', color: p.simulation },
        ]}
      />
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: space.lg }}>
        <Card style={{ flex: isWide ? 1.4 : undefined, gap: space.lg }}>
          <SectionHeader title="Scans this week" subtitle="Imaging volume (simulated)" icon="bar-chart-outline" />
          <BarChart data={stats.scansThisWeek.map((v, i) => ({ label: days[i], value: v }))} highlightIndex={today} />
        </Card>
        <FindingsBreakdown stats={stats} />
      </View>
      <HealthHero stats={stats} patients={patients} />
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: space.lg, alignItems: 'flex-start' }}>
        <Card style={{ flex: isWide ? 1 : undefined, width: isWide ? undefined : '100%', gap: space.md }}>
          <SectionHeader title="Doctors & nurses" subtitle="Today's roster" icon="people-circle-outline" />
          {(staff.data ?? []).map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={s.name} size={38} color={s.role === 'Doctor' ? p.primary : p.accent} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="title" numberOfLines={1}>
                  {s.name}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {s.role} · {s.specialty} · {s.patientsToday} patients today
                </Text>
              </View>
              <StatusBadge
                status={s.status === 'On duty' ? 'healthy' : s.status === 'In surgery' ? 'attention' : 'unknown'}
                label={s.status}
                size="sm"
              />
            </View>
          ))}
        </Card>
        <Card style={{ flex: isWide ? 1 : undefined, width: isWide ? undefined : '100%', gap: space.md }}>
          <SectionHeader
            title="Recent scans"
            subtitle="Open any record"
            icon="images-outline"
            action={<Button label="Records" variant="ghost" size="sm" iconRight="chevron-forward" onPress={() => router.push('/patients')} />}
          />
          {(scans.data ?? []).map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push({ pathname: '/patient/[id]', params: { id: s.patientId } })}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: p.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={s.scanType === 'CBCT' ? 'cube-outline' : 'image-outline'} size={18} color={p.textMuted} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="title" numberOfLines={1}>
                  {s.patientName}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {s.scanType} · {relativeDay(s.time)}
                </Text>
              </View>
              <StudyStatusBadge status={s.status} />
            </Pressable>
          ))}
        </Card>
      </View>
    </>
  );
}

// ----------------------------------------------------------------- nurse

function NurseDashboard({ stats, patients }: { stats: ClinicStats; patients: Patient[] }) {
  const p = usePalette();
  const { user } = useAuth();
  const mine = patients.filter((x) => x.assignedNurse === user?.name);
  const awaiting = mine.filter((x) => x.study.status === 'Awaiting scan' || x.study.status === 'Uploaded');
  return (
    <>
      <StatsGrid
        items={[
          { label: 'Assigned patients', value: mine.length, icon: 'people-outline', color: p.primary, onPress: () => router.push('/patients') },
          { label: 'Awaiting scan / analysis', value: awaiting.length, icon: 'cloud-upload-outline', color: p.attention },
          { label: "Clinic scans today", value: stats.todaysScans, icon: 'scan-outline', color: p.accent, onPress: () => router.push('/scans') },
        ]}
      />
      <Card style={{ gap: space.md }}>
        <SectionHeader title="Scan queue" subtitle="Upload or select a simulated scan, then run the AI analysis" icon="cloud-upload-outline" />
        {awaiting.length === 0 ? (
          <Text variant="bodySm" tone="muted">
            No scans waiting. All assigned studies are analysed.
          </Text>
        ) : (
          awaiting.map((pt) => (
            <View key={pt.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
              <Avatar name={pt.name} size={40} color={p.attention} />
              <View style={{ flex: 1, minWidth: 140 }}>
                <Text variant="title">
                  Patient {pt.code} · {pt.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {pt.scenario}
                </Text>
              </View>
              <StudyStatusBadge status={pt.study.status} />
              <Button
                label={pt.study.status === 'Uploaded' ? 'Analyze' : 'Upload scan'}
                size="sm"
                icon={pt.study.status === 'Uploaded' ? 'sparkles-outline' : 'cloud-upload-outline'}
                onPress={() => router.push({ pathname: '/patient/[id]/scan', params: { id: pt.id } })}
                testID={`queue-${pt.code}`}
              />
            </View>
          ))
        )}
      </Card>
      <SectionHeader title="My assigned patients" subtitle="Records, scan status and simulated results" />
      {mine.map((pt, i) => (
        <Animated.View key={pt.id} entering={FadeInDown.delay(i * 70).duration(400)}>
          <PatientRow patient={pt} />
        </Animated.View>
      ))}
      <Badge label="Nurses can view results; clinical review is restricted to doctors" color={p.textMuted} bg={p.surfaceAlt} icon="lock-closed-outline" />
    </>
  );
}
