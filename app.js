// ---------- Simple note-taking app (vanilla JS + localStorage) ----------

const STORAGE_KEY = "notes-app.notes";
const THEME_KEY = "notes-app.theme";

// DOM refs
const noteList = document.getElementById("note-list");
const searchInput = document.getElementById("search");
const newBtn = document.getElementById("new-note");
const emptyState = document.getElementById("empty-state");
const editorWrap = document.getElementById("editor-wrap");
const titleInput = document.getElementById("title");
const contentEl = document.getElementById("content");
const metaEl = document.getElementById("meta");
const deleteBtn = document.getElementById("delete-note");
const toolbar = document.querySelector(".toolbar");
const themeToggle = document.getElementById("theme-toggle");

let notes = load();
let activeId = null;

// ---------- Persistence ----------
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Theme ----------
function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

// ---------- Rendering ----------
function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").trim();
}

function formatDate(ts) {
  return new Date(ts).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function renderList() {
  const q = searchInput.value.trim().toLowerCase();
  const visible = notes
    .slice()
    .sort((a, b) => b.updated - a.updated)
    .filter((n) => {
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q)
      );
    });

  noteList.innerHTML = "";

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-list";
    li.textContent = q ? "No matching notes." : "No notes yet.";
    noteList.appendChild(li);
    return;
  }

  for (const n of visible) {
    const li = document.createElement("li");
    li.className = "note-item" + (n.id === activeId ? " active" : "");
    li.dataset.id = n.id;

    const title = document.createElement("div");
    title.className = "note-title";
    title.textContent = n.title || "Untitled note";

    const preview = document.createElement("div");
    preview.className = "note-preview";
    preview.textContent = stripHtml(n.content) || "No additional text";

    li.append(title, preview);
    li.addEventListener("click", () => selectNote(n.id));
    noteList.appendChild(li);
  }
}

function renderEditor() {
  const note = notes.find((n) => n.id === activeId);
  if (!note) {
    editorWrap.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  editorWrap.classList.remove("hidden");
  titleInput.value = note.title;
  contentEl.innerHTML = note.content;
  metaEl.textContent = "Last edited " + formatDate(note.updated);
}

// ---------- Actions ----------
function createNote() {
  const note = { id: uid(), title: "", content: "", updated: Date.now() };
  notes.push(note);
  activeId = note.id;
  save();
  renderList();
  renderEditor();
  titleInput.focus();
}

function selectNote(id) {
  activeId = id;
  renderList();
  renderEditor();
}

function deleteNote() {
  const note = notes.find((n) => n.id === activeId);
  if (!note) return;
  if (!confirm(`Delete "${note.title || "Untitled note"}"?`)) return;
  notes = notes.filter((n) => n.id !== activeId);
  activeId = null;
  save();
  renderList();
  renderEditor();
}

// Persist edits from the title/content fields to the active note.
function syncActive() {
  const note = notes.find((n) => n.id === activeId);
  if (!note) return;
  note.title = titleInput.value;
  note.content = contentEl.innerHTML;
  note.updated = Date.now();
  metaEl.textContent = "Last edited " + formatDate(note.updated);
  save();
  renderList();
}

// ---------- Editing toolbar ----------
toolbar.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  const value = btn.dataset.value || null;
  contentEl.focus();
  document.execCommand(cmd, false, value);
  syncActive();
});

// ---------- Event wiring ----------
newBtn.addEventListener("click", createNote);
themeToggle.addEventListener("click", toggleTheme);
deleteBtn.addEventListener("click", deleteNote);
searchInput.addEventListener("input", renderList);
titleInput.addEventListener("input", syncActive);
contentEl.addEventListener("input", syncActive);

// Keep keyboard shortcuts (Ctrl/Cmd+B/I/U) saving their changes.
contentEl.addEventListener("keyup", (e) => {
  if ((e.ctrlKey || e.metaKey) && ["b", "i", "u"].includes(e.key.toLowerCase())) {
    syncActive();
  }
});

// ---------- Init ----------
applyTheme(currentTheme());
renderList();
renderEditor();
