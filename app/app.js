// Leonida Legend — GTA VI trophy guide & tracker.
// Static, offline: loads only data/trophies.json and data/roadmap.json from this app.
// Progress is saved in localStorage; export writes a file, import reads one back.
const KEY = 'leonida-legend-progress-v1';
const PREFS = 'leonida-legend-prefs-v1';
const KIND_LABEL = {
  story: 'Story', side: 'Side missions', collectibles: 'Collectibles',
  activities: 'Activities', crime: 'Crime & robberies', exploration: 'Exploration',
  misc: 'Odd jobs & secrets', platinum: 'Platinum & 100%',
};

const doc = await (await fetch('data/trophies.json')).json();
const roadmap = await (await fetch('data/roadmap.json')).json();
const trophies = doc.trophies;

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let prefs = { spoilers: true, ...(JSON.parse(localStorage.getItem(PREFS) ?? '{}')) };
let open = new Set();

const $ = (id) => document.getElementById(id);
const els = {
  bar: $('bar'), progress: $('progress'), chips: $('gradeChips'),
  roadmapIntro: $('roadmapIntro'), roadmapMissable: $('roadmapMissable'), roadmap: $('roadmap'),
  search: $('search'), kind: $('kind'), grade: $('grade'), hideEarned: $('hideEarned'),
  spoilers: $('spoilers'), list: $('list'), empty: $('empty'), countLine: $('countLine'),
  listCount: $('listCount'), sourceList: $('sourceList'), saveState: $('saveState'),
};
els.spoilers.checked = prefs.spoilers;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(PREFS, JSON.stringify(prefs));
  els.saveState.textContent = `Saved in this browser · ${new Date().toLocaleTimeString()}`;
}

function fmtTarget(t) {
  if (t.target == null) return '';
  return t.target.toLocaleString('en-US');
}

function isStorySpoiler(t) {
  return prefs.spoilers && t.kind === 'story' && !earned.has(t.name);
}

function renderProgress() {
  const n = earned.size, total = trophies.length;
  const pct = Math.round((n / total) * 100);
  els.bar.style.width = pct + '%';
  els.progress.textContent = `${n} of ${total} earned · ${pct}% · ${total - n} to go`;
  const got = {};
  for (const t of trophies) if (earned.has(t.name)) got[t.grade] = (got[t.grade] ?? 0) + 1;
  const totalBy = {};
  for (const t of trophies) totalBy[t.grade] = (totalBy[t.grade] ?? 0) + 1;
  els.chips.replaceChildren();
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const s = document.createElement('span');
    s.className = 'chip';
    s.innerHTML = '';
    s.append(`${g[0].toUpperCase() + g.slice(1)} `);
    const b = document.createElement('b');
    b.textContent = `${got[g] ?? 0}/${totalBy[g]}`;
    s.append(b);
    els.chips.append(s);
  }
}

function renderRoadmap() {
  els.roadmapIntro.textContent = roadmap.intro;
  els.roadmapMissable.textContent = '⚠ ' + roadmap.note_missable;
  els.roadmap.replaceChildren();
  for (const st of roadmap.stages) {
    const li = document.createElement('li');
    const title = document.createElement('span');
    title.className = 'stage-title';
    title.textContent = st.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${st.trophies} trophies`;
    const p = document.createElement('p');
    p.textContent = st.what;
    li.append(title, count, p);
    els.roadmap.append(li);
  }
}

function renderSources() {
  els.sourceList.replaceChildren();
  for (const [key, text] of Object.entries(doc.sources)) {
    const li = document.createElement('li');
    li.textContent = text;
    els.sourceList.append(li);
  }
}

function matches(t) {
  const q = els.search.value.trim().toLowerCase();
  const kind = els.kind.value, grade = els.grade.value;
  if (kind === 'missable') { if (!t.missable) return false; }
  else if (kind !== 'all' && t.kind !== kind) return false;
  if (grade !== 'all' && t.grade !== grade) return false;
  if (els.hideEarned.checked && earned.has(t.name)) return false;
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${KIND_LABEL[t.kind] ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function trophyCard(t) {
  const card = document.createElement('article');
  card.className = 'trophy' + (earned.has(t.name) ? ' earned' : '');
  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    save(); renderAll();
  });
  const main = document.createElement('div');
  main.className = 'trophy-main';
  const name = document.createElement('div');
  name.className = 'trophy-name';
  if (isStorySpoiler(t)) {
    const s = document.createElement('span');
    s.className = 'spoiler';
    s.textContent = 'Story trophy — hidden until earned (spoiler setting on)';
    name.append(s);
  } else {
    name.textContent = t.name;
  }
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = isStorySpoiler(t) ? 'Complete the story to reveal this trophy.' : t.description;
  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  const gradeTag = document.createElement('span');
  gradeTag.className = `tag grade-${t.grade}`;
  gradeTag.textContent = t.grade;
  tags.append(gradeTag);
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = KIND_LABEL[t.kind] ?? t.kind;
  tags.append(kindTag);
  if (t.hidden) {
    const h = document.createElement('span');
    h.className = 'tag hidden';
    h.textContent = 'Hidden on PSN';
    tags.append(h);
  }
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = 'Possibly missable';
    tags.append(m);
  }
  if (earned.has(t.name)) {
    const e = document.createElement('span');
    e.className = 'tag earned-tag';
    e.textContent = 'Earned ✓';
    tags.append(e);
  }
  main.append(name, desc, tags);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'trophy-toggle';
  toggle.setAttribute('aria-expanded', String(open.has(t.name)));
  toggle.textContent = open.has(t.name) ? '▲ Hide guide' : '▼ Guide';
  toggle.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (open.has(t.name)) open.delete(t.name); else open.add(t.name);
    renderList();
  });
  head.append(box, main, toggle);
  card.append(head);

  if (open.has(t.name)) {
    const body = document.createElement('div');
    body.className = 'trophy-body';
    if (isStorySpoiler(t)) {
      const p = document.createElement('p');
      p.textContent = 'This is a story trophy. Turn the spoiler setting off, or tick it as earned, to read its guide.';
      body.append(p);
    } else {
      const h = document.createElement('h3');
      h.textContent = 'Guide';
      const p = document.createElement('p');
      p.textContent = t.guide;
      body.append(h, p);
      if (t.target != null) {
        const tp = document.createElement('p');
        tp.append('Target: ');
        const b = document.createElement('b');
        b.className = 'target';
        b.textContent = fmtTarget(t);
        tp.append(b);
        body.append(tp);
      }
      if (t.missable && t.missable_note) {
        const mp = document.createElement('p');
        mp.textContent = '⚠ Missable: ' + t.missable_note;
        body.append(mp);
      }
      const src = document.createElement('p');
      src.className = 'src';
      src.textContent = 'Sources: ' + (t.sources ?? []).map((s) => doc.sources[s] ?? s).join(' · ');
      body.append(src);
    }
    card.append(body);
  }
  return card;
}

function renderList() {
  const shown = trophies.filter(matches);
  els.list.replaceChildren(...shown.map(trophyCard));
  els.empty.hidden = shown.length !== 0;
  els.listCount.textContent = `(${shown.length} shown)`;
  const n = earned.size;
  els.countLine.textContent = shown.length === trophies.length
    ? `${n} of ${trophies.length} trophies earned. Tick a trophy to mark it earned — it stays ticked in this browser.`
    : `Showing ${shown.length} of ${trophies.length} trophies · ${n} earned overall.`;
}

function renderAll() {
  renderProgress();
  renderList();
}

els.search.addEventListener('input', renderList);
els.kind.addEventListener('change', renderList);
els.grade.addEventListener('change', renderList);
els.hideEarned.addEventListener('change', renderList);
els.spoilers.addEventListener('change', () => {
  prefs.spoilers = els.spoilers.checked;
  save();
  renderList();
});

$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: [...earned].sort() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set((names ?? []).filter((n) => known.has(n)));
    save();
    renderAll();
    els.saveState.textContent = `Imported ${earned.size} earned trophies from ${file.name}.`;
  } catch {
    els.saveState.textContent = 'Import failed: that file is not a valid progress export.';
  }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (!confirm('Clear every tick? Your exported files are not affected.')) return;
  earned = new Set();
  save();
  renderAll();
});

renderRoadmap();
renderSources();
renderAll();
