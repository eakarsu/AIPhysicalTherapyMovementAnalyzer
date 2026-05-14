# Audit Note — AIPhysicalTherapyMovementAnalyzer

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #23.

## Original Recommendations

### Gaps — AI Counterparts
- `/appointment-optimize` — predict no-shows, suggest overbooking
- `/patient-dropout-predict` — flag at-risk patients
- `/exercise-difficulty-adapt` — auto-difficulty based on performance

### Gaps — Non-AI Features
- EHR integration (referrals)
- Wearable accelerometer data
- Telehealth with real-time movement feedback
- Insurance billing automation
- Fitness/activity tracker integration

### Custom Feature Suggestions
1. Agentic HEP execution with video AI
2. Movement quality scoring (computer vision)
3. Telehealth live feedback
4. Outcome prediction + intervention
5. Pain science education videos

## Implemented (Mechanical)
- `POST /api/ai/appointment-optimize` — added in `backend/routes/ai.js`. Pulls upcoming appointments + 180-day status history, returns no-show risk, overbooking suggestions, scheduling gaps, outreach actions. Persists via `persistAIResult`.
- `POST /api/ai/patient-dropout-predict` — added in `backend/routes/ai.js`. Pulls patient roster (visits, no-show count, compliance), returns at-risk list with engagement recommendations. Persists via `persistAIResult`.

Both follow existing `callOpenRouter`/`extractJSON`/`persistAIResult` pattern.

## Backlog (deferred)

### NEEDS-CREDS / NEW-DEPS
- EHR/EMR integration (HL7/FHIR)
- Wearable integration (Apple Health, Fitbit, Whistle)
- Insurance billing claims (claims clearinghouse credentials)

### NEEDS-PRODUCT-DECISION
- `/exercise-difficulty-adapt` — depends on whether patient performance metrics are captured at exercise level (need schema decision).
- Telehealth video infra
- Pain science education content library

### TOO-RISKY
- Agentic HEP video pipeline (real-time CV)
- Live telehealth feedback (latency-sensitive ML)
- Outcome-driven plan auto-modification (clinical liability).

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- `frontend/src/pages/AppointmentOptimize.jsx` posts to `/ai/appointment-optimize`.
- `frontend/src/pages/PatientDropoutPredict.jsx` posts to `/ai/patient-dropout-predict`.
- Both routes registered in `frontend/src/App.jsx` (lines 70-71); JWT handled via `frontend/src/api.js`.
- All other AI endpoints already have corresponding pages (AIAnalysis, AIHistory, ROMCalculator, ExercisePrescription, OutcomeScoreCalculator, etc.).
- No FE files modified.

## Apply pass 4 (mechanical backlog)

- **Action:** SKIPPED — backlog entries are all NEEDS-CREDS/NEW-DEPS (EHR/EMR HL7-FHIR, wearable APIs, claims clearinghouse), NEEDS-PRODUCT-DECISION (`/exercise-difficulty-adapt` needs schema decision, telehealth infra, content library), or TOO-RISKY (real-time CV, live telehealth feedback, clinical liability). No mechanical-only item remains.
