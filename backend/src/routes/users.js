const express = require('express');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  return res.json({ user: req.user });
});

router.get('/', protect, authorize('student_affairs', 'department_admin', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return res.json({ users });
});

router.post('/', protect, authorize('student_affairs', 'department_admin', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  const allowedRoles = ['student', 'lecturer'];
  const requestedRole = req.body.role || 'student';
  if (!allowedRoles.includes(requestedRole) && !['system_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only system administrators can create privileged users' });
  }
  const user = await User.create({ ...req.body, role: requestedRole });
  if (requestedRole === 'student') {
    await StudentProfile.create({
      userId: user._id,
      studentId: user.studentId || `STU-${user._id.toString().slice(-8).toUpperCase()}`,
      fullName: user.fullName,
      email: user.email,
      programme: user.programme || undefined,
      department: user.department || undefined,
      level: user.level || undefined,
    });
  }
  return res.status(201).json({ user: user.toPublicJSON() });
});

router.patch('/:id', protect, authorize('student_affairs', 'department_admin', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  const updates = { ...req.body };
  delete updates.password;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user });
});

router.delete('/:id', protect, authorize('student_affairs', 'department_admin', 'academic_officer', 'system_admin', 'super_admin'), async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'User deleted' });
});

module.exports = router;
