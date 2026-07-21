module.exports={
 caseType:'clinician_reviewed_movement_observation',initialState:'consent_pending',
 states:['consent_pending','observation_validated','calibration_review','uncertainty_review','clinician_review','followup_owned','plan_approved','escalated','resolved'],
 createRoles:['physical_therapist','clinical_coordinator'],assessmentRoles:['physical_therapist','movement_reviewer','clinical_safety_reviewer'],auditRoles:['clinical_coordinator','privacy_officer','auditor'],connectorRoles:['integration_operator','clinical_coordinator'],
 evidenceKinds:['consent_receipt','observation_manifest','device_version','calibration_record','missing_data_report','uncertainty_report','contraindication_screen','bias_slice_report','clinician_review','followup_assignment','plan_approval','escalation_receipt','outcome_measure','ehr_write_receipt'],
 requiredSignals:['observationVersion','deviceVersion','calibrationVersion','observedAt','evaluatedAt','staleAfterSeconds','missingDataRate','confidence','calibrationError','contraindicationStatus','consentStatus','biasSliceStatus','policyVersion'],
 professionalBoundary:'Movement analysis is an observation aid only; it does not diagnose, prescribe exercise, change medication, or replace a licensed clinician or emergency evaluation.',
 connectors:[{name:'ehr_fhir',purpose:'consented encounter references and reviewed write receipts'},{name:'wearable_device',purpose:'read-only timestamped observations'},{name:'imaging',purpose:'approved study references only'},{name:'scheduling',purpose:'follow-up ownership receipts'},{name:'clinician_messaging',purpose:'secure acknowledgement receipts'},{name:'payer',purpose:'authorization status only'}],
 transitions:[
  {from:'consent_pending',action:'validate_observation',to:'observation_validated',roles:['movement_reviewer','physical_therapist'],requiresEvidence:true},
  {from:'observation_validated',action:'review_calibration',to:'calibration_review',roles:['movement_reviewer'],requiresEvidence:true},
  {from:'calibration_review',action:'review_uncertainty',to:'uncertainty_review',roles:['clinical_safety_reviewer','physical_therapist'],requiresEvidence:true},
  {from:'uncertainty_review',action:'submit_clinician_review',to:'clinician_review',roles:['physical_therapist'],requiresEvidence:true,dualControl:true},
  {from:'clinician_review',action:'assign_followup',to:'followup_owned',roles:['clinical_coordinator'],requiresEvidence:true,dualControl:true},
  {from:'followup_owned',action:'approve_plan',to:'plan_approved',roles:['physical_therapist'],requiresEvidence:true,dualControl:true},
  {from:'observation_validated',action:'escalate',to:'escalated',roles:['physical_therapist','clinical_safety_reviewer'],requiresEvidence:true},
  {from:'calibration_review',action:'escalate',to:'escalated',roles:['physical_therapist','clinical_safety_reviewer'],requiresEvidence:true},
  {from:'escalated',action:'resolve',to:'resolved',roles:['physical_therapist'],requiresEvidence:true,dualControl:true}
 ],
 acceptedFixture:{observationVersion:'o1',deviceVersion:'d1',calibrationVersion:'c1',observedAt:'2026-07-18T10:00:00Z',evaluatedAt:'2026-07-18T10:01:00Z',staleAfterSeconds:300,missingDataRate:0.01,confidence:0.9,calibrationError:0.04,contraindicationStatus:'clear',consentStatus:'verified',biasSliceStatus:'passed',policyVersion:'p1'},
 readyDisposition:'clinician_review_required',holdDisposition:'manual_clinical_review',decisionField:'clinicalAction',
 assess:x=>{const observed=Date.parse(x.observedAt),evaluated=Date.parse(x.evaluatedAt),staleAfter=Number(x.staleAfterSeconds),missing=Number(x.missingDataRate),confidence=Number(x.confidence),calibration=Number(x.calibrationError);const stale=!Number.isFinite(observed)||!Number.isFinite(evaluated)||!Number.isFinite(staleAfter)||staleAfter<=0||evaluated<observed||(evaluated-observed)/1000>staleAfter;const valid=[missing,confidence,calibration].every(Number.isFinite)&&missing>=0&&missing<=1&&confidence>=0&&confidence<=1&&calibration>=0&&calibration<=1;const ready=!stale&&valid&&missing<=0.05&&calibration<=0.1&&x.contraindicationStatus==='clear'&&x.consentStatus==='verified'&&x.biasSliceStatus==='passed';return{disposition:ready?'clinician_review_required':'manual_clinical_review',clinicalAction:null,stale,metrics:{missingDataRate:valid?missing:null,confidence:valid?confidence:null,calibrationError:valid?calibration:null},versions:{observation:x.observationVersion,device:x.deviceVersion,calibration:x.calibrationVersion}};}
};
