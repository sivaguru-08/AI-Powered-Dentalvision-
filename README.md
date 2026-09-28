# DentalVision 3D — Explainable AI Dental Imaging (Pilot)

> **SIMULATION / DEMO DATA — NOT A MEDICAL DIAGNOSIS.**
> All AI findings, health scores, radiographs and patients in this pilot are simulated and illustrative. Clinical decisions require qualified dental professionals and validated systems.

An interactive mobile prototype (Expo / React Native, TypeScript) that simulates an explainable-AI dental imaging workflow:

**Login → Dashboard → Patient → Mouth overview (FDI arch) → Tooth → 360° 3D inspection → Lesion / Anatomy / Bone layers → Explainable AI → Possible contributing factors → Recommendations (DOs / DON'Ts) → Clinical review → Report**

Runs on **Android & iOS (Expo Go)**, Android tablets and the **web** (desktop browser).

---

## Run it

Requirements: Node 20+ (tested with Node 24), npm. For phones: the **Expo Go** app (SDK 57).

```bash
npm install
npx expo start          # then: press "w" for web, "a" for Android emulator,
                        # or scan the QR code with Expo Go on a phone (same Wi-Fi)
```

Shortcuts: `npm run web`, `npm run android`, `npm run typecheck`, `npm run lint`.

### Demo credentials (simulated auth)

| Role | Email | Password |
|---|---|---|
| Doctor | `doctor@demo.com` | `demo123` |
| Hospital Admin | `admin@demo.com` | `demo123` |
| Nurse | `nurse@demo.com` | `demo123` |

The login screen pre-fills the doctor account; tap a role (or a row in the credentials box) to switch.

---

## 5-minute demo script

1. **Login** as Doctor → **Clinical Dashboard** (stats, Average Dental Health Index ring, recent patients, pending reviews).
2. Open **Patient 001** → profile, overall index, healthy / attention / priority counts.
3. **View Mouth** → tap **tooth 46** on the dental arch → *Lower Right First Molar · 68/100 · Possible Caries*.
4. **INSPECT TOOTH** → drag to rotate 360°, pinch/scroll to zoom, two-finger pan, double-tap to reset, **Auto** rotate.
5. Tap **Lesion** → the camera swings to the distal lesion, heat-mapped with a pulsing marker. Try **Anatomy** (enamel / dentin / pulp), **Bone** (socket cut-away) and **Full**.
6. **Explain AI** → original region vs. attention map, *image region → finding → explanation*, confidence bars, evidence.
7. **Why did it happen?** → possible contributing factors, clearly separated from observed image findings.
8. **Recommendations** → priority, preventive guidance, follow-up, **DOs / DON'Ts**.
9. **Approve Finding** → *Reviewed by Dr. Demo* + timestamp (dashboard pending count updates).
10. **Back to mouth** → select another tooth → repeat. Also try **Scan** (Original / AI Overlay / Findings), **Dental Chart**, **Tooth Health** heatmap and **Report → Export**.

Other roles:
- **Nurse** → *Scan queue* → Patient 006 → **Upload scan** (pick a sample) → **Analyze Scan** → 7-stage simulated AI pipeline → **View Results**.
- **Admin** → hospital overview, weekly scan volume, findings by condition, staff roster, recent scans / records.

### Demo patients

| Patient | Scenario | Affected teeth |
|---|---|---|
| 001 Arjun Mehta | Mostly healthy | 16, 46 (caries) |
| 002 Priya Raman | Caries scenario (CBCT) | 26, 36, 46 |
| 003 Karthik Suresh | Impacted wisdom tooth | 28 |
| 004 Lakshmi Iyer | Bone-loss scenario | 34, 35 |
| 005 Faizal Rahman | Mixed findings | 16 (periapical), 28 (impacted), 36 (caries), 46 (bone) |
| 006 Sneha Kulkarni | New patient — awaiting scan (nurse upload flow) | 24, 37 after analysis |

---

## Architecture

```
UI (src/app routes, src/components)
  ↓
State / controllers (src/state: auth, useRepoQuery hooks)
  ↓
Domain models & rules (src/domain: models, FDI helpers, simulated scoring)
  ↓
DentalRepository interface (src/data/repository.ts)
  ├─ MockRepository  (src/data/mock)  ← active in the pilot
  └─ ApiRepository   (src/data/api)   ← ready for the real backend
```

| Area | Files |
|---|---|
| Routes (Expo Router) | `src/app/` — splash, login, `(app)/(tabs)/*` (Dashboard, Patients, Scans, Reports, Profile), `(app)/patient/[id]/*` (overview, mouth, chart, health, scan, report, `tooth/[tooth]`), `(app)/analyze/[id]` |
| 3D tooth | `src/components/three/geometry.ts` (procedural anatomy: crown cusps/grooves, root trunk, roots, dentin, pulp, alveolar bone, gingiva, lesion vertex colours), `ToothScene.tsx` (layers, lighting, markers, camera), `ToothViewer.tsx` (gestures, controls) |
| Dental visuals | `DentalArch.tsx` (SVG occlusal odontogram), `Radiograph.tsx` (simulated OPG + AI overlays), `XaiView.tsx`, `HealthHeatmap.tsx` |
| Mock data | `src/data/mock/patients.ts` (compact JSON scenarios), `conditions.ts` (causes, XAI evidence, recommendations per condition), `clinic.ts` (users, staff, samples) |
| Theme | `src/theme` — light/dark palettes (follows system, switchable in Profile) |

Domain entities: `Patient`, `Study`, `Tooth`, `Finding`, `HealthScore`, `XAIExplanation`, `Recommendation`, `ClinicalReview` (see `src/domain/models.ts`).

### Plugging in the real AI backend

1. Implement the endpoints and return JSON matching `src/domain/models.ts`:
   `POST /scan`, `POST /analyze`, `GET /patient/{id}`, `GET /study/{id}`, `GET /tooth/{id}`, `GET /recommendations/{finding}`, `POST /clinical-review` (plus `/auth/login`, `/patients`, `/stats`, `/staff`, `/scans/recent`, `/scans/samples` used by dashboards).
2. Start the app with:
   ```bash
   EXPO_PUBLIC_DATA_SOURCE=api EXPO_PUBLIC_API_URL=https://your-backend npx expo start
   ```
   The switch lives in `src/data/index.ts`; no UI changes are required.
3. For real imaging, replace `Radiograph.tsx` with the uploaded image and draw model boxes / masks / heatmaps from the API response; replace the procedural tooth in `geometry.ts` with segmented meshes (e.g. GLB from CBCT segmentation) using the same layer names (crown, roots, dentin, pulp, bone).

---

## Tested

- Web (headless Chrome, phone 430×932, desktop 1280×800, light & dark): full doctor flow, nurse upload → analyze flow, admin dashboard, scan overlays, chart, heatmap, report, invalid-login state — no runtime errors.
- Android 15 emulator (Pixel 7, hardware GPU) via Expo Go: login → dashboard → patient → mouth → tooth 46 → 3D rotate / layers / auto-rotate → XAI → causes → recommendations → DON'Ts → approve → back to mouth → tooth 16.
- `npm run typecheck`, `npm run lint`, `npx expo-doctor` — all clean.

## Known limitations

- Everything clinical is simulated: no real image analysis, DICOM parsing or validated scoring.
- Authentication is simulated (session kept in memory; on web it survives a page refresh via `sessionStorage`).
- Review decisions and uploads live in memory and reset when the app reloads.
- The radiograph is a procedurally drawn illustration, and the 3D teeth are procedural approximations, not patient anatomy.
- PDF export uses `expo-print` (native: generates and shares a PDF; web: opens the print dialog → "Save as PDF").
- In Expo Go the floating developer "gear" button can overlap the top-right header buttons; it does not exist in a production build.

## Assets to replace later

- `assets/images/*` — generated placeholder brand icons (app icon, adaptive icon, splash, favicon).
- Sample scan list in `src/data/mock/clinic.ts` → real uploads.
- Procedural tooth models → real segmented meshes; simulated OPG → real radiographs.
# AI-Powered-Dentalvision-
