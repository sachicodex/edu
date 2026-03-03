export function toast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  Object.assign(container.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end',
    pointerEvents: 'none',
    zIndex: 2147483647,
  });

  const icon = ({
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info',
  }[type] || 'info');

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-content">
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close"><i data-lucide="x"></i></button>
  `;
  Object.assign(el.style, {
    pointerEvents: 'auto',
    position: 'relative',
    transformOrigin: 'center right',
  });

  container.appendChild(el);
  try { lucide.createIcons(); } catch {}

  const remove = () => {
    try {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    } catch { el.remove(); }
  };

  const timer = setTimeout(remove, 3000);
  el.querySelector('.toast-close')?.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}
