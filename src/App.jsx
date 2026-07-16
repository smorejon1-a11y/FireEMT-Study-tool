import React, { useState, useRef } from 'react';
import { Upload, FileText, BookOpen, Zap, Download, Loader } from 'lucide-react';

export default function FireAcademyStudyGenerator() {
  const [transcriptText, setTranscriptText] = useState('');
  const [studyNotes, setStudyNotes] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

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

  const generateStudyMaterials = async () => {
    if (!transcriptText.trim()) {
      setError('Please paste or upload a transcript');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Generate Study Notes
      const notesResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: `You are an expert firefighter instructor specializing in "Essentials of Firefighting 1 & 2" curriculum. A student has provided this lecture transcript. Your job is to create clear, organized study notes.

LECTURE TRANSCRIPT:
${transcriptText}

Please create study notes that:
1. Extract and organize key concepts by topic
2. Include important definitions (especially technical firefighting terms)
3. Highlight critical safety procedures and protocols
4. Note any regulations or standards mentioned
5. List equipment and tools discussed
6. Organize procedures step-by-step

Format the notes as:
- TOPIC HEADERS (in ALL CAPS)
- Subtopic: key information
- • Bullet points for details
- [Important definitions in brackets]

Make the notes concise but comprehensive - perfect for studying before an exam.`,
        }),
      });

      const notesData = await notesResponse.json();
      if (!notesResponse.ok) throw new Error(notesData.error?.message || 'Failed to generate notes');
      const generatedNotes = notesData.content[0].text;
      setStudyNotes(generatedNotes);

      // Generate Questions
      const questionsResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: `You are an expert firefighter instructor creating practice questions for Essentials of Firefighting 1 & 2 students. Based on this lecture transcript, create a mix of question types to help the student prepare for exams and practical scenarios.

LECTURE TRANSCRIPT:
${transcriptText}

Generate 50 questions mixing these types: Multiple choice (4 options), Short answer (facts/procedures), Scenario-based (real-world situations), True/False, Matching (terms to definitions), Essay (deeper understanding).

IMPORTANT: Output ONLY valid JSON, nothing else. Use this exact format:

{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "B",
      "explanation": "Why B is correct..."
    },
    {
      "id": 2,
      "type": "short_answer",
      "question": "Question text here?",
      "answer": "Expected answer",
      "explanation": "Why this is important..."
    },
    {
      "id": 3,
      "type": "scenario",
      "question": "Scenario: [describe situation]. What should you do?",
      "answer": "Correct response",
      "explanation": "This tests your ability to..."
    },
    {
      "id": 4,
      "type": "true_false",
      "question": "Statement here?",
      "answer": true,
      "explanation": "Explanation..."
    },
    {
      "id": 5,
      "type": "matching",
      "question": "Match these terms to definitions",
      "pairs": [
        {"term": "Term 1", "definition": "Definition 1"},
        {"term": "Term 2", "definition": "Definition 2"}
      ],
      "explanation": "These terms are important because..."
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
      } else {
        setError('Could not generate questions. Please try again.');
        return;
      }

      setActiveTab('results');
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadAsText = () => {
    let content = `FIRE ACADEMY STUDY GUIDE\nGenerated: ${new Date().toLocaleDateString()}\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    if (fileName) {
      content += `Source: ${fileName}\n\n`;
    }

    content += `STUDY NOTES\n${'-'.repeat(60)}\n\n${studyNotes}\n\n`;
    content += `${'='.repeat(60)}\n\nPRACTICE QUESTIONS\n${'-'.repeat(60)}\n\n`;
    
    questions.forEach((q, i) => {
      content += `${i + 1}. [${q.type.toUpperCase()}]\n`;
      content += `${q.question}\n`;
      
      if (q.options) {
        q.options.forEach(opt => {
          content += `${opt}\n`;
        });
        content += `\nAnswer: ${q.answer}\n`;
      } else if (q.pairs) {
        q.pairs.forEach(pair => {
          content += `  • ${pair.term}: ${pair.definition}\n`;
        });
      } else {
        content += `Answer: ${q.answer}\n`;
      }
      
      content += `Explanation: ${q.explanation}\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `fire-academy-study-${new Date().toISOString().split('T')[0]}.txt`);
    element.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white py-8 border-b-4 border-blue-600">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">Fire Academy Study Generator</h1>
          <p className="text-gray-300 text-sm">Essentials of Firefighting 1 & 2 | Educational Study Tool</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('input')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'input'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload size={18} className="inline mr-2" />
            Upload Materials
          </button>
          {(studyNotes || questions.length > 0) && (
            <button
              onClick={() => setActiveTab('results')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen size={18} className="inline mr-2" />
              Study Materials
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

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Transcript or Lecture Notes</h2>

              {/* File Upload */}
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

              {/* Divider */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm font-semibold">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Paste Text */}
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
                <li>Click "Generate Study Materials"</li>
                <li>Review organized notes and 50 practice questions</li>
                <li>Download the complete study guide</li>
              </ol>
            </div>

            {/* Generate Button */}
            {transcriptText && (
              <button
                onClick={generateStudyMaterials}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Generating Study Materials...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Generate Study Materials</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Study Notes */}
            {studyNotes && (
              <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen size={24} className="text-blue-600" />
                  Study Notes
                </h2>
                <div className="bg-gray-50 p-6 rounded border border-gray-200 text-sm leading-relaxed">
                  {studyNotes.split('\n').map((line, i) => {
                    if (line.match(/^[A-Z\s]+$/) && line.trim()) {
                      return (
                        <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3 pt-4 border-t border-gray-300">
                          {line}
                        </h3>
                      );
                    } else if (line.startsWith('•')) {
                      return <li key={i} className="ml-6 text-gray-700">{line.substring(2)}</li>;
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                      return (
                        <div key={i} className="ml-4 text-gray-700 font-semibold text-base mt-3">
                          {line.substring(2)}
                        </div>
                      );
                    } else if (line.includes('[') && line.includes(']')) {
                      return (
                        <p key={i} className="text-gray-700 mb-2 p-3 bg-yellow-50 rounded border-l-2 border-yellow-400 my-2">
                          {line}
                        </p>
                      );
                    } else if (line.trim()) {
                      return (
                        <p key={i} className="text-gray-700 mb-2">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Questions */}
            {questions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText size={24} className="text-blue-600" />
                  Practice Questions ({questions.length})
                </h2>
                <div className="space-y-6">
                  {questions.map((q, i) => (
                    <div key={i} className="border-l-4 border-blue-600 pl-6 py-4 bg-gray-50 rounded-r p-4">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <h3 className="font-semibold text-gray-900">
                          <span className="text-blue-600 font-bold">{i + 1}.</span> {q.question}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded whitespace-nowrap font-semibold">
                          {q.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Multiple Choice */}
                      {q.options && (
                        <div className="space-y-2 mb-4 ml-4">
                          {q.options.map((opt, j) => {
                            const isCorrect = opt.trim().startsWith(q.answer);
                            return (
                              <div
                                key={j}
                                className={`p-3 rounded text-sm ${
                                  isCorrect ? 'bg-green-100 border-l-4 border-green-600 text-green-900 font-semibold' : 'bg-white border border-gray-300 text-gray-700'
                                }`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Matching */}
                      {q.pairs && (
                        <div className="mb-4 ml-4 space-y-2">
                          {q.pairs.map((pair, j) => (
                            <div key={j} className="flex gap-4 p-3 bg-white rounded border border-gray-300 text-sm">
                              <strong className="text-blue-700 min-w-max">{pair.term}</strong>
                              <span className="text-gray-600">{pair.definition}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Answer */}
                      <details className="cursor-pointer ml-4">
                        <summary className="font-semibold text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded text-sm">
                          View Answer & Explanation
                        </summary>
                        <div className="mt-3 p-4 bg-gray-50 border-l-4 border-blue-600 rounded-r text-sm">
                          {q.answer && (
                            <p className="mb-2 text-gray-800">
                              <strong className="text-gray-900">Answer:</strong> {q.answer}
                            </p>
                          )}
                          <p className="text-gray-700">
                            <strong className="text-gray-900">Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Button */}
            {(studyNotes || questions.length > 0) && (
              <button
                onClick={downloadAsText}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Study Guide
              </button>
            )}

            {/* New Session Button */}
            <button
              onClick={() => {
                setActiveTab('input');
                setTranscriptText('');
                setFileName('');
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 mt-12">
        <p className="text-sm">Fire Academy Study Generator | Essentials of Firefighting 1 & 2</p>
      </footer>
    </div>
  );
}
