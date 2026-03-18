import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';

import { api } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Button, Card, Input } from '../components/ui.jsx';

export default function InstructorQuizEditor() {
  const { id } = useParams();
  const courseId = Number(id);
  const { token, user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState('Course Final Quiz');
  const [questions, setQuestions] = useState(
    Array(5).fill(0).map(() => ({
      prompt: '',
      options: ['', '', '', ''],
      answer: ''
    }))
  );
  const [message, setMessage] = useState(null);

  const { data: existingQuiz, isLoading } = useQuery({
    queryKey: ['instructor', 'quiz', courseId],
    queryFn: () => api.getInstructorQuiz(courseId, token),
    enabled: !!token && !!courseId
  });

  useEffect(() => {
    if (existingQuiz) {
      setTitle(existingQuiz.title);
      setQuestions(existingQuiz.questions.map(q => ({
        prompt: q.prompt,
        options: JSON.parse(q.options),
        answer: q.answer
      })));
    }
  }, [existingQuiz]);

  const saveQuizMutation = useMutation({
    mutationFn: (data) => api.saveInstructorQuiz(courseId, data, token),
    onSuccess: () => {
      setMessage('Quiz saved successfully!');
      qc.invalidateQueries({ queryKey: ['instructor', 'quiz', courseId] });
    },
    onError: (err) => setMessage(err.message)
  });

  if (!user || !['INSTRUCTOR', 'ADMIN'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const isFormValid = questions.every(q => 
    q.prompt.trim() !== '' && 
    q.options.every(o => o.trim() !== '') && 
    q.answer.trim() !== '' &&
    q.options.includes(q.answer)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/instructor/courses/${courseId}`} className="text-sm text-slate-400 hover:text-white transition">
            ← Back to Course Editor
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-white">Quiz Editor</h1>
          <p className="text-slate-400">Create a 5-question quiz. Students need 80% to pass.</p>
        </div>
        <Button 
          onClick={() => saveQuizMutation.mutate({ title, questions })}
          disabled={!isFormValid || saveQuizMutation.isPending}
          className="gap-2"
        >
          <Save size={18} />
          {saveQuizMutation.isPending ? 'Saving...' : 'Save Quiz'}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <Card className="p-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quiz Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Final Assessment" />
        </Card>

        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Question {qIndex + 1}</h3>
              {q.answer && !q.options.includes(q.answer) && (
                <span className="text-[10px] text-rose-500 font-bold uppercase">Correct answer must be one of the options</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prompt</label>
              <textarea
                value={q.prompt}
                onChange={(e) => handleQuestionChange(qIndex, 'prompt', e.target.value)}
                placeholder="What is the main topic of this course?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex}>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Option {oIndex + 1}</label>
                  <div className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className={q.answer === opt && opt !== '' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                    />
                    <button
                      onClick={() => handleQuestionChange(qIndex, 'answer', opt)}
                      className={`h-10 w-10 flex items-center justify-center rounded-lg border transition ${q.answer === opt && opt !== '' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                      title="Set as correct answer"
                      disabled={opt === ''}
                    >
                      <CheckCircle size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
