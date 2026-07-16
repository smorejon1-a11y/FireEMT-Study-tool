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
              content: `You are an expert firefighter instructor. Create organized study notes from this transcript.

TRANSCRIPT:
${transcriptText}

Format:
- TOPIC HEADERS (ALL CAPS)
- Key definitions in [brackets]
- • Bullet points for details`,
            },
          ],
        }),
      });

      const notesData = await notesResponse.json();
      if (!notesResponse.ok) throw new Error(notesData.error?.message || 'Failed to generate notes');
      const generatedNotes = notesData.content[0].text;
      setStudyNotes(generatedNotes);

      const questionsResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [
            {
              role: 'user',
              content: `Generate 50 firefighting practice questions from this transcript. Output ONLY valid JSON.

TRANSCRIPT:
${transcriptText}

{
  "questions": [
    {"id": 1, "type": "multiple_choice", "question": "?", "options": ["A)", "B)", "C)", "D)"], "answer": "B", "explanation": "..."},
    {"id": 2, "type": "short_answer", "question": "?", "answer": "...", "explanation": "..."}
  ]
}`,
            },
          ],
        }),
      });

      const questionsData = await questionsResponse.json();
      if (!questionsResponse.ok) throw new Error(questionsData.error?.message || 'Failed');
      const questionsText = questionsData.content[0].text;
      const jsonMatch = questionsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]);
        setQuestions(parsedQuestions.questions || []);
      }
      setActiveTab('results');
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadAsText = () => {
    let content = `FIRE ACADEMY STUDY GUIDE\n${new Date().toLocaleDateString()}\n${'='.repeat(60)}\n\n`;
    if (fileName) content += `Source: ${fileName}\n\n`;
    content += `STUDY NOTES\n${'-'.repeat(60)}\n\n${studyNotes}\n\n${'='.repeat(60)}\n\nQUESTIONS\n`;
    questions.forEach((q, i) => {
      content += `\n${i + 1}. [${q.type}] ${q.question}\n`;
      if (q.options) q.options.forEach(o => content += `${o}\n`);
      if (q.pairs) q.pairs.forEach(p => content += `• ${p.term}: ${p.definition}\n`);
      content += `Answer: ${q.answer}\nExplanation: ${q.explanation}\n`;
    });
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `study-${new Date().toISOString().split('T')[0]}.txt`);
    element.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">🚒 Fire Academy Study Generator</h1>
          <p className="text-red-100">Transform transcripts into study materials</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab('input')} className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'input' ? 'bg-red-600 text-white' : 'bg-white border-2 border-gray-300'}`}>
            <Upload size={20} className="inline mr-2" /> Upload
          </button>
          {(studyNotes || questions.length > 0) && (
            <button onClick={() => setActiveTab('results')} className={`px-6 py-3 rounded-lg font-semibold ${activeTab === 'results' ? 'bg-red-600 text-white' : 'bg-white border-2 border-gray-300'}`}>
              <Brain size={20} className="inline mr-2" /> Materials
            </button>
          )}
        </div>

        {error && <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 mb-6">{error}</div>}

        {activeTab === 'input' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-8 border-2">
              <h2 className="text-2xl font-bold mb-6">Upload Transcript</h2>
              <div onClick={() => fileInputRef.current?.click()} className="border-3 border-dashed border-red-300 rounded-lg p-8 text-center cursor-pointer">
                <Upload className="mx-auto mb-3" size={40} />
                <p className="font-semibold">Click to upload</p>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.docx" />
              </div>
              {fileName && <p className="text-sm text-green-600 mt-3">✓ {fileName}</p>}
              
              <div className="my-6 text-center text-gray-600">OR</div>
              
              <textarea value={transcriptText} onChange={handlePasteText} placeholder="Paste transcript..." className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg" />
            </div>

            {transcriptText && (
              <button onClick={generateStudyMaterials} disabled={loading} className="w-full bg-red-600 text-white py-4 rounded-lg font-bold hover:shadow-xl disabled:opacity-50">
                {loading ? <>Loading...</> : <>Generate Study Materials</>}
              </button>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {studyNotes && <div className="bg-white rounded-lg p-8 border-2"><h2 className="text-2xl font-bold mb-4">Study Notes</h2><div className="whitespace-pre-wrap text-gray-700">{studyNotes}</div></div>}
            {questions.length > 0 && <div className="bg-white rounded-lg p-8 border-2"><h2 className="text-2xl font-bold mb-4">Questions ({questions.length})</h2><div className="space-y-4">{questions.map((q,i) => <div key={i} className="border-l-4 border-red-600 pl-4"><p className="font-bold">{i+1}. {q.question}</p><details><summary>Answer</summary><p>{q.answer}</p></details></div>)}</div></div>}
            {(studyNotes || questions.length > 0) && <button onClick={downloadAsText} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold">Download</button>}
          </div>
        )}
      </div>
    </div>
  );
}
