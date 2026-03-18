const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(path, { token, ...init } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // ignore
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (data) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  listCourses: () => apiFetch('/api/courses'),
  getCourse: (id, token) => apiFetch(`/api/courses/${id}`, { token }),
  enroll: (courseId, token) =>
    apiFetch('/api/enrollments', { method: 'POST', body: JSON.stringify({ courseId }), token }),
  listCertificates: (token) => apiFetch('/api/certificates', { token }),
  deleteCertificate: (id, token) => apiFetch(`/api/certificates/${id}`, { method: 'DELETE', token }),
  getCourseQuiz: (courseId, token) => apiFetch(`/api/courses/${courseId}/quiz`, { token }),
  getInstructorQuiz: (courseId, token) => apiFetch(`/api/instructor/courses/${courseId}/quiz`, { token }),
  saveInstructorQuiz: (courseId, data, token) =>
    apiFetch(`/api/instructor/courses/${courseId}/quiz`, { method: 'POST', body: JSON.stringify(data), token }),
  submitQuiz: (courseId, answers, token) => apiFetch(`/api/courses/${courseId}/quiz/submit`, { method: 'POST', body: JSON.stringify({ answers }), token }),
  setLessonProgress: (courseId, lessonId, data, token) =>
    apiFetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    }),
  listReviews: (courseId) => apiFetch(`/api/courses/${courseId}/reviews`),
  submitReview: (courseId, data, token) =>
    apiFetch(`/api/courses/${courseId}/reviews`, { method: 'POST', body: JSON.stringify(data), token })
};
