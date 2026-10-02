const prisma = require('../utils/prismaClient');

const REQUIRED_FIELDS = ['title', 'description', 'category', 'location'];
const STATUS_UPDATE_VALUES = ['IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function userSelect() {
  return { select: { id: true, name: true, email: true, department: true } };
}

function buildPagination(page, limit) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
}

function buildFilterWhere({ status, category, priority, startDate, endDate }) {
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  return where;
}

// GET /api/requests
async function getAllRequests(req, res) {
  try {
    const { status, category, priority, startDate, endDate, page = 1, limit = 10 } = req.query;
    const { role, id, department } = req.user;

    const where = buildFilterWhere({ status, category, priority, startDate, endDate });

    if (role === 'CITIZEN') {
      where.submittedById = id;
    } else if (role === 'DEPT_MANAGER') {
      where.department = department;
    }
    // CITY_ADMIN sees all requests, no extra filter

    const { pageNum, limitNum, skip } = buildPagination(page, limit);

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: { submittedBy: userSelect() },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return res.status(200).json({
      requests,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch requests', error: err.message });
  }
}

// GET /api/requests/:id
async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { submittedBy: userSelect() },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (role === 'CITIZEN' && request.submittedById !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have access to this request' });
    }

    return res.status(200).json({ request });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch request', error: err.message });
  }
}

// POST /api/requests
async function createRequest(req, res) {
  try {
    const { title, description, category, location, priority, department } = req.body;

    const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        title,
        description,
        category,
        location,
        priority: priority || 'MEDIUM',
        department: department || null,
        status: 'SUBMITTED',
        submittedById: req.user.id,
      },
    });

    return res.status(201).json({ request });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create request', error: err.message });
  }
}

// PUT /api/requests/:id/status - requires DEPT_MANAGER or CITY_ADMIN
async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status || !STATUS_UPDATE_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUS_UPDATE_VALUES.join(', ')}`,
      });
    }

    const existingRequest = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existingRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        ...(resolutionNotes !== undefined && { resolutionNotes }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    return res.status(200).json({ request });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update request status', error: err.message });
  }
}

// PUT /api/requests/:id/assign - requires DEPT_MANAGER or CITY_ADMIN
// The assignee does not need to be a registered user - a free-text name is accepted
async function assignRequest(req, res) {
  try {
    const { id } = req.params;
    const { assignedToName, department } = req.body;

    if (!assignedToName || !department) {
      return res.status(400).json({ success: false, message: 'assignedToName and department are required' });
    }

    const existingRequest = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existingRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = await prisma.serviceRequest.update({
      where: { id },
      data: {
        assignedToName,
        department,
        status: 'ASSIGNED',
      },
    });

    return res.status(200).json({ request });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to assign request', error: err.message });
  }
}

// GET /api/requests/my
async function getMyRequests(req, res) {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { submittedById: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch your requests', error: err.message });
  }
}

// GET /api/requests/department - requires DEPT_MANAGER
async function getDepartmentRequests(req, res) {
  try {
    const { department } = req.user;

    const requests = await prisma.serviceRequest.findMany({
      where: { department },
      orderBy: { createdAt: 'desc' },
      include: { submittedBy: userSelect() },
    });

    return res.status(200).json({ requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch department requests', error: err.message });
  }
}

// GET /api/requests/stats - requires DEPT_MANAGER or CITY_ADMIN
// Managers only see stats scoped to their own department; admins see city-wide stats
async function getRequestStats(req, res) {
  try {
    const { role, department } = req.user;
    const where = role === 'DEPT_MANAGER' ? { department } : {};

    const [total, byStatus, byCategory, byPriority, byDepartment, resolvedRequests] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.groupBy({ by: ['status'], where, _count: { status: true } }),
      prisma.serviceRequest.groupBy({ by: ['category'], where, _count: { category: true } }),
      prisma.serviceRequest.groupBy({ by: ['priority'], where, _count: { priority: true } }),
      prisma.serviceRequest.groupBy({
        by: ['department'],
        where: { ...where, department: { not: null } },
        _count: { department: true },
      }),
      prisma.serviceRequest.findMany({
        where: { ...where, status: 'RESOLVED', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    const avgResolutionTime = resolvedRequests.length
      ? resolvedRequests.reduce((sum, r) => sum + (r.resolvedAt - r.createdAt), 0) /
        resolvedRequests.length /
        (1000 * 60 * 60)
      : 0;

    return res.status(200).json({
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.category })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.priority })),
      byDepartment: byDepartment.map((d) => ({ department: d.department, count: d._count.department })),
      avgResolutionTimeHours: Math.round(avgResolutionTime * 100) / 100,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch request stats', error: err.message });
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignRequest,
  getMyRequests,
  getDepartmentRequests,
  getRequestStats,
};
