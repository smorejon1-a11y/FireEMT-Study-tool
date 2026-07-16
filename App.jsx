import React, { useState, useRef } from 'react';
import { Upload, FileText, Brain, Zap, Download, Loader, Clock, BookOpen } from 'lucide-react';

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
      const notesResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `You are an expert firefighter instructor specializing in "Essentials of Firefighting 1 & 2" curriculum.

A student has provided this lecture transcript. Your job is to create clear, organized study notes that will help them prepare for exams and practical assessments.

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
            },
          ],
        }),
      });

      const notesData = await notesResponse.json();
      if (!notesResponse.ok) throw new Error(notesData.error?.message || 'Failed to generate notes');

      const generatedNotes = notesData.content[0].text;
      setStudyNotes(generatedNotes);

      // Generate Questions
      const questionsResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          messages: [
            {
              role: 'user',
              content: `You are an expert firefighter instructor creating practice questions for Essentials of Firefighting 1 & 2 students.

Based on this lecture transcript, create a mix of question types to help the student prepare for exams and practical scenarios.

LECTURE TRANSCRIPT:
${transcriptText}

Generate 10-15 questions mixing these types:
- Multiple choice (4 options)
- Short answer (facts/procedures)
- Scenario-based (real-world situations)
- True/False
- Matching (terms to definitions)
- Essay (deeper understanding)

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
            },
          ],
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl">🚒</span>
            <h1 className="text-4xl font-bold">Fire Academy Study Generator</h1>
          </div>
          <p className="text-red-100 text-lg">Transform Claude transcripts into study questions</p>
          <p className="text-red-200 text-sm mt-2">Essentials of Firefighting 1 & 2</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'input'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-600'
            }`}
          >
            <Upload size={20} />
            Upload Transcript
          </button>
          {(studyNotes || questions.length > 0) && (
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeTab === 'results'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-600'
              }`}
            >
              <Brain size={20} />
              Study Materials
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={28} className="text-red-600" />
                Upload Your Transcript
              </h2>

              {/* File Upload */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Option 1: Upload a Text File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-red-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition"
                >
                  <Upload className="mx-auto mb-3 text-red-600" size={40} />
                  <p className="text-gray-800 font-semibold mb-2">Click to upload or drag a file</p>
                  <p className="text-gray-600 text-sm">.txt, .md, or .docx files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.md,.docx,.doc"
                  />
                </div>
                {fileName && (
                  <p className="text-sm text-green-600 font-semibold mt-3">✓ Loaded: {fileName}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 border-t-2 border-gray-300"></div>
                <span className="text-gray-600 font-semibold">OR</span>
                <div className="flex-1 border-t-2 border-gray-300"></div>
              </div>

              {/* Paste Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Option 2: Paste Your Transcript
                </label>
                <textarea
                  value={transcriptText}
                  onChange={handlePasteText}
                  placeholder="Paste your Claude-generated transcript here...

Example:
'Today we covered fire behavior, combustion theory, and the fire tetrahedron. The instructor explained how oxygen, fuel, heat, and chemical reaction all play a role in fire development...'

Paste the entire transcript and click Generate."
                  className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-mono text-sm resize-none"
                />
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">How to Use:</h3>
              <ol className="space-y-2 text-blue-900 text-sm list-decimal list-inside">
                <li>Get your lecture transcript from Claude (voice recording or provided summary)</li>
                <li>Upload the transcript file or paste it in the text box above</li>
                <li>Click "Generate Study Materials" button below</li>
                <li>Review the organized study notes and practice questions</li>
                <li>Download everything as a study guide to print or review later</li>
              </ol>
            </div>

            {/* Generate Button */}
            {transcriptText && (
              <button
                onClick={generateStudyMaterials}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={24} />
                    <span>Generating Study Materials...</span>
                  </>
                ) : (
                  <>
                    <Zap size={24} />
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
              <div className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <BookOpen size={28} className="text-red-600" />
                  Study Notes
                </h2>
                <div className="prose prose-sm max-w-none space-y-4">
                  {studyNotes.split('\n').map((line, i) => {
                    if (line.match(/^[A-Z\s]+$/) && line.trim()) {
                      return (
                        <h3 key={i} className="text-lg font-bold text-red-700 mt-6 mb-3 pt-4 border-t-2 border-gray-200">
                          {line}
                        </h3>
                      );
                    } else if (line.startsWith('•')) {
                      return <li key={i} className="ml-6 text-gray-700">{line.substring(2)}</li>;
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                      return (
                        <div key={i} className="ml-4 text-gray-700 font-semibold text-base">
                          {line.substring(2)}
                        </div>
                      );
                    } else if (line.includes('[') && line.includes(']')) {
                      return (
                        <p key={i} className="text-gray-700 mb-2 p-3 bg-yellow-50 rounded border-l-2 border-yellow-400">
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
              <div className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Brain size={28} className="text-red-600" />
                  Practice Questions ({questions.length})
                </h2>
                <div className="space-y-6">
                  {questions.map((q, i) => (
                    <div key={i} className="border-l-4 border-red-600 pl-6 py-4 bg-gray-50 rounded-r-lg p-4">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <h3 className="font-bold text-gray-800">
                          <span className="text-red-600 font-bold">{i + 1}.</span> {q.question}
                        </h3>
                        <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full whitespace-nowrap font-semibold">
                          {q.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Multiple Choice Options */}
                      {q.options && (
                        <div className="space-y-2 mb-4 ml-4">
                          {q.options.map((opt, j) => {
                            const isCorrect = opt.trim().startsWith(q.answer);
                            return (
                              <div
                                key={j}
                                className={`p-3 rounded ${
                                  isCorrect ? 'bg-green-100 border-l-4 border-green-600' : 'bg-white border border-gray-300'
                                }`}
                              >
                                <span className={isCorrect ? 'text-green-900 font-semibold' : 'text-gray-700'}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Matching */}
                      {q.pairs && (
                        <div className="mb-4 ml-4 space-y-2">
                          {q.pairs.map((pair, j) => (
                            <div key={j} className="flex gap-4 p-2 bg-white rounded border border-gray-300">
                              <strong className="text-red-700 min-w-max">{pair.term}</strong>
                              <span className="text-gray-600">{pair.definition}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Answer & Explanation */}
                      <details className="cursor-pointer ml-4">
                        <summary className="font-semibold text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded">
                          📌 View Answer & Explanation
                        </summary>
                        <div className="mt-3 p-4 bg-green-50 border-l-4 border-green-600 rounded-r">
                          {q.answer && (
                            <p className="mb-3 text-gray-800">
                              <strong className="text-green-700">Answer:</strong> {q.answer}
                            </p>
                          )}
                          <p className="text-gray-700">
                            <strong className="text-green-700">Why:</strong> {q.explanation}
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
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <Download size={24} />
                Download All Study Materials (.txt file)
              </button>
            )}

            {/* Back to Upload */}
            <button
              onClick={() => {
                setActiveTab('input');
                setTranscriptText('');
                setFileName('');
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Generate from Another Transcript
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 bg-gray-800 text-gray-300 text-center py-6">
        <p className="text-sm">
          🚒 Fire Academy Study Generator | Powered by Claude AI | Essentials of Firefighting 1 & 2
        </p>
      </div>
    </div>
  );
}