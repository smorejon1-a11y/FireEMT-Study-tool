import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Zap, Loader, RotateCcw, Download, FolderOpen, Save } from 'lucide-react';

export default function FireAcademyStudyGenerator() {
  const [transcriptText, setTranscriptText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [quizName, setQuizName] = useState('');
  const fileInputRef = useRef(null);
  const questionFileRef = useRef(null);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setTranscriptText(event.target.result);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handlePasteText = (e) => {
    setTranscriptText(e.target.value);
    setFileName('Pasted transcript');
  };

  // Load saved question bank
  const handleQuestionBankUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setQuizName(data.quizName || file.name.replace('.json', ''));
          resetQuizState();
          setActiveTab('quiz');
        } else {
          setError('Invalid question bank file. Please upload a file downloaded from this app.');
        }
      } catch (err) {
        setError('Could not read question bank file. Make sure it is a valid JSON file from this app.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
    // Reset input so same file can be uploaded again
    e.target.value = '';
  };

  const resetQuizState = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setAnsweredQuestions([]);
    setQuizComplete(false);
  };

  const generateQuestions = async () => {
    if (!transcriptText.trim()) {
      setError('Please paste or upload a transcript');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const questionsResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: `You are an expert firefighter instructor creating practice questions for Essentials of Firefighting 1 & 2 students. Based on this lecture transcript, create a mix of question types to help the student prepare for exams and practical scenarios.

LECTURE TRANSCRIPT:
${transcriptText}

Generate 50 questions mixing these types: Multiple choice (4 options), True/False.

IMPORTANT: Output ONLY valid JSON, nothing else. Use this exact format:

{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "B",
      "explanation": "Why B is correct based on the lecture..."
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "Statement here?",
      "answer": true,
      "explanation": "Explanation based on the lecture..."
    }
  ]
}`,
        }),
      });

      const questionsData = await questionsResponse.json();
      if (!questionsResponse.ok) throw new Error(questionsData.error?.message || 'Failed to generate questions');
      const questionsText = questionsData.content[0].text;
      const jsonMatch = questionsText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]);
        setQuestions(parsedQuestions.questions || []);
        setQuizName(fileName.replace(/\.(txt|md|docx|doc)$/i, '') || 'Quiz');
        resetQuizState();
        setActiveTab('quiz');
      } else {
        setError('Could not generate questions. Please try again.');
        return;
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Download question bank as JSON (for reloading later)
  const downloadQuestionBank = () => {
    const bankData = {
      quizName: quizName || 'Fire Academy Quiz',
      createdDate: new Date().toISOString(),
      totalQuestions: questions.length,
      questions: questions,
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bankData, null, 2)));
    element.setAttribute('download', `${(quizName || 'quiz').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-question-bank.json`);
    element.click();
  };

  // Download printable questions and answers as text
  const downloadPrintableQuiz = () => {
    let content = `FIRE ACADEMY QUESTION BANK\n`;
    content += `Quiz: ${quizName || 'Fire Academy Quiz'}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n`;
    content += `Total Questions: ${questions.length}\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `QUESTIONS\n${'-'.repeat(60)}\n\n`;

    questions.forEach((q, i) => {
      content += `${i + 1}. [${q.type.replace(/_/g, ' ').toUpperCase()}]\n`;
      content += `${q.question}\n`;
      if (q.options) {
        q.options.forEach(opt => {
          content += `   ${opt}\n`;
        });
      }
      if (q.type === 'true_false') {
        content += `   True / False\n`;
      }
      content += `\n`;
    });

    content += `\n${'='.repeat(60)}\n\nANSWER KEY\n${'-'.repeat(60)}\n\n`;

    questions.forEach((q, i) => {
      content += `${i + 1}. Answer: ${q.answer}\n`;
      content += `   Explanation: ${q.explanation}\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `${(quizName || 'quiz').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-printable.txt`);
    element.click();
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    const question = questions[currentQuestion];
    const isCorrect = getCorrectAnswer(question) === selectedAnswer;

    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestion] = {
      questionId: question.id,
      selected: selectedAnswer,
      correct: isCorrect,
    };
    setAnsweredQuestions(newAnswered);

    if (isCorrect) {
      setScore(score + 1);
    }

    setShowFeedback(true);
  };

  const getCorrectAnswer = (question) => {
    if (question.type === 'true_false') {
      return question.answer ? 'true' : 'false';
    }
    return question.answer;
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const restartQuiz = () => {
    resetQuizState();
  };

  const downloadResults = () => {
    let content = `FIRE ACADEMY QUIZ RESULTS\n`;
    content += `Quiz: ${quizName || 'Fire Academy Quiz'}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Total Questions: ${questions.length}\n`;
    content += `Correct Answers: ${score}/${questions.length}\n`;
    content += `Percentage: ${Math.round((score / questions.length) * 100)}%\n\n`;
    content += `${'='.repeat(60)}\n\nQUESTION REVIEW\n${'-'.repeat(60)}\n\n`;

    questions.forEach((q, i) => {
      const answered = answeredQuestions[i];
      const isCorrect = answered?.correct;
      
      content += `${i + 1}. [${q.type.toUpperCase()}] ${isCorrect ? 'CORRECT' : 'INCORRECT'}\n`;
      content += `Question: ${q.question}\n`;
      
      if (q.type === 'multiple_choice') {
        q.options.forEach(opt => {
          content += `${opt}\n`;
        });
      }
      content += `Your Answer: ${answered?.selected || 'Not answered'}\n`;
      content += `Correct Answer: ${q.answer}\n`;
      content += `Explanation: ${q.explanation}\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `quiz-results-${new Date().toISOString().split('T')[0]}.txt`);
    element.click();
  };

  const renderQuestion = () => {
    if (!questions.length) return null;
    const question = questions[currentQuestion];

    return (
      <div className="space-y-6">
        {/* Quiz Name & Download Bank */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 border border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Current Quiz</p>
            <p className="font-bold text-gray-900">{quizName || 'Fire Academy Quiz'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadQuestionBank}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 flex items-center gap-2"
              title="Download question bank to reload later"
            >
              <Save size={16} />
              Save Question Bank
            </button>
            <button
              onClick={downloadPrintableQuiz}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 flex items-center gap-2"
              title="Download printable questions and answer key"
            >
              <Download size={16} />
              Printable Version
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>Score: {score}/{questions.length}</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{question.question}</h2>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded font-semibold">
              {question.type.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          {/* Multiple Choice */}
          {question.type === 'multiple_choice' && (
            <div className="space-y-3 mb-6">
              {question.options.map((option, idx) => {
                const optionKey = option.split(')')[0].trim();
                const isSelected = selectedAnswer === optionKey;
                const isCorrect = optionKey === question.answer;
                
                return (
                  <button
                    key={idx}
                    onClick={() => !showFeedback && setSelectedAnswer(optionKey)}
                    disabled={showFeedback}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      showFeedback
                        ? isCorrect
                          ? 'border-green-600 bg-green-50'
                          : isSelected
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-600'
                    }`}
                  >
                    <span className={`font-semibold ${
                      showFeedback
                        ? isCorrect ? 'text-green-900' : isSelected ? 'text-red-900' : 'text-gray-700'
                        : isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true_false' && (
            <div className="space-y-3 mb-6">
              {['true', 'false'].map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === String(question.answer);
                
                return (
                  <button
                    key={option}
                    onClick={() => !showFeedback && setSelectedAnswer(option)}
                    disabled={showFeedback}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      showFeedback
                        ? isCorrect
                          ? 'border-green-600 bg-green-50'
                          : isSelected
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-600'
                    }`}
                  >
                    <span className={`font-semibold text-lg ${
                      showFeedback
                        ? isCorrect ? 'text-green-900' : isSelected ? 'text-red-900' : 'text-gray-700'
                        : isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div className={`p-4 rounded-lg border-l-4 ${
              answeredQuestions[currentQuestion]?.correct
                ? 'bg-green-50 border-green-600'
                : 'bg-red-50 border-red-600'
            }`}>
              <p className={`font-bold mb-2 ${
                answeredQuestions[currentQuestion]?.correct ? 'text-green-900' : 'text-red-900'
              }`}>
                {answeredQuestions[currentQuestion]?.correct ? 'Correct!' : 'Incorrect'}
              </p>
              {!answeredQuestions[currentQuestion]?.correct && (
                <p className="text-red-800 mb-3">
                  <strong>Correct Answer:</strong> {getCorrectAnswer(question)}
                </p>
              )}
              <p className="text-gray-800">
                <strong>Explanation:</strong> {question.explanation}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            {!showFeedback ? (
              <button
                onClick={handleAnswerSubmit}
                disabled={selectedAnswer === null}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
          <div className="mb-6">
            <div className="text-6xl font-bold text-blue-600 mb-2">{percentage}%</div>
            <p className="text-xl font-semibold text-gray-700">
              {score} out of {questions.length} correct
            </p>
          </div>

          {percentage >= 80 && <p className="text-lg text-green-600 font-semibold mb-4">Excellent work!</p>}
          {percentage >= 60 && percentage < 80 && <p className="text-lg text-blue-600 font-semibold mb-4">Good job! Review the missed questions.</p>}
          {percentage < 60 && <p className="text-lg text-orange-600 font-semibold mb-4">Keep studying! Review the material and try again.</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={restartQuiz}
              className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Retake Quiz
            </button>
            <button
              onClick={downloadResults}
              className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download Results
            </button>
            <button
              onClick={downloadQuestionBank}
              className="bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Question Bank
            </button>
            <button
              onClick={downloadPrintableQuiz}
              className="bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Printable Version
            </button>
          </div>
        </div>

        {/* Review */}
        <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Question Review</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((q, i) => {
              const answered = answeredQuestions[i];
              return (
                <div key={i} className={`p-4 rounded-lg border-l-4 ${
                  answered?.correct ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'
                }`}>
                  <p className="font-semibold text-gray-900">
                    {i + 1}. {answered?.correct ? '✓' : '✗'} {q.question}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Your answer: <strong>{answered?.selected || 'Not answered'}</strong>
                  </p>
                  {!answered?.correct && (
                    <p className="text-sm text-gray-700">
                      Correct answer: <strong>{getCorrectAnswer(q)}</strong>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white py-8 border-b-4 border-blue-600">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">Fire Academy Study Generator</h1>
          <p className="text-gray-300 text-sm">Essentials of Firefighting 1 & 2 | Interactive Quiz Mode</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload size={18} className="inline mr-2" />
            Upload Materials
          </button>
          {questions.length > 0 && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'quiz'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen size={18} className="inline mr-2" />
              Take Quiz
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-4 mb-6 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Load Saved Question Bank */}
            <div className="bg-white rounded-lg shadow p-8 border-2 border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FolderOpen size={24} className="text-blue-600" />
                Load Saved Question Bank
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Previously saved a question bank? Load it here to retake the quiz for exam prep.
              </p>
              <button
                onClick={() => questionFileRef.current?.click()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <FolderOpen size={20} />
                Load Question Bank (.json file)
              </button>
              <input
                ref={questionFileRef}
                type="file"
                onChange={handleQuestionBankUpload}
                className="hidden"
                accept=".json"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 text-sm font-semibold">OR CREATE NEW QUIZ</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Upload Card */}
            <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Transcript or Lecture Notes</h2>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Upload File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition"
                >
                  <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                  <p className="text-gray-900 font-semibold">Click to upload or drag and drop</p>
                  <p className="text-gray-500 text-sm mt-1">.txt, .md, .docx files supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.md,.docx,.doc"
                  />
                </div>
                {fileName && (
                  <p className="text-sm text-green-700 font-semibold mt-3">File loaded: {fileName}</p>
                )}
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm font-semibold">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Paste Transcript</label>
                <textarea
                  value={transcriptText}
                  onChange={handlePasteText}
                  placeholder="Paste your Claude-generated transcript or lecture notes here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono text-sm"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
              <ol className="space-y-1 text-blue-900 text-sm list-decimal list-inside">
                <li>Upload a transcript or paste lecture notes</li>
                <li>Click "Generate Quiz" to create 50 interactive questions</li>
                <li>Answer questions and get instant feedback</li>
                <li>Save the question bank to retake before finals</li>
                <li>Load any saved question bank anytime for review</li>
              </ol>
            </div>

            {transcriptText && (
              <button
                onClick={generateQuestions}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Generate Quiz (50 Questions)</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && questions.length > 0 && (
          <>
            {quizComplete ? renderResults() : renderQuestion()}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 mt-12">
        <p className="text-sm">Fire Academy Study Generator | Essentials of Firefighting 1 & 2</p>
      </footer>
    </div>
  );
}
