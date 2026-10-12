// Example patient names and observations are fictional; no record reference is created.
const cases = {
  'analyze-movement': [
    { patientName: 'Alex Morgan (example)', exerciseName: 'Bodyweight squat', bodyRegion: 'Right knee', movementDescription: 'Five controlled squats to chair height with feet hip width apart.', observedIssues: 'Right knee moves inward on descent; trunk leans left during ascent.', painLevel: '3', rangeOfMotion: 'Knee flexion approximately 0–105 degrees' },
    { patientName: 'Jordan Lee (example)', exerciseName: 'Wall slide', bodyRegion: 'Left shoulder', movementDescription: 'Eight slow wall slides from chest height toward overhead reach.', observedIssues: 'Shoulder hikes above 100 degrees; reduced upward rotation on left.', painLevel: '2', rangeOfMotion: 'Active shoulder flexion approximately 0–125 degrees' },
  ],
  'generate-treatment-plan': [
    { patientName: 'Alex Morgan (example)', age: '34', diagnosis: 'Right ACL reconstruction rehabilitation', severity: 'moderate', surgeryDate: '2026-08-20', medicalHistory: 'No reported complications; clearance and protocol must be confirmed.', goals: 'Return to stairs without pain and progress toward recreational running.', frequency: '2 visits per week plus prescribed home exercises' },
    { patientName: 'Jordan Lee (example)', age: '58', diagnosis: 'Left adhesive capsulitis', severity: 'moderate', surgeryDate: '2026-01-15', medicalHistory: 'Type 2 diabetes reported; no recent surgery. Date is an example historical event only.', goals: 'Reach overhead cabinets and dress comfortably.', frequency: '1 visit per week with daily mobility practice' },
  ],
  'assess-recovery': [
    { patientName: 'Alex Morgan (example)', condition: 'Right ACL reconstruction', weeksSinceOnset: '7', currentPainLevel: '2', initialPainLevel: '7', currentROM: 'Knee flexion 115 degrees; extension 0 degrees', strengthLevel: '3/5', functionalAbilities: 'Walks 20 minutes on level ground; stairs require a handrail.', complianceRate: '85' },
    { patientName: 'Jordan Lee (example)', condition: 'Left adhesive capsulitis', weeksSinceOnset: '16', currentPainLevel: '4', initialPainLevel: '8', currentROM: 'Shoulder flexion 125 degrees, external rotation 35 degrees', strengthLevel: '4/5', functionalAbilities: 'Can dress independently; overhead lifting remains limited.', complianceRate: '70' },
  ],
  'recommend-exercises': [
    { condition: 'Patellofemoral pain during stairs', phase: 'subacute', painLevel: '3', restrictions: 'Avoid movements that increase pain beyond the agreed tolerance; confirm clinician guidance.', equipment: 'Resistance band, step, chair', fitnessLevel: 'moderate', goals: 'Improve stair tolerance and hip control.' },
    { condition: 'Shoulder stiffness after immobilization', phase: 'post-surgical-late', painLevel: '2', restrictions: 'Confirm surgical protocol and range limits before exercise.', equipment: 'Towel, wall, light resistance band', fitnessLevel: 'low', goals: 'Restore comfortable overhead reach.' },
  ],
  'generate-hep': [
    { patientName: 'Alex Morgan (example)', condition: 'Right patellofemoral pain', phase: 'subacute', frequency: '5 days per week', duration: '4 weeks', painLevel: '3', restrictions: 'Keep exercise within clinician-approved pain limits.', goals: 'Climb one flight of stairs comfortably.', homeEquipment: 'Resistance band, stable chair, low step' },
    { patientName: 'Jordan Lee (example)', condition: 'Left shoulder stiffness', phase: 'chronic', frequency: 'Daily mobility; strengthening 3 days per week', duration: '6 weeks', painLevel: '2', restrictions: 'Avoid forceful end-range stretching.', goals: 'Reach a kitchen shelf without compensation.', homeEquipment: 'Towel, wall, light resistance band' },
  ],
  'generate-soap': [
    { patientName: 'Alex Morgan (example)', sessionDate: '2026-10-09', diagnosis: 'Right patellofemoral pain', patientComplaints: 'Reports 3/10 pain descending stairs; walking is comfortable.', vitalSigns: 'Knee flexion 120 degrees; single-leg squat shows medial knee drift.', treatmentPerformed: 'Supervised step-downs, hip abductor strengthening, and movement cueing.', patientResponse: 'Completed exercises without increased pain; improved alignment with cues.', sessionDuration: '45' },
    { patientName: 'Jordan Lee (example)', sessionDate: '2026-10-08', diagnosis: 'Left adhesive capsulitis', patientComplaints: 'Reports morning stiffness and difficulty reaching overhead.', vitalSigns: 'Active flexion 125 degrees; pain 2/10 at rest and 5/10 near end range.', treatmentPerformed: 'Gentle active-assisted mobility and scapular control exercises.', patientResponse: 'Tolerated session; reported easier dressing afterward.', sessionDuration: '40' },
  ],
  'analyze-pain': [
    { patientName: 'Alex Morgan (example)', bodyRegions: 'Right anterior knee', painTypes: 'Aching with occasional sharp discomfort', triggers: 'Descending stairs and prolonged sitting.', painHistory: 'Gradual onset over 6 weeks after increased running volume.', currentMedications: 'No pain medication reported; confirm during assessment.', functionalLimitations: 'Limits stair use and recreational running.' },
    { patientName: 'Jordan Lee (example)', bodyRegions: 'Left shoulder and upper arm', painTypes: 'Deep ache and stiffness', triggers: 'Overhead reach and sleeping on left side.', painHistory: 'Progressive symptoms over 4 months without reported trauma.', currentMedications: 'Over-the-counter analgesic reported; dose and use must be confirmed.', functionalLimitations: 'Difficulty dressing and reaching kitchen shelves.' },
  ],
  'predict-outcomes': [
    { patientName: 'Alex Morgan (example)', condition: 'Right knee rehabilitation', age: '34', measureType: 'LEFS', currentScore: '52', previousScores: '39, 46', weeksInTreatment: '6', complianceRate: '85', comorbidities: 'None reported; verify medical history.' },
    { patientName: 'Jordan Lee (example)', condition: 'Left shoulder stiffness', age: '58', measureType: 'DASH', currentScore: '42', previousScores: '61, 51', weeksInTreatment: '8', complianceRate: '70', comorbidities: 'Type 2 diabetes reported.' },
  ],
};

export function analysisPresets(feature) {
  return (cases[feature.id] || []).map((values, index) => ({
    label: index === 0 ? 'Fill example A' : 'Fill example B',
    values,
  }));
}
