const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS waitlist CASCADE;
      DROP TABLE IF EXISTS outcome_measures CASCADE;
      DROP TABLE IF EXISTS pain_assessments CASCADE;
      DROP TABLE IF EXISTS exercise_videos CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS billing CASCADE;
      DROP TABLE IF EXISTS therapists CASCADE;
      DROP TABLE IF EXISTS treatment_notes CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS home_exercise_programs CASCADE;
      DROP TABLE IF EXISTS recovery_progress CASCADE;
      DROP TABLE IF EXISTS movement_assessments CASCADE;
      DROP TABLE IF EXISTS treatment_plans CASCADE;
      DROP TABLE IF EXISTS exercises CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('Creating tables...');

    // Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'therapist',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Patients table
    await client.query(`
      CREATE TABLE patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        date_of_birth DATE,
        condition VARCHAR(255),
        injury_type VARCHAR(255),
        insurance VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Exercises table
    await client.query(`
      CREATE TABLE exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        body_region VARCHAR(100),
        difficulty_level VARCHAR(50),
        equipment_needed VARCHAR(255),
        repetitions INTEGER,
        sets INTEGER,
        duration_seconds INTEGER,
        video_url VARCHAR(500),
        instructions TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Treatment plans table
    await client.query(`
      CREATE TABLE treatment_plans (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        therapist_name VARCHAR(255),
        diagnosis TEXT,
        goals TEXT,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        frequency VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Movement assessments table
    await client.query(`
      CREATE TABLE movement_assessments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
        assessment_date TIMESTAMP DEFAULT NOW(),
        form_score INTEGER CHECK (form_score >= 0 AND form_score <= 100),
        ai_feedback TEXT,
        joint_angles JSONB,
        movement_quality VARCHAR(50),
        recommendations TEXT,
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Recovery progress table
    await client.query(`
      CREATE TABLE recovery_progress (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        assessment_date TIMESTAMP DEFAULT NOW(),
        pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10),
        mobility_score INTEGER CHECK (mobility_score >= 0 AND mobility_score <= 100),
        strength_score INTEGER CHECK (strength_score >= 0 AND strength_score <= 100),
        overall_progress VARCHAR(255),
        notes TEXT,
        milestones TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Home exercise programs table
    await client.query(`
      CREATE TABLE home_exercise_programs (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        program_name VARCHAR(255),
        exercises JSONB,
        compliance_rate NUMERIC(5,2),
        start_date DATE,
        end_date DATE,
        frequency VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        ai_recommendations TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Appointments table
    await client.query(`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        therapist_name VARCHAR(255),
        appointment_date TIMESTAMP,
        duration_minutes INTEGER,
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Treatment notes table
    await client.query(`
      CREATE TABLE treatment_notes (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        therapist_name VARCHAR(255),
        note_date TIMESTAMP DEFAULT NOW(),
        subjective TEXT,
        objective TEXT,
        assessment TEXT,
        plan TEXT,
        treatment_provided TEXT,
        patient_response TEXT,
        next_visit_goals TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Waitlist table
    await client.query(`
      CREATE TABLE waitlist (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        preferred_therapist VARCHAR(255),
        preferred_time VARCHAR(100),
        reason VARCHAR(500),
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(50) DEFAULT 'waiting',
        notes TEXT,
        requested_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created. Seeding data...');

    // Seed users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Admin User', 'admin@ptclinic.com', $1, 'admin'),
      ('Dr. Sarah Mitchell', 'sarah.mitchell@ptclinic.com', $1, 'therapist'),
      ('Dr. James Rodriguez', 'james.rodriguez@ptclinic.com', $1, 'therapist'),
      ('Dr. Emily Chen', 'emily.chen@ptclinic.com', $1, 'therapist')
    `, [passwordHash]);
    console.log('Users seeded.');

    // Seed patients (16)
    await client.query(`
      INSERT INTO patients (name, email, phone, date_of_birth, condition, injury_type, insurance, status) VALUES
      ('Michael Thompson', 'michael.t@email.com', '555-0101', '1985-03-15', 'ACL Reconstruction Recovery', 'ACL Tear', 'Blue Cross Blue Shield', 'active'),
      ('Jennifer Garcia', 'jen.garcia@email.com', '555-0102', '1990-07-22', 'Rotator Cuff Repair', 'Rotator Cuff Tear', 'Aetna', 'active'),
      ('Robert Williams', 'rob.williams@email.com', '555-0103', '1978-11-08', 'Lumbar Disc Herniation', 'L4-L5 Disc Herniation', 'UnitedHealthcare', 'active'),
      ('Maria Santos', 'maria.santos@email.com', '555-0104', '1995-01-30', 'Ankle Sprain Grade II', 'Lateral Ankle Sprain', 'Cigna', 'active'),
      ('David Kim', 'david.kim@email.com', '555-0105', '1982-09-14', 'Total Knee Replacement', 'Osteoarthritis Right Knee', 'Medicare', 'active'),
      ('Sarah Johnson', 'sarah.j@email.com', '555-0106', '1988-05-03', 'Tennis Elbow', 'Lateral Epicondylitis', 'Humana', 'active'),
      ('James Wilson', 'james.w@email.com', '555-0107', '1972-12-20', 'Frozen Shoulder', 'Adhesive Capsulitis Left Shoulder', 'Kaiser Permanente', 'active'),
      ('Lisa Anderson', 'lisa.a@email.com', '555-0108', '1993-08-11', 'Patellofemoral Syndrome', 'Anterior Knee Pain', 'Anthem', 'active'),
      ('Carlos Rivera', 'carlos.r@email.com', '555-0109', '1980-04-27', 'Cervical Radiculopathy', 'C5-C6 Nerve Root Compression', 'Tricare', 'on-hold'),
      ('Amanda Foster', 'amanda.f@email.com', '555-0110', '1997-02-16', 'Plantar Fasciitis', 'Plantar Fascia Inflammation', 'Blue Cross Blue Shield', 'active'),
      ('Thomas Brown', 'thomas.b@email.com', '555-0111', '1965-10-05', 'Total Hip Replacement', 'Osteoarthritis Left Hip', 'Medicare', 'active'),
      ('Rachel Lee', 'rachel.l@email.com', '555-0112', '1991-06-18', 'IT Band Syndrome', 'Iliotibial Band Friction Syndrome', 'Aetna', 'discharged'),
      ('William Davis', 'william.d@email.com', '555-0113', '1975-01-09', 'Carpal Tunnel Syndrome', 'Median Nerve Compression', 'UnitedHealthcare', 'active'),
      ('Emily Martinez', 'emily.m@email.com', '555-0114', '1986-11-25', 'Sciatica', 'Piriformis Syndrome', 'Cigna', 'active'),
      ('Daniel Clark', 'daniel.c@email.com', '555-0115', '1999-07-07', 'Meniscus Tear', 'Medial Meniscus Tear Right Knee', 'Anthem', 'active'),
      ('Jessica Turner', 'jessica.t@email.com', '555-0116', '1983-03-30', 'Post-Stroke Rehabilitation', 'Ischemic Stroke Left Hemisphere', 'Medicare', 'active')
    `);
    console.log('Patients seeded.');

    // Seed exercises (18)
    await client.query(`
      INSERT INTO exercises (name, description, body_region, difficulty_level, equipment_needed, repetitions, sets, duration_seconds, video_url, instructions, category) VALUES
      ('Straight Leg Raise', 'Strengthen quadriceps while protecting the knee joint. Lie supine with one leg bent and the other straight. Lift the straight leg to 45 degrees.', 'Lower Extremity', 'beginner', 'None', 15, 3, 0, 'https://videos.ptclinic.com/slr', 'Lie on back. Bend one knee with foot flat on floor. Keep other leg straight. Tighten quad and lift straight leg to height of bent knee. Hold 3 seconds. Lower slowly.', 'strength'),
      ('Clamshells', 'Strengthen hip external rotators and gluteus medius. Side-lying with knees bent, open top knee like a clamshell.', 'Hip', 'beginner', 'Resistance Band (optional)', 20, 3, 0, 'https://videos.ptclinic.com/clamshells', 'Lie on side with hips and knees bent to 45 degrees. Keep feet together. Raise top knee as high as possible without moving pelvis. Hold 2 seconds. Return slowly.', 'strength'),
      ('Pendulum Exercises', 'Gentle shoulder mobilization using gravity. Lean forward and let arm hang, creating small circles.', 'Shoulder', 'beginner', 'None', 20, 2, 60, 'https://videos.ptclinic.com/pendulum', 'Lean forward supporting yourself with uninvolved arm on a table. Let affected arm hang freely. Make small circles clockwise then counterclockwise. Keep arm relaxed.', 'flexibility'),
      ('Wall Slides', 'Improve shoulder flexion range of motion by sliding arms up a wall. Promotes scapular control.', 'Shoulder', 'intermediate', 'Wall', 12, 3, 0, 'https://videos.ptclinic.com/wall-slides', 'Stand with back against wall. Place forearms against wall at shoulder height. Slowly slide arms up the wall as far as comfortable. Hold 5 seconds at top. Return slowly.', 'flexibility'),
      ('Bird Dog', 'Core stabilization exercise. On hands and knees, extend opposite arm and leg while maintaining neutral spine.', 'Core/Spine', 'intermediate', 'Exercise Mat', 10, 3, 0, 'https://videos.ptclinic.com/bird-dog', 'Start on hands and knees. Tighten abdominals. Extend right arm forward and left leg backward simultaneously. Hold 5 seconds. Return to start. Alternate sides.', 'strength'),
      ('Single Leg Balance', 'Proprioception and balance training. Stand on one leg maintaining stability.', 'Lower Extremity', 'beginner', 'None', 5, 3, 30, 'https://videos.ptclinic.com/single-leg-balance', 'Stand near a wall for safety. Lift one foot off the ground. Maintain balance for 30 seconds. Keep hips level. Progress by closing eyes or standing on foam pad.', 'balance'),
      ('Heel Slides', 'Improve knee flexion range of motion post-surgery. Slide heel toward buttock while lying supine.', 'Knee', 'beginner', 'None', 15, 3, 0, 'https://videos.ptclinic.com/heel-slides', 'Lie on back with legs straight. Slowly slide heel toward buttock, bending knee. Use a towel under foot if needed for sliding. Hold at end range 3 seconds. Return slowly.', 'flexibility'),
      ('Prone Press-Up', 'McKenzie extension exercise for lumbar disc pathology. Lie prone and press upper body up with arms.', 'Lumbar Spine', 'beginner', 'Exercise Mat', 10, 3, 0, 'https://videos.ptclinic.com/prone-press-up', 'Lie face down with hands by shoulders. Press upper body up keeping hips on the mat. Straighten arms as far as comfortable. Hold 5 seconds. Lower slowly. Keep gluteals relaxed.', 'flexibility'),
      ('Standing Calf Raises', 'Strengthen gastrocnemius and soleus muscles. Stand on edge of step and raise up on toes.', 'Ankle/Foot', 'intermediate', 'Step or Platform', 15, 3, 0, 'https://videos.ptclinic.com/calf-raises', 'Stand on edge of step with heels hanging off. Rise up on toes as high as possible. Hold 2 seconds at top. Lower heels below step level slowly. Hold handrail for balance.', 'strength'),
      ('Chin Tucks', 'Strengthen deep cervical flexors and improve cervical posture. Retract chin without flexing neck.', 'Cervical Spine', 'beginner', 'None', 15, 3, 0, 'https://videos.ptclinic.com/chin-tucks', 'Sit or stand with good posture. Draw chin straight back creating a double chin. Hold 5 seconds. Release. Do not look down. Imagine a string pulling the back of your head up.', 'strength'),
      ('Towel Curls', 'Strengthen intrinsic foot muscles for plantar fasciitis. Scrunch a towel with toes.', 'Foot', 'beginner', 'Towel', 20, 3, 0, 'https://videos.ptclinic.com/towel-curls', 'Sit in chair with feet flat on floor. Place a towel under feet. Use toes to scrunch towel toward you. Spread toes and repeat. Complete full towel length.', 'strength'),
      ('Lateral Band Walks', 'Strengthen hip abductors and external rotators. Walk sideways with resistance band around ankles.', 'Hip', 'intermediate', 'Resistance Band', 15, 3, 0, 'https://videos.ptclinic.com/lateral-band-walks', 'Place resistance band around ankles. Assume quarter-squat position. Step sideways maintaining tension on band. Keep toes pointed forward. Take 15 steps each direction.', 'strength'),
      ('Seated Row with Band', 'Strengthen rhomboids and middle trapezius for improved posture. Pull resistance band toward chest.', 'Upper Back', 'intermediate', 'Resistance Band', 12, 3, 0, 'https://videos.ptclinic.com/seated-row', 'Sit on floor with legs extended. Wrap band around feet. Pull band toward lower chest squeezing shoulder blades together. Hold 3 seconds. Return slowly.', 'strength'),
      ('Hamstring Stretch', 'Improve hamstring flexibility. Lie supine and raise straight leg, pulling gently with strap or towel.', 'Lower Extremity', 'beginner', 'Strap or Towel', 5, 3, 30, 'https://videos.ptclinic.com/hamstring-stretch', 'Lie on back. Loop strap around one foot. Raise leg keeping knee straight until stretch felt in back of thigh. Hold 30 seconds. Keep opposite leg flat on floor. Breathe normally.', 'flexibility'),
      ('BOSU Ball Squats', 'Advanced balance and strengthening exercise. Perform squats while standing on BOSU ball.', 'Lower Extremity', 'advanced', 'BOSU Ball', 12, 3, 0, 'https://videos.ptclinic.com/bosu-squats', 'Stand on BOSU ball dome side up. Find balance. Slowly squat to 60 degrees knee flexion. Keep weight centered over feet. Rise back up. Use wall nearby for safety.', 'balance'),
      ('Wrist Flexor Stretch', 'Stretch wrist flexors for carpal tunnel syndrome. Extend arm with palm up and gently pull fingers back.', 'Wrist/Hand', 'beginner', 'None', 5, 3, 30, 'https://videos.ptclinic.com/wrist-stretch', 'Extend affected arm in front with palm facing up. Use other hand to gently pull fingers toward floor. Hold 30 seconds. Should feel stretch along inner forearm. Do not bounce.', 'flexibility'),
      ('Dead Bug', 'Advanced core stabilization. Lie supine with arms and legs raised. Lower opposite arm and leg while maintaining core stability.', 'Core', 'intermediate', 'Exercise Mat', 10, 3, 0, 'https://videos.ptclinic.com/dead-bug', 'Lie on back with arms pointing to ceiling and knees bent 90 degrees. Brace core. Slowly lower right arm overhead and left leg to floor. Return to start. Alternate sides. Keep low back pressed to floor.', 'strength'),
      ('Stationary Bike', 'Low-impact cardiovascular conditioning. Maintain moderate intensity on stationary bicycle.', 'Cardiovascular', 'beginner', 'Stationary Bike', 0, 1, 900, 'https://videos.ptclinic.com/stationary-bike', 'Adjust seat height so knee is slightly bent at bottom of pedal stroke. Start at low resistance. Maintain RPE of 3-4 out of 10. Pedal smoothly for 15 minutes. Progress duration and resistance as tolerated.', 'cardio')
    `);
    console.log('Exercises seeded.');

    // Seed treatment plans (16)
    await client.query(`
      INSERT INTO treatment_plans (patient_id, therapist_name, diagnosis, goals, start_date, end_date, status, frequency, notes) VALUES
      (1, 'Dr. Sarah Mitchell', 'Post-operative ACL reconstruction, left knee', 'Restore full ROM, achieve quadriceps strength 90% of uninvolved, return to sport by 9 months', '2025-12-01', '2026-06-01', 'active', '3x per week', 'Patient is a recreational soccer player. Graft type: patellar tendon autograft. Surgery date 11/15/2025.'),
      (2, 'Dr. James Rodriguez', 'Right rotator cuff repair - supraspinatus', 'Restore pain-free overhead ROM, return to functional activities, strengthen rotator cuff to 4+/5', '2025-11-15', '2026-04-15', 'active', '2x per week', 'Arthroscopic repair with suture anchors. Immobilizer x 6 weeks post-op. Passive ROM initiated.'),
      (3, 'Dr. Emily Chen', 'L4-L5 disc herniation with left-sided radiculopathy', 'Reduce pain to 2/10 or less, restore lumbar ROM, improve core stability, return to work', '2026-01-10', '2026-04-10', 'active', '2x per week', 'Conservative management. Patient is a warehouse worker. Modified duty. MRI confirmed posterolateral herniation.'),
      (4, 'Dr. Sarah Mitchell', 'Grade II lateral ankle sprain, right', 'Restore full ankle ROM, proprioception training, return to running', '2026-02-01', '2026-04-01', 'active', '2x per week', 'Injury occurred during trail running. ATFL and CFL involved. Initial RICE protocol completed.'),
      (5, 'Dr. James Rodriguez', 'Status post total knee arthroplasty, right', 'Achieve 0-120 degrees ROM, independent ambulation without assistive device, stair negotiation', '2025-10-20', '2026-02-20', 'active', '3x per week', 'Cemented TKA. Approach: medial parapatellar. Patient motivated and compliant.'),
      (6, 'Dr. Emily Chen', 'Lateral epicondylitis, right elbow', 'Pain-free grip, return to daily activities, eccentric strengthening program', '2026-01-15', '2026-03-15', 'active', '2x per week', 'Chronic condition > 6 months. Previous cortisone injection with temporary relief. Occupation: software developer.'),
      (7, 'Dr. Sarah Mitchell', 'Adhesive capsulitis, left shoulder, stage 2 (frozen)', 'Restore passive and active ROM in all planes, reduce pain, improve function', '2025-09-01', '2026-03-01', 'active', '2x per week', 'Onset insidious. Associated with type 2 diabetes. Currently in frozen stage. Very limited ER and flexion.'),
      (8, 'Dr. James Rodriguez', 'Patellofemoral pain syndrome, bilateral', 'Reduce anterior knee pain, improve VMO activation, correct movement patterns', '2026-01-05', '2026-04-05', 'active', '2x per week', 'Runner, 25 miles per week. Pain worse with stairs and prolonged sitting. No structural damage on imaging.'),
      (9, 'Dr. Emily Chen', 'C5-C6 cervical radiculopathy, right side', 'Reduce radicular symptoms, restore cervical ROM, improve posture, return to desk work', '2025-12-15', '2026-03-15', 'paused', '2x per week', 'Patient on hold due to insurance authorization delay. MRI shows foraminal stenosis. Positive Spurling test on right.'),
      (10, 'Dr. Sarah Mitchell', 'Chronic plantar fasciitis, bilateral', 'Reduce morning pain to 1/10, improve ankle dorsiflexion to 15 degrees, return to walking program', '2026-02-10', '2026-05-10', 'active', '2x per week', 'Duration > 1 year. Custom orthotics ordered. Night splint prescribed. BMI 28.'),
      (11, 'Dr. James Rodriguez', 'Status post left total hip arthroplasty - posterior approach', 'Independent ambulation, hip precaution compliance, strength restoration, return to golf', '2025-11-01', '2026-03-01', 'active', '3x per week', 'Posterior approach hip precautions: no flexion > 90, no adduction past midline, no IR. Using front-wheeled walker.'),
      (12, 'Dr. Emily Chen', 'Iliotibial band syndrome, left knee', 'Pain-free running, hip strengthening, flexibility improvement', '2025-10-01', '2025-12-15', 'completed', '2x per week', 'Marathon runner. Completed gradual return-to-run program. Discharged at full activity level.'),
      (13, 'Dr. Sarah Mitchell', 'Bilateral carpal tunnel syndrome', 'Reduce paresthesias, improve grip strength, ergonomic modifications, avoid surgery', '2026-01-20', '2026-04-20', 'active', '2x per week', 'EMG/NCS confirms moderate CTS bilaterally. Night splints issued. Ergonomic workstation assessment completed.'),
      (14, 'Dr. James Rodriguez', 'Piriformis syndrome with sciatic nerve irritation, right', 'Reduce sciatic symptoms, piriformis lengthening, core stabilization, return to gym', '2026-02-05', '2026-05-05', 'active', '2x per week', 'Positive FAIR test. Negative lumbar MRI. Symptoms reproduced with prolonged sitting and hip IR.'),
      (15, 'Dr. Emily Chen', 'Medial meniscus tear, right knee - post arthroscopic partial meniscectomy', 'Restore full ROM, quadriceps strengthening, return to basketball', '2026-02-15', '2026-05-15', 'active', '2x per week', 'Arthroscopic partial meniscectomy 2/10/2026. Weight bearing as tolerated. College basketball player.'),
      (16, 'Dr. Sarah Mitchell', 'Left hemiparesis secondary to ischemic stroke', 'Improve left UE and LE function, gait training, ADL independence, balance improvement', '2025-11-20', '2026-05-20', 'active', '5x per week', 'Stroke onset 11/10/2025. MCA territory. Brunnstrom stage 3 UE, stage 4 LE. Motivated with family support.')
    `);
    console.log('Treatment plans seeded.');

    // Seed movement assessments (16)
    await client.query(`
      INSERT INTO movement_assessments (patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url) VALUES
      (1, 1, '2026-02-15 10:00:00', 78, 'Good quadriceps activation during straight leg raise. Slight hip flexor dominance noted. Maintain neutral pelvis throughout the movement. The lifting arc is consistent but could benefit from a slower eccentric phase.', '{"hip_flexion": 42, "knee_extension": 0, "pelvis_tilt": 5}', 'good', 'Focus on tightening quadriceps before lifting. Add 2-second hold at top. Ensure pelvis remains neutral.', 'https://videos.ptclinic.com/assessments/1001'),
      (2, 3, '2026-02-14 11:30:00', 65, 'Pendulum circles are slightly too large and too fast. Patient is using active shoulder muscles rather than letting gravity do the work. Some guarding noted. Circle diameter should be reduced to 6-8 inches.', '{"shoulder_flexion": 30, "shoulder_abduction": 25, "trunk_lean": 40}', 'fair', 'Relax shoulder completely. Let gravity create the motion. Reduce circle size. Lean forward more to increase pendulum effect.', 'https://videos.ptclinic.com/assessments/1002'),
      (3, 8, '2026-02-16 09:00:00', 82, 'Excellent prone press-up form. Good end-range extension achieved. Hips maintaining contact with mat. Breathing pattern is appropriate. Slight asymmetry noted with more pressure on right arm.', '{"lumbar_extension": 35, "hip_extension": 0, "elbow_extension": 170}', 'good', 'Equalize pressure through both arms. Hold end range for 5 seconds. Perform every 2 hours throughout the day.', 'https://videos.ptclinic.com/assessments/1003'),
      (4, 6, '2026-02-17 14:00:00', 55, 'Balance on right leg is significantly impaired. Ankle strategy is weak - patient relying on hip strategy for corrections. Excessive lateral trunk sway. Weight shifting to lateral border of foot.', '{"ankle_inversion": 12, "hip_abduction": 8, "trunk_lateral_flex": 7}', 'fair', 'Start with supported single leg balance near wall. Progress to eyes open unsupported. Add ankle alphabet exercises for proprioception.', 'https://videos.ptclinic.com/assessments/1004'),
      (5, 7, '2026-02-13 10:30:00', 72, 'Heel slides showing improved ROM compared to last session. Achieving 95 degrees knee flexion. Slight compensatory hip hiking noted at end range. Good control during return phase.', '{"knee_flexion": 95, "hip_flexion": 15, "ankle_dorsiflexion": 10}', 'good', 'Continue progressing ROM goal to 120 degrees. Use towel assist at end range for overpressure. Ice after exercise.', 'https://videos.ptclinic.com/assessments/1005'),
      (6, 16, '2026-02-18 13:00:00', 88, 'Wrist flexor stretch is well-performed. Good sustained hold at 30 seconds. Elbow fully extended. Stretch applied to correct muscle group. No compensatory shoulder elevation.', '{"wrist_extension": 55, "elbow_extension": 180, "finger_extension": 40}', 'excellent', 'Maintain current technique. Can add gentle overpressure with opposite hand. Perform 5 times daily.', 'https://videos.ptclinic.com/assessments/1006'),
      (7, 4, '2026-02-12 11:00:00', 45, 'Wall slides limited by significant capsular restriction. Only achieving 110 degrees of elevation. Scapular winging noted. Compensatory trunk extension at end range. Upper trapezius overactivity.', '{"shoulder_flexion": 110, "scapular_upward_rotation": 30, "trunk_extension": 10}', 'poor', 'Continue gentle PROM. Add scapular stabilization exercises. Avoid forcing through pain. Manual therapy to address capsular restrictions.', 'https://videos.ptclinic.com/assessments/1007'),
      (8, 2, '2026-02-19 15:30:00', 74, 'Clamshell exercise shows improved gluteus medius activation. Pelvis is mostly stable. Slight anterior pelvic tilt noted. Good range of hip external rotation. Speed is appropriate.', '{"hip_external_rotation": 38, "hip_flexion": 45, "pelvis_rotation": 5}', 'good', 'Add resistance band for progression. Ensure pelvis does not roll backward. Increase to 25 reps per set.', 'https://videos.ptclinic.com/assessments/1008'),
      (1, 5, '2026-02-20 10:00:00', 70, 'Bird dog shows adequate core activation. Some lumbar extension noted when extending leg. Arm reach is good. Difficulty maintaining balance during transition. Hold time inconsistent.', '{"lumbar_lordosis": 20, "hip_extension": 15, "shoulder_flexion": 170}', 'good', 'Focus on bracing core before movement. Add 5-second hold at extended position. Place dowel on back to monitor spine position.', 'https://videos.ptclinic.com/assessments/1009'),
      (10, 11, '2026-02-14 16:00:00', 80, 'Good towel curl technique. Toes are gripping effectively. Both feet showing equal participation. Arch is lifting appropriately during exercise. Maintaining seated posture well.', '{"toe_flexion": 35, "arch_height": 12, "ankle_position": 0}', 'good', 'Progress to marble pickups. Add short foot exercise. Perform barefoot activities on varied surfaces.', 'https://videos.ptclinic.com/assessments/1010'),
      (11, 1, '2026-02-16 09:30:00', 60, 'Straight leg raise on left side showing quad lag of approximately 5 degrees. Lifting to only 30 degrees. Good effort but significant weakness present. No Trendelenburg during lift.', '{"hip_flexion": 30, "knee_extension": -5, "pelvis_tilt": 3}', 'fair', 'Add quad sets before SLR. Use electrical stimulation to improve quad recruitment. Progress slowly.', 'https://videos.ptclinic.com/assessments/1011'),
      (13, 16, '2026-02-18 14:30:00', 85, 'Wrist stretches performed bilaterally with good form. Right side slightly more restricted than left. Maintaining stretch duration appropriately. No compensatory movements.', '{"wrist_extension_right": 48, "wrist_extension_left": 55, "elbow_extension": 180}', 'good', 'Continue bilateral stretching. Add nerve gliding exercises. Perform before and after computer work.', 'https://videos.ptclinic.com/assessments/1012'),
      (14, 14, '2026-02-17 10:00:00', 76, 'Hamstring stretch on right side reaching 65 degrees hip flexion. Good technique with strap. Keeping knee extended. Some neural tension signs present - tingling at 60 degrees.', '{"hip_flexion": 65, "knee_extension": 0, "ankle_dorsiflexion": 5}', 'good', 'Respect neural tension limits. Stop stretch before tingling. Add neural flossing techniques. Avoid aggressive stretching.', 'https://videos.ptclinic.com/assessments/1013'),
      (15, 7, '2026-02-20 11:00:00', 68, 'Heel slides showing 100 degrees knee flexion at 10 days post-op. Good effort. Mild effusion limiting end range. Patient controlling motion well. No increased warmth noted.', '{"knee_flexion": 100, "hip_flexion": 20, "ankle_position": 0}', 'good', 'Progress ROM aggressively to achieve 115 degrees by week 3. Continue ice and elevation. Patellar mobilizations to assist ROM.', 'https://videos.ptclinic.com/assessments/1014'),
      (16, 6, '2026-02-19 13:00:00', 35, 'Single leg balance on left (affected) side severely impaired. Unable to maintain for more than 3 seconds. Significant postural sway. Left ankle dorsiflexor weakness contributing to instability.', '{"ankle_dorsiflexion": 5, "hip_abduction": 3, "trunk_sway": 15}', 'poor', 'Begin with weight shifting exercises. Progress to tandem stance before single leg. Use parallel bars for safety. Consider AFO for functional activities.', 'https://videos.ptclinic.com/assessments/1015'),
      (8, 12, '2026-02-21 09:00:00', 73, 'Lateral band walks showing improved hip abductor endurance. Maintaining good squat depth. Occasional knee valgus on right side at end of set. Band tension appropriate.', '{"hip_abduction": 20, "knee_flexion": 35, "trunk_lateral_flex": 3}', 'good', 'Increase band resistance next session. Focus on maintaining knee over 2nd toe. Add side-lying hip abduction as supplement.', 'https://videos.ptclinic.com/assessments/1016')
    `);
    console.log('Movement assessments seeded.');

    // Seed recovery progress (16)
    await client.query(`
      INSERT INTO recovery_progress (patient_id, assessment_date, pain_level, mobility_score, strength_score, overall_progress, notes, milestones) VALUES
      (1, '2026-02-20 10:00:00', 3, 72, 65, 'Good progress - on track for return to sport timeline', 'Knee flexion ROM 125 degrees. Full extension achieved. Quad strength improving. Beginning sport-specific drills.', 'Full extension ROM achieved; Independent straight leg raise; Walking without crutches'),
      (2, '2026-02-18 11:00:00', 4, 55, 45, 'Progressing as expected for 3 months post-op', 'Passive flexion 140 degrees. Active flexion 130 degrees. Beginning active-assisted ER exercises. Pain mostly with overhead activities.', 'Sling discontinued; Active forward flexion to 130 degrees; Sleeping through the night'),
      (3, '2026-02-16 09:00:00', 5, 60, 55, 'Moderate improvement - centralizing symptoms', 'Radicular symptoms now centralized to low back only. No leg symptoms past 2 weeks. Tolerating press-ups well. Sitting tolerance improved to 45 minutes.', 'Leg symptoms resolved; Sitting tolerance 45 minutes; Returned to modified work duty'),
      (4, '2026-02-19 14:00:00', 2, 78, 70, 'Excellent progress - ahead of schedule', 'Full ankle ROM restored. Proprioception improving. Able to jog on flat surfaces. Minimal swelling after activity. Progressing to agility drills.', 'Full ROM restored; Jogging initiated; Single leg hop test 85% limb symmetry'),
      (5, '2026-02-15 10:30:00', 4, 68, 58, 'Steady progress - ROM improving well', 'Knee flexion 110 degrees. Extension -2 degrees. Walking with single-point cane. Stairs with rail. Quad strength 3+/5. Minimal effusion.', 'Cane from walker transition; Knee flexion 110 degrees; Independent home ambulation'),
      (6, '2026-02-17 13:00:00', 3, 80, 72, 'Good improvement with eccentric program', 'Grip strength improved 30% since initial eval. Pain now only with heavy resistance. Performing desk work pain-free. Tyler Twist exercises progressing well.', 'Pain-free desk work; Grip strength improved 30%; Tolerating eccentric loading'),
      (7, '2026-02-14 11:00:00', 5, 35, 40, 'Slow progress - consistent with adhesive capsulitis timeline', 'ER 15 degrees, Flexion 100 degrees, Abduction 75 degrees. Very gradual ROM improvements. Night pain persisting. Manual therapy providing temporary relief.', 'Flexion improved from 80 to 100 degrees; Able to reach back pocket; Pain medication reduced'),
      (8, '2026-02-20 15:00:00', 3, 75, 68, 'Good progress with movement retraining', 'VMO activation improved on EMG biofeedback. Pain reduced with stairs. Running at 2 miles pain-free. Single leg squat form improving. Patellar tracking normalized.', 'Pain-free flat running 2 miles; Stairs without pain; Normalized patellar tracking'),
      (9, '2026-02-10 10:00:00', 6, 50, 48, 'On hold - but stable from last visit', 'Symptoms stable. Performing home exercises independently. Cervical ROM limited in right rotation and sidebend. Paresthesias intermittent in right C6 dermatome.', 'Independent with HEP; Paresthesias reduced from constant to intermittent; Posture improved'),
      (10, '2026-02-21 16:00:00', 4, 65, 60, 'Moderate improvement - morning pain decreasing', 'First-step morning pain reduced from 8/10 to 4/10. Calf flexibility improving. Tolerated 20-minute walks. Orthotics fitting well. Night splint compliance 90%.', 'Morning pain reduced 50%; Walking 20 minutes continuously; Night splint tolerated'),
      (11, '2026-02-18 09:30:00', 3, 62, 50, 'Good progress for 4 months post-op THA', 'Hip precautions maintained. Ambulating with straight cane. Hip flexion 95 degrees. Abduction 30 degrees. Able to perform most ADLs independently. Planning return to golf.', 'Transitioned to straight cane; Independent ADLs; Hip flexion 95 degrees'),
      (12, '2025-12-10 10:00:00', 1, 95, 90, 'Excellent - ready for discharge', 'Running pain-free at pre-injury mileage. Hip strength 5/5 bilaterally. ITB flexibility normalized. Completed return-to-run program. No symptoms during 10-mile run.', 'Full return to running; Marathon training resumed; Discharge criteria met'),
      (13, '2026-02-19 14:30:00', 4, 60, 55, 'Moderate progress - night symptoms improving', 'Night paresthesias reduced frequency. Grip strength improved 20%. Phalen test positive at 45 seconds (improved from 15 seconds). Ergonomic modifications helping.', 'Phalen test improved; Grip strength up 20%; Night symptoms reduced 50%'),
      (14, '2026-02-20 10:00:00', 4, 68, 62, 'Good progress with piriformis management', 'Sciatic symptoms reduced significantly. Piriformis flexibility improved. Sitting tolerance up to 60 minutes. Performing gym exercises with modifications.', 'Sitting tolerance 60 minutes; Returned to gym with modifications; Sciatic symptoms centralizing'),
      (15, '2026-02-22 11:00:00', 3, 70, 60, 'Excellent early post-op progress', 'Knee flexion 108 degrees at 12 days post-op. Minimal effusion. Walking without assistive device on flat surfaces. Good quad activation. Performing HEP independently.', 'Assistive device discontinued indoors; Knee flexion 108 degrees; Independent with HEP'),
      (16, '2026-02-21 13:00:00', 3, 40, 35, 'Steady neurological recovery - motivated patient', 'Left grip strength improving. Gait pattern showing improved symmetry. Left ankle dorsiflexion 5 degrees active. Requiring AFO for community ambulation. Transfers modified independent.', 'Modified independent transfers; Left grip strength improved; Gait symmetry improving')
    `);
    console.log('Recovery progress seeded.');

    // Seed home exercise programs (16)
    await client.query(`
      INSERT INTO home_exercise_programs (patient_id, program_name, exercises, compliance_rate, start_date, end_date, frequency, status, ai_recommendations) VALUES
      (1, 'ACL Rehab Phase 2 - Home Program', '${JSON.stringify([
        { name: "Straight Leg Raises", sets: 3, reps: 15, notes: "Tighten quad first" },
        { name: "Heel Slides", sets: 3, reps: 15, notes: "Use towel for assistance" },
        { name: "Quad Sets", sets: 3, reps: 20, hold: "5 seconds" },
        { name: "Ankle Pumps", sets: 2, reps: 30, notes: "Hourly when elevated" },
        { name: "Prone Knee Flexion", sets: 3, reps: 15, notes: "Gravity assist" },
        { name: "Standing Weight Shifts", sets: 3, reps: 10, hold: "10 seconds" }
      ])}', 85.50, '2026-01-15', '2026-03-15', 'Daily', 'active', 'Patient showing good compliance. Recommend progressing to mini squats next week. Add stationary bike 15 min daily when ROM reaches 110 degrees.'),
      (2, 'Rotator Cuff Recovery - Phase 1 HEP', '${JSON.stringify([
        { name: "Pendulum Exercises", sets: 2, reps: 20, direction: "clockwise and counterclockwise" },
        { name: "Passive ER with Stick", sets: 3, reps: 10, hold: "5 seconds" },
        { name: "Passive Flexion with Pulley", sets: 3, reps: 10, notes: "Go to tolerance" },
        { name: "Scapular Squeezes", sets: 3, reps: 15, hold: "5 seconds" },
        { name: "Grip Strengthening", sets: 3, reps: 20, notes: "Use tennis ball" }
      ])}', 92.00, '2025-12-01', '2026-02-01', 'Twice daily', 'active', 'Excellent compliance noted. Continue passive ROM focus. Transition to active-assisted exercises once 6-week post-op mark reached.'),
      (3, 'Lumbar Disc - McKenzie Home Program', '${JSON.stringify([
        { name: "Prone Press-Ups", sets: 3, reps: 10, frequency: "Every 2 hours" },
        { name: "Standing Extension", sets: 2, reps: 10, notes: "At work hourly" },
        { name: "Lumbar Rolls", sets: 2, reps: 5, notes: "Use rolled towel for support" },
        { name: "Walking", duration: "20 minutes", frequency: "Twice daily" },
        { name: "Abdominal Bracing", sets: 3, reps: 10, hold: "10 seconds" }
      ])}', 78.00, '2026-01-15', '2026-04-15', 'Multiple times daily', 'active', 'Symptoms centralizing - good sign. Press-ups frequency critical for maintaining improvement. Avoid sitting > 30 minutes without standing break.'),
      (4, 'Ankle Sprain Recovery - Phase 2', '${JSON.stringify([
        { name: "Ankle Alphabet", sets: 2, reps: 1, notes: "Write full alphabet with foot" },
        { name: "Calf Raises", sets: 3, reps: 15, notes: "Both legs then single leg" },
        { name: "Single Leg Balance", sets: 3, hold: "30 seconds", notes: "Eyes open then closed" },
        { name: "Resistance Band 4-Way Ankle", sets: 3, reps: 15, notes: "All directions" },
        { name: "Towel Scrunches", sets: 3, reps: 20, notes: "Seated" },
        { name: "Walking on Uneven Surfaces", duration: "10 minutes", notes: "Grass, gravel" }
      ])}', 88.00, '2026-02-15', '2026-03-30', 'Daily', 'active', 'Balance improving rapidly. Ready to add BOSU ball exercises. Recommend starting light jogging on treadmill in 1 week.'),
      (5, 'TKA Post-Op Phase 2 Home Program', '${JSON.stringify([
        { name: "Heel Slides", sets: 3, reps: 15, notes: "Push for more ROM each session" },
        { name: "Straight Leg Raises", sets: 3, reps: 15, notes: "All 4 directions" },
        { name: "Quad Sets", sets: 4, reps: 15, hold: "5 seconds" },
        { name: "Seated Knee Extension", sets: 3, reps: 15, notes: "0-40 degree arc" },
        { name: "Stationary Bike", duration: "15 minutes", notes: "Low resistance" },
        { name: "Standing Hip Abduction", sets: 3, reps: 15, notes: "Hold counter for balance" },
        { name: "Ankle Pumps", sets: 2, reps: 30, notes: "DVT prevention" }
      ])}', 90.00, '2025-11-01', '2026-02-28', 'Twice daily ROM, daily strengthening', 'active', 'ROM progressing well. Stationary bike initiated - excellent for ROM and endurance. Continue ice after exercise. Monitor for increased swelling.'),
      (6, 'Tennis Elbow - Eccentric Protocol', '${JSON.stringify([
        { name: "Tyler Twist (FlexBar)", sets: 3, reps: 15, notes: "Slow eccentric phase" },
        { name: "Wrist Flexor Stretch", sets: 5, hold: "30 seconds", frequency: "Throughout day" },
        { name: "Wrist Extensor Stretch", sets: 5, hold: "30 seconds", frequency: "Throughout day" },
        { name: "Grip Strengthening", sets: 3, reps: 20, notes: "Use stress ball" },
        { name: "Ice Massage", duration: "5 minutes", frequency: "After exercises and after work" }
      ])}', 72.00, '2026-01-20', '2026-03-30', 'Daily, stretches multiple times daily', 'active', 'Compliance could improve with stretching frequency. Eccentric program showing results - continue for full 12 weeks. Ergonomic assessment recommendations being followed.'),
      (7, 'Frozen Shoulder - Mobility Program', '${JSON.stringify([
        { name: "Pendulum Exercises", sets: 3, reps: 20, notes: "Before all other exercises" },
        { name: "Wall Walks - Flexion", sets: 3, reps: 10, notes: "Mark highest point" },
        { name: "Wall Walks - Abduction", sets: 3, reps: 10, notes: "Mark highest point" },
        { name: "Cross-Body Stretch", sets: 3, hold: "30 seconds" },
        { name: "Towel Internal Rotation Stretch", sets: 3, hold: "30 seconds" },
        { name: "Heat Before Exercise", duration: "15 minutes", notes: "Moist heat preferred" }
      ])}', 95.00, '2025-09-15', '2026-03-15', 'Three times daily', 'active', 'Exceptional compliance despite slow progress. This is expected with adhesive capsulitis. Continue aggressive ROM program. Consider MUA if plateau persists.'),
      (8, 'Patellofemoral - Movement Correction HEP', '${JSON.stringify([
        { name: "Clamshells with Band", sets: 3, reps: 20, notes: "Medium resistance" },
        { name: "Lateral Band Walks", sets: 3, reps: 15, notes: "Each direction" },
        { name: "VMO Activation - Terminal Knee Extension", sets: 3, reps: 15, notes: "Use band" },
        { name: "Single Leg Squat to Chair", sets: 3, reps: 10, notes: "Control descent" },
        { name: "Foam Rolling - Quads and IT Band", duration: "5 minutes", notes: "Pre-exercise" },
        { name: "Hamstring Stretch", sets: 3, hold: "30 seconds" }
      ])}', 80.00, '2026-01-10', '2026-04-10', 'Daily', 'active', 'Movement patterns improving. Running form analysis shows reduced knee valgus. Continue hip strengthening focus. Gradual return to mileage - add 10% weekly maximum.'),
      (9, 'Cervical Radiculopathy - Home Management', '${JSON.stringify([
        { name: "Chin Tucks", sets: 3, reps: 15, hold: "5 seconds" },
        { name: "Cervical Retraction with Overpressure", sets: 2, reps: 10, notes: "Gentle" },
        { name: "Upper Trap Stretch", sets: 3, hold: "30 seconds", notes: "Both sides" },
        { name: "Levator Scapulae Stretch", sets: 3, hold: "30 seconds", notes: "Both sides" },
        { name: "Scapular Squeezes", sets: 3, reps: 15, hold: "5 seconds" },
        { name: "Posture Correction", frequency: "Every 30 minutes at desk" }
      ])}', 65.00, '2025-12-20', '2026-03-20', 'Three times daily', 'active', 'Compliance needs improvement, especially postural correction. Recommend phone reminders. Symptoms stable while on hold status. Resume in-clinic treatment when authorized.'),
      (10, 'Plantar Fasciitis - Comprehensive HEP', '${JSON.stringify([
        { name: "Calf Stretch - Gastrocnemius", sets: 3, hold: "30 seconds", notes: "On step" },
        { name: "Calf Stretch - Soleus", sets: 3, hold: "30 seconds", notes: "Knee bent" },
        { name: "Towel Curls", sets: 3, reps: 20 },
        { name: "Frozen Water Bottle Roll", duration: "10 minutes", frequency: "After activity" },
        { name: "Marble Pickups", sets: 2, reps: 20, notes: "Both feet" },
        { name: "Night Splint", duration: "Overnight", notes: "Every night" },
        { name: "Short Foot Exercise", sets: 3, reps: 15, hold: "5 seconds" }
      ])}', 82.00, '2026-02-15', '2026-05-15', 'Daily, stretches twice daily', 'active', 'Morning pain trend is positive. Night splint compliance is key - maintain 90%+ usage. Progress to standing calf raises when pain allows. Consider low-dye taping for activity.'),
      (11, 'THA Post-Op Phase 3 - Home Program', '${JSON.stringify([
        { name: "Standing Hip Flexion", sets: 3, reps: 15, notes: "Within precautions" },
        { name: "Standing Hip Abduction", sets: 3, reps: 15, notes: "Use counter for balance" },
        { name: "Standing Hip Extension", sets: 3, reps: 15, notes: "Squeeze glutes" },
        { name: "Mini Squats", sets: 3, reps: 10, notes: "To 45 degrees only" },
        { name: "Stationary Bike", duration: "20 minutes", notes: "Moderate resistance" },
        { name: "Walking Program", duration: "30 minutes", notes: "Community distances" }
      ])}', 88.00, '2026-01-01', '2026-03-15', 'Daily', 'active', 'Excellent progress. Begin golf-specific training in 2 weeks with putting and chipping. Full swing cleared at 6 months post-op. Continue hip precautions until surgeon follow-up.'),
      (12, 'IT Band - Return to Running Program', '${JSON.stringify([
        { name: "Foam Rolling - IT Band", duration: "5 minutes", frequency: "Before and after running" },
        { name: "Clamshells with Band", sets: 3, reps: 25 },
        { name: "Side Plank", sets: 3, hold: "30 seconds" },
        { name: "Single Leg Deadlift", sets: 3, reps: 12 },
        { name: "Running Intervals", notes: "Per graduated schedule" },
        { name: "Pigeon Stretch", sets: 3, hold: "45 seconds" }
      ])}', 96.00, '2025-11-01', '2025-12-15', 'Daily, running 3x/week', 'completed', 'Program successfully completed. Patient returned to full marathon training. Maintain hip strengthening as maintenance program 3x per week indefinitely.'),
      (13, 'Carpal Tunnel - Conservative Management HEP', '${JSON.stringify([
        { name: "Median Nerve Glides", sets: 3, reps: 10, notes: "Gentle - stop if tingling increases" },
        { name: "Tendon Gliding Exercises", sets: 3, reps: 10, notes: "All 5 positions" },
        { name: "Wrist Flexor Stretch", sets: 5, hold: "30 seconds" },
        { name: "Wrist Extensor Stretch", sets: 5, hold: "30 seconds" },
        { name: "Grip Strengthening - Putty", sets: 2, reps: 15, notes: "Medium resistance" },
        { name: "Night Splints", duration: "Overnight", notes: "Both wrists" }
      ])}', 75.00, '2026-01-25', '2026-04-25', 'Three times daily, splints nightly', 'active', 'Nerve glide compliance critical for improvement. Night splints showing benefit. Ergonomic modifications at workstation helping. Monitor EMG findings at 3-month follow-up.'),
      (14, 'Piriformis Syndrome - Home Management', '${JSON.stringify([
        { name: "Piriformis Stretch - Supine", sets: 3, hold: "30 seconds", notes: "Both sides" },
        { name: "Figure 4 Stretch", sets: 3, hold: "30 seconds" },
        { name: "Foam Rolling - Glutes", duration: "5 minutes" },
        { name: "Clamshells", sets: 3, reps: 20 },
        { name: "Bridge with Band", sets: 3, reps: 15 },
        { name: "Dead Bug", sets: 3, reps: 10, notes: "Each side" },
        { name: "Tennis Ball Self-Massage", duration: "3 minutes", notes: "On piriformis" }
      ])}', 70.00, '2026-02-10', '2026-05-10', 'Daily', 'active', 'Sitting breaks every 30 minutes essential. Tennis ball release providing relief. Progress hip strengthening as symptoms allow. Consider lumbar stabilization component.'),
      (15, 'Post-Meniscectomy - Early Recovery HEP', '${JSON.stringify([
        { name: "Quad Sets", sets: 4, reps: 20, hold: "5 seconds" },
        { name: "Straight Leg Raises", sets: 3, reps: 15 },
        { name: "Heel Slides", sets: 3, reps: 15, notes: "Push for more ROM" },
        { name: "Ankle Pumps", sets: 2, reps: 30, notes: "Hourly" },
        { name: "Prone Knee Flexion", sets: 3, reps: 10, notes: "Gravity assist" },
        { name: "Ice and Elevation", duration: "20 minutes", frequency: "After exercises" }
      ])}', 92.00, '2026-02-12', '2026-03-30', 'Three times daily', 'active', 'Excellent compliance from motivated athlete. ROM ahead of schedule. Begin stationary bike when ROM reaches 115 degrees. Protect from impact activities for 6 weeks.'),
      (16, 'Stroke Recovery - Home Exercise Program', '${JSON.stringify([
        { name: "Seated Weight Shifts", sets: 3, reps: 10, notes: "All directions" },
        { name: "Sit to Stand Practice", sets: 3, reps: 10, notes: "Use armrests as needed" },
        { name: "Standing Balance at Counter", sets: 3, hold: "30 seconds" },
        { name: "Left Hand Grip - Putty", sets: 3, reps: 15, notes: "All grip patterns" },
        { name: "Left Wrist AROM", sets: 3, reps: 10, notes: "Flexion, extension, deviation" },
        { name: "Stepping Practice", sets: 3, reps: 10, notes: "Forward and lateral" },
        { name: "Task Practice - Reaching", sets: 2, reps: 15, notes: "Varied heights and directions" }
      ])}', 85.00, '2025-12-01', '2026-05-30', 'Twice daily', 'active', 'Family caregiver involved in HEP supervision. Task-specific practice showing best carry-over. Increase repetitions as endurance improves. Neuroplasticity demands high volume practice.')
    `);
    console.log('Home exercise programs seeded.');

    // Seed appointments (18)
    await client.query(`
      INSERT INTO appointments (patient_id, therapist_name, appointment_date, duration_minutes, type, status, notes, location) VALUES
      (1, 'Dr. Sarah Mitchell', '2026-03-20 09:00:00', 60, 'follow-up', 'scheduled', 'ACL rehab phase 2 progression. Assess quad strength. Sport-specific drills assessment.', 'Main Clinic - Room 3'),
      (2, 'Dr. James Rodriguez', '2026-03-20 10:30:00', 45, 'follow-up', 'scheduled', 'Rotator cuff - begin active-assisted exercises. Check passive ROM progress.', 'Main Clinic - Room 1'),
      (3, 'Dr. Emily Chen', '2026-03-20 13:00:00', 45, 'follow-up', 'scheduled', 'Lumbar disc - reassess centralization. Progress core stabilization. Work conditioning assessment.', 'Main Clinic - Room 2'),
      (4, 'Dr. Sarah Mitchell', '2026-03-21 09:00:00', 45, 'follow-up', 'scheduled', 'Ankle sprain - agility drills progression. Balance testing. Return-to-run assessment.', 'Main Clinic - Room 3'),
      (5, 'Dr. James Rodriguez', '2026-03-21 11:00:00', 60, 'follow-up', 'scheduled', 'TKA - ROM check. Progress strengthening. Assess stair negotiation ability.', 'Main Clinic - Room 1'),
      (6, 'Dr. Emily Chen', '2026-03-22 09:00:00', 45, 'follow-up', 'scheduled', 'Tennis elbow - eccentric protocol week 8. Grip strength reassessment.', 'Main Clinic - Room 2'),
      (7, 'Dr. Sarah Mitchell', '2026-03-22 10:30:00', 60, 'follow-up', 'scheduled', 'Frozen shoulder - manual therapy session. Aggressive ROM. Reassess PROM gains.', 'Main Clinic - Room 3'),
      (8, 'Dr. James Rodriguez', '2026-03-23 09:00:00', 45, 'follow-up', 'scheduled', 'PFP - running analysis. VMO biofeedback. Progress mileage discussion.', 'Main Clinic - Room 1'),
      (1, 'Dr. Sarah Mitchell', '2026-02-18 09:00:00', 60, 'follow-up', 'completed', 'Progressed to closed chain exercises. Quad strength 4/5. ROM 125 degrees flexion. Patient tolerating well.', 'Main Clinic - Room 3'),
      (2, 'Dr. James Rodriguez', '2026-02-14 10:30:00', 45, 'follow-up', 'completed', 'Passive ROM progressing well. Flexion 140 degrees passive. Initiated pendulum exercises. No complications.', 'Main Clinic - Room 1'),
      (3, 'Dr. Emily Chen', '2026-02-16 13:00:00', 45, 'follow-up', 'completed', 'Centralization pattern confirmed. Press-ups effective. Added bird dog exercise. Modified work duty continuing.', 'Main Clinic - Room 2'),
      (5, 'Dr. James Rodriguez', '2026-02-13 11:00:00', 60, 'follow-up', 'completed', 'ROM 110 degrees flexion. Transitioned from walker to cane. Quad activation improving with NMES.', 'Main Clinic - Room 1'),
      (10, 'Dr. Sarah Mitchell', '2026-02-10 14:00:00', 45, 'initial-eval', 'completed', 'Initial evaluation for bilateral plantar fasciitis. Ankle DF limited bilaterally. Windlass test positive. Treatment plan established.', 'Main Clinic - Room 3'),
      (15, 'Dr. Emily Chen', '2026-02-15 09:00:00', 60, 'initial-eval', 'completed', 'Post-meniscectomy initial eval. 5 days post-op. ROM 85 degrees flexion. Mild effusion. Initiated gentle ROM and quad activation.', 'Main Clinic - Room 2'),
      (11, 'Dr. James Rodriguez', '2026-03-19 11:00:00', 45, 'follow-up', 'completed', 'THA phase 3 progression. Hip strength improving. Cane use outdoors only. Discussed golf timeline.', 'Main Clinic - Room 1'),
      (16, 'Dr. Sarah Mitchell', '2026-03-19 14:00:00', 60, 'follow-up', 'completed', 'Stroke rehab - gait training focus. Left ankle dorsiflexion slightly improved. Task-specific practice for reaching. Family education.', 'Neuro Rehab Unit - Room A'),
      (9, 'Dr. Emily Chen', '2026-03-25 10:00:00', 45, 'follow-up', 'scheduled', 'Cervical radiculopathy - resume treatment after insurance authorization. Reassess cervical ROM and radicular symptoms.', 'Main Clinic - Room 2'),
      (13, 'Dr. Sarah Mitchell', '2026-03-24 13:00:00', 45, 'follow-up', 'scheduled', 'Carpal tunnel - check nerve glide progress. Grip strength test. Review ergonomic modifications. Night splint compliance.', 'Main Clinic - Room 3')
    `);
    console.log('Appointments seeded.');

    // Seed treatment notes (16)
    await client.query(`
      INSERT INTO treatment_notes (patient_id, therapist_name, note_date, subjective, objective, assessment, plan, treatment_provided, patient_response, next_visit_goals) VALUES
      (1, 'Dr. Sarah Mitchell', '2026-02-18 09:00:00',
       'Patient reports knee feeling stronger. Minimal swelling after exercises. Occasional catching sensation with deep flexion. Pain 3/10 with activity, 1/10 at rest. Sleeping well. Compliant with HEP.',
       'Knee ROM: 0-125 degrees. Quad strength 4/5. Hamstring strength 4/5. No effusion. Ligament testing stable. Gait: normal pattern, no deviations. SLR: no lag. Patellar mobility normal.',
       'Patient progressing well at 3 months post ACL reconstruction. ROM goals met. Strength progressing appropriately. On track for return to sport at 9 months. No signs of graft complications.',
       'Continue Phase 2 protocol. Progress to CKC exercises - leg press, mini squats. Initiate sport cord exercises. Begin agility ladder next session if tolerated. Continue quad and hamstring strengthening. HEP updated.',
       'Therapeutic exercise 45 min, manual therapy - patellar mobs 10 min, neuromuscular re-education 15 min, cryotherapy post-treatment.',
       'Patient tolerated all exercises well. No increased pain or swelling during session. Good effort and motivation. Quad activation visibly improved.',
       'Achieve knee flexion 130 degrees; Quad strength 4+/5; Initiate agility drills; Progress CKC exercises'),
      (2, 'Dr. James Rodriguez', '2026-02-14 10:30:00',
       'Patient reports improved sleep - only waking 1x per night. Shoulder stiffness decreasing. Able to perform light ADLs with affected arm. Pain 4/10 with movement, 2/10 at rest. Using sling only when out of house.',
       'PROM: Flexion 140, Abduction 120, ER at side 30, IR to L3. AROM: Flexion 130, Abduction 100. No signs of infection. Incisions well-healed. Tenderness at supraspinatus insertion. Negative impingement signs.',
       'Three months post rotator cuff repair progressing as expected. PROM improving well. AROM lag improving. Ready to begin active-assisted exercises. Sling discontinuation appropriate.',
       'Discontinue sling. Begin active-assisted ROM exercises - wand and pulley. Continue PROM program. Initiate isometric rotator cuff strengthening at 0 degrees abduction. Progress HEP. Follow up in 1 week.',
       'Manual therapy - glenohumeral mobs grade II 15 min, PROM exercises 15 min, pendulum instruction 5 min, therapeutic exercise 10 min, patient education 10 min.',
       'Patient tolerated grade II mobilizations with mild discomfort. Improved PROM immediately post-mobilization. Demonstrated correct pendulum technique. Motivated to progress.',
       'AROM flexion 140 degrees; Initiate active-assisted exercises; Begin isometric RC strengthening; Decrease night pain'),
      (3, 'Dr. Emily Chen', '2026-02-16 13:00:00',
       'Patient reports leg pain has resolved - only low back pain remaining. Pain 5/10 with prolonged sitting, 2/10 with standing and walking. Able to work modified duty 6 hours. HEP compliance improving.',
       'Lumbar ROM: Flexion 60%, Extension 80%, Sidebend WNL bilaterally. SLR negative bilaterally. DTRs 2+ symmetric. Sensation intact L4-S1 dermatomes. Motor strength 5/5 LE bilaterally. Centralization with repeated extension.',
       'Significant improvement - radicular symptoms fully centralized. Extension-biased approach effective. Patient demonstrating good understanding of directional preference. Modified work duty appropriate. Prognosis good for full return to work.',
       'Continue McKenzie extension protocol. Add bird dog for core stabilization. Progress press-up frequency. Initiate general conditioning on bike. Ergonomic assessment at workplace next week. Progress to full duty evaluation in 3 weeks.',
       'Mechanical diagnosis and therapy 20 min, therapeutic exercise 20 min, core stabilization training 15 min, patient education on body mechanics 10 min.',
       'Excellent response to repeated extension. Centralization achieved within 10 repetitions. Patient reports decreased pain immediately after press-ups. Motivated by progress.',
       'Maintain centralization; Sitting tolerance 60 minutes; Core stability endurance 30 seconds; Full work duty evaluation'),
      (4, 'Dr. Sarah Mitchell', '2026-02-17 14:00:00',
       'Patient reports ankle feeling more stable. Able to walk on uneven surfaces with mild insecurity. No swelling after walking. Pain 2/10 with activity. Wants to return to trail running.',
       'Ankle ROM: DF 15 degrees, PF 45 degrees, Inversion 30 degrees, Eversion 15 degrees - all WNL. Anterior drawer negative. Talar tilt negative. Single leg balance: 15 seconds eyes open. Star excursion: 85% LSI. Mild peroneal weakness.',
       'Grade II lateral ankle sprain at 4 weeks progressing well. ROM fully restored. Ligament integrity maintained. Proprioception improving but not yet at pre-injury level. Peroneal strengthening needed before return to trail running.',
       'Progress proprioception training - BOSU ball exercises, perturbation training. Advance peroneal strengthening. Begin jogging on flat treadmill surface. Star excursion goal 95% LSI. Trail running clearance when single leg balance 30 seconds eyes closed.',
       'Balance and proprioception training 20 min, therapeutic exercise 15 min, manual therapy - ankle joint mobs 10 min, agility drills introduction 10 min, taping instruction 5 min.',
       'Patient demonstrated good motor learning with balance progressions. Tolerated grade III joint mobilizations well. Ankle taping technique reviewed for return to running.',
       'Single leg balance 30 seconds eyes open; Star excursion 90% LSI; Jog 10 minutes pain-free; Peroneal strength 4+/5'),
      (5, 'Dr. James Rodriguez', '2026-02-13 11:00:00',
       'Patient reports less stiffness in morning. Able to walk around house without walker. Pain 4/10 with stairs, 2/10 with level walking. Sleeping better. Swelling decreased.',
       'Knee ROM: -2 to 110 degrees. Quad strength 3+/5. Incision well-healed. Minimal effusion. Gait: mild antalgic pattern, decreased stance time on right. Stair test: up and down with rail, step-to pattern. TUG: 15 seconds.',
       'TKA at 4 months showing good progress. ROM approaching functional goals. Quad weakness remains primary impairment. Gait deviations secondary to quad weakness. Fall risk low. Stair negotiation improving.',
       'Transition from walker to straight cane. Initiate NMES for quad strengthening. Progress ROM exercises - stationary bike initiated. Add step-ups and sit-to-stand progressions. Continue HEP with increased resistance. Re-assess in 1 week.',
       'Therapeutic exercise 30 min, gait training 15 min, NMES to quads 15 min, manual therapy - patellar mobs, soft tissue mobilization to quads 10 min.',
       'Patient responded well to NMES - improved quad activation immediately. Tolerated cane ambulation for 200 feet. Motivated by walker-to-cane progression. No adverse reactions.',
       'Knee flexion 115 degrees; Quad strength 4/5; Cane ambulation 500 feet; Reciprocal stair pattern with rail'),
      (6, 'Dr. Emily Chen', '2026-02-17 13:00:00',
       'Patient reports pain at elbow decreasing. Able to type for 2 hours without pain. Grip still weak for carrying bags. Pain 3/10 with gripping, 0/10 at rest. Using ice after work daily.',
       'Grip strength R: 55 lbs (L: 80 lbs, 69% comparison). Palpation: mild tenderness at lateral epicondyle. Cozen test: positive but less painful. Mill test: positive. Wrist extension strength 4/5. Elbow ROM: WNL.',
       'Lateral epicondylitis improving at 4 weeks of eccentric program. Grip strength improving but still significantly below uninvolved side. Pain with functional activities reducing. Eccentric protocol should continue for full 12 weeks.',
       'Continue Tyler Twist eccentric protocol - progress to red FlexBar. Maintain stretching frequency. Review ergonomic setup at workstation. Add forearm pronation/supination strengthening. Consider counterforce brace for heavy gripping tasks.',
       'Therapeutic exercise 20 min, eccentric loading protocol 10 min, manual therapy - deep friction massage and MFR 15 min, ergonomic education 10 min, modalities - iontophoresis 10 min.',
       'Patient reports decreased pain immediately after deep friction massage. Tolerated progression to red FlexBar for 10 reps. Ergonomic modifications reviewed and understood.',
       'Grip strength 65% of uninvolved; Pain-free typing 3 hours; Negative Cozen test; Progress FlexBar to 3x15'),
      (7, 'Dr. Sarah Mitchell', '2026-02-12 11:00:00',
       'Patient reports persistent difficulty with overhead activities and dressing. Night pain continues but less frequent. Pain 5/10 at end range, 2/10 at rest. Frustrated with slow progress. Diabetic control stable.',
       'PROM: Flexion 100 (from 80), Abduction 75 (from 60), ER at side 15 (from 5), IR to sacrum. AROM: Flexion 85, Abduction 60. Capsular end-feel in all restricted directions. Scapulohumeral rhythm disrupted.',
       'Adhesive capsulitis stage 2 (frozen phase) progressing slowly but consistently. PROM gains noted in all directions. Diabetes may be contributing to prolonged frozen phase. Patient education regarding expected timeline important for managing expectations.',
       'Continue aggressive PROM and manual therapy. Grade III+ mobilizations in restricted directions. Maintain heat before ROM exercises. Discuss MUA with referring physician if plateau reached. Supportive counseling regarding timeline expectations.',
       'Manual therapy - grade III+ GH mobs in flexion, abduction, ER 25 min, PROM exercises 15 min, heat 15 min pre-mobilization, therapeutic exercise - scapular stabilization 10 min.',
       'Patient tolerated aggressive mobilizations with moderate discomfort. Gained 5 degrees ER immediately post-mobilization. Expressed understanding of typical AC timeline after education. Less frustrated after discussion.',
       'PROM flexion 110 degrees; PROM ER 20 degrees; Decreased night pain frequency; Continue aggressive mobilization'),
      (8, 'Dr. James Rodriguez', '2026-02-19 15:00:00',
       'Patient reports knee pain decreased with running. Ran 2 miles yesterday with no pain. Stairs improving - only mild discomfort descending. Performing HEP consistently. Pain 3/10 worst, usually 1/10.',
       'VMO activation: improved on biofeedback (40% MVC to 65% MVC). Single leg squat: improved knee valgus control. Step-down test: mild dynamic valgus right > left. Running gait: reduced knee adduction moment. Hip abduction strength: 4+/5 bilaterally.',
       'PFP improving significantly with hip-focused strengthening and movement retraining. VMO activation and timing improved. Running biomechanics normalized. Ready for gradual mileage progression with monitoring.',
       'Progress running to 3 miles with walk breaks. Continue hip strengthening - progress resistance. Add plyometric introduction - bilateral landing drills. Running form cues: maintain cadence 180. Re-assess in 1 week.',
       'Therapeutic exercise 25 min, neuromuscular re-education with biofeedback 10 min, running gait analysis on treadmill 10 min, plyometric education 10 min.',
       'Patient demonstrated excellent motor control improvements during biofeedback session. Running form visibly improved. Tolerated 10-minute treadmill run at clinic. Eager to progress mileage.',
       'Pain-free running 3 miles; Hip abduction 5/5; Negative step-down test bilaterally; Initiate plyometrics'),
      (10, 'Dr. Sarah Mitchell', '2026-02-21 16:00:00',
       'Patient reports morning pain decreasing - now 4/10 first steps vs 8/10 initial. Walking 20 minutes without increased pain. Night splint comfortable. Orthotics fitting well in shoes. Pain 4/10 AM, 2/10 PM.',
       'Ankle DF: R 8 degrees, L 10 degrees (goal 15). Windlass test: mildly positive bilaterally. Palpation: moderate tenderness plantar fascia insertion bilaterally. Arch height index: low bilaterally. Calf endurance: 15 reps bilateral (goal 25).',
       'Bilateral plantar fasciitis at 2 weeks showing encouraging improvement in morning pain. Ankle DF remains restricted and is a primary contributor. Night splint compliance excellent and correlates with AM pain improvement. Orthotic fit confirmed.',
       'Progress calf stretching - add eccentric calf raises on step. Continue night splint. Add intrinsic foot strengthening. Low-dye taping for longer walks. Consider extracorporeal shockwave therapy if plateau at 6 weeks. Progress walking to 30 minutes.',
       'Manual therapy - calf and plantar fascia soft tissue mobilization 15 min, therapeutic exercise 20 min, taping - low-dye application and instruction 10 min, iontophoresis bilateral 10 min.',
       'Patient responded well to soft tissue mobilization with immediate improvement in DF. Tolerated low-dye taping well and reports improved comfort walking. Iontophoresis well-tolerated.',
       'Morning pain 2/10; Ankle DF 12 degrees bilaterally; Walking 30 minutes; Calf endurance 20 reps'),
      (11, 'Dr. James Rodriguez', '2026-03-19 11:00:00',
       'Patient feeling confident with walking. Using cane only outdoors for uneven terrain. No hip pain at rest. Mild groin soreness after long walks. Wants to discuss golf timeline. Pain 3/10 with activity.',
       'Hip ROM: Flexion 95, Extension 10, Abduction 30, ER 25, IR 15. All within precautions. Gait: near-normal pattern with cane. Without cane: mild Trendelenburg on left. Hip abduction strength: 4/5. TUG: 11 seconds.',
       'THA at 4 months post-op progressing well. Hip precautions maintained. Functional mobility approaching independence. Mild glut med weakness persists as indicated by Trendelenburg. Safe for progressive strengthening.',
       'Advance hip abductor strengthening - lateral band walks. Begin golf-specific conditioning - putting and chipping. Full swing cleared at 6-month surgeon follow-up. Progress outdoor ambulation without cane on flat surfaces. Continue HEP.',
       'Therapeutic exercise 25 min, gait training without cane 10 min, sport-specific training - putting mechanics 10 min, balance training 10 min.',
       'Patient ambulated 300 feet without assistive device with minimal Trendelenburg. Putting motion performed without hip discomfort. Excited about golf timeline. Balance improved on single leg.',
       'Cane-free indoor and flat outdoor ambulation; Hip abduction 4+/5; 9-hole putting round without pain; Trendelenburg resolved'),
      (13, 'Dr. Sarah Mitchell', '2026-02-19 14:30:00',
       'Patient reports decreased nighttime tingling. Numbness in fingers less frequent. Grip still weak for opening jars. Ergonomic changes at work helping with symptoms. Pain 4/10 with repetitive gripping. Night splint use 90%.',
       'Phalen test: positive at 45 seconds (improved from 15 seconds). Tinel sign: positive bilateral. Grip strength: R 42 lbs, L 38 lbs (improved from 35/30). Sensation: diminished light touch median nerve distribution bilateral. Thenar bulk: mildly atrophied bilaterally.',
       'Bilateral CTS improving with conservative management. Phalen test improvement significant. Grip strength gains noted. Night splints and nerve glides appear effective. Continue conservative approach before reconsidering surgical referral.',
       'Continue nerve glide program - progress range. Maintain night splints. Progress grip strengthening to firm putty. Add pinch strengthening. Review work station setup - ensure monitor and keyboard optimal. Follow up with physician for EMG at 3 months.',
       'Therapeutic exercise 15 min, nerve gliding program 10 min, manual therapy - carpal bone mobilization and soft tissue 15 min, ultrasound bilateral 10 min, ergonomic review 10 min.',
       'Patient reports decreased paresthesias immediately after nerve glides. Tolerated carpal bone mobilizations well. Demonstrated correct nerve glide technique independently. Ergonomic modifications reviewed and updated.',
       'Negative Phalen test; Grip strength 50 lbs bilateral; Night symptoms 2x per week or less; Independent nerve glide program'),
      (14, 'Dr. James Rodriguez', '2026-02-20 10:00:00',
       'Patient reports sciatic symptoms much better. Sitting tolerance improved to 60 minutes. Able to perform deadlifts with light weight. Occasional buttock ache after prolonged driving. Pain 4/10 with prolonged sitting, 1/10 with activity.',
       'FAIR test: mildly positive right (improved). Piriformis flexibility: improved 15 degrees hip IR. SLR: negative bilaterally. Lumbar ROM: WNL. Gluteal strength: 4+/5 bilaterally. Core endurance: side plank 25 seconds bilaterally.',
       'Piriformis syndrome responding well to treatment. Sciatic symptoms significantly reduced. Hip flexibility improving. Core stability progressing. Patient successfully returning to gym activities with modifications.',
       'Continue piriformis stretching and hip strengthening. Progress gym exercises - increase deadlift weight gradually. Add seated piriformis stretch for use at work. Progress core stabilization. Taper frequency to 1x per week if continues to improve.',
       'Manual therapy - piriformis release, hip mobilization 15 min, therapeutic exercise 20 min, core stabilization training 10 min, dry needling to piriformis 10 min.',
       'Patient had excellent response to dry needling - immediate reduction in piriformis tension. Tolerated progressive hip strengthening. Demonstrated good core control during dead bug exercise.',
       'FAIR test negative; Sitting tolerance 90 minutes; Full gym routine without modifications; Core plank 45 seconds'),
      (15, 'Dr. Emily Chen', '2026-02-22 11:00:00',
       'Patient reports knee feeling good overall. Swelling almost gone. Walking normally on flat surfaces. Knee stiff in morning but loosens up quickly. Pain 3/10 with deep flexion, 0/10 with walking. Very motivated to return to basketball.',
       'Knee ROM: 5-108 degrees (12 days post-op). Effusion: trace. Quad activation: good, no lag with SLR. Gait: normal pattern on flat, mild antalgic on stairs. Incisions clean and healing. McMurray: not tested post-op. Patella mobile.',
       'Post arthroscopic partial meniscectomy at 12 days showing excellent early progress. ROM ahead of typical timeline. Effusion nearly resolved. Quad activation preserved. Patient highly motivated athlete - need to manage expectations regarding return to basketball timeline.',
       'Progress ROM exercises aggressively - goal 120 degrees by week 3. Initiate stationary bike. Begin closed chain strengthening. Progress walking program. No impact activities for 6 weeks. Discuss return to basketball timeline - goal 8-10 weeks.',
       'Therapeutic exercise 30 min, manual therapy - patellar mobilization, soft tissue 10 min, gait training on stairs 10 min, patient education on RTP timeline 10 min.',
       'Patient tolerated progressive exercises well. Achieved 5 additional degrees flexion during session. Stair gait improved with cueing. Understood and accepted return to play timeline after discussion.',
       'ROM 0-120 degrees; Stationary bike 20 minutes; Quad strength 4/5; Walk 30 minutes without difficulty'),
      (16, 'Dr. Sarah Mitchell', '2026-03-19 14:00:00',
       'Patient reports feeling more stable when walking. Left hand grip improving - able to hold cup briefly. Fatigue remains a challenge. Family assisting with HEP. Pain 3/10 in left shoulder. Mood positive.',
       'Left UE: Shoulder flexion 3/5, Grip strength 8 lbs (R 45 lbs), Wrist extension 3/5, Finger extension 2+/5. Left LE: Hip flexion 4/5, Knee extension 4/5, Ankle DF 3/5. Balance: standing 30 seconds supported. Gait: asymmetric with AFO, step length improved. BBS: 32/56.',
       'CVA rehabilitation at 4 months showing continued motor recovery. Brunnstrom stage improving - UE stage 3+ with emerging isolated movements, LE stage 4. Functional gains in transfers and gait. Balance improving but fall risk persists. Excellent family support and patient motivation.',
       'Continue intensive neurorehabilitation 5x/week. Progress UE task-specific practice. Advance gait training - outdoor surfaces. Increase standing balance challenges. Assess for FES to dorsiflexors. Family training on advanced HEP. OT referral for fine motor and ADL training.',
       'Gait training 20 min, balance training 15 min, UE task-specific practice 15 min, neuromuscular re-education 15 min, patient and family education 10 min.',
       'Patient demonstrated improved gait symmetry with verbal cueing. Left hand grip sustained for 10 seconds (new achievement). Balance reactions improving on left side. Family member demonstrated HEP exercises correctly. Patient emotionally positive about hand grip progress.',
       'Left grip sustain 15 seconds; BBS score 36; Outdoor ambulation 200 feet; Left ankle DF 3+/5; Independent sit-to-stand')
    `);
    console.log('Treatment notes seeded.');

    // Therapists table
    await client.query(`
      CREATE TABLE therapists (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        specialization VARCHAR(255),
        license_number VARCHAR(100),
        years_experience INTEGER,
        certifications TEXT,
        bio TEXT,
        status VARCHAR(50) DEFAULT 'active',
        hire_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Billing table
    await client.query(`
      CREATE TABLE billing (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        insurance_provider VARCHAR(255),
        policy_number VARCHAR(100),
        claim_number VARCHAR(100),
        service_date DATE,
        service_type VARCHAR(100),
        cpt_code VARCHAR(20),
        diagnosis_code VARCHAR(20),
        amount NUMERIC(10,2),
        paid_amount NUMERIC(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Messages table
    await client.query(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        sender_type VARCHAR(50) DEFAULT 'therapist',
        subject VARCHAR(255),
        body TEXT,
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'normal',
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Exercise videos table
    await client.query(`
      CREATE TABLE exercise_videos (
        id SERIAL PRIMARY KEY,
        exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
        title VARCHAR(255),
        description TEXT,
        video_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        duration_seconds INTEGER,
        difficulty_level VARCHAR(50),
        body_region VARCHAR(100),
        instructor_name VARCHAR(255),
        view_count INTEGER DEFAULT 0,
        rating NUMERIC(3,1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Pain assessments table
    await client.query(`
      CREATE TABLE pain_assessments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        assessment_date TIMESTAMP DEFAULT NOW(),
        body_region VARCHAR(100),
        pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10),
        pain_type VARCHAR(50),
        triggers TEXT,
        relieving_factors TEXT,
        functional_impact TEXT,
        duration_of_pain VARCHAR(100),
        notes TEXT,
        assessed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Outcome measures table
    await client.query(`
      CREATE TABLE outcome_measures (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        measure_type VARCHAR(50),
        score NUMERIC(10,2),
        max_score NUMERIC(10,2),
        percentage NUMERIC(5,1),
        assessment_date TIMESTAMP DEFAULT NOW(),
        assessed_by VARCHAR(255),
        interpretation TEXT,
        previous_score NUMERIC(10,2),
        change_from_previous NUMERIC(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('New tables created.');

    // Seed therapists (16)
    await client.query(`
      INSERT INTO therapists (first_name, last_name, email, phone, specialization, license_number, years_experience, certifications, bio, status, hire_date) VALUES
      ('Sarah', 'Mitchell', 'sarah.mitchell@ptclinic.com', '555-2001', 'Orthopedic Physical Therapy', 'PT-2015-4421', 11, 'OCS, CSCS, Dry Needling Certified', 'Specializes in post-surgical rehabilitation and sports injuries. Passionate about evidence-based practice and patient education.', 'active', '2015-06-15'),
      ('James', 'Rodriguez', 'james.rodriguez@ptclinic.com', '555-2002', 'Sports Physical Therapy', 'PT-2012-3318', 14, 'SCS, FAAOMPT, ATC', 'Former athletic trainer turned physical therapist. Expert in sports injury prevention and return-to-play protocols.', 'active', '2012-03-01'),
      ('Emily', 'Chen', 'emily.chen@ptclinic.com', '555-2003', 'Neurological Physical Therapy', 'PT-2016-5532', 10, 'NCS, CBIS, NDT Certified', 'Specializes in stroke rehabilitation, traumatic brain injury, and vestibular disorders. Research focus on neuroplasticity.', 'active', '2016-09-01'),
      ('Michael', 'Patel', 'michael.patel@ptclinic.com', '555-2004', 'Geriatric Physical Therapy', 'PT-2010-2287', 16, 'GCS, CEEAA, Balance & Falls Certified', 'Expert in fall prevention, geriatric fitness, and age-related movement disorders. Conducts community wellness programs.', 'active', '2010-01-15'),
      ('Jessica', 'Wang', 'jessica.wang@ptclinic.com', '555-2005', 'Pediatric Physical Therapy', 'PT-2018-6643', 8, 'PCS, NDT Certified, Kinesio Taping', 'Dedicated to helping children achieve developmental milestones. Specializes in cerebral palsy and developmental delays.', 'active', '2018-07-01'),
      ('David', 'Thompson', 'david.thompson@ptclinic.com', '555-2006', 'Hand Therapy', 'PT-2013-3901', 13, 'CHT, OCS, Graston Certified', 'Certified hand therapist specializing in upper extremity rehabilitation, work injury management, and custom splinting.', 'active', '2013-11-01'),
      ('Amanda', 'Brooks', 'amanda.brooks@ptclinic.com', '555-2007', 'Womens Health PT', 'PT-2017-5890', 9, 'WCS, PRPC, Pilates Certified', 'Specializes in pelvic floor rehabilitation, prenatal/postpartum care, and lymphedema management.', 'active', '2017-04-15'),
      ('Robert', 'Kim', 'robert.kim@ptclinic.com', '555-2008', 'Pain Management', 'PT-2011-2956', 15, 'OCS, FAAOMPT, Pain Science Education', 'Expert in chronic pain management using a biopsychosocial approach. Published researcher in pain neuroscience education.', 'active', '2011-08-01'),
      ('Lisa', 'Johnson', 'lisa.johnson@ptclinic.com', '555-2009', 'Cardiopulmonary PT', 'PT-2014-4112', 12, 'CCS, ACSM-CEP', 'Specializes in cardiac rehabilitation, pulmonary rehabilitation, and post-COVID recovery programs.', 'active', '2014-02-01'),
      ('Thomas', 'Garcia', 'thomas.garcia@ptclinic.com', '555-2010', 'Vestibular Rehabilitation', 'PT-2019-7234', 7, 'NCS, Vestibular Competency Certified', 'Expert in treating dizziness, vertigo, and balance disorders. Uses advanced assessment technology for vestibular evaluation.', 'active', '2019-10-01'),
      ('Rachel', 'Foster', 'rachel.foster@ptclinic.com', '555-2011', 'Aquatic Therapy', 'PT-2016-5678', 10, 'ATRIC, OCS, Pool Safety Certified', 'Pioneering aquatic therapy programs for orthopedic and neurological conditions. Manages clinic aquatic therapy center.', 'active', '2016-05-01'),
      ('Christopher', 'Lee', 'christopher.lee@ptclinic.com', '555-2012', 'Spine Specialist', 'PT-2009-1845', 17, 'OCS, FAAOMPT, MDT Certified', 'McKenzie-certified spine specialist with extensive experience in disc pathology, spinal stenosis, and post-surgical spine rehab.', 'active', '2009-03-15'),
      ('Maria', 'Santos', 'maria.santos@ptclinic.com', '555-2013', 'Orthopedic Physical Therapy', 'PT-2020-8123', 6, 'OCS Candidate, Dry Needling Certified', 'Passionate about joint replacement rehabilitation and osteoarthritis management. Fluent in English and Spanish.', 'active', '2020-08-01'),
      ('Daniel', 'Wright', 'daniel.wright@ptclinic.com', '555-2014', 'Sports Physical Therapy', 'PT-2015-4556', 11, 'SCS, CSCS, Blood Flow Restriction Certified', 'Works with professional and collegiate athletes. Expertise in ACL reconstruction rehab and throwing athlete injuries.', 'on-leave', '2015-09-01'),
      ('Karen', 'Martinez', 'karen.martinez@ptclinic.com', '555-2015', 'Oncology Rehabilitation', 'PT-2012-3367', 14, 'CLT-LANA, OCS', 'Specializes in cancer rehabilitation, lymphedema management, and survivorship programs. Runs clinic cancer rehab program.', 'active', '2012-06-01'),
      ('Steven', 'Park', 'steven.park@ptclinic.com', '555-2016', 'Wound Care', 'PT-2008-1234', 18, 'CWS, ATP, DPT', 'Expert in wound care, pressure injury management, and advanced wound healing technologies. Clinical director emeritus.', 'inactive', '2008-01-01')
    `);
    console.log('Therapists seeded.');

    // Seed billing (16)
    await client.query(`
      INSERT INTO billing (patient_id, insurance_provider, policy_number, claim_number, service_date, service_type, cpt_code, diagnosis_code, amount, paid_amount, status, notes) VALUES
      (1, 'Blue Cross Blue Shield', 'BCBS-445521', 'CLM-2026-0001', '2026-02-18', 'Physical Therapy Evaluation', '97163', 'M23.611', 250.00, 250.00, 'paid', 'Initial evaluation - ACL reconstruction. High complexity eval.'),
      (1, 'Blue Cross Blue Shield', 'BCBS-445521', 'CLM-2026-0015', '2026-02-20', 'Therapeutic Exercise', '97110', 'M23.611', 150.00, 150.00, 'paid', 'Follow-up session - quad strengthening, ROM exercises.'),
      (2, 'Aetna', 'AET-882234', 'CLM-2026-0002', '2026-02-14', 'Manual Therapy', '97140', 'M75.111', 175.00, 140.00, 'paid', 'Glenohumeral mobilizations, soft tissue work. 80% coverage.'),
      (3, 'UnitedHealthcare', 'UHC-667788', 'CLM-2026-0003', '2026-02-16', 'Therapeutic Exercise', '97110', 'M51.16', 150.00, 150.00, 'paid', 'McKenzie protocol, core stabilization training.'),
      (4, 'Cigna', 'CIG-334455', 'CLM-2026-0004', '2026-02-17', 'Neuromuscular Re-ed', '97112', 'S93.401A', 160.00, 128.00, 'paid', 'Balance and proprioception training. 80% covered.'),
      (5, 'Medicare', 'MED-112233', 'CLM-2026-0005', '2026-02-13', 'Therapeutic Exercise', '97110', 'M17.11', 150.00, 120.00, 'approved', 'Post-TKA strengthening. Medicare 80% rate.'),
      (6, 'Humana', 'HUM-556677', 'CLM-2026-0006', '2026-02-17', 'Manual Therapy', '97140', 'M77.11', 175.00, 0.00, 'submitted', 'Deep friction massage, iontophoresis for lateral epicondylitis.'),
      (7, 'Kaiser Permanente', 'KP-889900', 'CLM-2026-0007', '2026-02-12', 'Manual Therapy', '97140', 'M75.01', 175.00, 175.00, 'paid', 'Aggressive GH mobilizations for adhesive capsulitis. In-network.'),
      (8, 'Anthem', 'ANT-223344', 'CLM-2026-0008', '2026-02-19', 'Therapeutic Exercise', '97110', 'M22.2X1', 150.00, 0.00, 'pending', 'VMO biofeedback, running gait analysis.'),
      (10, 'Blue Cross Blue Shield', 'BCBS-990011', 'CLM-2026-0009', '2026-02-21', 'Therapeutic Exercise', '97110', 'M72.2', 150.00, 0.00, 'submitted', 'Calf stretching, intrinsic foot strengthening for plantar fasciitis.'),
      (11, 'Medicare', 'MED-445566', 'CLM-2026-0010', '2026-03-19', 'Therapeutic Exercise', '97110', 'M16.12', 150.00, 0.00, 'pending', 'Post-THA hip strengthening, gait training. Medicare patient.'),
      (13, 'UnitedHealthcare', 'UHC-778899', 'CLM-2026-0011', '2026-02-19', 'Manual Therapy', '97140', 'G56.01', 175.00, 0.00, 'denied', 'Carpal bone mobilization. Denied: exceeded visit limit. Appeal submitted.'),
      (14, 'Cigna', 'CIG-001122', 'CLM-2026-0012', '2026-02-20', 'Dry Needling', '20560', 'M79.1', 200.00, 160.00, 'paid', 'Dry needling to piriformis. Cigna covers at 80%.'),
      (15, 'Anthem', 'ANT-334455', 'CLM-2026-0013', '2026-02-22', 'PT Evaluation', '97163', 'M23.211', 250.00, 250.00, 'paid', 'Post-meniscectomy initial evaluation. High complexity.'),
      (16, 'Medicare', 'MED-667788', 'CLM-2026-0014', '2026-03-19', 'Neuromuscular Re-ed', '97112', 'I63.512', 160.00, 128.00, 'approved', 'Gait training, balance training for stroke patient. Medicare 80%.'),
      (5, 'Medicare', 'MED-112233', 'CLM-2026-0016', '2026-02-15', 'Manual Therapy', '97140', 'M17.11', 175.00, 140.00, 'paid', 'Patellar mobilization, quad soft tissue mobilization post-TKA.')
    `);
    console.log('Billing seeded.');

    // Seed messages (16)
    await client.query(`
      INSERT INTO messages (patient_id, sender_type, subject, body, is_read, priority, category) VALUES
      (1, 'patient', 'Question about knee exercises', 'Hi Dr. Mitchell, I wanted to ask about the straight leg raises. Should I feel a pulling sensation behind my knee when I do them? I want to make sure I am doing them correctly.', true, 'normal', 'exercise'),
      (1, 'therapist', 'Re: Question about knee exercises', 'Hi Michael, a slight pulling sensation is normal as you stretch the hamstrings. However, if you feel sharp pain in the knee joint itself, stop and let me know. Keep the movement slow and controlled.', true, 'normal', 'exercise'),
      (2, 'system', 'Appointment Reminder', 'This is a reminder that you have an appointment scheduled with Dr. James Rodriguez on March 20, 2026 at 10:30 AM at Main Clinic - Room 1.', false, 'normal', 'appointment'),
      (3, 'patient', 'Work situation update', 'Dr. Chen, my employer is asking when I can return to full duty. The modified duty has been working well. My back feels much better with the press-ups. Can we discuss a timeline?', true, 'high', 'general'),
      (4, 'therapist', 'Great progress today!', 'Maria, I wanted to let you know you did fantastic in todays session. Your balance has improved significantly. Keep up the great work with your home exercises!', true, 'normal', 'progress'),
      (5, 'patient', 'Swelling after exercises', 'Dr. Rodriguez, I noticed more swelling than usual after doing my exercises yesterday. Should I be concerned? I iced it for 20 minutes like you recommended.', false, 'high', 'exercise'),
      (7, 'patient', 'Frustrated with progress', 'Dr. Mitchell, I am feeling discouraged about my shoulder recovery. It seems like it is taking so long. Is this normal for frozen shoulder? I feel like I am doing everything right.', true, 'high', 'general'),
      (7, 'therapist', 'Re: Frustrated with progress', 'James, I completely understand your frustration. Adhesive capsulitis typically takes 12-18 months for full recovery. Your ROM is actually improving steadily. You ARE making progress. Lets discuss more at your next visit.', true, 'normal', 'general'),
      (10, 'therapist', 'Night splint reminder', 'Amanda, just a friendly reminder to keep wearing your night splints consistently. They are really making a difference in your morning pain levels. Your compliance has been excellent!', false, 'normal', 'exercise'),
      (13, 'system', 'Insurance Update', 'Important: Your UnitedHealthcare claim CLM-2026-0011 for carpal tunnel treatment has been denied. Reason: Visit limit exceeded. An appeal has been filed on your behalf.', false, 'urgent', 'billing'),
      (15, 'patient', 'Can I start shooting baskets?', 'Dr. Chen, I am feeling really good at 2 weeks post-op. My knee flexion is getting better every day. When can I start doing light shooting practice? I promise I will take it easy.', false, 'normal', 'exercise'),
      (16, 'therapist', 'Family exercise instruction video', 'Jessica, I have attached instructions for the home exercises we discussed. Please have a family member assist you with the reaching practice. Remember, more repetitions lead to better recovery!', true, 'normal', 'exercise'),
      (8, 'patient', 'Running update', 'Dr. Rodriguez, I ran 2 miles yesterday with zero knee pain! This is the first time in months. Thank you so much for the hip strengthening program. It really works.', true, 'normal', 'progress'),
      (9, 'system', 'Insurance Authorization Approved', 'Good news! Your Tricare insurance has approved continued physical therapy treatment. You are authorized for 12 additional visits through June 2026.', false, 'high', 'billing'),
      (14, 'patient', 'Gym exercise modifications', 'Dr. Rodriguez, can you send me a list of the gym exercise modifications we discussed? I want to make sure I do them correctly when I go to the gym this weekend.', false, 'normal', 'exercise'),
      (6, 'therapist', 'Ergonomic follow-up', 'Sarah, I wanted to check in on the ergonomic changes we made to your workstation last week. Are you finding the keyboard tray position comfortable? Let me know if we need to make any adjustments.', false, 'normal', 'general')
    `);
    console.log('Messages seeded.');

    // Seed exercise videos (16)
    await client.query(`
      INSERT INTO exercise_videos (exercise_id, title, description, video_url, thumbnail_url, duration_seconds, difficulty_level, body_region, instructor_name, view_count, rating) VALUES
      (1, 'Straight Leg Raise - Proper Form Guide', 'Complete tutorial on performing straight leg raises correctly for quad strengthening post-surgery. Includes common mistakes and corrections.', 'https://videos.ptclinic.com/tutorials/slr-guide', 'https://thumbs.ptclinic.com/slr-guide.jpg', 245, 'beginner', 'Lower Extremity', 'Dr. Sarah Mitchell', 1250, 4.8),
      (2, 'Clamshell Exercise Mastery', 'Learn the clamshell exercise for hip strengthening. Covers progressions from basic to advanced with resistance band variations.', 'https://videos.ptclinic.com/tutorials/clamshell', 'https://thumbs.ptclinic.com/clamshell.jpg', 310, 'beginner', 'Hip', 'Dr. James Rodriguez', 980, 4.6),
      (3, 'Pendulum Exercises After Shoulder Surgery', 'Gentle shoulder mobilization technique demonstration. Learn proper body positioning and movement amplitude for post-operative recovery.', 'https://videos.ptclinic.com/tutorials/pendulum', 'https://thumbs.ptclinic.com/pendulum.jpg', 195, 'beginner', 'Shoulder', 'Dr. Emily Chen', 2100, 4.9),
      (5, 'Bird Dog for Core Stability', 'Master the bird dog exercise for core stabilization. Includes progressions and tips for maintaining neutral spine throughout the movement.', 'https://videos.ptclinic.com/tutorials/bird-dog', 'https://thumbs.ptclinic.com/bird-dog.jpg', 280, 'intermediate', 'Core/Spine', 'Dr. Christopher Lee', 875, 4.7),
      (6, 'Single Leg Balance Training Program', 'Progressive balance training protocol from basic single leg stance to advanced perturbation training on unstable surfaces.', 'https://videos.ptclinic.com/tutorials/balance', 'https://thumbs.ptclinic.com/balance.jpg', 420, 'beginner', 'Lower Extremity', 'Dr. Thomas Garcia', 1560, 4.8),
      (7, 'Heel Slides for Knee ROM Recovery', 'Step-by-step guide to heel slides for regaining knee flexion after surgery. Shows towel-assisted technique and progression milestones.', 'https://videos.ptclinic.com/tutorials/heel-slides', 'https://thumbs.ptclinic.com/heel-slides.jpg', 215, 'beginner', 'Knee', 'Dr. Sarah Mitchell', 1890, 4.9),
      (8, 'Prone Press-Up McKenzie Technique', 'Detailed demonstration of the McKenzie prone press-up exercise for lumbar disc management. Covers proper positioning and breathing.', 'https://videos.ptclinic.com/tutorials/press-up', 'https://thumbs.ptclinic.com/press-up.jpg', 260, 'beginner', 'Lumbar Spine', 'Dr. Christopher Lee', 2340, 4.9),
      (9, 'Standing Calf Raises - Complete Guide', 'Comprehensive calf strengthening tutorial covering gastrocnemius and soleus variations. Includes eccentric emphasis for tendinopathy.', 'https://videos.ptclinic.com/tutorials/calf-raises', 'https://thumbs.ptclinic.com/calf-raises.jpg', 290, 'intermediate', 'Ankle/Foot', 'Dr. Rachel Foster', 720, 4.5),
      (10, 'Chin Tucks for Cervical Health', 'Essential exercise for cervical posture correction. Demonstrates proper chin tuck technique for office workers and neck pain patients.', 'https://videos.ptclinic.com/tutorials/chin-tucks', 'https://thumbs.ptclinic.com/chin-tucks.jpg', 180, 'beginner', 'Cervical Spine', 'Dr. Robert Kim', 3200, 4.8),
      (12, 'Lateral Band Walks Tutorial', 'Hip abductor strengthening with resistance bands. Covers proper squat depth, toe alignment, and common compensation patterns to avoid.', 'https://videos.ptclinic.com/tutorials/band-walks', 'https://thumbs.ptclinic.com/band-walks.jpg', 235, 'intermediate', 'Hip', 'Dr. Daniel Wright', 890, 4.6),
      (14, 'Hamstring Stretching with Strap', 'Safe and effective hamstring stretching technique using a strap. Includes modifications for neural tension and sciatic nerve irritation.', 'https://videos.ptclinic.com/tutorials/hamstring', 'https://thumbs.ptclinic.com/hamstring.jpg', 200, 'beginner', 'Lower Extremity', 'Dr. James Rodriguez', 1100, 4.7),
      (15, 'BOSU Ball Squat Progression', 'Advanced balance and strengthening exercise progression on BOSU ball. Safety tips and proper form for challenging proprioception training.', 'https://videos.ptclinic.com/tutorials/bosu', 'https://thumbs.ptclinic.com/bosu.jpg', 350, 'advanced', 'Lower Extremity', 'Dr. Daniel Wright', 560, 4.4),
      (16, 'Wrist Stretches for Carpal Tunnel Relief', 'Complete wrist stretching program for carpal tunnel syndrome. Includes nerve gliding exercises and tendon gliding techniques.', 'https://videos.ptclinic.com/tutorials/wrist-stretch', 'https://thumbs.ptclinic.com/wrist-stretch.jpg', 275, 'beginner', 'Wrist/Hand', 'Dr. David Thompson', 4100, 4.9),
      (17, 'Dead Bug Exercise Breakdown', 'Core stabilization exercise tutorial with focus on maintaining lumbar spine neutral. Covers breathing patterns and common errors.', 'https://videos.ptclinic.com/tutorials/dead-bug', 'https://thumbs.ptclinic.com/dead-bug.jpg', 300, 'intermediate', 'Core', 'Dr. Emily Chen', 670, 4.5),
      (4, 'Wall Slides for Shoulder Mobility', 'Gentle shoulder flexion exercise against a wall. Great for improving overhead reach while maintaining scapular control.', 'https://videos.ptclinic.com/tutorials/wall-slides', 'https://thumbs.ptclinic.com/wall-slides.jpg', 225, 'intermediate', 'Shoulder', 'Dr. Amanda Brooks', 780, 4.6),
      (13, 'Seated Row with Resistance Band', 'Upper back strengthening exercise for posture improvement. Demonstrates proper scapular retraction technique and breathing.', 'https://videos.ptclinic.com/tutorials/seated-row', 'https://thumbs.ptclinic.com/seated-row.jpg', 240, 'intermediate', 'Upper Back', 'Dr. Robert Kim', 920, 4.7)
    `);
    console.log('Exercise videos seeded.');

    // Seed pain assessments (16)
    await client.query(`
      INSERT INTO pain_assessments (patient_id, assessment_date, body_region, pain_level, pain_type, triggers, relieving_factors, functional_impact, duration_of_pain, notes, assessed_by) VALUES
      (1, '2026-02-20 10:00:00', 'Left Knee - Anterior', 3, 'aching', 'Deep knee flexion, prolonged sitting, stairs', 'Ice, elevation, quad sets, rest', 'Difficulty with deep squats and prolonged sitting. Walking and flat surface activities pain-free.', '3 months', 'Post-ACL reconstruction pain improving steadily. No signs of re-injury.', 'Dr. Sarah Mitchell'),
      (2, '2026-02-18 11:00:00', 'Right Shoulder - Lateral', 4, 'sharp', 'Overhead reaching, sleeping on affected side, lifting', 'Pendulum exercises, ice, positioning with pillow', 'Cannot reach overhead. Difficulty dressing. Sleep disrupted 1x per night.', '3 months', 'Post-rotator cuff repair. Sharp pain only at end range. Improving weekly.', 'Dr. James Rodriguez'),
      (3, '2026-02-16 09:00:00', 'Low Back - Central', 5, 'aching', 'Prolonged sitting >30 min, bending forward, lifting', 'Standing extension, walking, prone press-ups, heat', 'Limited sitting tolerance. Modified work duty. Cannot lift >20 lbs.', '6 weeks', 'Radicular symptoms resolved. Pain now centralized to low back only. Good sign.', 'Dr. Emily Chen'),
      (5, '2026-02-15 10:30:00', 'Right Knee - General', 4, 'dull', 'Stairs, getting up from chair, end-range flexion', 'Ice post-exercise, elevation, gentle ROM', 'Requires cane for community ambulation. Stairs step-to pattern only.', '4 months', 'Post-TKA pain consistent with recovery timeline. Effusion minimal.', 'Dr. James Rodriguez'),
      (7, '2026-02-14 11:00:00', 'Left Shoulder - Global', 5, 'aching', 'Any shoulder movement, night, cold weather', 'Heat before exercise, gentle pendulums, NSAIDs', 'Cannot reach overhead, behind back, or across body. Significant ADL limitations.', '6 months', 'Adhesive capsulitis stage 2. Pain with capsular stretching expected. Managing well.', 'Dr. Sarah Mitchell'),
      (9, '2026-02-10 10:00:00', 'Right Neck/Arm', 6, 'burning', 'Cervical extension, right rotation, prolonged desk work', 'Chin tucks, cervical retraction, ergonomic positioning', 'Intermittent numbness/tingling in right hand. Decreased grip endurance. Difficulty with computer work >45 min.', '3 months', 'C5-C6 radiculopathy. Neural symptoms intermittent. Improving with postural correction.', 'Dr. Emily Chen'),
      (10, '2026-02-21 16:00:00', 'Bilateral Feet - Plantar', 4, 'stabbing', 'First steps in morning, prolonged standing, walking >20 min', 'Night splints, ice massage, calf stretching, orthotics', 'Morning pain limiting. Walking limited to 20 minutes. Cannot stand >30 minutes.', '14 months', 'Chronic plantar fasciitis. Morning pain trending down significantly since starting night splints.', 'Dr. Sarah Mitchell'),
      (13, '2026-02-19 14:30:00', 'Bilateral Wrists/Hands', 4, 'burning', 'Repetitive typing, gripping, vibration', 'Night splints, nerve glides, ergonomic modifications, rest breaks', 'Decreased grip strength. Dropping objects occasionally. Night paresthesias disrupting sleep.', '8 months', 'Bilateral CTS. Night symptoms improving with splinting. Phalen test improving.', 'Dr. Sarah Mitchell'),
      (14, '2026-02-20 10:00:00', 'Right Buttock/Posterior Thigh', 4, 'aching', 'Prolonged sitting, hip internal rotation, crossing legs', 'Piriformis stretching, foam rolling, standing breaks', 'Sitting limited to 60 minutes. Gym activities modified. Driving >30 min uncomfortable.', '4 weeks', 'Piriformis syndrome. Sciatic component improving with stretching and dry needling.', 'Dr. James Rodriguez'),
      (16, '2026-02-21 13:00:00', 'Left Shoulder/UE', 3, 'dull', 'Active use of left arm, fatigue, cold', 'Rest, gentle AROM, warmth, positioning', 'Left arm functional use severely limited. Unable to grip objects consistently. Requires assistance with bilateral tasks.', '4 months', 'Post-stroke left hemiparesis. Pain related to spasticity and muscle weakness rather than structural injury.', 'Dr. Sarah Mitchell'),
      (4, '2026-02-19 14:00:00', 'Right Ankle - Lateral', 2, 'aching', 'Uneven surfaces, prolonged standing, running', 'Taping, ice after activity, ankle exercises', 'Jogging on flat surfaces tolerated. Trail running not yet safe. Single leg balance improving.', '4 weeks', 'Grade II ankle sprain resolving well. Pain minimal and only with challenging activities.', 'Dr. Sarah Mitchell'),
      (6, '2026-02-17 13:00:00', 'Right Elbow - Lateral', 3, 'aching', 'Gripping, wrist extension against resistance, typing >2 hours', 'Ice massage, Tyler Twist eccentric program, forearm stretches', 'Typing limited to 2 hours pain-free. Cannot carry heavy bags. Opening jars painful.', '7 months', 'Chronic lateral epicondylitis responding to eccentric protocol. Pain decreasing steadily.', 'Dr. Emily Chen'),
      (8, '2026-02-20 15:00:00', 'Bilateral Knees - Anterior', 3, 'aching', 'Stairs (especially descending), prolonged sitting, running >2 miles', 'Hip strengthening, proper warm-up, foam rolling', 'Running limited to 2 miles. Stairs with occasional discomfort. Prolonged sitting >1 hour uncomfortable.', '8 months', 'Bilateral PFP improving with hip strengthening approach. Pain significantly less than initial evaluation.', 'Dr. James Rodriguez'),
      (11, '2026-03-19 09:30:00', 'Left Hip - Groin', 3, 'dull', 'Prolonged walking, end-range hip flexion, pivoting', 'Ice after activity, hip exercises, positioning', 'Ambulating with cane outdoors. Mild Trendelenburg gait. Most ADLs independent.', '4 months', 'Post-THA recovery. Groin soreness expected with increased activity. No signs of complication.', 'Dr. James Rodriguez'),
      (15, '2026-02-22 11:00:00', 'Right Knee - Medial', 3, 'dull', 'Deep flexion, pivoting movements, morning stiffness', 'Ice and elevation post-exercise, gentle ROM', 'Walking normally on flat. Stairs with mild discomfort. No impact activities yet.', '12 days', 'Post-meniscectomy early recovery. Pain appropriate for timeline. No signs of complications.', 'Dr. Emily Chen'),
      (12, '2025-12-10 10:00:00', 'Left Knee - Lateral', 1, 'dull', 'None currently - previously: running >5 miles, downhill running', 'Hip strengthening maintenance, foam rolling', 'No functional limitations. Running at full pre-injury mileage without symptoms.', '0 - resolved', 'IT band syndrome fully resolved. Ready for discharge. Maintenance program established.', 'Dr. Emily Chen')
    `);
    console.log('Pain assessments seeded.');

    // Seed outcome measures (16)
    await client.query(`
      INSERT INTO outcome_measures (patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes) VALUES
      (1, 'LEFS', 52, 80, 65.0, '2026-02-20 10:00:00', 'Dr. Sarah Mitchell', 'Moderate functional limitation. Improving from post-surgical baseline. On track for expected recovery.', 38, 14, 'Lower Extremity Functional Scale. Significant improvement from initial eval score of 22/80.'),
      (2, 'DASH', 45, 100, 55.0, '2026-02-18 11:00:00', 'Dr. James Rodriguez', 'Moderate upper extremity disability. Expected at 3 months post rotator cuff repair. Improving trajectory.', 62, -17, 'Disabilities of Arm, Shoulder, and Hand. Lower score = better function. Improving well.'),
      (3, 'ODI', 32, 100, 32.0, '2026-02-16 09:00:00', 'Dr. Emily Chen', 'Moderate disability. Significant improvement since radicular symptoms resolved. Function improving.', 54, -22, 'Oswestry Disability Index. Lower = better. Dropped from severe to moderate disability.'),
      (5, 'LEFS', 45, 80, 56.3, '2026-02-15 10:30:00', 'Dr. James Rodriguez', 'Moderate-severe functional limitation. Consistent with 4 months post-TKA. Quad weakness primary limiting factor.', 30, 15, 'LEFS improving steadily. Expect continued gains with strengthening progression.'),
      (7, 'DASH', 68, 100, 32.0, '2026-02-14 11:00:00', 'Dr. Sarah Mitchell', 'Severe upper extremity disability consistent with stage 2 adhesive capsulitis. Slow but measurable improvement.', 75, -7, 'DASH score improving slowly. Consistent with natural history of adhesive capsulitis.'),
      (8, 'LEFS', 60, 80, 75.0, '2026-02-20 15:00:00', 'Dr. James Rodriguez', 'Mild functional limitation. Significant improvement with hip strengthening approach. Running return progressing.', 42, 18, 'LEFS reflects good functional recovery. Patient returning to running successfully.'),
      (10, 'LEFS', 50, 80, 62.5, '2026-02-21 16:00:00', 'Dr. Sarah Mitchell', 'Moderate functional limitation due to bilateral plantar fasciitis. Walking tolerance improving with treatment.', 35, 15, 'LEFS improving as morning pain decreases and walking tolerance increases.'),
      (11, 'LEFS', 48, 80, 60.0, '2026-03-19 09:30:00', 'Dr. James Rodriguez', 'Moderate limitation. Good progress for 4 months post-THA. Approaching community-level independence.', 32, 16, 'Steady improvement. Golf-specific function not yet captured in LEFS score.'),
      (12, 'LEFS', 78, 80, 97.5, '2025-12-10 10:00:00', 'Dr. Emily Chen', 'Near-normal function. Meets discharge criteria. Full return to marathon training without symptoms.', 55, 23, 'Excellent outcome. Full recovery from IT band syndrome. Discharge appropriate.'),
      (13, 'DASH', 52, 100, 48.0, '2026-02-19 14:30:00', 'Dr. Sarah Mitchell', 'Moderate upper extremity disability. Bilateral CTS limiting grip and fine motor function. Conservative management showing progress.', 65, -13, 'DASH improving with conservative CTS management. Night symptoms improving.'),
      (14, 'ODI', 24, 100, 24.0, '2026-02-20 10:00:00', 'Dr. James Rodriguez', 'Mild disability. Piriformis syndrome responding to treatment. Functional activities improving.', 42, -18, 'ODI dropped from moderate to mild disability. Excellent response to dry needling and stretching.'),
      (15, 'LEFS', 42, 80, 52.5, '2026-02-22 11:00:00', 'Dr. Emily Chen', 'Moderate limitation at 12 days post-meniscectomy. Excellent early progress for post-surgical timeline.', NULL, NULL, 'Initial LEFS post-surgery. Will track improvement over coming weeks.'),
      (16, 'FIM', 85, 126, 67.5, '2026-02-21 13:00:00', 'Dr. Sarah Mitchell', 'Moderate assistance needed. Motor scores improving. Cognitive scores near normal. Gait and UE function primary areas of limitation.', 68, 17, 'Functional Independence Measure improving. Motor recovery driving gains.'),
      (16, 'BERG', 32, 56, 57.1, '2026-02-21 13:00:00', 'Dr. Sarah Mitchell', 'Moderate fall risk. Balance improving but remains impaired. AFO assisting with stability. Continue intensive balance training.', 22, 10, 'Berg Balance Scale improved 10 points. Moving toward low fall risk category (>41).'),
      (3, 'VAS', 5, 10, 50.0, '2026-02-16 09:00:00', 'Dr. Emily Chen', 'Moderate pain on Visual Analog Scale. Improved from initial 8/10. Consistent with centralization of symptoms.', 8, -3, 'VAS pain decreasing as symptoms centralize. Good prognostic indicator.'),
      (9, 'NDI', 38, 100, 38.0, '2026-02-10 10:00:00', 'Dr. Emily Chen', 'Moderate disability on Neck Disability Index. Cervical radiculopathy symptoms stable. Will reassess when treatment resumes.', 48, -10, 'NDI showing improvement despite treatment pause. Home program maintaining gains.')
    `);
    console.log('Outcome measures seeded.');

    // Seed waitlist
    await client.query(`
      INSERT INTO waitlist (patient_id, preferred_therapist, preferred_time, reason, priority, status, notes, requested_date) VALUES
      (9, 'Dr. Emily Chen', 'Morning', 'Resume cervical radiculopathy treatment after insurance authorization', 'high', 'waiting', 'Insurance approved 3/18. Needs to resume ASAP.', '2026-03-18 10:00:00'),
      (12, 'Dr. Emily Chen', 'Afternoon', 'New complaint - hip pain during marathon training', 'normal', 'waiting', 'Previously discharged for IT band. New issue may be related.', '2026-03-19 14:00:00'),
      (4, 'Dr. Sarah Mitchell', 'Any', 'Additional session for return-to-sport testing', 'normal', 'waiting', 'Wants clearance testing before trail race in April.', '2026-03-20 09:00:00'),
      (16, 'Dr. Sarah Mitchell', 'Morning', 'Extra neuro rehab session requested by family', 'high', 'waiting', 'Family requesting increased frequency due to recent gains.', '2026-03-17 08:00:00'),
      (7, 'Dr. Sarah Mitchell', 'Any', 'Manual therapy session - shoulder stiffness worsening', 'urgent', 'waiting', 'Patient called reporting increased stiffness and night pain.', '2026-03-21 07:30:00'),
      (14, 'Dr. James Rodriguez', 'Afternoon', 'Flare-up of sciatic symptoms after long drive', 'high', 'contacted', 'Left voicemail 3/20. Awaiting callback to schedule.', '2026-03-20 16:00:00')
    `);
    console.log('Waitlist seeded.');

    console.log('\nSeeding complete! All tables populated with realistic data.');
    console.log('Demo user: admin@ptclinic.com / password123');

  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
