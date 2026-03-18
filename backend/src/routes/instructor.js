import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authRequired, requireRole } from '../middleware/auth.js';

export const instructorRouter = Router();

instructorRouter.use(authRequired, requireRole('INSTRUCTOR', 'ADMIN'));

function canManageCourse(user, course) {
  if (user.role === 'ADMIN') return true;
  return course.instructorId === user.sub;
}

instructorRouter.get('/courses', async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { instructorId: req.user.sub };
  const courses = await prisma.course.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, pdfUrl: true, order: true } }
    }
  });
  return res.json(courses);
});

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  bannerUrl: z.string().url().optional()
});

instructorRouter.post('/courses', async (req, res) => {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      bannerUrl: parsed.data.bannerUrl,
      published: false,
      instructorId: req.user.sub
    }
  });

  await redis.del('courses:list:v1');
  return res.status(201).json(course);
});

const updateCourseSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().nullable().optional(),
    bannerUrl: z.string().url().nullable().optional(),
    published: z.boolean().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

instructorRouter.patch('/courses/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });

  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, course)) return res.status(403).json({ message: 'Forbidden' });

  const updated = await prisma.course.update({
    where: { id },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.bannerUrl !== undefined ? { bannerUrl: parsed.data.bannerUrl } : {}),
      ...(parsed.data.published !== undefined ? { published: parsed.data.published } : {})
    }
  });

  await redis.del('courses:list:v1');
  return res.json(updated);
});

instructorRouter.get('/courses/:id/analytics', async (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid id' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, course)) return res.status(403).json({ message: 'Forbidden' });

  const [
    lessons,
    enrollmentsCount,
    reviewsCount,
    ratingAgg
  ] = await Promise.all([
    prisma.lesson.findMany({ where: { courseId }, orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } }),
    prisma.enrollment.count({ where: { courseId } }),
    prisma.review.count({ where: { courseId } }),
    prisma.review.aggregate({ where: { courseId }, _avg: { rating: true } })
  ]);

  const totalLessons = lessons.length;

  const completedByUser = await prisma.lessonProgress.groupBy({
    by: ['userId'],
    where: { completedAt: { not: null }, lesson: { courseId } },
    _count: { _all: true }
  });

  const completedMap = new Map(completedByUser.map((r) => [r.userId, r._count._all]));

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const studentsTable = enrollments.map((e) => {
    const completedLessons = completedMap.get(e.userId) ?? 0;
    const completionPct = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    return {
      userId: e.userId,
      email: e.user.email,
      enrolledAt: e.createdAt,
      completedLessons,
      totalLessons,
      completionPct
    };
  });

  const fullyCompleted = studentsTable.filter((s) => totalLessons > 0 && s.completedLessons >= totalLessons).length;
  const completionRate = enrollmentsCount === 0 ? 0 : Math.round((fullyCompleted / enrollmentsCount) * 100);

  const perLessonCompletion = await prisma.lessonProgress.groupBy({
    by: ['lessonId'],
    where: { completedAt: { not: null }, lesson: { courseId } },
    _count: { _all: true }
  });

  const perLessonCompletionMap = new Map(perLessonCompletion.map((r) => [r.lessonId, r._count._all]));

  const lessonChart = lessons.map((l) => ({
    lessonId: l.id,
    title: l.title,
    order: l.order,
    completedCount: perLessonCompletionMap.get(l.id) ?? 0
  }));

  return res.json({
    courseId,
    enrollmentsCount,
    reviewsCount,
    avgRating: ratingAgg._avg.rating ?? null,
    completionRate,
    lessonChart,
    studentsTable
  });
});

const createLessonSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  pdfUrl: z.string().url().optional()
});

instructorRouter.post('/courses/:id/lessons', async (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid id' });

  const parsed = createLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, course)) return res.status(403).json({ message: 'Forbidden' });

  const maxOrder = await prisma.lesson.aggregate({
    where: { courseId },
    _max: { order: true }
  });
  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      title: parsed.data.title,
      content: parsed.data.content,
      pdfUrl: parsed.data.pdfUrl,
      order: nextOrder
    }
  });

  return res.status(201).json(lesson);
});

const updateLessonSchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.string().nullable().optional(),
    pdfUrl: z.string().url().nullable().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

instructorRouter.patch('/lessons/:lessonId', async (req, res) => {
  const lessonId = Number(req.params.lessonId);
  if (!Number.isFinite(lessonId)) return res.status(400).json({ message: 'Invalid id' });

  const parsed = updateLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: true } });
  if (!lesson) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, lesson.course)) return res.status(403).json({ message: 'Forbidden' });

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      ...(parsed.data.pdfUrl !== undefined ? { pdfUrl: parsed.data.pdfUrl } : {})
    }
  });

  return res.json(updated);
});

instructorRouter.delete('/lessons/:lessonId', async (req, res) => {
  const lessonId = Number(req.params.lessonId);
  if (!Number.isFinite(lessonId)) return res.status(400).json({ message: 'Invalid id' });

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: true } });
  if (!lesson) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, lesson.course)) return res.status(403).json({ message: 'Forbidden' });

  await prisma.lesson.delete({ where: { id: lessonId } });

  const remaining = await prisma.lesson.findMany({
    where: { courseId: lesson.courseId },
    orderBy: { order: 'asc' },
    select: { id: true }
  });

  await prisma.$transaction(
    remaining.map((l, idx) =>
      prisma.lesson.update({
        where: { id: l.id },
        data: { order: idx + 1 }
      })
    )
  );

  return res.status(204).send();
});

const reorderSchema = z.object({
  lessonIds: z.array(z.number().int().positive()).min(1)
});

instructorRouter.post('/courses/:id/lessons/reorder', async (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid id' });

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, course)) return res.status(403).json({ message: 'Forbidden' });

  const lessons = await prisma.lesson.findMany({ where: { courseId }, select: { id: true } });
  const existingIds = new Set(lessons.map((l) => l.id));
  const incoming = parsed.data.lessonIds;

  if (incoming.length !== existingIds.size) return res.status(400).json({ message: 'Lesson list mismatch' });
  for (const id of incoming) {
    if (!existingIds.has(id)) return res.status(400).json({ message: 'Lesson list mismatch' });
  }

  await prisma.$transaction(
    incoming.map((lessonId, idx) =>
      prisma.lesson.update({
        where: { id: lessonId },
        data: { order: idx + 1 }
      })
    )
  );

  return res.json({ ok: true });
});

const quizSchema = z.object({
  title: z.string().min(1),
  questions: z.array(z.object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    answer: z.string().min(1)
  })).length(5)
});

instructorRouter.post('/courses/:id/quiz', async (req, res) => {
  const courseId = Number(req.params.id);
  const parsed = quizSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input. Need 5 questions with 4 options each.' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (!canManageCourse(req.user, course)) return res.status(403).json({ message: 'Forbidden' });

  const existing = await prisma.quiz.findFirst({ where: { courseId }, select: { id: true } });

  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          questions: {
            deleteMany: {},
            create: parsed.data.questions.map((q) => ({
              prompt: q.prompt,
              options: JSON.stringify(q.options),
              answer: q.answer
            }))
          }
        },
        include: { questions: true }
      })
    : await prisma.quiz.create({
        data: {
          courseId,
          title: parsed.data.title,
          questions: {
            create: parsed.data.questions.map((q) => ({
              prompt: q.prompt,
              options: JSON.stringify(q.options),
              answer: q.answer
            }))
          }
        },
        include: { questions: true }
      });

  return res.status(201).json(quiz);
});

instructorRouter.get('/courses/:id/quiz', async (req, res) => {
  const courseId = Number(req.params.id);
  const quiz = await prisma.quiz.findFirst({
    where: { courseId },
    include: { questions: true }
  });
  return res.json(quiz);
});

instructorRouter.delete('/courses/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ message: 'Not found' });
  if (!canManageCourse(req.user, course)) return res.status(403).json({ message: 'Forbidden' });

  // Delete everything related to the course first due to foreign key constraints if not cascading
  // (In our schema, we should check if they are cascading, but for safety we can delete them or rely on Prisma cascade if configured)
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { lesson: { courseId: id } } }),
    prisma.lesson.deleteMany({ where: { courseId: id } }),
    prisma.enrollment.deleteMany({ where: { courseId: id } }),
    prisma.review.deleteMany({ where: { courseId: id } }),
    prisma.certificate.deleteMany({ where: { courseId: id } }),
    prisma.course.delete({ where: { id } })
  ]);

  await redis.del('courses:list:v1');
  return res.status(204).send();
});
