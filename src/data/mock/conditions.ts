import type { ConditionType, EvidenceContext, Recommendation } from '@/domain/models';

/**
 * Simulated knowledge base per condition. In production these texts would come
 * from GET /recommendations/{finding} and the XAI service.
 */
export interface ConditionKnowledge {
  title: string;
  shortTitle: string;
  description: string;
  evidence: string[];
  xaiSummary: string;
  annotation: string;
  possibleCauses: string[];
  evidenceContext: (surface: string) => EvidenceContext;
  recommendations: Recommendation;
}

const COMMON_DONTS = [
  'Do not ignore worsening symptoms',
  'Do not delay professional evaluation',
  'Do not self-prescribe medication',
  'Do not assume the AI output is a confirmed diagnosis',
];

export const CONDITIONS: Record<Exclude<ConditionType, 'healthy'>, ConditionKnowledge> = {
  caries: {
    title: 'Possible Carious Lesion',
    shortTitle: 'Possible Caries',
    description:
      'Localized area of reduced radiographic density on the tooth surface, consistent with a simulated carious lesion pattern.',
    evidence: [
      'Localized abnormal region detected on the crown',
      'Structural pattern change in enamel / dentin density',
      'Suspicious radiolucent appearance near the contact area',
      'Affected surface identified from the lesion position',
      'Pattern associated with the simulated caries condition',
    ],
    xaiSummary:
      'The simulated model focused on a small radiolucent area near the proximal contact. Attention was concentrated on the crown, not the root or bone.',
    annotation: 'Radiolucent region at proximal surface',
    possibleCauses: [
      'Plaque accumulation',
      'Frequent sugar exposure',
      'Inadequate cleaning around posterior teeth',
      'Poor interdental cleaning',
      'Previous restoration / local structural vulnerability',
    ],
    evidenceContext: (surface) => ({
      affectedRegion: `${surface} surface`,
      observedPattern: 'Localized structural abnormality',
      potentialAssociation: 'Plaque retention in difficult-to-clean area',
    }),
    recommendations: {
      priority: 'Dental evaluation recommended.',
      priorityLevel: 'soon',
      preventive: [
        'Maintain regular oral hygiene',
        'Brush twice daily with fluoride toothpaste',
        'Clean between teeth daily',
        'Reduce frequent sugary snacks and drinks',
        "Follow the dentist's advice",
      ],
      followUp: 'Schedule a professional dental assessment to confirm or rule out the finding.',
      dos: [
        'Maintain regular oral hygiene',
        'Clean between teeth',
        "Follow the dentist's treatment plan",
        'Attend recommended follow-up',
        'Monitor changes in pain, swelling or sensitivity',
      ],
      donts: COMMON_DONTS,
    },
  },
  periapical: {
    title: 'Periapical Abnormality',
    shortTitle: 'Periapical Change',
    description:
      'Simulated area of altered density around the root apex. Periapical changes can have several explanations and require clinical correlation.',
    evidence: [
      'Localized region of altered density at the root apex',
      'Apparent widening of the periapical space',
      'Loss of continuity in the lamina dura outline',
      'Region located at the periapical area of the root',
      'Pattern associated with the simulated periapical condition',
    ],
    xaiSummary:
      'The simulated model attended mainly to the bone surrounding the root tip, where the density pattern differs from neighbouring teeth.',
    annotation: 'Altered density around root apex',
    possibleCauses: [
      'Deep untreated decay reaching the pulp',
      'Previous trauma to the tooth',
      'Leakage around an existing restoration',
      'Cracked tooth allowing bacterial entry',
      'Previously treated root canal with persistent change',
    ],
    evidenceContext: () => ({
      affectedRegion: 'Periapical region (root apex)',
      observedPattern: 'Localized altered density around the apex',
      potentialAssociation: 'Possible pulpal involvement — requires clinical tests',
    }),
    recommendations: {
      priority: 'Prompt dental evaluation recommended.',
      priorityLevel: 'urgent',
      preventive: [
        'Maintain regular oral hygiene',
        'Avoid chewing hard foods on the affected side',
        'Keep a note of pain, swelling or tenderness',
        "Follow the dentist's advice",
      ],
      followUp:
        'Clinical examination with vitality testing and a periapical radiograph is typically required to interpret this finding.',
      dos: [
        'Book a dental evaluation soon',
        'Report swelling, fever or spreading pain promptly',
        "Follow the dentist's treatment plan",
        'Attend recommended follow-up imaging',
        'Monitor changes in pain, swelling or sensitivity',
      ],
      donts: COMMON_DONTS,
    },
  },
  impacted: {
    title: 'Impacted Tooth',
    shortTitle: 'Impacted',
    description:
      'Simulated finding of a tooth that has not fully erupted and appears angled against the adjacent tooth.',
    evidence: [
      'Tooth crown positioned below the occlusal plane',
      'Angulation relative to the adjacent tooth axis',
      'Crown in close proximity to the neighbouring root',
      'Surrounding bone covering part of the crown',
      'Pattern associated with the simulated impaction condition',
    ],
    xaiSummary:
      'The simulated model attended to the crown position and its contact with the adjacent second molar, as well as the covering bone.',
    annotation: 'Crown angled against adjacent tooth',
    possibleCauses: [
      'Insufficient space in the dental arch',
      'Late developmental timing of third molars',
      'Abnormal eruption path / angulation',
      'Dense overlying bone or soft tissue',
      'Hereditary jaw size and tooth size factors',
    ],
    evidenceContext: () => ({
      affectedRegion: 'Crown & surrounding bone',
      observedPattern: 'Tooth angulated and below the occlusal plane',
      potentialAssociation: 'Limited arch space for eruption',
    }),
    recommendations: {
      priority: 'Surgical / orthodontic consultation may be considered.',
      priorityLevel: 'soon',
      preventive: [
        'Keep the area clean — use a small-headed brush',
        'Rinse after meals to reduce food trapping',
        'Watch for gum swelling behind the last tooth',
        "Follow the dentist's advice",
      ],
      followUp:
        'An oral surgeon or dentist can assess whether monitoring or intervention is appropriate. Additional 3D imaging (CBCT) may be requested.',
      dos: [
        'Keep the back of the mouth clean',
        'Attend the recommended consultation',
        "Follow the dentist's treatment plan",
        'Report pain, swelling or difficulty opening the mouth',
        'Monitor changes in pain, swelling or sensitivity',
      ],
      donts: COMMON_DONTS,
    },
  },
  boneLoss: {
    title: 'Bone-Loss Concern',
    shortTitle: 'Bone Loss',
    description:
      'Simulated reduction of the alveolar bone level around the root compared with the expected crest height.',
    evidence: [
      'Alveolar crest positioned below the expected level',
      'Horizontal / angular bone contour change',
      'Increased exposed root length on the radiograph',
      'Region located along the interdental septum',
      'Pattern associated with the simulated bone-loss condition',
    ],
    xaiSummary:
      'The simulated model focused on the interdental bone crest and the distance between the crown margin and the bone level.',
    annotation: 'Reduced alveolar crest height',
    possibleCauses: [
      'Long-standing gum inflammation (periodontal disease)',
      'Plaque and calculus build-up below the gumline',
      'Smoking or tobacco use',
      'Systemic factors such as uncontrolled diabetes',
      'Excessive biting forces / grinding',
    ],
    evidenceContext: () => ({
      affectedRegion: 'Alveolar crest around the root',
      observedPattern: 'Reduced bone support compared with neighbours',
      potentialAssociation: 'Periodontal inflammation — requires periodontal charting',
    }),
    recommendations: {
      priority: 'Periodontal evaluation recommended.',
      priorityLevel: 'soon',
      preventive: [
        'Brush twice daily along the gumline',
        'Clean between teeth with interdental brushes',
        'Attend professional cleaning',
        'Avoid tobacco products',
        "Follow the dentist's advice",
      ],
      followUp:
        'Periodontal charting (probing depths) and clinical assessment are needed to interpret the radiographic bone level.',
      dos: [
        'Maintain meticulous gumline cleaning',
        'Use interdental brushes or floss daily',
        "Follow the dentist's treatment plan",
        'Attend periodontal maintenance visits',
        'Monitor bleeding gums, mobility or sensitivity',
      ],
      donts: COMMON_DONTS,
    },
  },
};

export const HEALTHY_RECOMMENDATION: Recommendation = {
  priority: 'Routine care — no simulated findings on this tooth.',
  priorityLevel: 'routine',
  preventive: [
    'Maintain regular oral hygiene',
    'Brush twice daily with fluoride toothpaste',
    'Clean between teeth daily',
    'Attend routine dental check-ups',
  ],
  followUp: 'Continue routine recall as advised by your dentist.',
  dos: [
    'Maintain regular oral hygiene',
    'Clean between teeth',
    'Attend routine check-ups',
    'Monitor changes in pain, swelling or sensitivity',
  ],
  donts: [
    'Do not ignore new symptoms',
    'Do not self-prescribe medication',
    'Do not assume the AI output is a confirmed diagnosis',
  ],
};

export const CONDITION_LABELS: Record<ConditionType, string> = {
  healthy: 'Healthy',
  caries: 'Possible Caries',
  periapical: 'Periapical Abnormality',
  impacted: 'Impacted Tooth',
  boneLoss: 'Bone-Loss Concern',
};
