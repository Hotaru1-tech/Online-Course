import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authRequired, requireRole } from '../middleware/auth.js';

export const coursesRouter = Router();

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  bannerUrl: z.string().url().optional(),
  published: z.boolean().optional(),
  lessons: z
    .array(
      z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        pdfUrl: z.string().url().optional()
      })
    )
    .optional()
});

coursesRouter.get('/', async (req, res) => {
  const cacheKey = 'courses:list:v1';
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      bannerUrl: true,
      published: true,
      createdAt: true,
      instructor: { select: { id: true, email: true } }
    }
  });

  await redis.set(cacheKey, JSON.stringify(courses), 'EX', 60);
  return res.json(courses);
});

coursesRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
    } catch (e) {
      // ignore
    }
  }

  const [course, enrollment, cert, reviewsAgg] = await Promise.all([
    prisma.course.findFirst({
      where: { id, published: true },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            content: true,
            pdfUrl: true,
            order: true,
            progress: userId ? { where: { userId }, select: { completedAt: true } } : { take: 0 }
          }
        },
        instructor: { select: { id: true, email: true } }
      }
    }),
    userId
      ? prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: id } }
        })
      : null,
    userId ? prisma.certificate.findUnique({ where: { userId_courseId: { userId, courseId: id } }, select: { id: true } }) : null,
    prisma.review.aggregate({ where: { courseId: id }, _avg: { rating: true }, _count: { _all: true } })
  ]);

  if (!course) return res.status(404).json({ message: 'Not found' });
  return res.json({
    ...course,
    isEnrolled: !!enrollment,
    hasCertificate: !!cert,
    avgRating: reviewsAgg._avg.rating ?? 0,
    reviewsCount: reviewsAgg._count._all ?? 0
  });
});

coursesRouter.get('/:courseId/quiz', authRequired, requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  const userId = req.user.sub;
  const courseId = Number(req.params.courseId);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid id' });

  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } });
  if (!enrollment) return res.status(403).json({ message: 'Not enrolled' });

  const quiz = await prisma.quiz.findFirst({
    where: { courseId },
    include: { questions: { select: { id: true, prompt: true, options: true } } }
  });

  if (!quiz) return res.json(null);

  return res.json({
    id: quiz.id,
    courseId: quiz.courseId,
    title: quiz.title,
    questions: quiz.questions
  });
});

const lessonProgressSchema = z
  .object({
    completed: z.boolean().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

coursesRouter.post(
  '/:courseId/lessons/:lessonId/progress',
  authRequired,
  requireRole('STUDENT', 'ADMIN'),
  async (req, res) => {
    const courseId = Number(req.params.courseId);
    const lessonId = Number(req.params.lessonId);
    if (!Number.isFinite(courseId) || !Number.isFinite(lessonId)) return res.status(400).json({ message: 'Invalid id' });

    const parsed = lessonProgressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

    const userId = req.user.sub;

    const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, courseId }, select: { id: true } });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled' });

    const completedAt = parsed.data.completed ? new Date() : undefined;

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        ...(completedAt ? { completedAt } : {})
      },
      update: {
        lastViewedAt: new Date(),
        ...(completedAt ? { completedAt } : {})
      },
      select: { id: true, userId: true, lessonId: true, completedAt: true, lastViewedAt: true }
    });

    return res.json({ ...progress });
  }
);

coursesRouter.post('/:courseId/quiz/submit', authRequired, async (req, res) => {
  const userId = req.user.sub;
  const courseId = Number(req.params.courseId);
  const { answers } = req.body; // Array of { questionId, selectedOption }

  const quiz = await prisma.quiz.findFirst({
    where: { courseId },
    include: { questions: true }
  });

  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  let correctCount = 0;
  const results = quiz.questions.map(q => {
    const userAnswer = answers.find(a => a.questionId === q.id)?.selectedOption;
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correctCount++;
    return { questionId: q.id, isCorrect };
  });

  const score = (correctCount / quiz.questions.length) * 100;
  const passed = score >= 80;

  let certificateIssued = false;
  if (passed) {
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {}
    });
    certificateIssued = true;
  }

  return res.json({ score, passed, results, certificateIssued });
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000).optional()
});

coursesRouter.get('/:id/reviews', async (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid id' });

  const reviews = await prisma.review.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, email: true } }
    }
  });

  return res.json(reviews);
});

coursesRouter.post('/:id/reviews', authRequired, requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid id' });

  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const userId = req.user.sub;

  const course = await prisma.course.findFirst({ where: { id: courseId, published: true }, select: { id: true } });
  if (!course) return res.status(404).json({ message: 'Not found' });

  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } });
  if (!enrollment) return res.status(403).json({ message: 'Not enrolled' });

  const totalLessons = await prisma.lesson.count({ where: { courseId } });
  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completedAt: { not: null }, lesson: { courseId } }
  });

  if (totalLessons > 0 && completedLessons < totalLessons) {
    return res.status(400).json({ message: 'Complete the course before reviewing' });
  }

  try {
    const review = await prisma.review.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        rating: parsed.data.rating,
        comment: parsed.data.comment
      },
      update: {
        rating: parsed.data.rating,
        comment: parsed.data.comment
      },
      select: { id: true, rating: true, comment: true, createdAt: true }
    });

    return res.status(201).json(review);
  } catch (e) {
    if (e?.code === 'P2002') return res.status(409).json({ message: 'Already reviewed' });
    return res.status(500).json({ message: 'Server error' });
  }
});

coursesRouter.post('/', authRequired, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const { title, description, bannerUrl, published, lessons } = parsed.data;
  const instructorId = req.user.sub;

  const course = await prisma.course.create({
    data: {
      title,
      description,
      bannerUrl,
      published: Boolean(published),
      instructorId,
      lessons: lessons
        ? {
            create: lessons.map((l, idx) => ({
              title: l.title,
              content: l.content,
              pdfUrl: l.pdfUrl,
              order: idx + 1
            }))
          }
        : undefined
    },
    include: { lessons: { orderBy: { order: 'asc' } } }
  });

  await redis.del('courses:list:v1');
  return res.status(201).json(course);
});
