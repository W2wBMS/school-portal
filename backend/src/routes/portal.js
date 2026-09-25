const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const FeeLedger = require('../models/FeeLedger');
const Result = require('../models/Result');
const { audit } = require('../utils/audit');
const { calculateAcademicSummary } = require('../utils/academics');

const router = express.Router();

function gradeForScore(score) {
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function validScore(score) {
  return Number.isFinite(Number(score)) && Number(score) >= 0 && Number(score) <= 100;
}

function calculateScore(components) {
  if (!components || typeof components !== 'object' || Array.isArray(components)) return null;
  let ranges = {};
  try { ranges = JSON.parse(process.env.RESULT_COMPONENT_RANGES || '{}'); } catch { return null; }
  const values = Object.entries(components).map(([name, value]) => ({ name, value: Number(value), max: Number(ranges[name] ?? 100) }));
  if (!values.length || values.some(({ value, max }) => !Number.isFinite(value) || value < 0 || value > max)) return null;
  const total = values.reduce((sum, item) => sum + item.value, 0);
  return total <= 100 ? total : null;
}

async function canEnterResult(user, courseId) {
  if (['academic_officer', 'department_admin', 'system_admin', 'super_admin'].includes(user.role)) return true;
  if (user.role !== 'lecturer') return false;
  const course = await Course.findOne({ _id: courseId, lecturerId: user._id });
  return Boolean(course);
}

function canManageAllAttendance(user) {
  return ['department_admin', 'academic_officer', 'system_admin', 'super_admin'].includes(user.role);
}

async function canManageAttendance(user, courseId) {
  if (canManageAllAttendance(user)) return true;
  if (user.role !== 'lecturer') return false;
  return Boolean(await Course.exists({ _id: courseId, lecturerId: user._id }));
}

router.get('/student-overview', protect, async (req, res) => {
  const profile = await StudentProfile.findOne({ userId: req.user._id });
  const results = await Result.find({ studentId: req.user._id, approved: { $ne: false } }).populate('courseId').sort({ semester: 1, createdAt: 1 });
  const attendance = await Attendance.find({ studentId: req.user._id }).populate('courseId');
  const feeLedger = await FeeLedger.find({ studentId: req.user._id }).sort({ createdAt: -1 });

  const normalizedResults = results.map((result) => ({ ...result.toObject(), level: result.level || profile?.level || '', academicYear: result.academicYear || process.env.CURRENT_ACADEMIC_YEAR || '2025/2026' }));
  const academicSummary = calculateAcademicSummary(normalizedResults);
  return res.json({
    profile: profile ? { ...profile.toObject(), cgpa: academicSummary.cgpa, creditsCompleted: academicSummary.totalCredits } : profile,
    results: normalizedResults,
    attendance,
    feeLedger,
    academicSummary,
  });
});

router.get('/courses', protect, async (req, res) => {
  const courses = await Course.find().populate('lecturerId', 'fullName email');
  return res.json({ courses });
});

router.post('/courses', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const course = await Course.create(req.body);
  return res.status(201).json({ course });
});

router.patch('/courses/:id', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!course) return res.status(404).json({ message: 'Course not found' });
  return res.json({ course });
});

router.delete('/courses/:id', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  return res.json({ message: 'Course deleted' });
});

router.get('/attendance', protect, authorize('lecturer', 'department_admin', 'student_affairs', 'system_admin', 'super_admin', 'academic_officer'), async (req, res) => {
  const filter = req.user.role === 'lecturer'
    ? { courseId: { $in: await Course.find({ lecturerId: req.user._id }).distinct('_id') } }
    : {};
  const attendance = await Attendance.find(filter).populate('studentId', 'fullName email').populate('courseId', 'code title');
  return res.json({ attendance });
});

router.post('/attendance', protect, authorize('lecturer', 'department_admin', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  const percentage = Number(req.body.percentage);
  if (!req.body.studentId || !req.body.courseId || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return res.status(400).json({ message: 'Student, course, and a percentage from 0 to 100 are required' });
  }
  if (!(await canManageAttendance(req.user, req.body.courseId))) return res.status(403).json({ message: 'You are not authorized to manage this course attendance' });
  const attendance = await Attendance.create({ ...req.body, percentage });
  return res.status(201).json({ attendance });
});

router.patch('/attendance/:id', protect, authorize('lecturer', 'department_admin', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  const current = await Attendance.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Attendance record not found' });
  if (!(await canManageAttendance(req.user, current.courseId))) return res.status(403).json({ message: 'You are not authorized to manage this course attendance' });
  if (req.body.percentage !== undefined && (!Number.isFinite(Number(req.body.percentage)) || Number(req.body.percentage) < 0 || Number(req.body.percentage) > 100)) {
    return res.status(400).json({ message: 'Percentage must be from 0 to 100' });
  }
  const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
  return res.json({ attendance });
});

router.delete('/attendance/:id', protect, authorize('department_admin', 'student_affairs', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  const attendance = await Attendance.findByIdAndDelete(req.params.id);
  if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
  return res.json({ message: 'Attendance record deleted' });
});

router.get('/fees', protect, authorize('finance_officer', 'department_admin', 'system_admin', 'super_admin', 'student'), async (req, res) => {
  const filter = req.user.role === 'student' ? { studentId: req.user._id } : {};
  const fees = await FeeLedger.find(filter).populate('studentId', 'fullName email');
  return res.json({ fees });
});

router.get('/results', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin', 'lecturer', 'student'), async (req, res) => {
  const filter = req.user.role === 'student' ? { studentId: req.user._id, approved: { $ne: false } } : {};
  const results = await Result.find(filter).populate('studentId', 'fullName email').populate('courseId', 'code title credits').sort({ semester: 1, createdAt: 1 });
  return res.json({ results });
});

router.post('/results', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin', 'lecturer'), async (req, res) => {
  const { studentId, courseId, score, scoreComponents, semester = 'Semester 1', level, academicYear = process.env.CURRENT_ACADEMIC_YEAR || '2025/2026' } = req.body;
  const calculatedScore = scoreComponents ? calculateScore(scoreComponents) : Number(score);
  if (!studentId || !courseId || !validScore(calculatedScore)) return res.status(400).json({ message: 'Student, course, and valid score components are required' });
  if (!(await canEnterResult(req.user, courseId))) return res.status(403).json({ message: 'You are not authorized to enter results for this course' });
  const student = await User.findById(studentId).select('level');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const resultLevel = level || student.level || '';
  const duplicate = await Result.exists({ studentId, courseId, semester, level: resultLevel, academicYear });
  if (duplicate) return res.status(409).json({ message: 'A result already exists for this student, course, and semester' });
  const result = await Result.create({ studentId, courseId, score: calculatedScore, scoreComponents: scoreComponents || {}, grade: gradeForScore(calculatedScore), semester, level: resultLevel, academicYear, approved: false });
  await audit({ actorId: req.user._id, action: 'result.submitted', entity: 'Result', entityId: result._id, after: result.toObject() });
  const populated = await Result.findById(result._id)
    .populate('studentId', 'fullName email')
    .populate('courseId', 'code title credits');
  return res.status(201).json({ result: populated });
});

router.patch('/results/:id', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin', 'lecturer'), async (req, res) => {
  const current = await Result.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Result record not found' });
  if (current.finalized) return res.status(409).json({ message: 'Finalized grades require the correction workflow' });
  if (!(await canEnterResult(req.user, current.courseId))) return res.status(403).json({ message: 'You are not authorized to update this result' });
  const calculatedScore = req.body.scoreComponents ? calculateScore(req.body.scoreComponents) : Number(req.body.score);
  if (!validScore(calculatedScore)) return res.status(400).json({ message: 'Score or score components must be within configured ranges' });
  const result = await Result.findByIdAndUpdate(req.params.id, { score: calculatedScore, scoreComponents: req.body.scoreComponents || current.scoreComponents, grade: gradeForScore(calculatedScore) }, { new: true, runValidators: true });
  if (!result) return res.status(404).json({ message: 'Result record not found' });
  await audit({ actorId: req.user._id, action: 'result.updated', entity: 'Result', entityId: result._id, before: current.toObject(), after: result.toObject() });
  const populated = await Result.findById(result._id)
    .populate('studentId', 'fullName email')
    .populate('courseId', 'code title credits');
  return res.json({ result: populated });
});

router.post('/results/:id/approve', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const current = await Result.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Result record not found' });
  const result = await Result.findByIdAndUpdate(req.params.id, { approved: true, finalized: true, approvedBy: req.user._id, approvedAt: new Date() }, { new: true });
  await audit({ actorId: req.user._id, action: 'result.approved_and_finalized', entity: 'Result', entityId: result._id, before: current.toObject(), after: result.toObject() });
  return res.json({ result });
});

router.post('/results/:id/correct', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const current = await Result.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Result record not found' });
  if (!current.finalized) return res.status(409).json({ message: 'Use the normal result update workflow before finalization' });
  if (!req.body.reason || !validScore(req.body.score)) return res.status(400).json({ message: 'Correction reason and score from 0 to 100 are required' });
  const result = await Result.findByIdAndUpdate(req.params.id, { score: Number(req.body.score), grade: gradeForScore(Number(req.body.score)), approved: false, finalized: false, correctionReason: req.body.reason, approvedBy: null, approvedAt: null }, { new: true, runValidators: true });
  await audit({ actorId: req.user._id, action: 'result.corrected', entity: 'Result', entityId: result._id, before: current.toObject(), after: result.toObject(), metadata: { reason: req.body.reason } });
  return res.json({ result });
});

router.delete('/results/:id', protect, authorize('academic_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const existing = await Result.findById(req.params.id);
  if (existing?.finalized) return res.status(409).json({ message: 'Finalized grades require the correction workflow' });
  const result = await Result.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ message: 'Result record not found' });
  return res.json({ message: 'Result deleted' });
});

router.post('/fees', protect, authorize('finance_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const amountDue = Number(req.body.amountDue);
  const amountPaid = Number(req.body.amountPaid || 0);
  if (!req.body.studentId || !req.body.invoiceNumber || !Number.isFinite(amountDue) || amountDue < 0 || !Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > amountDue) {
    return res.status(400).json({ message: 'Valid student, invoice, amount due, and amount paid are required' });
  }
  const balance = amountDue - amountPaid;
  const fee = await FeeLedger.create({ ...req.body, amountDue, amountPaid, balance, status: balance === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid' });
  return res.status(201).json({ fee });
});

router.patch('/fees/:id', protect, authorize('finance_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const updates = { ...req.body };
  if (updates.amountDue !== undefined || updates.amountPaid !== undefined) {
    const current = await FeeLedger.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Fee record not found' });
    const amountDue = Number(updates.amountDue ?? current.amountDue);
    const amountPaid = Number(updates.amountPaid ?? current.amountPaid);
    if (!Number.isFinite(amountDue) || amountDue < 0 || !Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > amountDue) {
      return res.status(400).json({ message: 'Amount paid must be between zero and amount due' });
    }
    updates.amountDue = amountDue;
    updates.amountPaid = amountPaid;
    updates.balance = amountDue - amountPaid;
    updates.status = updates.balance === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
  }
  const fee = await FeeLedger.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!fee) return res.status(404).json({ message: 'Fee record not found' });
  return res.json({ fee });
});

router.delete('/fees/:id', protect, authorize('finance_officer', 'department_admin', 'system_admin', 'super_admin'), async (req, res) => {
  const fee = await FeeLedger.findByIdAndDelete(req.params.id);
  if (!fee) return res.status(404).json({ message: 'Fee record not found' });
  return res.json({ message: 'Fee record deleted' });
});

module.exports = router;
