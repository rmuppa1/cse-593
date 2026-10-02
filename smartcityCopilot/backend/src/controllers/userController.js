const prisma = require('../utils/prismaClient');

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    approvalStatus: user.approvalStatus,
    createdAt: user.createdAt,
  };
}

// GET /api/users - requires CITY_ADMIN
async function getAllUsers(req, res) {
  try {
    const { role, approvalStatus } = req.query;
    const where = {};
    if (role) where.role = role;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });

    return res.status(200).json({ users: users.map(sanitizeUser) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message });
  }
}

module.exports = { getAllUsers };
