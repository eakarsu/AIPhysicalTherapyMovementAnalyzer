const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reports/overview - Clinic overview stats
router.get('/overview', async (req, res) => {
  try {
    const [
      patientStats,
      appointmentStats,
      recoveryStats,
      conditionBreakdown,
      therapistWorkload,
      recentActivity,
      complianceStats,
      weeklyAppointments
    ] = await Promise.all([
      // Patient counts by status
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'on-hold') as on_hold,
          COUNT(*) FILTER (WHERE status = 'discharged') as discharged
        FROM patients
      `),
      // Appointment stats
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE status = 'no-show') as no_show,
          COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE AND appointment_date < CURRENT_DATE + INTERVAL '7 days') as upcoming_week
        FROM appointments
      `),
      // Average recovery metrics
      pool.query(`
        SELECT
          ROUND(AVG(pain_level), 1) as avg_pain,
          ROUND(AVG(mobility_score), 1) as avg_mobility,
          ROUND(AVG(strength_score), 1) as avg_strength,
          COUNT(*) as total_assessments
        FROM recovery_progress
      `),
      // Top conditions
      pool.query(`
        SELECT condition, COUNT(*) as count
        FROM patients
        WHERE condition IS NOT NULL AND condition != ''
        GROUP BY condition
        ORDER BY count DESC
        LIMIT 10
      `),
      // Therapist workload
      pool.query(`
        SELECT
          therapist_name,
          COUNT(*) as total_appointments,
          COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM appointments
        WHERE therapist_name IS NOT NULL AND therapist_name != ''
        GROUP BY therapist_name
        ORDER BY total_appointments DESC
      `),
      // Recent activity (last 10 treatment notes)
      pool.query(`
        SELECT tn.id, tn.note_date, tn.therapist_name, p.name as patient_name, tn.assessment
        FROM treatment_notes tn
        LEFT JOIN patients p ON tn.patient_id = p.id
        ORDER BY tn.note_date DESC
        LIMIT 10
      `),
      // HEP compliance stats
      pool.query(`
        SELECT
          ROUND(AVG(compliance_rate), 1) as avg_compliance,
          COUNT(*) FILTER (WHERE compliance_rate >= 80) as high_compliance,
          COUNT(*) FILTER (WHERE compliance_rate >= 50 AND compliance_rate < 80) as moderate_compliance,
          COUNT(*) FILTER (WHERE compliance_rate < 50) as low_compliance,
          COUNT(*) as total_programs
        FROM home_exercise_programs
        WHERE status = 'active'
      `),
      // Appointments by day of week (last 30 days)
      pool.query(`
        SELECT
          TO_CHAR(appointment_date, 'Dy') as day_name,
          EXTRACT(DOW FROM appointment_date) as day_num,
          COUNT(*) as count
        FROM appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY day_name, day_num
        ORDER BY day_num
      `)
    ]);

    res.json({
      patients: patientStats.rows[0],
      appointments: appointmentStats.rows[0],
      recovery: recoveryStats.rows[0],
      conditions: conditionBreakdown.rows,
      therapistWorkload: therapistWorkload.rows,
      recentActivity: recentActivity.rows,
      compliance: complianceStats.rows[0],
      weeklyAppointments: weeklyAppointments.rows
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

module.exports = router;
