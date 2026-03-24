import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  type: 'notes' | 'chapters';
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  html: string;
  uploaded?: boolean;
}

// ── Chapter 4 HTML (Shortened for brevity) ──────────────────────────────────
const CH4_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Georgia', serif; line-height: 1.6; padding: 1rem; color: #333; max-width: 900px; margin: 0 auto; }
    h1, h2 { color: #900; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
    .topic { margin-bottom: 1.5rem; }
    .definition { background: #f9f9f9; border-left: 4px solid #900; padding: 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Advanced Data Modeling (EER)</h1>
  <div class="topic">
    <h2>1. Entity Supertypes & Subtypes</h2>
    <p>Common characteristics are kept in the supertype, while unique attributes go to subtypes.</p>
    <div class="definition">Inheritance: Subtypes inherit all attributes of the supertype.</div>
  </div>
</body>
</html>
`;

const BUILTIN_CHAPTERS: Chapter[] = [
  { id: 'im-ch1', number: 1, title: 'Introduction to Database Systems', html: '<h2>Chapter 1 content goes here.</h2>' },
  { id: 'im-ch2', number: 2, title: 'Data Modeling & the ER Model', html: '<h2>Chapter 2 content goes here.</h2>' },
  { id: 'im-ch3', number: 3, title: 'Normalization', html: '<h2>Chapter 3 content goes here.</h2>' },
  { id: 'im-ch4', number: 4, title: 'Advanced Data Modeling (EER)', html: CH4_HTML },
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'im', name: 'Information Management', icon: '🗄️', type: 'chapters' },
  { id: '1',  name: 'Computer Science',       icon: '💻', type: 'notes'    },
  { id: '2',  name: 'Mathematics',            icon: '📐', type: 'notes'    },
  { id: '3',  name: 'History',                icon: '📜', type: 'notes'    },
  { id: '4',  name: 'Biology',                icon: '🧬', type: 'notes'    },
];

function extractTitle(html: string, fallback: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : fallback;
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
interface UploadModalProps {
  onClose: () => void;
  onSave: (chapter: Chapter) => void;
  nextNumber: number;
  filename: string;
  detectedTitle: string;
  html: string;
}

function UploadModal({ onClose, onSave, nextNumber, filename, detectedTitle, html }: UploadModalProps) {
  const [chNum, setChNum] = useState(nextNumber);
  const [title, setTitle] = useState(detectedTitle);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="sidebar-section-title">Post New Chapter</h3>
        <p style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Draft: {filename}</p>
        <label className="meta-label" style={{textAlign: 'left', display: 'block', width: 'auto'}}>Chapter Number</label>
        <input className="modal-input" type="number" value={chNum} onChange={e => setChNum(Number(e.target.value))} />
        <label className="meta-label" style={{textAlign: 'left', display: 'block', width: 'auto'}}>Chapter Title</label>
        <input className="modal-input" type="text" value={title} onChange={e => setTitle(e.target.value)} />
        <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
          <button className="btn btn-primary" onClick={() => onSave({ id: `up-${Date.now()}`, number: chNum, title, html, uploaded: true })}>Post</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [subjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [activeSubjectId, setActiveSubjectId] = useState<string>(DEFAULT_SUBJECTS[0].id);
  const [notes, setNotes] = useState<Note[]>(() => JSON.parse(localStorage.getItem('study-notes') || '[]'));
  const [uploadedChapters, setUploadedChapters] = useState<Chapter[]>(() => JSON.parse(localStorage.getItem('im-uploaded-chapters') || '[]'));
  const [pendingUpload, setPendingUpload] = useState<{ filename: string; detectedTitle: string; html: string; } | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>(BUILTIN_CHAPTERS[3].id);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allChapters: Chapter[] = [...BUILTIN_CHAPTERS, ...uploadedChapters].sort((a, b) => a.number - b.number);
  const activeSubject = subjects.find(s => s.id === activeSubjectId)!;
  const activeChapter = allChapters.find(c => c.id === activeChapterId) || allChapters[0];
  const activeNote = notes.find(n => n.id === activeNoteId) || notes.find(n => n.subjectId === activeSubjectId) || null;

  useEffect(() => localStorage.setItem('study-notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('im-uploaded-chapters', JSON.stringify(uploadedChapters)), [uploadedChapters]);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timeLeft > 0) interval = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    else if (timeLeft === 0) { setIsTimerRunning(false); alert('Focus session ended!'); setTimeLeft(25 * 60); }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleCreateNote = () => {
    const n: Note = { id: Date.now().toString(), subjectId: activeSubjectId, title: 'New Work', content: '', updatedAt: Date.now() };
    setNotes([n, ...notes]);
    setActiveNoteId(n.id);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPendingUpload({ filename: file.name, detectedTitle: extractTitle(ev.target?.result as string, file.name), html: ev.target?.result as string });
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-container">
      <header className="ao3-header">
        <div className="ao3-logo">🏠 <span>ARCHIVE OF OUR OWN</span></div>
        <nav className="ao3-nav-main">
          <div className={`nav-link ${activeSubject.type === 'chapters' ? 'active' : ''}`} onClick={() => setActiveSubjectId('im')}>Fandoms</div>
          <div className="nav-link" onClick={() => fileInputRef.current?.click()}>Post New</div>
          <input ref={fileInputRef} type="file" accept=".html" style={{display: 'none'}} onChange={handleFileSelected} />
        </nav>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section-title">Navigate By Subject</div>
          <div className="subject-list">
            {subjects.map(s => (
              <div key={s.id} className={`subject-item ${s.id === activeSubjectId ? 'active' : ''}`} onClick={() => {setActiveSubjectId(s.id); setActiveNoteId(null);}}>
                {s.icon} {s.name}
              </div>
            ))}
          </div>

          {activeSubject.type === 'chapters' && (
            <>
              <div className="sidebar-section-title">Chapter Index</div>
              <div className="subject-list">
                {allChapters.map(ch => (
                  <div key={ch.id} className={`subject-item ${ch.id === activeChapterId ? 'active' : ''}`} onClick={() => setActiveChapterId(ch.id)}>
                    Ch {ch.number}: {ch.title}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="timer-block">
            <div className="sidebar-section-title" style={{color: '#555'}}>Focus Timer</div>
            <div className="timer-display">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}</div>
            <div style={{display: 'flex', gap: '4px', marginTop: '8px'}}>
              <button className="btn" style={{flex: 1}} onClick={() => setIsTimerRunning(!isTimerRunning)}>{isTimerRunning ? 'Pause' : 'Start'}</button>
              <button className="btn" onClick={() => {setTimeLeft(25*60); setIsTimerRunning(false)}}>⟳</button>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="work-meta">
            <div className="meta-group"><div className="meta-label">Rating:</div><div className="meta-value">General Audiences</div></div>
            <div className="meta-group"><div className="meta-label">Archive Warning:</div><div className="meta-value">No Archive Warnings Apply</div></div>
            <div className="meta-group"><div className="meta-label">Fandom:</div><div className="meta-value">{activeSubject.name}</div></div>
            <div className="meta-group"><div className="meta-label">Stats:</div><div className="meta-value">Published: 2026-03-24 | Words: {activeSubject.type === 'notes' ? (activeNote?.content.split(' ').length || 0) : 'HTML Source'}</div></div>
          </div>

          <div className="view-container">
            {activeSubject.type === 'chapters' ? (
              <>
                <div className="chapter-header">
                  <div className="chapter-title">Chapter {activeChapter.number}: {activeChapter.title}</div>
                </div>
                <iframe key={activeChapterId} srcDoc={activeChapter.html} title={activeChapter.title} className="chapter-iframe" sandbox="allow-scripts allow-same-origin" />
              </>
            ) : (
              <>
                <input className="editor-title" value={activeNote?.title || ''} onChange={e => setNotes(prev => prev.map(n => n.id === activeNote?.id ? {...n, title: e.target.value} : n))} placeholder="Work Title" />
                <textarea className="editor-body" value={activeNote?.content || ''} onChange={e => setNotes(prev => prev.map(n => n.id === activeNote?.id ? {...n, content: e.target.value} : n))} placeholder="Write your work here..." />
                {!activeNote && <button className="btn btn-primary" onClick={handleCreateNote}>Create New Work</button>}
              </>
            )}
          </div>
        </main>
      </div>

      {pendingUpload && (
        <UploadModal 
          {...pendingUpload} 
          nextNumber={Math.max(...allChapters.map(c => c.number), 0) + 1} 
          onClose={() => setPendingUpload(null)} 
          onSave={ch => { setUploadedChapters(p => [...p, ch]); setActiveChapterId(ch.id); setPendingUpload(null); }} 
        />
      )}
    </div>
  );
}

export default App;
