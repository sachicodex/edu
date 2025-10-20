const STORAGE_KEY = 'eduvideo_saved';

export function getSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isSaved(id) {
  const sid = String(id);
  return getSaved().some(v => String(v.id) === sid);
}

export function updateSavedCount({ savedCountEl } = {}) {
  const count = getSaved().length;
  if (savedCountEl) savedCountEl.textContent = String(count);
  return count;
}

export function toggleSave(id, { state, notify, renderSavedSection, updateSavedCount } = {}) {
  const saved = getSaved();
  const sid = String(id);
  const exists = saved.find(v => String(v.id) === sid);
  if (exists) {
    const updated = saved.filter(v => String(v.id) !== sid);
    saveList(updated);
    notify && notify('Removed from saved', 'info');
  } else {
    const video = (state?.videos || []).find(v => String(v.id) === sid);
    if (video) {
      saved.push({ id: video.id, title: video.title, thumbnail: video.thumbnail, youtubeLink: video.youtubeLink || null });
      saveList(saved);
      notify && notify('Video saved!', 'success');
    }
  }
  try { updateSavedCount?.(); } catch { }
  if (state?.viewContext === 'saved') {
    try { renderSavedSection?.(); } catch { }
  }
  try { window.dispatchEvent(new CustomEvent('eduvideo:saved-changed', { detail: { id } })); } catch { }
}

export function renderSavedSection({ state, dom, renderVideos, iconLib } = {}) {
  const saved = getSaved();
  if (!dom?.videosGrid) return;
  if (saved.length === 0) {
    dom.videosGrid.innerHTML = `<div class="no-results"><h3>No saved videos</h3><p>You haven't saved any videos yet.</p></div>`;
    try { dom.loadMoreContainer?.classList.add('hidden'); } catch { }
    return;
  }
  try { renderVideos?.(); } catch { }
  try { iconLib?.createIcons?.(); } catch { }
}
