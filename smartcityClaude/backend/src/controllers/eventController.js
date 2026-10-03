const { prisma, asyncHandler, toInt } = require('../utils/helpers');

const CATEGORIES = ['COMMUNITY_SERVICE', 'SPORTS', 'PUBLIC_SAFETY', 'EDUCATION', 'ENVIRONMENT', 'CULTURAL'];

const withCounts = (e, userId) => {
  const { rsvps, _count, ...rest } = e;
  return {
    ...rest,
    price: rest.price != null ? Number(rest.price) : null,
    rsvpCount: _count.rsvps,
    attending: userId ? rsvps.some((r) => r.userId === userId) : false,
  };
};

// GET /api/events?category=&search=&location=&free=&dateFrom=&dateTo=&upcoming=&sort=date|popularity
const getEvents = asyncHandler(async (req, res) => {
  const { category, search, location, free, dateFrom, dateTo, sort } = req.query;
  const where = {};
  if (req.user?.role !== 'ADMIN') where.blocked = false; // blocked content is admin-only

  if (category && CATEGORIES.includes(category)) where.category = category;
  if (free === 'true') where.isFree = true;
  if (free === 'false') where.isFree = false;
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  const from = dateFrom ? new Date(dateFrom) : null;
  const to = dateTo ? new Date(dateTo) : null;
  if ((from && !isNaN(from)) || (to && !isNaN(to))) {
    where.date = {};
    if (from && !isNaN(from)) where.date.gte = from;
    if (to && !isNaN(to)) {
      to.setHours(23, 59, 59, 999);
      where.date.lte = to;
    }
  }

  const events = await prisma.event.findMany({
    where,
    include: { _count: { select: { rsvps: true } }, rsvps: { select: { userId: true } } },
    orderBy: sort === 'popularity' ? { rsvps: { _count: 'desc' } } : { date: 'asc' },
  });
  res.json(events.map((e) => withCounts(e, req.user?.id)));
});

const getEvent = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const event = await prisma.event.findUnique({
    where: { id: id ?? -1 },
    include: { _count: { select: { rsvps: true } }, rsvps: { select: { userId: true } } },
  });
  if (!event || (event.blocked && req.user?.role !== 'ADMIN')) return res.status(404).json({ message: 'Event not found' });
  res.json(withCounts(event, req.user?.id));
});

const parseEventBody = (body, partial = false) => {
  const data = {};
  const errors = [];
  const { title, description, category, location, date, isFree, price, capacity } = body;

  if (!partial || title !== undefined) (title?.trim() ? (data.title = title.trim()) : errors.push('title'));
  if (!partial || description !== undefined) (description?.trim() ? (data.description = description.trim()) : errors.push('description'));
  if (!partial || location !== undefined) (location?.trim() ? (data.location = location.trim()) : errors.push('location'));
  if (!partial || category !== undefined) (CATEGORIES.includes(category) ? (data.category = category) : errors.push('category'));
  if (!partial || date !== undefined) {
    const d = new Date(date);
    isNaN(d) ? errors.push('date') : (data.date = d);
  }
  if (isFree !== undefined) data.isFree = Boolean(isFree);
  if (data.isFree === false || (partial && price !== undefined)) {
    const p = price === '' || price == null ? null : Number(price);
    if (p != null && (isNaN(p) || p < 0)) errors.push('price');
    else data.price = p;
  }
  if (data.isFree === true) data.price = null;
  if (capacity !== undefined) {
    const c = capacity === '' || capacity == null ? null : parseInt(capacity, 10);
    if (c != null && (isNaN(c) || c < 1)) errors.push('capacity');
    else data.capacity = c;
  }
  return { data, errors };
};

const createEvent = asyncHandler(async (req, res) => {
  const { data, errors } = parseEventBody(req.body);
  if (errors.length) return res.status(400).json({ message: `Invalid or missing: ${errors.join(', ')}` });
  const event = await prisma.event.create({ data: { ...data, createdById: req.user.id } });
  res.status(201).json(event);
});

const updateEvent = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const { data, errors } = parseEventBody(req.body, true);
  if (errors.length) return res.status(400).json({ message: `Invalid: ${errors.join(', ')}` });
  const exists = await prisma.event.findUnique({ where: { id: id ?? -1 } });
  if (!exists) return res.status(404).json({ message: 'Event not found' });
  res.json(await prisma.event.update({ where: { id }, data }));
});

const deleteEvent = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const exists = await prisma.event.findUnique({ where: { id: id ?? -1 } });
  if (!exists) return res.status(404).json({ message: 'Event not found' });
  await prisma.event.delete({ where: { id } });
  res.status(204).end();
});

// POST /api/events/:id/rsvp toggles attendance for the signed-in user.
const toggleRsvp = asyncHandler(async (req, res) => {
  const eventId = toInt(req.params.id);
  const event = await prisma.event.findUnique({
    where: { id: eventId ?? -1 },
    include: { _count: { select: { rsvps: true } } },
  });
  if (!event || event.blocked) return res.status(404).json({ message: 'Event not found' });

  const key = { userId_eventId: { userId: req.user.id, eventId } };
  const existing = await prisma.eventRSVP.findUnique({ where: key });
  if (existing) {
    await prisma.eventRSVP.delete({ where: key });
    return res.json({ attending: false });
  }
  if (event.capacity && event._count.rsvps >= event.capacity) {
    return res.status(409).json({ message: 'This event is full' });
  }
  await prisma.eventRSVP.create({ data: { userId: req.user.id, eventId } });
  res.json({ attending: true });
});

// POST /api/events/:id/flag (CITIZEN) { reason } -- private; never exposed outside the admin review endpoints.
const flagEvent = asyncHandler(async (req, res) => {
  const eventId = toInt(req.params.id);
  const reason = String(req.body.reason ?? '').trim();
  if (reason.length < 5) return res.status(400).json({ message: 'Please describe why this event should be flagged' });
  if (reason.length > 1000) return res.status(400).json({ message: 'Description is too long (max 1000 characters)' });

  const event = await prisma.event.findUnique({ where: { id: eventId ?? -1 } });
  if (!event || event.blocked) return res.status(404).json({ message: 'Event not found' });
  const existing = await prisma.eventFlag.findUnique({ where: { userId_eventId: { userId: req.user.id, eventId } } });
  if (existing) return res.status(409).json({ message: 'You have already flagged this event' });

  await prisma.eventFlag.create({ data: { userId: req.user.id, eventId, reason } });
  res.status(201).json({ ok: true });
});

// GET /api/events/flags (ADMIN) -> pending flags with event + reporter
const listFlags = asyncHandler(async (req, res) => {
  res.json(await prisma.eventFlag.findMany({
    where: { status: 'PENDING' },
    include: {
      event: { select: { id: true, title: true, description: true, location: true, blocked: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  }));
});

// PATCH /api/events/flags/:id/review (ADMIN) { decision: 'BLOCK' | 'DISMISS' }
const reviewFlag = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const { decision } = req.body;
  if (!['BLOCK', 'DISMISS'].includes(decision)) return res.status(400).json({ message: 'Decision must be BLOCK or DISMISS' });
  const flag = await prisma.eventFlag.findUnique({ where: { id: id ?? -1 } });
  if (!flag || flag.status !== 'PENDING') return res.status(404).json({ message: 'Pending flag not found' });

  const reviewedAt = new Date();
  if (decision === 'BLOCK') {
    // Blocking settles every open flag on the event.
    await prisma.$transaction([
      prisma.event.update({ where: { id: flag.eventId }, data: { blocked: true } }),
      prisma.eventFlag.updateMany({ where: { eventId: flag.eventId, status: 'PENDING' }, data: { status: 'UPHELD', reviewedAt } }),
    ]);
  } else {
    await prisma.eventFlag.update({ where: { id }, data: { status: 'DISMISSED', reviewedAt } });
  }
  res.json({ ok: true });
});

// PATCH /api/events/:id/block (ADMIN) { blocked: boolean } -- lets an admin restore a blocked event.
const setBlocked = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const exists = await prisma.event.findUnique({ where: { id: id ?? -1 } });
  if (!exists) return res.status(404).json({ message: 'Event not found' });
  res.json(await prisma.event.update({ where: { id }, data: { blocked: Boolean(req.body.blocked) } }));
});

module.exports = { flagEvent, listFlags, reviewFlag, setBlocked, getEvents, getEvent, createEvent, updateEvent, deleteEvent, toggleRsvp, CATEGORIES };
