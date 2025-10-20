export function createUploadModal({ supabase, state, notify, onUploaded } = {}) {
  if (document.getElementById('uploadModal')) return;
  const modal = document.createElement('div');
  modal.id = 'uploadModal';
  modal.className = 'upload-modal';
  modal.innerHTML = `
    <div class="upload-modal-backdrop"></div>
    <div class="upload-modal-content">
      <button class="upload-modal-close" aria-label="Close">✕</button>
      <h2>Upload Video</h2>
      <form id="uploadForm" class="upload-form" autocomplete="off" autocorrect="off" spellcheck="false">
        <div class="row"><input id="u_title" placeholder="Title" required></div>
        <div class="row"><textarea id="u_description" placeholder="Description" style="resize: none"></textarea></div>
        <div class="row inline">
          <input id="u_duration" placeholder="Duration (e.g. 1:25:40)" autocomplete="off">
          <input id="u_views" type="number" placeholder="Views" autocomplete="off">
        </div>
        <div class="row inline">
          <input id="u_category" placeholder="Category" autocomplete="off">
          <input id="u_rating" type="number" step="0.1" placeholder="Rating" autocomplete="off">
        </div>
        <div class="row inline">
          <input id="u_youtube" placeholder="YouTube Link" autocomplete="off">
          <input id="u_date" type="date" autocomplete="off">
        </div>
        <div class="row inline">
          <input id="u_tags" placeholder="AI Tags (comma separated)" autocomplete="off">
          <select id="u_difficulty"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        </div>
        <div class="row inline">
          <input id="u_thumbnail" placeholder="Thumbnail URL" autocomplete="off">
          <input id="u_password" type="password" placeholder="Password" autocomplete="new-password">
        </div>
        <div class="row actions">
          <button type="button" id="u_cancel" class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('upload-modal-open'));

  try {
    const dateInput = modal.querySelector('#u_date');
    if (dateInput) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
  } catch { }

  const close = () => {
    modal.classList.remove('upload-modal-open');
    modal.classList.add('upload-modal-closing');
    setTimeout(() => modal.remove(), 320);
  };
  modal.querySelector('.upload-modal-backdrop')?.addEventListener('click', close);
  modal.querySelector('.upload-modal-close')?.addEventListener('click', close);
  modal.querySelector('#u_cancel')?.addEventListener('click', close);

  modal.querySelector('#uploadForm')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const pass = modal.querySelector('#u_password')?.value || '';
    if (pass !== 'bD32CCc3') {
      notify && notify('Are you Developer', 'error');
      return;
    }
    const video = {
      title: modal.querySelector('#u_title')?.value || '',
      description: modal.querySelector('#u_description')?.value || '',
      duration: modal.querySelector('#u_duration')?.value || '',
      views: parseInt(modal.querySelector('#u_views')?.value || '0') || 0,
      category: modal.querySelector('#u_category')?.value || '',
      youtube_link: modal.querySelector('#u_youtube')?.value || '',
      upload_date: modal.querySelector('#u_date')?.value || new Date().toISOString(),
      ai_tags: (modal.querySelector('#u_tags')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      difficulty: modal.querySelector('#u_difficulty')?.value || 'Beginner',
      rating: parseFloat(modal.querySelector('#u_rating')?.value || '') || null,
      thumbnail: modal.querySelector('#u_thumbnail')?.value || '',
    };
    if (!video.title) {
      notify && notify('Please enter a title', 'error');
      return;
    }
    try {
      const { error } = await supabase.from('EduVideoDB').insert([video]);
      if (error) {
        console.error('upload error', error);
        notify && notify('Upload failed', 'error');
      } else {
        notify && notify('Video uploaded', 'success');
        close();
        try { await onUploaded?.(); } catch { }
      }
    } catch (e) {
      console.error('upload exception', e);
      notify && notify('Upload failed', 'error');
    }
  });
}
