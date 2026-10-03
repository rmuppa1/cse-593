const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma, publicUser, asyncHandler, toInt, DEPARTMENT_TYPES } = require('../utils/helpers');


const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Public registration creates a CITIZEN or MANAGER (with a department).
// The account cannot log in until an admin approves it.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'CITIZEN', department } = req.body;
  if (!name?.trim() || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (!['CITIZEN', 'MANAGER'].includes(role)) return res.status(400).json({ message: 'Invalid account type' });
  if (role === 'MANAGER' && !Object.keys(DEPARTMENT_TYPES).includes(department)) {
    return res.status(400).json({ message: 'Managers must choose a department' });
  }

  const normalized = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalized } })) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  await prisma.user.create({
    data: {
      name: name.trim(), email: normalized, password: await bcrypt.hash(password, 10), role,
      department: role === 'MANAGER' ? department : null, approved: false,
    },
  });
  res.status(201).json({ pending: true, message: 'Registration received. An administrator must approve your account before you can log in.' });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.approved) return res.status(403).json({ message: 'Your account is awaiting administrator approval.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || !user.approved) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

// Admin: registrations waiting for approval.
const listPending = asyncHandler(async (req, res) => {
  res.json(await prisma.user.findMany({
    where: { approved: false },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  }));
});

const approveUser = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: id ?? -1 } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await prisma.user.update({ where: { id }, data: { approved: true } });
  res.json({ ok: true });
});

// Rejecting removes the pending registration (only allowed while unapproved).
const rejectUser = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: id ?? -1 } });
  if (!user || user.approved) return res.status(404).json({ message: 'Pending registration not found' });
  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

// Admin: create a staff account (pre-approved).
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !['ADMIN', 'MANAGER'].includes(role)) {
    return res.status(400).json({ message: 'Name, email, password and a valid staff role are required' });
  }
  if (role === 'MANAGER' && !Object.keys(DEPARTMENT_TYPES).includes(department)) {
    return res.status(400).json({ message: 'Managers need a department' });
  }
  const normalized = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalized } })) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const user = await prisma.user.create({
    data: {
      name, email: normalized, password: await bcrypt.hash(password, 10), role, approved: true,
      department: role === 'MANAGER' ? department : null,
    },
  });
  res.status(201).json({ user: publicUser(user) });
});

module.exports = { register, login, me, listPending, approveUser, rejectUser, createStaff };
