/**
 * StudyNotes v2 — Application Logic
 */

// ---------------------------------------------------------------------------
// Data Storage
// ---------------------------------------------------------------------------
const DB = {
    get: () => {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem('studynotes_db') || localStorage.getItem('studynotes_data') || localStorage.getItem('studynotes') || localStorage.getItem('notes_db') || 'null');
        } catch (e) { }
        if (!data || !data.courses || data.courses.length === 0) {
            data = {
                courses: [
                    {
                        id: 1,
                        title: "Information Management",
                        tags: "IT, Database, Management",
                        description: "Key concepts in managing information as a strategic resource.",
                        lessons: [
                            {
                                id: 101,
                                title: "Topic 1: Information Systems Overview",
                                description: "The role of IS in modern organizations.",
                                content: "Information Systems (IS) consist of hardware, software, data, people, and procedures that work together to produce quality information.\n\n**Components:**\n1. **Hardware**: Physical components.\n2. **Software**: Programs and OS.\n3. **Data**: Raw facts.\n4. **People**: Users and IT staff.\n5. **Procedures**: Rules for IS use.",
                                completed: false
                            },
                            {
                                id: 102,
                                title: "Topic 2: Database Management Systems",
                                description: "Understanding RDBMS and SQL basics.",
                                content: "A DBMS is software that handles storage, retrieval, and updating of data in a computer system.\n\n**Key Features:**\n- **Data Integrity**: Ensures data accuracy.\n- **Concurrency**: Allows multiple users to access data.\n- **Security**: Protects sensitive information.\n\n*Common SQL Commands: SELECT, INSERT, UPDATE, DELETE.*",
                                completed: false
                            },
                            {
                                id: 103,
                                title: "Topic 3: Data Security and Privacy",
                                description: "Protecting information assets.",
                                content: "Information security focuses on the Confidentiality, Integrity, and Availability (CIA) triad.\n\n- **Confidentiality**: Only authorized access.\n- **Integrity**: Data remains unaltered.\n- **Availability**: Accessible when needed.\n\nMethods include encryption, firewalls, and multi-factor authentication.",
                                completed: false
                            }
                        ]
                    }
                ]
            };
            localStorage.setItem('studynotes_db', JSON.stringify(data));
        }
        return data;
    },
    save: (data) => localStorage.setItem('studynotes_db', JSON.stringify(data)),

    addCourse(course) {
        const data = DB.get();
        course.id = Date.now();
        course.lessons = [];
        data.courses.push(course);
        DB.save(data);
        return course.id;
    },

    editCourse(id, updates) {
        const data = DB.get();
        const c = data.courses.find(c => c.id == id);
        if (c) { Object.assign(c, updates); DB.save(data); }
    },

    deleteCourse(id) {
        const data = DB.get();
        data.courses = data.courses.filter(c => c.id != id);
        DB.save(data);
    },

    addLesson(courseId, lesson) {
        const data = DB.get();
        const c = data.courses.find(c => c.id == courseId);
        lesson.id = Date.now();
        lesson.completed = false;
        c.lessons.push(lesson);
        DB.save(data);
    },

    editLesson(courseId, lessonId, updates) {
        const data = DB.get();
        const c = data.courses.find(c => c.id == courseId);
        const l = c && c.lessons.find(l => l.id == lessonId);
        if (l) { Object.assign(l, updates); DB.save(data); }
    },

    toggleLessonStatus(courseId, lessonId) {
        const data = DB.get();
        const c = data.courses.find(c => c.id == courseId);
        const l = c && c.lessons.find(l => l.id == lessonId);
        if (l) {
            l.completed = !l.completed;
            DB.save(data);
        }
    },

    deleteLesson(courseId, lessonId) {
        const data = DB.get();
        const c = data.courses.find(c => c.id == courseId);
        if (c) { c.lessons = c.lessons.filter(l => l.id != lessonId); DB.save(data); }
    }
};

// ---------------------------------------------------------------------------
// Minimal Markdown Renderer
// ---------------------------------------------------------------------------
function renderMarkdown(text) {
    if (!text) return '<p><em>No content yet.</em></p>';

    // Handle Code Blocks first
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, function (match, lang, code) {
        return '<pre class="code-block"><button class="copy-code-btn">Copy</button><code>' + code.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
    });

    const lines = text.split('\n');
    let html = '';
    let inList = false;

    lines.forEach(function (line) {
        // Skip lines that are already part of a code block (very naive check)
        if (line.indexOf('<pre') !== -1 || line.indexOf('</pre') !== -1 || line.indexOf('<code>') !== -1) {
            html += line;
            return;
        }

        line = line
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>');

        if (/^#{1,4}\s/.test(line)) {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<h4>' + line.replace(/^#+\s+/, '') + '</h4>';
        } else if (/^[-*]\s/.test(line)) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += '<li>' + line.replace(/^[-*]\s/, '') + '</li>';
        } else if (/^\d+\.\s/.test(line)) {
            if (inList) { html += '</ul>'; inList = true; } // Reuse same list logic
            html += '<li>' + line.replace(/^\d+\.\s/, '') + '</li>';
        } else if (line.trim() === '') {
            if (inList) { html += '</ul>'; inList = false; }
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<p>' + line + '</p>';
        }
    });

    if (inList) html += '</ul>';
    return html;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
var router = {
    currentView: 'dashboard',
    params: {},

    navigate: function (view, params) {
        this.currentView = view;
        this.params = params || {};
        this.render();
        window.scrollTo(0, 0);
    },

    render: function () {
        var root = document.getElementById('app-root');
        root.innerHTML = '';
        if (this.currentView === 'dashboard') renderDashboard(root);
        else if (this.currentView === 'course') renderCourse(root, this.params.id);
    }
};

// ---------------------------------------------------------------------------
// Search helper
// ---------------------------------------------------------------------------
function getFilteredCourses(courses) {
    var q = (document.getElementById('search-bar').value || '').toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(function (c) {
        return c.title.toLowerCase().indexOf(q) !== -1 ||
            (c.tags || '').toLowerCase().indexOf(q) !== -1 ||
            (c.description || '').toLowerCase().indexOf(q) !== -1;
    });
}

// ---------------------------------------------------------------------------
// Dashboard View
// ---------------------------------------------------------------------------
function renderDashboard(container) {
    var db = DB.get();
    var courses = getFilteredCourses(db.courses);

    var section = document.createElement('section');
    section.className = 'dashboard';

    var countText = courses.length + ' of ' + db.courses.length + ' course' + (db.courses.length !== 1 ? 's' : '');
    section.innerHTML = '<div class="page-header"><h2>My Courses</h2><span class="stats">' + countText + '</span></div><div class="course-grid" id="course-grid"></div>';

    var grid = section.querySelector('#course-grid');

    if (courses.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128218;</div><p>No courses yet.</p><p class="empty-sub">Click <strong>+ New Course</strong> in the header or <strong>&#11014; Import</strong> a Markdown / JSON file to get started.</p></div>';
    }

    courses.forEach(function (course) {
        var card = document.createElement('div');
        card.className = 'course-card';

        var tagsHtml = (course.tags || '').split(',').filter(Boolean).map(function (t) {
            return '<span class="tag">' + t.trim() + '</span>';
        }).join('');

        var lessonWord = course.lessons.length !== 1 ? 'lessons' : 'lesson';
        card.innerHTML = '<div class="card-header"><h3><a href="#" class="course-link">' + course.title + '</a></h3><div class="card-actions"><button class="icon-btn edit-course-card-btn" title="Edit course">&#9998;</button><button class="icon-btn danger-icon delete-course-card-btn" title="Delete course">&#10005;</button></div></div>' +
            (tagsHtml ? '<div class="tags">' + tagsHtml + '</div>' : '') +
            '<p class="card-desc">' + (course.description || '<em>No description.</em>') + '</p>' +
            '<div class="card-footer"><span class="lesson-count">' + course.lessons.length + ' ' + lessonWord + '</span><div class="card-footer-btns"><button class="text-btn quick-add-btn">+ Lesson</button><a href="#" class="card-open-link">Open &rarr;</a></div></div>';

        (function (cid, ctitle, courseObj) {
            card.querySelectorAll('.course-link, .card-open-link').forEach(function (el) {
                el.addEventListener('click', function (e) {
                    e.preventDefault();
                    router.navigate('course', { id: cid });
                });
            });

            card.querySelector('.quick-add-btn').addEventListener('click', function (e) {
                e.stopPropagation();
                showForm('lesson', { courseId: cid });
            });

            card.querySelector('.edit-course-card-btn').addEventListener('click', function (e) {
                e.stopPropagation();
                showForm('edit-course', { courseId: cid, course: courseObj });
            });

            card.querySelector('.delete-course-card-btn').addEventListener('click', function (e) {
                e.stopPropagation();
                if (confirm('Delete "' + ctitle + '" and all its lessons? This cannot be undone.')) {
                    DB.deleteCourse(cid);
                    router.render();
                }
            });
        })(course.id, course.title, course);

        grid.appendChild(card);
    });

    container.appendChild(section);
}

// ---------------------------------------------------------------------------
// Course View (all lessons inline as accordions)
// ---------------------------------------------------------------------------
function renderCourse(container, id) {
    var db = DB.get();
    var course = db.courses.find(function (c) { return c.id == id; });
    if (!course) { router.navigate('dashboard'); return; }

    var section = document.createElement('section');
    section.className = 'course-view';

    var completedCount = course.lessons.filter(l => l.completed).length;
    var progressPercent = course.lessons.length > 0 ? (completedCount / course.lessons.length) * 100 : 0;

    var tagsHtml = (course.tags || '').split(',').filter(Boolean).map(function (t) {
        return '<span class="tag">' + t.trim() + '</span>';
    }).join('');

    var lessonCountLabel = course.lessons.length + ' LESSON' + (course.lessons.length !== 1 ? 'S' : '');
    var expandControls = course.lessons.length > 1
        ? '<div class="expand-controls"><button class="text-btn" id="expand-all-btn">Expand all</button><span class="sep">&middot;</span><button class="text-btn" id="collapse-all-btn">Collapse all</button></div>'
        : '';

    section.innerHTML = '<a href="#" class="back-link" id="back-btn">&larr; Back to Dashboard</a>' +
        '<div class="course-header">' +
        '<h2 class="course-title">' + course.title + '</h2>' +
        (tagsHtml ? '<div class="tags">' + tagsHtml + '</div>' : '') +
        (course.description ? '<p class="course-desc">' + course.description + '</p>' : '') +
        '<div class="course-progress-container"><div class="progress-bar" style="width:' + progressPercent + '%"></div></div>' +
        '<span class="progress-text">' + Math.round(progressPercent) + '% Completed (' + completedCount + '/' + course.lessons.length + ')</span>' +
        '<div class="course-actions">' +
        '<button class="button action-btn" id="add-lesson-btn">+ Add Lesson</button>' +
        '<button class="button secondary" id="import-lesson-btn">Import Lessons</button>' +
        '<button class="button secondary" id="edit-course-btn">Edit Course</button>' +
        '<button class="button danger-btn" id="delete-course-btn">Delete Course</button>' +
        '</div></div>' +
        '<div class="lesson-navigator" id="lesson-navigator"></div>' +
        '<div class="lessons-section">' +
        '<div class="lessons-toolbar">' +
        '<span class="lessons-label">' + lessonCountLabel + '</span>' +
        '<div class="lesson-search-container"><input type="text" id="lesson-search" placeholder="Filter lessons..."></div>' +
        expandControls +
        '</div>' +
        '<div class="lessons-container" id="lessons-container"></div>' +
        '</div>';

    // Populate Navigator
    var navigator = section.querySelector('#lesson-navigator');
    course.lessons.forEach(function (l, idx) {
        var chip = document.createElement('div');
        chip.className = 'nav-chip' + (l.completed ? ' completed' : '');
        chip.textContent = (idx + 1) + '. ' + l.title;
        chip.onclick = function () {
            var el = document.getElementById('lesson-' + l.id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (!el.classList.contains('is-open')) el.querySelector('.accordion-header').click();
            }
        };
        navigator.appendChild(chip);
    });

    (function (courseId, courseTitle) {
        section.querySelector('#back-btn').addEventListener('click', function (e) {
            e.preventDefault(); router.navigate('dashboard');
        });
        section.querySelector('#add-lesson-btn').addEventListener('click', function () {
            showForm('lesson', { courseId: courseId });
        });
        section.querySelector('#import-lesson-btn').addEventListener('click', function () {
            openImportModal(courseId);
        });
        section.querySelector('#edit-course-btn').addEventListener('click', function () {
            showForm('edit-course', { courseId: courseId, course: course });
        });
        section.querySelector('#delete-course-btn').addEventListener('click', function () {
            if (confirm('Delete "' + courseTitle + '" and all its lessons?')) {
                DB.deleteCourse(courseId);
                router.navigate('dashboard');
            }
        });

        var searchInput = section.querySelector('#lesson-search');
        searchInput.addEventListener('input', function (e) {
            var q = e.target.value.toLowerCase();
            section.querySelectorAll('.lesson-accordion').forEach(function (acc) {
                var title = acc.querySelector('.lesson-name').textContent.toLowerCase();
                var summary = (acc.querySelector('.lesson-summary') || { textContent: '' }).textContent.toLowerCase();
                if (title.indexOf(q) !== -1 || summary.indexOf(q) !== -1) {
                    acc.style.display = '';
                } else {
                    acc.style.display = 'none';
                }
            });
        });

        var expandBtn = section.querySelector('#expand-all-btn');
        var collapseBtn = section.querySelector('#collapse-all-btn');
        if (expandBtn) expandBtn.addEventListener('click', function () { setAllAccordions(section, true); });
        if (collapseBtn) collapseBtn.addEventListener('click', function () { setAllAccordions(section, false); });
    })(course.id, course.title);

    var lessonsContainer = section.querySelector('#lessons-container');
    if (course.lessons.length === 0) {
        lessonsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128221;</div><p>No lessons yet. Click <strong>+ Add Lesson</strong> to start adding content.</p></div>';
    } else {
        course.lessons.forEach(function (lesson, idx) {
            var acc = createAccordion(lesson, idx, course.id, idx === 0);
            acc.id = 'lesson-' + lesson.id;
            lessonsContainer.appendChild(acc);
        });
    }

    container.appendChild(section);
}

function setAllAccordions(section, open) {
    section.querySelectorAll('.lesson-accordion').forEach(function (item) {
        var body = item.querySelector('.accordion-body');
        var arrow = item.querySelector('.accordion-arrow');
        if (open) {
            item.classList.add('is-open');
            body.style.display = '';
            arrow.textContent = '\u25b2';
        } else {
            item.classList.remove('is-open');
            body.style.display = 'none';
            arrow.textContent = '\u25bc';
        }
    });
}

function createAccordion(lesson, idx, courseId, expanded) {
    expanded = expanded || false;
    var item = document.createElement('div');
    item.className = 'lesson-accordion' + (expanded ? ' is-open' : '') + (lesson.completed ? ' is-completed' : '');

    item.innerHTML = '<div class="accordion-header">' +
        '<div class="accordion-check-container">' +
        '<button class="check-btn' + (lesson.completed ? ' checked' : '') + '" title="Mark as reviewed">' + (lesson.completed ? '&#10003;' : '') + '</button>' +
        '</div>' +
        '<span class="lesson-num">' + (idx + 1) + '</span>' +
        '<div class="accordion-title">' +
        '<span class="lesson-name">' + lesson.title + '</span>' +
        (lesson.description ? '<span class="lesson-summary">' + lesson.description + '</span>' : '') +
        '</div>' +
        '<div class="accordion-actions">' +
        '<button class="icon-btn edit-lesson-btn" title="Edit lesson">&#9998;</button>' +
        '<button class="icon-btn danger-icon delete-lesson-btn" title="Delete lesson">&#10005;</button>' +
        '<span class="accordion-arrow">' + (expanded ? '\u25b2' : '\u25bc') + '</span>' +
        '</div></div>' +
        '<div class="accordion-body"' + (expanded ? '' : ' style="display:none"') + '>' +
        '<article class="lesson-content">' + renderMarkdown(lesson.content) + '</article>' +
        '</div>';

    var header = item.querySelector('.accordion-header');
    var body = item.querySelector('.accordion-body');
    var arrow = item.querySelector('.accordion-arrow');

    header.addEventListener('click', function (e) {
        if (e.target.closest('.accordion-actions button, .check-btn')) return;
        var isOpen = item.classList.toggle('is-open');
        body.style.display = isOpen ? '' : 'none';
        arrow.textContent = isOpen ? '\u25b2' : '\u25bc';
    });

    (function (lid, ltitle) {
        item.querySelector('.check-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            DB.toggleLessonStatus(courseId, lid);
            router.navigate('course', { id: courseId });
        });

        item.querySelector('.edit-lesson-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            showForm('edit-lesson', { courseId: courseId, lesson: lesson });
        });

        item.querySelector('.delete-lesson-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            if (confirm('Delete lesson "' + ltitle + '"?')) {
                DB.deleteLesson(courseId, lid);
                router.navigate('course', { id: courseId });
            }
        });
    })(lesson.id, lesson.title);

    return item;
}

// ---------------------------------------------------------------------------
// Forms & Modals  (if/else to avoid eager template literal evaluation)
// ---------------------------------------------------------------------------
function showForm(type, context) {
    context = context || {};
    var modal = document.getElementById('modal-overlay');
    var body = document.getElementById('modal-body');
    modal.style.display = 'block';

    var title, fields, onSubmit;

    if (type === 'course') {
        title = 'Add New Course';
        fields = '<div class="field"><label>Title *</label><input type="text" name="title" required placeholder="e.g. Biology 101"></div>' +
            '<div class="field"><label>Tags <span class="hint">(comma-separated)</span></label><input type="text" name="tags" placeholder="Science, Intro"></div>' +
            '<div class="field"><label>Description</label><textarea name="description" placeholder="What is this course about?"></textarea></div>';
        onSubmit = function (data) { DB.addCourse(data); router.render(); };

    } else if (type === 'edit-course') {
        var c = context.course;
        title = 'Edit Course';
        fields = '<div class="field"><label>Title *</label><input type="text" name="title" required value="' + c.title + '"></div>' +
            '<div class="field"><label>Tags <span class="hint">(comma-separated)</span></label><input type="text" name="tags" value="' + (c.tags || '') + '"></div>' +
            '<div class="field"><label>Description</label><textarea name="description">' + (c.description || '') + '</textarea></div>';
        onSubmit = function (data) { DB.editCourse(context.courseId, data); router.render(); };

    } else if (type === 'lesson') {
        title = 'Add Lesson';
        fields = '<div class="field"><label>Lesson Title *</label><input type="text" name="title" required placeholder="e.g. Chapter 1: Cell Structure"></div>' +
            '<div class="field"><label>Summary <span class="hint">(one line)</span></label><input type="text" name="description" placeholder="Brief overview"></div>' +
            '<div class="field"><label>Content / Notes <span class="hint">(Markdown supported)</span></label><textarea name="content" placeholder="Type your notes here..."></textarea></div>';
        onSubmit = function (data) {
            DB.addLesson(context.courseId, data);
            router.navigate('course', { id: context.courseId });
        };

    } else if (type === 'edit-lesson') {
        var l = context.lesson;
        title = 'Edit Lesson';
        fields = '<div class="field"><label>Lesson Title *</label><input type="text" name="title" required value="' + l.title + '"></div>' +
            '<div class="field"><label>Summary</label><input type="text" name="description" value="' + (l.description || '') + '"></div>' +
            '<div class="field"><label>Content / Notes <span class="hint">(Markdown supported)</span></label><textarea name="content">' + (l.content || '') + '</textarea></div>';
        onSubmit = function (data) {
            DB.editLesson(context.courseId, l.id, data);
            router.navigate('course', { id: context.courseId });
        };
    }

    body.innerHTML = '<h3>' + title + '</h3>' +
        '<form id="active-form">' + fields +
        '<div class="modal-footer">' +
        '<button type="submit" class="button action-btn">Save</button>' +
        '<button type="button" class="button secondary" id="close-modal">Cancel</button>' +
        '</div></form>';

    document.getElementById('close-modal').onclick = function () { modal.style.display = 'none'; };
    modal.onclick = function (e) { if (e.target === modal) modal.style.display = 'none'; };

    document.getElementById('active-form').onsubmit = function (e) {
        e.preventDefault();
        var data = Object.fromEntries(new FormData(e.target).entries());
        onSubmit(data);
        modal.style.display = 'none';
    };

    // Focus first input
    setTimeout(function () {
        var first = body.querySelector('input, textarea');
        if (first) first.focus();
    }, 50);
}

// ---------------------------------------------------------------------------
// Import System
// ---------------------------------------------------------------------------

/**
 * Parse a Markdown file into a course object.
 */
function parseMarkdownFile(text) {
    var lines = text.split(/\r?\n/);
    var course = null;
    var currentLesson = null;
    var contentBuffer = [];
    var inCodeBlock = false;

    function flushLesson() {
        if (currentLesson) {
            currentLesson.content = contentBuffer.join('\n').trim();
            course.lessons.push(currentLesson);
            currentLesson = null;
            contentBuffer = [];
        }
    }

    lines.forEach(function (line) {
        if (line.indexOf('```') === 0) inCodeBlock = !inCodeBlock;

        if (!inCodeBlock && line.indexOf('# ') === 0) {
            flushLesson();
            course = { title: line.slice(2).trim(), tags: '', description: '', lessons: [] };
        } else if (!inCodeBlock && line.indexOf('## ') === 0 && course) {
            flushLesson();
            currentLesson = { title: line.slice(3).trim(), description: '', content: '' };
        } else if (course && !currentLesson && !inCodeBlock) {
            var tagsMatch = line.match(/^Tags:\s*(.+)/i);
            var descMatch = line.match(/^Description:\s*(.+)/i);
            if (tagsMatch) course.tags = tagsMatch[1].trim();
            else if (descMatch) course.description = descMatch[1].trim();
        } else if (currentLesson) {
            var summaryMatch = line.match(/^Summary:\s*(.+)/i);
            if (!inCodeBlock && summaryMatch && !currentLesson.description) {
                currentLesson.description = summaryMatch[1].trim();
            } else {
                contentBuffer.push(line);
            }
        }
    });

    flushLesson();
    if (!course || !course.title) throw new Error('No course heading (# Title) found.');
    return course;
}

// ---------------------------------------------------------------------------
// Import System
// ---------------------------------------------------------------------------
var _parsedImport = null;
var _importTargetCourseId = null;

function openImportModal(targetCourseId) {
    _parsedImport = [];
    _importTargetCourseId = typeof targetCourseId === 'string' || typeof targetCourseId === 'number' ? targetCourseId : null;
    document.getElementById('import-modal-overlay').style.display = 'block';
    document.getElementById('import-file-input').value = '';
    document.getElementById('import-confirm-btn').disabled = true;
    document.getElementById('import-preview').style.display = 'none';
    document.getElementById('import-error').style.display = 'none';
    var modeContainer = document.getElementById('import-mode-container');
    if (modeContainer) {
        modeContainer.style.display = _importTargetCourseId ? 'none' : 'block';
    }
}

function closeImportModal() {
    document.getElementById('import-modal-overlay').style.display = 'none';
}

function parseJSONFile(text) {
    var data = JSON.parse(text);
    var courses = Array.isArray(data) ? data : (data.courses ? data.courses : [data]);
    return courses.map(function (c) {
        if (!c.title) throw new Error('Course missing title.');
        return {
            title: c.title,
            tags: c.tags || '',
            description: c.description || '',
            lessons: Array.isArray(c.lessons) ? c.lessons.map(function (l) {
                return {
                    title: l.title || 'Untitled',
                    description: l.description || '',
                    content: l.content || '',
                    completed: !!l.completed
                };
            }) : []
        };
    });
}

function applyImport(importedCourses, mode) {
    var db = DB.get();

    if (_importTargetCourseId) {
        var targetCourse = db.courses.find(function (c) { return c.id == _importTargetCourseId; });
        if (targetCourse) {
            importedCourses.forEach(function (ic) {
                ic.lessons.forEach(function (l, i) {
                    l.id = Date.now() + i + Math.floor(Math.random() * 1000);
                    targetCourse.lessons.push(l);
                });
            });
            DB.save(db);
            return;
        }
    }

    importedCourses.forEach(function (ic) {
        var existing = db.courses.find(function (c) { return c.title.toLowerCase() === ic.title.toLowerCase(); });
        if (existing) {
            if (mode === 'replace') {
                Object.assign(existing, ic);
                existing.id = Date.now() + Math.floor(Math.random() * 1000);
                existing.lessons.forEach(function (l, i) { l.id = Date.now() + i + Math.floor(Math.random() * 1000); });
            } else if (mode === 'merge') {
                ic.lessons.forEach(function (l, i) {
                    l.id = Date.now() + i + Math.floor(Math.random() * 1000);
                    existing.lessons.push(l);
                });
            } else if (mode === 'duplicate') {
                ic.id = Date.now() + Math.floor(Math.random() * 1000);
                ic.lessons.forEach(function (l, i) { l.id = Date.now() + i + Math.floor(Math.random() * 1000); });
                db.courses.push(ic);
            }
        } else {
            ic.id = Date.now() + Math.floor(Math.random() * 1000);
            ic.lessons.forEach(function (l, i) { l.id = Date.now() + i + Math.floor(Math.random() * 1000); });
            db.courses.push(ic);
        }
    });
    DB.save(db);
}

document.getElementById('import-file-input').addEventListener('change', function () {
    var files = Array.from(this.files);
    if (!files.length) return;

    var errEl = document.getElementById('import-error');
    var previewEl = document.getElementById('import-preview');
    var previewText = document.getElementById('import-preview-text');
    var confirmBtn = document.getElementById('import-confirm-btn');

    errEl.style.display = 'none';
    previewEl.style.display = 'none';
    confirmBtn.disabled = true;
    _parsedImport = [];

    var loaded = 0;
    files.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var content = e.target.result;
                var results = file.name.slice(-5) === '.json'
                    ? parseJSONFile(content)
                    : [parseMarkdownFile(content)];

                _parsedImport = _parsedImport.concat(results);

                loaded++;
                if (loaded === files.length) {
                    previewText.textContent = _parsedImport.map(function (c) {
                        var lines = '\uD83D\uDCD8 "' + c.title + '"  [' + c.lessons.length + ' lesson' + (c.lessons.length !== 1 ? 's' : '') + ']\n';
                        lines += c.lessons.slice(0, 5).map(function (l, i) { return '   ' + (i + 1) + '. ' + l.title; }).join('\n');
                        if (c.lessons.length > 5) lines += '\n   ... and ' + (c.lessons.length - 5) + ' more';
                        return lines;
                    }).join('\n\n');

                    previewEl.style.display = 'block';
                    confirmBtn.disabled = false;
                }
            } catch (err) {
                errEl.textContent = '\u26A0 Error in "' + file.name + '": ' + err.message;
                errEl.style.display = 'block';
            }
        };
        reader.readAsText(file);
    });
});

// Copy to Clipboard logic for code blocks
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('copy-code-btn')) {
        var pre = e.target.closest('pre');
        var code = pre.querySelector('code').innerText;
        navigator.clipboard.writeText(code).then(function () {
            var old = e.target.innerText;
            e.target.innerText = 'Copied!';
            setTimeout(function () { e.target.innerText = old; }, 2000);
        });
    }
});

document.getElementById('import-confirm-btn').addEventListener('click', function () {
    if (!_parsedImport) return;
    var modeEl = document.querySelector('input[name="import-mode"]:checked');
    var mode = modeEl ? modeEl.value : 'merge';
    applyImport(_parsedImport, mode);
    closeImportModal();
    if (_importTargetCourseId) {
        router.navigate('course', { id: _importTargetCourseId });
    } else {
        router.navigate('dashboard');
    }
});

document.getElementById('import-cancel-btn').addEventListener('click', closeImportModal);
document.getElementById('import-modal-overlay').addEventListener('click', function (e) {
    if (e.target === document.getElementById('import-modal-overlay')) closeImportModal();
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.getElementById('logo-link').addEventListener('click', function (e) { e.preventDefault(); router.navigate('dashboard'); });
document.getElementById('nav-dashboard').addEventListener('click', function (e) { e.preventDefault(); router.navigate('dashboard'); });
document.getElementById('global-add-btn').addEventListener('click', function (e) { e.preventDefault(); showForm('course'); });
document.getElementById('import-btn').addEventListener('click', function (e) { e.preventDefault(); openImportModal(); });

var darkModeToggle = document.getElementById('dark-mode-toggle');
if (localStorage.getItem('dark_mode') === 'enabled') document.body.classList.add('dark-mode');
darkModeToggle.addEventListener('click', function (e) {
    e.preventDefault();
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark_mode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
});

document.getElementById('search-bar').addEventListener('input', function () {
    if (router.currentView === 'dashboard') router.render();
});

router.render();