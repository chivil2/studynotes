import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Note {
  id: string; subjectId: string; title: string; content: string; updatedAt: number;
}
interface Subject {
  id: string; name: string; icon: string; type: 'notes' | 'chapters';
}
interface Chapter {
  id: string; number: number; title: string; html: string; uploaded?: boolean; isQuiz?: boolean;
}

// ── New Content: Chapter 5 and Quiz ──────────────────────────────────────────
const CH5_HTML = `
<div style="font-family:serif;line-height:1.6;padding:1rem;color:#333">
  <h2 style="color:#900">Chapter 5: Relational Algebra & Calculus</h2>
  <p>Foundational languages for manipulating relations.</p>
  <ul>
    <li><strong>Select (σ):</strong> Unary op that returns rows matching a condition.</li>
    <li><strong>Project (π):</strong> Unary op that returns specific columns.</li>
    <li><strong>Join (⨝):</strong> Binary op combining two relations based on a common attribute.</li>
  </ul>
</div>
`;

const MIDTERM_QUIZ_HTML = `
<div style="font-family:sans-serif;padding:1.5rem;color:#1a2c3e;background:#fff">
  <h2 style="color:#900;text-align:center">🏁 IM Midterm Practice Quiz</h2>
  <div style="background:#f4f4f4;padding:1rem;border-radius:8px;margin-bottom:1rem">
    <p><strong>Q1:</strong> Which constraint ensures every supertype instance belongs to a subtype?</p>
    <label><input type="radio" name="mq1"> A) Partial Completeness</label><br>
    <label><input type="radio" name="mq1"> B) Total Completeness</label>
  </div>
  <div style="background:#f4f4f4;padding:1rem;border-radius:8px;margin-bottom:1rem">
    <p><strong>Q2:</strong> A "Fan Trap" occurs in which relationship structure?</p>
    <label><input type="radio" name="mq2"> A) M:N</label><br>
    <label><input type="radio" name="mq2"> B) One entity in two 1:M relationships</label>
  </div>
  <button onclick="alert('Answers: 1:B, 2:B')" style="background:#900;color:white;border:none;padding:0.75rem 1.5rem;border-radius:4px;cursor:pointer;width:100%">Check Answers</button>
</div>
`;

const BUILTIN_CHAPTERS: Chapter[] = [
  { id: 'im-ch1', number: 1, title: 'Introduction to Database Systems', html: '<h2>Ch 1 placeholder</h2>' },
  { id: 'im-ch2', number: 2, title: 'Data Modeling & the ER Model', html: '<h2>Ch 2 placeholder</h2>' },
  { id: 'im-ch3', number: 3, title: 'Normalization', html: '<h2>Ch 3 placeholder</h2>' },
  { id: 'im-ch4', number: 4, title: 'Advanced Data Modeling (EER)', html: '<h2>Ch 4 Content (See previous versions)</h2>' },
  { id: 'im-ch5', number: 5, title: 'Relational Algebra', html: CH5_HTML },
  { id: 'im-quiz', number: 100, title: '🔥 MIDTERM PRACTICE QUIZ', html: MIDTERM_QUIZ_HTML, isQuiz: true },
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'im', name: 'Information Management', icon: '🗄️', type: 'chapters' },
  { id: '1',  name: 'Computer Science',       icon: '💻', type: 'notes'    },
  { id: '2',  name: 'Mathematics',            icon: '📐', type: 'notes'    },
];

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [activeSubjectId, setActiveSubjectId] = useState('im');
  const [notes, setNotes] = useState<Note[]>(() => JSON.parse(localStorage.getItem('study-notes') || '[]'));
  const [uploadedChapters, setUploadedChapters] = useState<Chapter[]>(() => JSON.parse(localStorage.getItem('im-uploaded-chapters') || '[]'));
  const [activeChapterId, setActiveChapterId] = useState(BUILTIN_CHAPTERS[5].id); // Start on Quiz
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allChapters = [...BUILTIN_CHAPTERS, ...uploadedChapters].sort((a, b) => a.number - b.number);
  const activeSubject = DEFAULT_SUBJECTS.find(s => s.id === activeSubjectId)!;
  const activeChapter = allChapters.find(c => c.id === activeChapterId) || allChapters[0];
  const activeNote = notes.find(n => n.id === activeNoteId) || notes.find(n => n.subjectId === activeSubjectId) || null;

  useEffect(() => localStorage.setItem('study-notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('im-uploaded-chapters', JSON.stringify(uploadedChapters)), [uploadedChapters]);

  const handleCreateNote = () => {
    const n = { id: Date.now().toString(), subjectId: activeSubjectId, title: 'New Work', content: '', updatedAt: Date.now() };
    setNotes([n, ...notes]); setActiveNoteId(n.id); setIsMenuOpen(false);
  };

  const handleFile = (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => setPendingUpload({ filename: file.name, html: ev.target.result });
    reader.readAsText(file);
  };

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${isMenuOpen ? 'visible' : ''}`} onClick={() => setIsMenuOpen(false)} />
      
      <header className="ao3-header">
        <div className="nav-group">
          <div className="nav-link mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>MENU</div>
          <div className="ao3-logo desktop-only">ARCHIVE OF OUR OWN</div>
        </div>
        <div className="nav-group">
          <div className="nav-link" onClick={() => fileInputRef.current?.click()}>Post New</div>
          <input ref={fileInputRef} type="file" accept=".html" style={{display:'none'}} onChange={handleFile} />
        </div>
      </header>

      <aside className={`sidebar ${isMenuOpen ? '' : 'hidden'}`}>
        <div className="sidebar-section-title">SUBJECTS</div>
        {DEFAULT_SUBJECTS.map(s => (
          <div key={s.id} className={`subject-item ${s.id === activeSubjectId ? 'active' : ''}`} onClick={() => {setActiveSubjectId(s.id); setActiveNoteId(null); setIsMenuOpen(false);}}>
            {s.icon} {s.name}
          </div>
        ))}
        {activeSubject.type === 'chapters' && (
          <>
            <div className="sidebar-section-title">CHAPTER INDEX</div>
            {allChapters.map(ch => (
              <div key={ch.id} className={`subject-item ${ch.id === activeChapterId ? 'active' : ''}`} onClick={() => {setActiveChapterId(ch.id); setIsMenuOpen(false);}}>
                {ch.isQuiz ? '🏁 ' : `Ch ${ch.number}: `}{ch.title}
              </div>
            ))}
          </>
        )}
        <div className="timer-block">
          <div className="timer-display">25:00</div>
          <button className="btn btn-primary" style={{width:'100%',marginTop:'5px'}}>Start Timer</button>
        </div>
      </aside>

      <main className="main-layout">
        <div className="work-meta">
          <div className="meta-group"><div className="meta-label">Fandom:</div><div className="meta-value">{activeSubject.name}</div></div>
          <div className="meta-group"><div className="meta-label">Type:</div><div className="meta-value">{activeSubject.type === 'chapters' ? 'Lessons/Quizzes' : 'Study Notes'}</div></div>
          <div className="meta-group"><div className="meta-label">Stats:</div><div className="meta-value">Updated: 2026-03-24</div></div>
        </div>

        <div className="view-container">
          {activeSubject.type === 'chapters' ? (
            <>
              <div className="chapter-header">
                <div className="chapter-title">{activeChapter.title}</div>
              </div>
              <iframe key={activeChapterId} srcDoc={activeChapter.html} className="chapter-iframe" sandbox="allow-scripts allow-same-origin" />
            </>
          ) : (
            <>
              <input className="editor-title" value={activeNote?.title || ''} onChange={e => setNotes(prev => prev.map(n => n.id === activeNote?.id ? {...n, title: e.target.value} : n))} placeholder="Title" />
              <textarea className="editor-body" value={activeNote?.content || ''} onChange={e => setNotes(prev => prev.map(n => n.id === activeNote?.id ? {...n, content: e.target.value} : n))} placeholder="Write here..." />
              {!activeNote && <button className="btn btn-primary" onClick={handleCreateNote}>+ Create New Work</button>}
            </>
          )}
        </div>
      </main>

      {pendingUpload && (
        <div className="modal-backdrop" onClick={() => setPendingUpload(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="sidebar-section-title">POST NEW CHAPTER</h3>
            <label className="meta-label">Ch #</label>
            <input className="modal-input" type="number" defaultValue={allChapters.length + 1} id="upChNum" />
            <label className="meta-label">Title</label>
            <input className="modal-input" type="text" defaultValue={pendingUpload.filename} id="upChTitle" />
            <button className="btn btn-primary" onClick={() => {
              const num = Number((document.getElementById('upChNum') as any).value);
              const title = (document.getElementById('upChTitle') as any).value;
              setUploadedChapters(p => [...p, { id: `up-${Date.now()}`, number: num, title, html: pendingUpload.html, uploaded: true }]);
              setPendingUpload(null);
            }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
