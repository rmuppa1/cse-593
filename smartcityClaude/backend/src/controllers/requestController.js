const { prisma, asyncHandler, toInt } = require('../utils/helpers');

const TYPES = ['STREETLIGHT', 'POTHOLE', 'GRAFFITI', 'WATER_LEAK', 'NOISE', 'OTHER'];
const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const include = {
  reporter: { select: { id: true, name: true, email: true } },
};

// Admins and managers (any department): every request. Citizens: their own reports.
const scopeOf = (user) => (user.role === 'CITIZEN' ? { reporterId: user.id } : {});

const createRequest = asyncHandler(async (req, res) => {
  const { type, title, description, location, latitude, longitude } = req.body;
  if (!TYPES.includes(type)) return res.status(400).json({ message: 'Invalid request type' });
  if (!title?.trim() || !description?.trim() || !location?.trim()) {
    return res.status(400).json({ message: 'Title, description and location are required' });
  }
  const lat = latitude === '' || latitude == null ? null : Number(latitude);
  const lng = longitude === '' || longitude == null ? null : Number(longitude);
  if ((lat != null && isNaN(lat)) || (lng != null && isNaN(lng))) {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }
  const request = await prisma.serviceRequest.create({
    data: {
      type, title: title.trim(), description: description.trim(), location: location.trim(),
      latitude: lat, longitude: lng, reporterId: req.user.id,
    },
    include,
  });
  res.status(201).json(request);
});

// GET /api/requests?status=&type=&assigneeId=
const getRequests = asyncHandler(async (req, res) => {
  const { status, type, assigneeId } = req.query;
  const where = { ...scopeOf(req.user) };
  if (STATUSES.includes(status)) where.status = status;
  if (TYPES.includes(type)) where.type = type;
  if (req.user.role !== 'CITIZEN' && assigneeId === 'none') where.assigneeName = null;
  if (req.user.role !== 'CITIZEN' && assigneeId === 'any') where.assigneeName = { not: null };
  res.json(await prisma.serviceRequest.findMany({ where, include, orderBy: { createdAt: 'desc' } }));
});

const getRequest = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const request = await prisma.serviceRequest.findFirst({
    where: { id: id ?? -1, ...scopeOf(req.user) },
    include,
  });
  if (!request) return res.status(404).json({ message: 'Request not found' });
  res.json(request);
});

// PATCH /api/requests/:id/assign  (ADMIN, MANAGER) { assigneeName, priority? }
// Assigns to a person by name (need not be registered); an empty name unassigns. Priority is admin-only.
const assignRequest = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const { assigneeName, priority } = req.body;
  const data = {};

  const exists = await prisma.serviceRequest.findFirst({ where: { id: id ?? -1, ...scopeOf(req.user) } });
  if (!exists) return res.status(404).json({ message: 'Request not found' });

  if (assigneeName !== undefined) {
    data.assigneeName = String(assigneeName ?? '').trim().slice(0, 100) || null;
  }
  if (priority !== undefined) {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Only admins can change priority' });
    if (!PRIORITIES.includes(priority)) return res.status(400).json({ message: 'Invalid priority' });
    data.priority = priority;
  }
  res.json(await prisma.serviceRequest.update({ where: { id }, data, include }));
});

// PATCH /api/requests/:id/status  (ADMIN, MANAGER) { status, managerNote? }
const updateStatus = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const { status, managerNote } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const request = await prisma.serviceRequest.findFirst({ where: { id: id ?? -1, ...scopeOf(req.user) } });
  if (!request) return res.status(404).json({ message: 'Request not found' });
  const data = { status, resolvedAt: status === 'RESOLVED' ? new Date() : null };
  if (managerNote !== undefined) data.managerNote = managerNote?.trim() || null;
  res.json(await prisma.serviceRequest.update({ where: { id }, data, include }));
});

// GET /api/requests/stats  (ADMIN, MANAGER) -> dashboard numbers
const getStats = asyncHandler(async (req, res) => {
  const scope = scopeOf(req.user);
  const [byStatus, byType, totalEvents, totalRsvps, resolved] = await Promise.all([
    prisma.serviceRequest.groupBy({ by: ['status'], where: scope, _count: true }),
    prisma.serviceRequest.groupBy({ by: ['type'], where: scope, _count: true }),
    prisma.event.count(),
    prisma.eventRSVP.count(),
    prisma.serviceRequest.findMany({ where: { ...scope, status: 'RESOLVED', resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } }),
  ]);
  const avgResolutionHours = resolved.length
    ? Math.round(resolved.reduce((s, r) => s + (r.resolvedAt - r.createdAt), 0) / resolved.length / 36e5)
    : null;
  const status = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  byStatus.forEach((r) => (status[r.status] = r._count));
  res.json({
    status,
    total: Object.values(status).reduce((a, b) => a + b, 0),
    byType: byType.map((r) => ({ type: r.type, count: r._count })),
    totalEvents,
    totalRsvps,
    avgResolutionHours,
  });
});

module.exports = { createRequest, getRequests, getRequest, assignRequest, updateStatus, getStats };
