import { DISCLAIMER_TEXT } from '@/components/ui/Disclaimer';
import type { ClinicalReview, PatientDetail } from '@/domain/models';

import { formatDate, formatDateTime } from './format';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function reviewText(r?: ClinicalReview) {
  if (!r || r.decision === 'pending') return 'Clinical Review Pending';
  const verb = r.decision === 'approved' ? 'Approved' : r.decision === 'modified' ? 'Modified' : 'Marked incorrect';
  return `${verb} by ${r.reviewer} · ${formatDateTime(r.reviewedAt!)}`;
}

/** Printable HTML version of the simulated assessment (used by expo-print). */
export function buildReportHtml(pt: PatientDetail, reviews: ClinicalReview[], reviewer: string): string {
  const findings = pt.teeth.filter((t) => t.finding);
  const rows = findings
    .map((t) => {
      const r = reviews.find((x) => x.findingId === t.finding!.id);
      return `<tr><td><b>${t.toothNumber}</b></td><td>${esc(t.name)}</td><td>${esc(t.finding!.title)}</td><td>${t.finding!.severity}</td><td>${t.healthIndex}/100</td><td>${Math.round(
        t.finding!.confidence * 100
      )}%</td><td>${esc(reviewText(r))}</td></tr>`;
    })
    .join('');
  const causes = findings
    .map((t) => `<li><b>Tooth ${t.toothNumber}</b> — ${t.possibleCauses.slice(0, 3).map(esc).join(', ')}</li>`)
    .join('');
  const recs = findings
    .map((t) => `<li><b>Tooth ${t.toothNumber}</b> — ${esc(t.recommendations.priority)} ${esc(t.recommendations.followUp)}</li>`)
    .join('');
  const allReviewed = findings.every((t) => reviews.find((r) => r.findingId === t.finding!.id)?.decision !== 'pending');
  return `<!doctype html><html><head><meta charset="utf-8"><title>DentalVision 3D Assessment — Patient ${pt.code}</title>
<style>
 body{font-family:-apple-system,Segoe UI,Inter,Roboto,Arial,sans-serif;color:#0B1A2C;margin:32px;font-size:12.5px}
 h1{font-size:22px;margin:0} h2{font-size:14px;margin:22px 0 8px;color:#1766E8;text-transform:uppercase;letter-spacing:.06em}
 .muted{color:#55667C} .banner{background:#F0ECFF;color:#5B3FD6;padding:8px 12px;border-radius:8px;font-weight:700;font-size:11px;letter-spacing:.05em}
 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px} .kv b{display:block;font-size:10px;color:#8A99AD;text-transform:uppercase}
 table{width:100%;border-collapse:collapse} td,th{border-bottom:1px solid #E3E9F1;padding:7px 6px;text-align:left;vertical-align:top} th{font-size:10px;color:#8A99AD;text-transform:uppercase}
 .score{font-size:30px;font-weight:800} .foot{margin-top:28px;font-size:10.5px;color:#55667C;border-top:1px solid #E3E9F1;padding-top:10px}
</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div class="muted">DentalVision 3D · Explainable AI Dental Imaging</div><h1>DentalVision 3D Assessment</h1></div><div class="muted">Generated ${formatDateTime(
    new Date().toISOString()
  )}</div></div>
<p class="banner">SIMULATION / DEMO DATA — NOT A MEDICAL DIAGNOSIS</p>
<h2>Patient details</h2><div class="grid">
<div class="kv"><b>Patient</b>Demo Patient ${pt.code} — ${esc(pt.name)}</div><div class="kv"><b>Patient ID</b>${pt.id}</div>
<div class="kv"><b>Age / Gender</b>${pt.age} / ${pt.gender}</div><div class="kv"><b>Doctor</b>${esc(pt.doctor)}</div></div>
<h2>Study details</h2><div class="grid">
<div class="kv"><b>Study ID</b>${pt.study.id}</div><div class="kv"><b>Scan type</b>${pt.study.scanType}</div>
<div class="kv"><b>Study date</b>${formatDate(pt.study.date)}</div><div class="kv"><b>Modality</b>${esc(pt.study.modality)}</div></div>
<h2>Overall Dental Health Index (simulated)</h2><div class="score">${pt.dentalHealthIndex} / 100</div>
<div class="muted">Healthy ${pt.counts.healthy} · Needs attention ${pt.counts.attention} · Priority ${pt.counts.priority} · Not assessed ${pt.counts.unknown}</div>
<h2>Affected teeth & findings</h2>
${findings.length ? `<table><tr><th>Tooth</th><th>Name</th><th>Finding</th><th>Severity</th><th>Health</th><th>Sim. conf.</th><th>Review</th></tr>${rows}</table>` : '<p>No simulated findings.</p>'}
<h2>Possible contributing factors</h2><ul>${causes || '<li>—</li>'}</ul>
<h2>Recommendations</h2><ul>${recs || '<li>Routine care.</li>'}</ul>
<h2>Clinical review</h2><p><b>Reviewer:</b> ${esc(reviewer)}<br/><b>Status:</b> ${allReviewed && findings.length ? 'Simulation / Clinical Review Complete' : 'Simulation / Clinical Review Pending'}</p>
<div class="foot">${esc(DISCLAIMER_TEXT)}</div>
</body></html>`;
}
