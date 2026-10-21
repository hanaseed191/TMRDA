'use client';

import React, { useState, useEffect } from 'react';
import { TestForm, ExamQuestion } from '@/lib/types';
import { MockDataStore } from '@/lib/supabase/mockStore';
import { toast } from 'sonner';

interface StudentExamModalProps {
  testForm: TestForm;
  courseName: string;
  onClose: () => void;
  onSubmitted?: (score: number, passed: boolean) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StudentExamModal({
  testForm,
  courseName,
  onClose,
  onSubmitted,
}: StudentExamModalProps) {
  const currentUser = MockDataStore.getCurrentUser();
  const storageKey = `exam_start_time_${testForm.id}_${currentUser?.id || 0}`;

  // Time Limit in Minutes (default to 1 if not set)
  const timeLimitMinutes = Number(testForm.time_limit_minutes || 1);
  const totalSeconds = timeLimitMinutes * 60;

  // Shuffled questions and choices stored in state with localStorage persistence
  const [processedQuestions] = useState<ExamQuestion[]>(() => {
    if (typeof window === 'undefined' || !currentUser) {
      return testForm.questions || [];
    }
    const cacheKey = `shuffled_questions_${testForm.id}_${currentUser.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached questions', e);
      }
    }

    // Generate shuffled questions
    let qs = testForm.questions ? [...testForm.questions] : [];
    if (testForm.randomize_questions) {
      qs = shuffleArray(qs);
    }
    if (testForm.randomize_choices) {
      qs = qs.map(q => {
        if (q.choices && q.choices.length > 0) {
          return {
            ...q,
            choices: shuffleArray(q.choices),
          };
        }
        return q;
      });
    }
    localStorage.setItem(cacheKey, JSON.stringify(qs));
    return qs;
  });

  // Initialize timer state with localStorage resume persistence
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedStart = localStorage.getItem(storageKey);
      if (storedStart) {
        const elapsed = Math.floor((Date.now() - Number(storedStart)) / 1000);
        const remaining = totalSeconds - elapsed;
        return remaining > 0 ? remaining : 0;
      } else {
        localStorage.setItem(storageKey, String(Date.now()));
        return totalSeconds;
      }
    }
    return totalSeconds;
  });

  const [answers, setAnswers] = useState<Record<number, any>>(() => {
    if (typeof window !== 'undefined' && currentUser) {
      const stored = localStorage.getItem(`answers_${testForm.id}_${currentUser.id}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return {};
  });

  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, Record<string, string>>>(() => {
    if (typeof window !== 'undefined' && currentUser) {
      const stored = localStorage.getItem(`matching_answers_${testForm.id}_${currentUser.id}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return {};
  });

  const [submitted, setSubmitted] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);

  // Sync answers to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser && !submitted) {
      localStorage.setItem(`answers_${testForm.id}_${currentUser.id}`, JSON.stringify(answers));
    }
  }, [answers, testForm.id, currentUser?.id, submitted]);

  // Sync matchingAnswers to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser && !submitted) {
      localStorage.setItem(`matching_answers_${testForm.id}_${currentUser.id}`, JSON.stringify(matchingAnswers));
    }
  }, [matchingAnswers, testForm.id, currentUser?.id, submitted]);

  // Synchronize timer persistence if testForm changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !submitted) {
      const storedStart = localStorage.getItem(storageKey);
      if (storedStart) {
        const elapsed = Math.floor((Date.now() - Number(storedStart)) / 1000);
        const remaining = totalSeconds - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          handleSubmitExam(true);
        } else {
          setTimeLeft(remaining);
        }
      } else {
        localStorage.setItem(storageKey, String(Date.now()));
        setTimeLeft(totalSeconds);
      }
    }
  }, [testForm.id, testForm.time_limit_minutes]);

  // Countdown timer effect
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning('หมดเวลาทำข้อสอบแล้ว! ระบบกำลังส่งคำตอบอัตโนมัติ');
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Choice Handlers
  const handleSingleChoiceSelect = (qId: number, choiceId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: choiceId }));
  };

  const handleMultipleChoiceToggle = (qId: number, choiceId: string) => {
    if (submitted) return;
    setAnswers((prev) => {
      const current = (prev[qId] as string[]) || [];
      const updated = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return { ...prev, [qId]: updated };
    });
  };

  const handleTrueFalseSelect = (qId: number, val: boolean) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleTextAnswerChange = (qId: number, text: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleMatchingSelect = (qId: number, pairId: string, rightText: string) => {
    if (submitted) return;
    setMatchingAnswers((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), [pairId]: rightText },
    }));
  };

  // Submit Exam
  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (submitted) return;

    // Validation: Check if all questions are answered (only if NOT an automatic submission when timer runs out)
    if (!isAutoSubmit) {
      const unansweredCount = processedQuestions.filter(q => {
        if (q.type === 'matching') {
          const userPairs = matchingAnswers[q.id] || {};
          const pairs = q.matching_pairs || [];
          return pairs.length === 0 || Object.keys(userPairs).length < pairs.length;
        } else {
          const userAns = answers[q.id];
          if (q.type === 'multiple_choices') {
            return !userAns || !Array.isArray(userAns) || userAns.length === 0;
          }
          return userAns === undefined || userAns === null || String(userAns).trim() === '';
        }
      }).length;

      if (unansweredCount > 0) {
        toast.error(`กรุณาตอบคำถามให้ครบทุกข้อก่อนส่งข้อสอบ (ยังไม่ได้ตอบอีก ${unansweredCount} ข้อ)`);
        return;
      }
    }

    let obtainedScore = 0;
    const questions = testForm.questions || [];
    const maxScore = questions.reduce((sum, q) => sum + Number(q.score || 1), 0);

    questions.forEach((q) => {
      const qScore = Number(q.score || 1);
      const userAns = answers[q.id];

      if (q.type === 'single_choices') {
        const correctChoice = q.choices.find((c) => c.is_correct);
        if (correctChoice && userAns === correctChoice.id) {
          obtainedScore += qScore;
        }
      } else if (q.type === 'multiple_choices') {
        const correctIds = q.choices.filter((c) => c.is_correct).map((c) => c.id).sort();
        const userAnsIds = Array.isArray(userAns) ? [...userAns].sort() : [];
        if (JSON.stringify(correctIds) === JSON.stringify(userAnsIds)) {
          obtainedScore += qScore;
        }
      } else if (q.type === 'true_false') {
        if (userAns === q.true_false_answer) {
          obtainedScore += qScore;
        }
      } else if (q.type === 'matching') {
        const pairs = q.matching_pairs || [];
        const userPairs = matchingAnswers[q.id] || {};
        let correctPairCount = 0;
        pairs.forEach((p) => {
          if (userPairs[p.id] === p.right_text) {
            correctPairCount++;
          }
        });
        if (pairs.length > 0) {
          obtainedScore += (correctPairCount / pairs.length) * qScore;
        }
      } else if (q.type === 'text_choices') {
        if (userAns && String(userAns).trim().length > 0) {
          obtainedScore += qScore;
        }
      }
    });

    const finalScore = Math.round(obtainedScore);
    const passingScore = Math.round((testForm.passing_percentage / 100) * (maxScore || 100));
    const isPassed = finalScore >= passingScore;

    setResult({
      score: finalScore,
      maxScore: maxScore > 0 ? maxScore : 100,
      passed: isPassed,
    });
    setSubmitted(true);
    setShowResultPopup(true);

    // Clear start time and exam randomization states from localStorage upon submission
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`shuffled_questions_${testForm.id}_${currentUser?.id || 0}`);
      localStorage.removeItem(`active_test_form_id_${testForm.training_id}_${currentUser?.id || 0}`);
      localStorage.removeItem(`answers_${testForm.id}_${currentUser?.id || 0}`);
      localStorage.removeItem(`matching_answers_${testForm.id}_${currentUser?.id || 0}`);
    }

    // Persist scores into Supabase
    if (currentUser) {
      await MockDataStore.recordExamResult(
        currentUser.id,
        testForm.training_id,
        finalScore,
        maxScore > 0 ? maxScore : 100,
        isPassed
      );
    }

    if (onSubmitted) {
      onSubmitted(finalScore, isPassed);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 my-6">
        {/* Header with Live Timer */}
        <div className="p-5 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-20 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <i className="fa-solid fa-file-pen text-red-600" />
              <span>{testForm.title}</span>
            </h3>
            <p className="text-xs text-zinc-500 font-medium">คอร์ส: {courseName}</p>
          </div>

          <div className="flex items-center gap-4">
            {!submitted && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1.5 rounded-lg font-bold text-xs">
                <i className="fa-solid fa-clock animate-pulse text-blue-600" />
                <span>
                  เวลาเหลือ: <strong className="font-mono text-sm">{formatTime(timeLeft)}</strong> (จากกำหนด {timeLimitMinutes} นาที)
                </span>
              </div>
            )}

            <button onClick={onClose} className="text-zinc-400 hover:text-red-600 p-1">
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs font-medium">
          {/* Test Guidelines */}
          {!submitted && (
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
              <span className="font-bold text-zinc-950 block mb-1">คำชี้แจงในการทำแบบทดสอบ:</span>
              <p className="text-zinc-600 leading-relaxed">{testForm.description}</p>
            </div>
          )}

          {/* Questions List */}
          {processedQuestions.map((q, qIdx) => (
            <div key={q.id} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-bold text-xs text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-md">
                  ข้อที่ {qIdx + 1} ({q.score || 1} คะแนน)
                </span>
              </div>

              <div className="font-bold text-sm text-zinc-950 leading-relaxed">{q.question_text}</div>

              {/* SINGLE CHOICE */}
              {q.type === 'single_choices' && (
                <div className="space-y-2 pt-2">
                  {q.choices.map((c, choiceIdx) => {
                    const isSelected = answers[q.id] === c.id;
                    const isCorrectChoice = c.is_correct;

                    let choiceStyle = 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800';

                    if (!submitted) {
                      if (isSelected) {
                        choiceStyle = 'bg-blue-50 border-blue-500 text-blue-950 font-bold border-2 shadow-sm';
                      }
                    } else {
                      if (isCorrectChoice) {
                        choiceStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold border-2';
                      } else if (isSelected && !isCorrectChoice) {
                        choiceStyle = 'bg-red-50 border-red-500 text-red-950 font-bold border-2';
                      } else {
                        choiceStyle = 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60';
                      }
                    }

                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${choiceStyle}`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          disabled={submitted}
                          checked={isSelected}
                          onChange={() => handleSingleChoiceSelect(q.id, c.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="uppercase text-zinc-400 font-bold">{String.fromCharCode(97 + choiceIdx)})</span>
                        <span className="flex-1 select-none">{c.choice_text}</span>

                        {submitted && isCorrectChoice && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded leading-none">
                            ✔ เฉลยถูกต้อง
                          </span>
                        )}

                        {submitted && isSelected && !isCorrectChoice && (
                          <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded leading-none">
                            ❌ ตอบผิด
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* MULTIPLE CHOICES */}
              {q.type === 'multiple_choices' && (
                <div className="space-y-2 pt-2">
                  {q.choices.map((c, choiceIdx) => {
                    const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(c.id);
                    const isCorrectChoice = c.is_correct;

                    let choiceStyle = 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800';

                    if (!submitted) {
                      if (selected) {
                        choiceStyle = 'bg-blue-50 border-blue-500 text-blue-950 font-bold border-2 shadow-sm';
                      }
                    } else {
                      if (isCorrectChoice) {
                        choiceStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold border-2';
                      } else if (selected && !isCorrectChoice) {
                        choiceStyle = 'bg-red-50 border-red-500 text-red-950 font-bold border-2';
                      } else {
                        choiceStyle = 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60';
                      }
                    }

                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${choiceStyle}`}
                      >
                        <input
                          type="checkbox"
                          disabled={submitted}
                          checked={selected}
                          onChange={() => handleMultipleChoiceToggle(q.id, c.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="uppercase text-zinc-400 font-bold">{String.fromCharCode(97 + choiceIdx)})</span>
                        <span className="flex-1 select-none">{c.choice_text}</span>

                        {submitted && isCorrectChoice && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded leading-none">
                            ✔ เฉลยถูกต้อง
                          </span>
                        )}

                        {submitted && selected && !isCorrectChoice && (
                          <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded leading-none">
                            ❌ ตอบผิด
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* TRUE / FALSE */}
              {q.type === 'true_false' && (
                <div className="flex gap-4 pt-2">
                  <label
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border cursor-pointer font-bold transition-all ${
                      !submitted
                        ? answers[q.id] === true
                          ? 'bg-blue-50 border-blue-500 text-blue-950 border-2 shadow-sm'
                          : 'bg-white border-zinc-200'
                        : q.true_false_answer === true
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 border-2'
                        : answers[q.id] === true
                        ? 'bg-red-50 border-red-500 text-red-950 border-2'
                        : 'bg-zinc-50 border-zinc-200 opacity-60'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_tf_${q.id}`}
                      disabled={submitted}
                      checked={answers[q.id] === true}
                      onChange={() => handleTrueFalseSelect(q.id, true)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <span className="select-none">ถูก (True)</span>
                    {submitted && q.true_false_answer === true && <span className="text-emerald-600 font-bold ml-1">✔ เฉลย</span>}
                  </label>

                  <label
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border cursor-pointer font-bold transition-all ${
                      !submitted
                        ? answers[q.id] === false
                          ? 'bg-blue-50 border-blue-500 text-blue-950 border-2 shadow-sm'
                          : 'bg-white border-zinc-200'
                        : q.true_false_answer === false
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 border-2'
                        : answers[q.id] === false
                        ? 'bg-red-50 border-red-500 text-red-950 border-2'
                        : 'bg-zinc-50 border-zinc-200 opacity-60'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_tf_${q.id}`}
                      disabled={submitted}
                      checked={answers[q.id] === false}
                      onChange={() => handleTrueFalseSelect(q.id, false)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <span className="select-none">ผิด (False)</span>
                    {submitted && q.true_false_answer === false && <span className="text-emerald-600 font-bold ml-1">✔ เฉลย</span>}
                  </label>
                </div>
              )}

              {/* MATCHING */}
              {q.type === 'matching' && (
                <div className="space-y-3 pt-2">
                  {(q.matching_pairs || []).map((pair) => {
                    const userSelectedRight = matchingAnswers[q.id]?.[pair.id];
                    const isPairCorrect = userSelectedRight === pair.right_text;

                    return (
                      <div
                        key={pair.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          submitted
                            ? isPairCorrect
                              ? 'bg-emerald-50 border-emerald-400'
                              : 'bg-red-50 border-red-400'
                            : userSelectedRight
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        <span className="font-bold text-zinc-900 flex-1">{pair.left_text}</span>
                        <i className="fa-solid fa-arrow-right-long text-zinc-400" />
                        <select
                          disabled={submitted}
                          value={userSelectedRight || ''}
                          onChange={(e) => handleMatchingSelect(q.id, pair.id, e.target.value)}
                          className="flex-1 h-9 border border-zinc-300 rounded px-2 bg-white text-xs font-bold"
                        >
                          <option value="">-- เลือกคำตอบจับคู่ --</option>
                          {(q.matching_pairs || []).map((pRight) => (
                            <option key={pRight.id} value={pRight.right_text}>
                              {pRight.right_text}
                            </option>
                          ))}
                        </select>
                        {submitted && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isPairCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                            {isPairCorrect ? '✔ ถูกต้อง' : `❌ เฉลย: ${pair.right_text}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TEXT ESSAY */}
              {q.type === 'text_choices' && (
                <div className="pt-2 space-y-2">
                  <textarea
                    disabled={submitted}
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder_text || 'พิมพ์คำตอบข้อเขียนของคุณ...'}
                    className={`w-full border rounded-lg p-3 text-xs focus:ring-1 focus:ring-blue-500 font-medium ${
                      !submitted && answers[q.id] ? 'bg-blue-50/50 border-blue-400' : 'bg-white border-zinc-300'
                    }`}
                  />
                  {submitted && q.correct_answer_text && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950">
                      <span className="font-bold block mb-1">เฉลยแนวทางคำตอบที่ถูกต้อง:</span>
                      <p>{q.correct_answer_text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Submit Action */}
          {!submitted && (
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-100 text-zinc-700 font-bold rounded-lg hover:bg-zinc-200 text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-xs shadow-sm flex items-center gap-2"
              >
                <i className="fa-solid fa-paper-plane" />
                <span>ส่งข้อสอบ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* POPUP RESULT DIALOG OVERLAY (FEEDBACK #2: อยากให้เด้งเป็น popup แทน) */}
      {showResultPopup && result && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-zinc-200 space-y-5">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl font-bold ${
                result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}
            >
              {result.passed ? (
                <i className="fa-solid fa-circle-check" />
              ) : (
                <i className="fa-solid fa-circle-xmark" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-950">
                {result.passed ? 'ยินดีด้วย! คุณสอบผ่านการประเมิน' : 'เสียใจด้วย คุณไม่ผ่านเกณฑ์ประเมิน'}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                ผลการสอบบันทึกเข้าสู่ระบบเรียบร้อยแล้ว
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-600">
                <span>คะแนนที่ได้:</span>
                <span className="font-bold text-sm text-zinc-950">
                  {result.score} / {result.maxScore} คะแนน
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>เกณฑ์คะแนนผ่าน:</span>
                <span className="font-bold text-emerald-600">{testForm.passing_percentage}%</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>สถานะการทดสอบ:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded ${
                    result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowResultPopup(false)}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-xs shadow-sm flex items-center gap-1.5"
              >
                <i className="fa-solid fa-eye text-xs" />
                <span>ดูเฉลยข้อสอบอย่างละเอียด</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-950 text-white font-bold rounded-lg hover:bg-zinc-800 text-xs shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
