import prisma from '../lib/prisma.js';

export const getDashboard = async (_req, res, next) => {
  try {
    const [totalRequests, resolved, pending, inProgress, totalEvents, citizens, recent, byType] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      prisma.serviceRequest.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.event.count({ where: { published: true, startsAt: { gte: new Date() } } }),
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.serviceRequest.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { citizen: { select: { name: true } }, manager: { select: { name: true } } } }),
      prisma.serviceRequest.groupBy({ by: ['issueType'], _count: true, orderBy: { _count: { issueType: 'desc' } } }),
    ]);
    res.json({ stats: { totalRequests, resolved, pending, inProgress, totalEvents, citizens, resolutionRate: totalRequests ? Math.round((resolved / totalRequests) * 100) : 0 }, recent, byType });
  } catch (error) { next(error); }
};

