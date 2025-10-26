(function () {
  const i = document.createElement("link").relList;
  // ensure counts reflect current data before rendering/animating
  // (updateStatsCounts is defined below)
  typeof updateStatsCounts === 'function' && updateStatsCounts(),
    new MutationObserver((n) => {
      for (const o of n)
        if (o.type === "childList")
          for (const d of o.addedNodes)
            d.tagName === "LINK" && d.rel === "modulepreload" && r(d);
    }).observe(document, { childList: !0, subtree: !0 });
  function s(n) {
    const o = {};
    return (
      n.integrity && (o.integrity = n.integrity),
      n.referrerPolicy && (o.referrerPolicy = n.referrerPolicy),
      n.crossOrigin === "use-credentials"
        ? (o.credentials = "include")
        : n.crossOrigin === "anonymous"
          ? (o.credentials = "omit")
          : (o.credentials = "same-origin"),
      o
    );
  }
  function r(n) {
    if (n.ep) return;
    n.ep = !0;
    const o = s(n);
    fetch(n.href, o);
  }
})();
import { DB, UPLOAD, SAVED, SEARCH, TOAST } from "../services/index.js";

// connect to Supabase (credentials provided by workspace/user)
const supabase = DB.initDB(
  "https://zzrxoeolscadwvjtcxsr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cnhvZW9sc2NhZHd2anRjeHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MTkwMzMsImV4cCI6MjA3MjE5NTAzM30.oGgD9Pzf_y5_79CqfnlbgdQXxocXLVjLprM1PeqNp3Y"
);

// Wrapper to open Upload modal via service
function openUploadModalService() {
  UPLOAD.createUploadModal({
    supabase,
    state: a,
    notify: c,
    onUploaded: async () => {
      await loadVideosFromDB();
    }
  });
}

lucide.createIcons();

const a = {
  searchQuery: "",
  activeFilters: [],
  sortBy: "relevance",
  viewMode: "grid",
  viewContext: "home",
  sidebarCollapsed: !1,
  isSearching: !1,
  searchResults: [],
  currentPage: 1,
  itemsPerPage: 9,
  totalResults: 0,
  searchStartTime: 0,
  videos: [],
  isMobile: window.innerWidth <= 768,
},
  t = {
    sidebar: document.getElementById("sidebar"),
    sidebarBrand: document.getElementById("sidebar-brand"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
    mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
    mobileOverlay: document.getElementById("mobile-overlay"),
    mainContent: document.querySelector(".main-content"),
    searchInput: document.getElementById("search-input"),
    quickSearchInput: document.getElementById("quick-search-input"),
    searchBtn: document.getElementById("search-btn"),
    aiAssistBtn: document.getElementById("ai-assist-btn"),
    suggestionsDropdown: document.getElementById("suggestions-dropdown"),
    searchResultsDropdown: document.getElementById("search-results-dropdown"),
    searchResultsList: document.getElementById("search-results-list"),
    closeSearchResults: document.getElementById("close-search-results"),
    searchPreviewContainer: document.getElementById("search-preview-container"),
    filterBadges: document.querySelectorAll(".filter-badge"),
    clearFiltersBtn: document.getElementById("clear-filters"),
    activeFiltersSummary: document.getElementById("active-filters-summary"),
    searchStats: document.getElementById("search-stats"),
    resultsCount: document.getElementById("results-count"),
    searchTime: document.getElementById("search-time"),
    sortSelect: document.getElementById("sort-select"),
    videosGrid: document.getElementById("videos-grid"),
    videosContainer: document.getElementById("videos-container"),
    gridViewBtn: document.getElementById("grid-view"),
    listViewBtn: document.getElementById("list-view"),
    loadMoreContainer: document.getElementById("load-more-container"),
    loadMoreBtn: document.getElementById("load-more-btn"),
    navItems: document.querySelectorAll(".nav-item[data-route]"),
    categoryItems: document.querySelectorAll(".nav-item[data-category]"),
    savedCount: document.getElementById("saved-count"),
    videoModal: document.getElementById("video-modal"),
    videoModalClose: document.getElementById("video-modal-close"),
    videoModalBackdrop: document.getElementById("video-modal-backdrop"),
    videoPlayerContainer: document.getElementById("video-player-container"),
    modalSaveBtn: document.getElementById("modal-save-btn"),
    modalShareBtn: document.getElementById("modal-share-btn"),
    uploadVideoBtn: document.getElementById("upload-video-btn"),
    toastContainer: document.getElementById("toast-container"),
    loadingScreen: document.getElementById("loading-screen"),
    // sidebar user menu button (bottom of sidebar)
    userMenu: document.querySelector('.user-menu'),
    // modal content wrapper
    videoModalContent: document.querySelector('.video-modal-content'),
    // Mobile navigation elements
    bottomNavItems: document.querySelectorAll(".bottom-nav-item[data-route]"),
    mobileHeaderSearchBtn: document.querySelector(".mobile-header-btn[title='Search']"),
    // Mobile search modal elements
    mobileSearchModal: document.getElementById("mobile-search-modal"),
    mobileSearchClose: document.getElementById("mobile-search-close"),
    mobileSearchInput: document.getElementById("mobile-search-input"),
    mobileSearchBtn: document.getElementById("mobile-search-btn"),
    mobileAiAssistBtn: document.getElementById("mobile-ai-assist-btn"),
    mobileFilterBtns: document.querySelectorAll(".mobile-filter-btn"),
    mobileSortSelect: document.getElementById("mobile-sort-select"),
  };
async function N() {
  V();
  // ensure UI reflects current viewContext before rendering
  applyViewContextUI();
  // ensure stats and saved counts reflect current data
  // load videos from database then init UI
  await loadVideosFromDB();
  // ensure view buttons reflect the current viewMode (default: grid)
  if (t.gridViewBtn) t.gridViewBtn.classList.toggle('active', a.viewMode === 'grid');
  if (t.listViewBtn) t.listViewBtn.classList.toggle('active', a.viewMode === 'list');

  updateStatsCounts();
  updateSavedCount();
  g();
  q();
  de();
  setTimeout(() => {
    t.loadingScreen.style.opacity = "0";
    setTimeout(() => {
      t.loadingScreen.style.display = "none";
    }, 300);
  }, 1000);
  // Welcome toast removed per preference (toasts limited to specific events)
}

// Load videos from Supabase and map to app shape
async function loadVideosFromDB() {
  try {
    const rows = await DB.loadVideosFromDB(supabase);
    a.videos = rows;
    updateStatsCounts();
    updateSavedCount();
    g();
  } catch (e) {
    console.error('loadVideosFromDB exception', e);
    c('Unable to load videos', 'error');
  }
}
function V() {
  var e, i, s, r, n, o, d, u, h, S, I, E, B, k, T, C, x, M, $, D;
  (e = t.sidebarToggle) == null || e.addEventListener("click", ae),
    (i = t.mobileMenuToggle) == null || i.addEventListener("click", ne),
    (s = t.mobileOverlay) == null || s.addEventListener("click", re),
    (r = t.searchInput) == null || r.addEventListener("input", j),
    (n = t.searchInput) == null || n.addEventListener("keydown", O),
    (o = t.searchInput) == null || o.addEventListener("focus", H),
    (d = t.searchInput) == null || d.addEventListener("blur", z),
    (u = t.quickSearchInput) == null || u.addEventListener("input", G),
    (h = t.quickSearchInput) == null ||
    h.addEventListener("keydown", (l) => {
      l.key === "Enter" &&
        ((t.searchInput.value = t.quickSearchInput.value),
          (a.searchQuery = t.quickSearchInput.value),
          p());
    }),
    (S = t.searchBtn) == null || S.addEventListener("click", () => {
      a.searchQuery = t.searchInput.value;
      p();
    }),
    (t.uploadVideoBtn) == null || t.uploadVideoBtn.addEventListener('click', openUploadModalService),
    (I = t.aiAssistBtn) == null || I.addEventListener("click", oe),
    (t.sidebarBrand) == null || t.sidebarBrand.addEventListener("click", () => {
      // clicking the brand should open the sidebar on mobile or ensure it's visible on desktop
      if (window.innerWidth <= 768) {
        // open mobile sidebar
        t.sidebar.classList.add('mobile-open');
        t.mobileOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        t.sidebar.style.transform = 'translate(0)';
      } else {
        // ensure desktop sidebar is expanded
        a.sidebarCollapsed = false;
        t.sidebar.classList.remove('collapsed');
        Q();
      }
    }),
    (E = t.closeSearchResults) == null || E.addEventListener("click", m),
    (B = t.filterBadges) == null ||
    B.forEach((l) => {
      l.addEventListener("click", () => Z(l.dataset.filter, l));
    }),
    (k = t.clearFiltersBtn) == null || k.addEventListener("click", clearAllFilters),
    (T = t.sortSelect) == null || T.addEventListener("change", Y),
    (C = t.gridViewBtn) == null || C.addEventListener("click", () => F("grid")),
    (x = t.listViewBtn) == null || x.addEventListener("click", () => F("list")),
    (M = t.loadMoreBtn) == null || M.addEventListener("click", _),
    ($ = t.navItems) == null ||
    $.forEach((l) => {
      l.addEventListener("click", (y) => ee(y, l));
    }),
    (D = t.categoryItems) == null ||
    D.forEach((l) => {
      l.addEventListener("click", (y) => te(y, l));
    }),
    // Mobile bottom navigation
    (t.bottomNavItems) == null ||
    t.bottomNavItems.forEach((l) => {
      l.addEventListener("click", (y) => handleBottomNavClick(y, l));
    }),
    // Mobile header search button
    (t.mobileHeaderSearchBtn) == null || t.mobileHeaderSearchBtn.addEventListener("click", openMobileSearchModal),
    // Mobile search modal handlers
    (t.mobileSearchClose) == null || t.mobileSearchClose.addEventListener("click", closeMobileSearchModal),
    (t.mobileSearchBtn) == null || t.mobileSearchBtn.addEventListener("click", performMobileSearch),
    (t.mobileAiAssistBtn) == null || t.mobileAiAssistBtn.addEventListener("click", performMobileAiAssist),
    (t.mobileSearchInput) == null || t.mobileSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performMobileSearch();
    }),
    // Mobile filter buttons
    (t.mobileFilterBtns) == null ||
    t.mobileFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => handleMobileFilterClick(btn));
    }),
    (t.mobileSortSelect) == null || t.mobileSortSelect.addEventListener("change", Y),
    // Mobile view toggle buttons
    document.querySelectorAll(".mobile-view-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleMobileViewClick(btn));
    }),
    // Mobile search modal backdrop
    (t.mobileSearchModal) == null || t.mobileSearchModal.querySelector(".mobile-search-backdrop").addEventListener("click", closeMobileSearchModal),
    document.querySelectorAll(".quick-action-item").forEach((l) => {
      l.addEventListener("click", () => ie(l.dataset.action));
    }),
    window.addEventListener("resize", q),
    window.addEventListener("click", ge),
    // Infinite scroll listener (lightweight; guarded by viewContext)
    window.addEventListener("scroll", handleInfiniteScroll);
}

function j(e) {
  (a.searchQuery = e.target.value),
    a.searchQuery.length > 2 ? ue(U, 300)() : (m(), g());
}
function O(e) {
  if (e.key === "Enter") {
    a.searchQuery = t.searchInput.value;
    const myVideosNav = document.querySelector('.nav-item[data-route="my-videos"]');
    if (myVideosNav) {
      ee({ preventDefault: () => { } }, myVideosNav);
    }
  } else if (e.key === "Escape") {
    m();
    t.suggestionsDropdown.classList.add("hidden");
  }
}
function H() {
  a.searchQuery.length > 2 &&
    t.searchResultsDropdown.classList.remove("hidden");
}
function z(e) {
  setTimeout(() => {
    t.searchResultsDropdown.contains(e.relatedTarget) || m();
  }, 200);
}
function G(e) {
  const i = e.target.value;
  if (i.length > 2) {
    const s = b(i).slice(0, 3);
    showQuickSearchResults(s);
  }
}
function U() {
  a.searchStartTime = performance.now();
  const e = b(a.searchQuery);
  (a.searchResults = e), J(e.slice(0, 5)), L(e.length);
}
function p() {
  (a.searchStartTime = performance.now()), (a.currentPage = 1);
  const e = b(a.searchQuery);
  (a.searchResults = e),
    (a.totalResults = e.length),
    m(),
    g(),
    L(e.length),
    // show search found toast only when there is a query and results
    a.searchQuery && e.length > 0 && c(`Found ${e.length} videos`, "info");
}
function b(e) {
  try {
    return SEARCH.filterVideos(a, e);
  } catch (err) {
    console.error('SEARCH.filterVideos failed', err);
    return a.videos.slice();
  }
}

// Toggle visibility of primary page sections depending on viewContext
function applyViewContextUI() {
  const hero = document.querySelector('.hero-section');
  const stats = document.querySelector('.stats-grid');
  const featured = document.querySelector('.featured-section');
  const quick = document.querySelector('.quick-actions');
  const search = document.querySelector('.search-section');
  if (a.viewContext === 'home') {
    if (hero) hero.style.display = '';
    if (stats) stats.style.display = '';
    if (featured) featured.style.display = '';
    if (quick) quick.style.display = '';
    if (search) search.style.display = '';
  } else if (a.viewContext === 'videos') {
    if (hero) hero.style.display = 'none';
    if (stats) stats.style.display = 'none';
    // show featured/videos grid when viewing videos
    if (featured) featured.style.display = '';
    if (quick) quick.style.display = 'none';
    if (search) search.style.display = '';
  } else if (a.viewContext === 'saved') {
    if (hero) hero.style.display = 'none';
    if (stats) stats.style.display = 'none';
    // show featured/videos grid for saved view as well
    if (featured) featured.style.display = '';
    if (quick) quick.style.display = 'none';
    if (search) search.style.display = 'none';
  }
}
function J(e) {
  (t.searchResultsList.innerHTML = ""),
    e.length === 0
      ? (t.searchResultsList.innerHTML = `
      <div class="no-search-results">
        <i data-lucide="search-x"></i>
        <span>No results found</span>
      </div>
    `)
      : e.forEach((i) => {
        const s = W(i);
        t.searchResultsList.appendChild(s);
      }),
    t.searchResultsDropdown.classList.remove("hidden"),
    lucide.createIcons();
}
function W(e) {
  const i = document.createElement("div");
  return (
    (i.className = "search-result-item"),
    (i.innerHTML = `
    <div class="search-result-thumbnail">
      <img src="${e.thumbnail}" alt="${e.title}" loading="lazy">
      <div class="search-result-duration">${e.duration}</div>
    </div>
    <div class="search-result-content">
      <h4 class="search-result-title">${A(e.title, a.searchQuery)}</h4>
      <p class="search-result-description">${A(
      e.description.substring(0, 100) + "...",
      a.searchQuery
    )}</p>
      <div class="search-result-meta">
        <span class="search-result-views">${f(e.views)} views</span>
      </div>
    </div>
  `),
    i.addEventListener("click", () => {
      // Opening video - no toast per preference; keep dropdown closed
      m();
    }),
    i
  );
}
function A(e, i) {
  try {
    return SEARCH.highlightText(e, i);
  } catch (err) {
    return e;
  }
}
function m() {
  if (t.searchResultsDropdown) t.searchResultsDropdown.classList.add("hidden");
  if (t.searchPreviewContainer) t.searchPreviewContainer.classList.add("hidden");
}
function g() {
  const startTime = performance.now();
  let videos = a.videos;

  // If viewing saved page, use the saved list only
  if (a.viewContext === 'saved') {
    const saved = getSaved();
    const savedIds = new Set(saved.map(s => String(s.id)));
    videos = a.videos.filter(v => savedIds.has(String(v.id)));
  } else {
    // Apply search and filters for other views
    videos = b(a.searchQuery);
  }

  // Sort the videos
  videos = X(videos, a.sortBy);

  // Pagination
  const endIndex = (a.currentPage - 1) * a.itemsPerPage + a.itemsPerPage;
  const videosToShow = videos.slice(0, endIndex);

  // Clear and set up container
  t.videosGrid.innerHTML = "";
  t.videosContainer.className = `videos-container ${a.viewMode}-view`;

  if (videos.length === 0) {
    le();
    return;
  }

  // Render videos
  videosToShow.forEach((video, index) => {
    const videoElement = K(video, index);
    t.videosGrid.appendChild(videoElement);
  });

  // Load More UI removed; guard in case element exists
  if (t.loadMoreContainer) t.loadMoreContainer.classList.toggle("hidden", endIndex >= videos.length);

  // Show search stats if there's a search query
  if (a.searchQuery) {
    const searchTime = Math.round(performance.now() - startTime);
    L(videos.length, searchTime);
  } else {
    t.searchStats.classList.add("hidden");
  }

  lucide.createIcons();
}
function K(e, i) {
  const s = document.createElement("div");
  (s.className = `video-card animate-fade-in ${a.viewMode}-card`),
    s.dataset.id = e.id;
  (s.style.animationDelay = `${i * 0.1}s`);
  const r =
    { Beginner: "success", Intermediate: "warning", Advanced: "destructive" }[
    e.difficulty
    ] || "muted";
  s.innerHTML = `
    <div class="video-thumbnail">
      <img src="${e.thumbnail}" alt="${e.title}" loading="lazy">
      <div class="video-duration">${e.duration}</div>
      <div class="video-overlay">
        <button class="play-btn">
          <i data-lucide="play"></i>
        </button>
      </div>
    </div>
    <div class="video-content">
      <div class="video-header">
        <h3 class="video-title">${e.title}</h3>
        <div class="video-rating">
          <i data-lucide="star"></i>
          <span>${e.rating}</span>
        </div>
      </div>
      <p class="video-description">${e.description}</p>
      <div class="video-meta">
        <div class="video-views">
          <i data-lucide="eye"></i>
          <span>${f(e.views)} views</span>
        </div>
      </div>
      <div class="video-footer">
        <div class="video-tags">
          <span class="video-category">${e.category}</span>
          <span class="video-difficulty ${r}">${e.difficulty}</span>
          ${e.aiTags.map((u) => `<span class="video-tag">${u}</span>`).join("")}
        </div>
        <div class="video-actions">
          <button class="video-action-btn" title="Save">
            ${_svgBookmark(isSaved(e.id) ? 'bookmark-check' : 'bookmark')}
          </button>
          <button class="video-action-btn" title="Share">
            <i data-lucide="share-2"></i>
          </button>
          <button class="video-action-btn" title="More">
            <i data-lucide="more-horizontal"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  const n = s.querySelector(".play-btn"),
    o = s.querySelector('.video-action-btn[title="Save"]'),
    d = s.querySelector('.video-action-btn[title="Share"]');
  const moreBtn = s.querySelector('.video-action-btn[title="More"]');
  // reflect initial saved state
  if (o) o.classList.toggle("active", isSaved(e.id));
  return (
    n.addEventListener("click", (u) => {
      u.stopPropagation();
      // Open playable modal if youtube link or video file present
      openVideoModal(e);
    }),
    d && d.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const url = e.youtubeLink || e.videoUrl || window.location.href;
      try {
        if (navigator.share) {
          await navigator.share({ title: e.title || 'Video', url });
          c('Share dialog opened', 'success');
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          c('Link copied to clipboard!', 'success');
        } else {
          window.open(url, '_blank');
        }
      } catch (err) {
        c("Couldn't share. Link copied instead.", 'warning');
        try { await navigator.clipboard.writeText(url); } catch { }
      }
    }),
    o.addEventListener("click", (u) => {
      u.stopPropagation();
      toggleSave(e.id);
      const active = isSaved(e.id);
      o.classList.toggle("active", active);
      // Rebuild icon with inline SVG (no library dependency)
      o.innerHTML = _svgBookmark(active ? 'bookmark-check' : 'bookmark');
    }),
    d.addEventListener("click", (u) => {
      u.stopPropagation();
      const url = e.youtubeLink || e.videoUrl || window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        c("Link copied to clipboard!", "success");
      });
    }),
    // open AI writer modal when More button clicked
    moreBtn && moreBtn.addEventListener('click', (u) => {
      u.stopPropagation();
      openAIModal(e);
    }),
    s.addEventListener("click", () => {
      // Open in-app video modal on any card click (do not redirect to YouTube)
      openVideoModal(e);
    }),
    s
  );
}

// update numeric stats (Total Videos etc) to reflect real data
function updateStatsCounts() {
  try {
    // Map specific stat cards by title to desired values
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card) => {
      const titleEl = card.querySelector('.stat-title');
      const valueEl = card.querySelector('.stat-value');
      if (!titleEl || !valueEl) return;
      const title = titleEl.textContent.trim().toLowerCase();
      if (title.includes('total videos')) {
        valueEl.dataset.count = String(a.videos.length);
        valueEl.textContent = f(a.videos.length);
      } else if (title.includes('active students')) {
        // static override as requested
        valueEl.dataset.count = String(1428);
        valueEl.textContent = '1,428';
      } else if (title.includes('ai insights')) {
        valueEl.dataset.count = String(273);
        valueEl.textContent = '273';
      }
    });

    // Update the My Videos nav badge to reflect total videos count
    const myNavBadge = document.querySelector('.nav-item[data-route="my-videos"] .nav-badge');
    if (myNavBadge) myNavBadge.textContent = String(a.videos.length);
  } catch (e) {
    console.error('updateStatsCounts error', e);
  }
}


// Persist saved videos in localStorage
function getSaved() {
  try { return SAVED.getSaved(); } catch (e) { return []; }
}

function saveList(list) {
  try { SAVED.saveList(list); } catch (e) { }
}

function isSaved(id) {
  try { return SAVED.isSaved(id); } catch (e) { return false; }
}

function toggleSave(id) {
  try {
    SAVED.toggleSave(id, {
      state: a,
      notify: c,
      renderSavedSection: () => renderSavedSection(),
      updateSavedCount: () => updateSavedCount()
    });
  } catch (e) {
    console.error('toggleSave failed', e);
  }
}

function updateSavedCount() {
  try { return SAVED.updateSavedCount({ savedCountEl: t.savedCount }); } catch (e) { }
}

function renderSavedSection() {
  a.viewContext = 'saved';
  applyViewContextUI();
  a.currentPage = 1;
  try {
    SAVED.renderSavedSection({ state: a, dom: t, renderVideos: g, iconLib: lucide });
  } catch (e) {
    console.error('renderSavedSection failed', e);
  }
}

// Video modal helpers
let currentModalVideoId = null;
function openVideoModal(video) {
  currentModalVideoId = video.id;
  if (!t.videoModal || !t.videoPlayerContainer) return;
  // lock background scroll
  document.body.style.overflow = 'hidden';

  // build header and player area
  t.videoPlayerContainer.innerHTML = "";
  // inject header
  const header = document.createElement('div');
  header.className = 'modal-video-header';
  header.innerHTML = `<div class="modal-title"><h3>${escapeHtml(video.title)}</h3></div>`;
  t.videoPlayerContainer.appendChild(header);
  const playerWrap = document.createElement('div');
  playerWrap.className = 'modal-video-player';
  t.videoPlayerContainer.appendChild(playerWrap);
  // If youtube link present, embed iframe
  if (video.youtubeLink && video.youtubeLink.includes("youtube.com")) {
    const url = new URL(video.youtubeLink);
    const vid = url.searchParams.get("v") || video.youtubeLink.split("/").pop();
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&modestbranding=1`;
    // Center and make responsive
    iframe.style.width = '100%';
    iframe.style.height = 'auto';
    iframe.style.aspectRatio = '16 / 9';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    // Center wrapper too
    playerWrap.style.display = 'flex';
    playerWrap.style.justifyContent = 'center';
    playerWrap.style.alignItems = 'center';
    playerWrap.appendChild(iframe);
  } else if (video.videoUrl) {
    const vid = document.createElement("video");
    vid.src = video.videoUrl;
    vid.controls = true;
    vid.autoplay = true;
    vid.style.width = '100%';
    vid.style.height = 'auto';
    vid.style.aspectRatio = '16 / 9';
    vid.style.display = 'block';
    vid.style.margin = '0 auto';
    playerWrap.style.display = 'flex';
    playerWrap.style.justifyContent = 'center';
    playerWrap.style.alignItems = 'center';
    playerWrap.appendChild(vid);
  } else {
    playerWrap.textContent = "Video cannot be played.";
  }
  // Update modal save button state and label
  if (t.modalSaveBtn) setModalSaveButtonUI();

  // display modal and trap focus
  t.videoModal.classList.remove("hidden");
  trapFocusInModal(t.videoModal);
  lucide.createIcons();
}

function closeVideoModal() {
  if (!t.videoModal) return;
  t.videoModal.classList.add("hidden");
  if (t.videoPlayerContainer) t.videoPlayerContainer.innerHTML = "";
  // restore body scroll
  document.body.style.overflow = '';
  releaseFocusTrap();
  currentModalVideoId = null;
}

// Inline SVG helper for bookmark icons (avoids runtime replacement issues)
function _svgBookmark(name) {
  const attrs = 'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  if (name === 'bookmark-check') {
    return `<svg ${attrs}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"></path><path d="m9 10 2 2 4-4"></path></svg>`;
  }
  return `<svg ${attrs}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>`;
}

// Ensure modal Save button shows icon + text and reflects saved state
function setModalSaveButtonUI() {
  try {
    if (!t.modalSaveBtn) return;
    const active = currentModalVideoId ? isSaved(currentModalVideoId) : false;
    // Build consistent content: icon + label
    const iconName = active ? 'bookmark-check' : 'bookmark';
    t.modalSaveBtn.innerHTML = `${_svgBookmark(iconName)}<span class="btn-label">${active ? 'Saved' : 'Save'}</span>`;
    t.modalSaveBtn.classList.toggle('active', active);
    // Colorize when active for clearer affordance
    t.modalSaveBtn.style.color = active ? 'black' : '';
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  } catch (err) { /* noop */ }
}

/* AI Writer Modal - lightweight local generator for 'Do' steps */
const aiModal = document.getElementById('ai-modal');
const aiModalBackdrop = aiModal ? aiModal.querySelector('.ai-modal-backdrop') : null;
const aiModalClose = aiModal ? aiModal.querySelector('.ai-modal-close') : null;
const aiModalOutput = aiModal ? document.getElementById('ai-modal-output') : null;
const aiModalVideoInfo = aiModal ? document.getElementById('ai-modal-video-info') : null;
const aiGenerateBtn = document.getElementById('ai-generate-btn');
const aiCopyBtn = document.getElementById('ai-copy-btn');
const aiDoneBtn = document.getElementById('ai-close-done');
const aiToneSelect = document.getElementById('ai-tone-select');

let currentAIVideo = null;

function openAIModal(video) {
  currentAIVideo = video;
  if (!aiModal) return;
  document.body.classList.add('ai-modal-open');
  aiModal.classList.remove('hidden');
  aiModal.setAttribute('aria-hidden', 'false');
  // populate header info
  if (aiModalVideoInfo) {
    aiModalVideoInfo.innerHTML = `<strong>${escapeHtml(video.title)}</strong><div class="muted">${escapeHtml(video.description || '')}</div>`;
  }
  if (aiModalOutput) aiModalOutput.textContent = '';
  // default to 'detailed' explanation per preference
  if (aiToneSelect) aiToneSelect.value = 'detailed';
  trapFocusInModal(aiModal);
}

function closeAIModal() {
  if (!aiModal) return;
  aiModal.classList.add('hidden');
  aiModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ai-modal-open');
  releaseFocusTrap();
  currentAIVideo = null;
}

function generateAIContent() {
  if (!currentAIVideo || !aiModalOutput) return;
  const tone = (aiToneSelect && aiToneSelect.value) || 'do';
  const title = currentAIVideo.title || '';
  const desc = currentAIVideo.description || '';
  const base = `${title}. ${desc}`;
  const out = simpleAIGenerator(base, tone);
  aiModalOutput.textContent = out;
}

function simpleAIGenerator(text, tone) {
  // Very small heuristic generator for local usage.
  const sentences = text.split(/[.\n]+/).map(s => s.trim()).filter(Boolean);
  const title = sentences[0] || text.slice(0, 60);
  if (tone === 'brief') {
    return `${title} — This video covers: ${sentences.slice(1, 4).join(', ') || 'key practical steps and measurement techniques.'}`;
  }
  if (tone === 'detailed') {
    return `Overview: ${title}\n\nDetails:\n- ${sentences.slice(1, 6).join('\n- ') || 'Practical techniques, setup, and real-world tips.'}\n\nTips:\n- Take notes during demonstrations.\n- Rewatch sections for measurement steps.`;
  }
  // default: 'do' action steps
  const actions = [];
  actions.push(`Do 1: Prepare the leveling instrument and ensure tripod is stable.`);
  actions.push(`Do 2: Level the instrument using the foot screws until the bubble is centered.`);
  actions.push(`Do 3: Take a backsight on a known benchmark to establish height.`);
  actions.push(`Do 4: Move to next station and take foresight readings; record all values.`);
  actions.push(`Do 5: Calculate height differences and verify closure to acceptable tolerance.`);
  if (desc) actions.push(`Do 6: Notes — ${desc.split('.').slice(0, 2).join('. ')}.`);
  return `Action Steps for ${title}:\n\n${actions.join('\n')}`;
}

// copy handler
aiCopyBtn && aiCopyBtn.addEventListener('click', () => {
  if (!aiModalOutput) return;
  const txt = aiModalOutput.innerText || aiModalOutput.textContent || '';
  navigator.clipboard.writeText(txt).then(() => c('Copied to clipboard', 'success'));
});

// generate button
aiGenerateBtn && aiGenerateBtn.addEventListener('click', generateAIContent);
// close handlers
aiModalBackdrop && aiModalBackdrop.addEventListener('click', closeAIModal);
aiModalClose && aiModalClose.addEventListener('click', closeAIModal);
aiDoneBtn && aiDoneBtn.addEventListener('click', closeAIModal);

// keyboard escape to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aiModal && !aiModal.classList.contains('hidden')) closeAIModal();
});

// small util: escape html
function escapeHtml(s) {
  return String(s).replace(/[&<>"]'/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Consolidated focus trap helpers used by all modals */
let __previouslyFocused = null;
function trapFocusInModal(modal) {
  try {
    __previouslyFocused = document.activeElement;
    const focusable = Array.from(modal.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')).filter(Boolean);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function keyHandler(e) {
      if (e.key === 'Escape') {
        // prefer closing any visible modal
        if (modal.classList.contains('ai-modal')) closeAIModal();
        if (modal.classList.contains('video-modal')) closeVideoModal();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    modal.__focusHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);
    first.focus();
  } catch (err) { /* ignore */ }
}

function releaseFocusTrap(modal) {
  try {
    if (modal && modal.__focusHandler) {
      document.removeEventListener('keydown', modal.__focusHandler);
      modal.__focusHandler = null;
    }
    if (__previouslyFocused && typeof __previouslyFocused.focus === 'function') __previouslyFocused.focus();
    __previouslyFocused = null;
  } catch (err) { /* ignore */ }
}

// Wire modal buttons
if (t.videoModalClose) t.videoModalClose.addEventListener("click", closeVideoModal);
if (t.videoModalBackdrop) t.videoModalBackdrop.addEventListener("click", closeVideoModal);
if (t.modalShareBtn) t.modalShareBtn.addEventListener("click", async () => {
  if (!currentModalVideoId) return;
  const video = a.videos.find((v) => v.id === currentModalVideoId);
  if (!video) return;
  const url = video.youtubeLink || video.videoUrl || window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: video.title || 'Video', url });
      c("Share dialog opened", "success");
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      c("Link copied to clipboard!", "success");
    } else {
      // Fallback: open new window
      window.open(url, '_blank');
    }
  } catch (err) {
    c("Couldn't share. Link copied to clipboard instead.", "warning");
    try { await navigator.clipboard.writeText(url); } catch { }
  }
});
if (t.modalSaveBtn) t.modalSaveBtn.addEventListener("click", () => {
  if (!currentModalVideoId) return;
  toggleSave(currentModalVideoId);
  setModalSaveButtonUI();
});

// Focus trap utilities for modal
// ...existing code...

// Hide user menu three-dots when sidebar collapsed (improve UX)
function updateUserMenuVisibility() {
  if (!t.userMenu) return;
  if (a.sidebarCollapsed) {
    t.userMenu.style.display = 'none';
  } else {
    t.userMenu.style.display = '';
  }
}
// call when sidebar toggled
const originalAe = ae;

ae = function () {
  originalAe();
  updateUserMenuVisibility();
};

// Ensure saved count is initialized
updateSavedCount();
// Listen for saved changes to sync UI (cards, modal save button)
window.addEventListener('eduvideo:saved-changed', (ev) => {
  // update all card save buttons
  document.querySelectorAll('.video-action-btn[title="Save"]').forEach(btn => {
    const card = btn.closest('.video-card');
    if (!card) return;
    const cid = card.dataset && card.dataset.id;
    if (cid) {
      const active = isSaved(cid);
      btn.classList.toggle('active', active);
      btn.innerHTML = _svgBookmark(active ? 'bookmark-check' : 'bookmark');
      return;
    }
    // fallback: infer by title if no data-id
    const titleEl = card.querySelector('.video-title');
    const title = titleEl ? titleEl.textContent.trim() : null;
    const video = a.videos.find(v => v.title === title);
    if (video) {
      const active = isSaved(video.id);
      btn.classList.toggle('active', active);
      btn.innerHTML = _svgBookmark(active ? 'bookmark-check' : 'bookmark');
    }
  });
  try { if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons(); } catch { }
  // update modal save button if open
  if (currentModalVideoId && t.modalSaveBtn) setModalSaveButtonUI();
});
function X(e, i) {
  try {
    return SEARCH.sortVideos(e, i);
  } catch (err) {
    return e;
  }
}
function v(e) {
  try { return SEARCH.parseDuration(e); } catch (err) { return 0; }
}
function Y(e) {
  a.sortBy = e.target.value;
  g();
  // Sorting toast suppressed
}
function Z(e, i) {
  // normalize filter token to lower-case for reliable matching
  const token = String(e).toLowerCase();
  const s = a.activeFilters.map(f => f.toLowerCase()).indexOf(token);
  if (s === -1) {
    a.activeFilters.push(e);
    i.classList.add("active");
  } else {
    // remove by index of original array
    const origIndex = a.activeFilters.findIndex(f => f.toLowerCase() === token);
    if (origIndex > -1) a.activeFilters.splice(origIndex, 1);
    i.classList.remove("active");
  }
  w();
  g();
  // Filter change toast suppressed
}

function w() {
  a.activeFilters.length > 0
    ? (t.clearFiltersBtn.classList.remove("hidden"),
      t.activeFiltersSummary.classList.remove("hidden"),
      (t.activeFiltersSummary.textContent = `Filtering by: ${a.activeFilters.join(
        ", "
      )}`))
    : (t.clearFiltersBtn.classList.add("hidden"),
      t.activeFiltersSummary.classList.add("hidden"));

  // Sync mobile filter buttons with active filters
  syncMobileFilters();
}

// Sync mobile filter buttons with desktop filter state
function syncMobileFilters() {
  if (t.mobileFilterBtns) {
    t.mobileFilterBtns.forEach(btn => {
      const filter = btn.dataset.filter;
      const isActive = a.activeFilters.some(f => f.toLowerCase() === filter.toLowerCase());
      btn.classList.toggle("active", isActive);
    });
  }
}
function F(e) {
  a.viewMode = e;

  // Update desktop view buttons
  if (t.gridViewBtn) t.gridViewBtn.classList.toggle("active", e === "grid");
  if (t.listViewBtn) t.listViewBtn.classList.toggle("active", e === "list");

  // Update mobile view buttons if they exist
  const mobileGridViewBtn = document.getElementById("mobile-grid-view");
  const mobileListViewBtn = document.getElementById("mobile-list-view");

  if (mobileGridViewBtn) mobileGridViewBtn.classList.toggle("active", e === "grid");
  if (mobileListViewBtn) mobileListViewBtn.classList.toggle("active", e === "list");

  g();
  // View switch toast suppressed
}
function _() {
  a.currentPage++;
  g();
}

// Infinite scroll: only active on My Videos (viewContext === 'videos')
let __isAutoLoading = false;
function handleInfiniteScroll() {
  try {
    if (a.viewContext !== 'videos') return;
    const doc = document.documentElement;
    const scrollPosition = (window.innerHeight || 0) + (window.scrollY || window.pageYOffset || 0);
    const totalHeight = (doc && doc.scrollHeight) || document.body.scrollHeight || 0;
    const threshold = 300;
    if (scrollPosition >= totalHeight - threshold) {
      // Determine total number of items in current 'videos' context with filters/sort
      let vids = b(a.searchQuery);
      vids = X(vids, a.sortBy);
      const total = vids.length;
      const loaded = a.currentPage * a.itemsPerPage;
      if (loaded < total && !__isAutoLoading) {
        __isAutoLoading = true;
        a.currentPage++;
        g();
        // Prevent rapid repeat triggers while still at bottom
        setTimeout(() => { __isAutoLoading = false; }, 200);
      }
    }
  } catch (e) {
    // fail-safe: never block scrolling due to errors
    __isAutoLoading = false;
  }
}
// Mobile bottom navigation handler
function handleBottomNavClick(e, item) {
  e.preventDefault();
  const route = item.dataset.route;

  // Update bottom nav active state
  t.bottomNavItems.forEach((nav) => nav.classList.remove("active"));
  item.classList.add("active");

  // Update sidebar nav active state
  t.navItems.forEach((nav) => nav.classList.remove("active"));
  const sidebarNav = document.querySelector(`.nav-item[data-route="${route}"]`);
  if (sidebarNav) sidebarNav.classList.add("active");

  // Handle route logic
  if (route === 'my-videos') a.viewContext = 'videos';
  else if (route === 'saved') a.viewContext = 'saved';
  else if (route === 'search') {
    a.viewContext = 'home';
    focusSearchInput();
    return;
  }
  else if (route === 'profile') {
    // For now, just show a toast - could be expanded to show user profile
    c("Profile feature coming soon!", "info");
    return;
  }
  else a.viewContext = 'home';

  applyViewContextUI();
  se(route);

  // Close mobile sidebar if open
  if (a.isMobile) {
    t.sidebar.classList.remove("mobile-open");
    t.mobileOverlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
  }

  // ensure home route re-renders the featured/videos list
  if (route === 'home') {
    a.viewContext = 'home';
    a.currentPage = 1; // Dashboard: constrain to first page
    applyViewContextUI();
    g();
  }
}

// Mobile search modal functions
function openMobileSearchModal() {
  if (t.mobileSearchModal) {
    t.mobileSearchModal.classList.remove("hidden");

    // Sync mobile filter states with current active filters
    syncMobileFilters();

    // Sync mobile view buttons with current view mode
    const mobileGridViewBtn = document.getElementById("mobile-grid-view");
    const mobileListViewBtn = document.getElementById("mobile-list-view");
    if (mobileGridViewBtn) mobileGridViewBtn.classList.toggle("active", a.viewMode === "grid");
    if (mobileListViewBtn) mobileListViewBtn.classList.toggle("active", a.viewMode === "list");
  }
}

function closeMobileSearchModal() {
  if (t.mobileSearchModal) {
    t.mobileSearchModal.classList.add("hidden");
  }
}

function performMobileSearch() {
  if (t.mobileSearchInput) {
    const query = t.mobileSearchInput.value.trim();
    if (query) {
      a.searchQuery = query;
      if (t.searchInput) {
        t.searchInput.value = query;
      }
      closeMobileSearchModal();
      const myVideosNav = document.querySelector('.nav-item[data-route="my-videos"]');
      if (myVideosNav) {
        ee({ preventDefault: () => { } }, myVideosNav);
      }
    }
  }
}

function performMobileAiAssist() {
  if (t.mobileSearchInput) {
    const query = t.mobileSearchInput.value.trim();
    if (query) {
      a.searchQuery = query;
      oe(); // Perform AI assist
      closeMobileSearchModal();
    } else {
      c("Please enter a search term first", "warning");
    }
  }
}

function handleMobileFilterClick(btn) {
  const filter = btn.dataset.filter;

  // Toggle the mobile filter button state
  btn.classList.toggle("active");

  // Apply filter to main search system
  const mainFilterBtn = document.querySelector(`[data-filter="${filter}"]`);
  if (mainFilterBtn) {
    // Use the same filter logic as desktop
    Z(filter, mainFilterBtn);
  }

  // Close modal and show results
  closeMobileSearchModal();
  const homeNav = document.querySelector('.bottom-nav-item[data-route="home"]');
  if (homeNav) {
    handleBottomNavClick({ preventDefault: () => { } }, homeNav);
  }
}

function handleMobileViewClick(btn) {
  const view = btn.dataset.view;

  // Update all mobile view buttons
  document.querySelectorAll(".mobile-view-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  // Update desktop view buttons
  if (t.gridViewBtn) t.gridViewBtn.classList.toggle("active", view === "grid");
  if (t.listViewBtn) t.listViewBtn.classList.toggle("active", view === "list");

  // Update the view mode and re-render
  a.viewMode = view;
  g();

  // Close modal
  closeMobileSearchModal();
}

// Focus search input (for mobile header search button)
function focusSearchInput() {
  if (a.isMobile) {
    openMobileSearchModal();
  } else if (t.searchInput) {
    t.searchInput.focus();
  }
}

function ee(e, i) {
  e.preventDefault();
  const s = i.dataset.route;
  t.navItems.forEach((r) => r.classList.remove("active"));
  i.classList.add("active");

  // Update bottom nav active state
  t.bottomNavItems.forEach((nav) => nav.classList.remove("active"));
  const bottomNav = document.querySelector(`.bottom-nav-item[data-route="${s}"]`);
  if (bottomNav) bottomNav.classList.add("active");

  // set viewContext
  if (s === 'my-videos') a.viewContext = 'videos';
  else if (s === 'saved') a.viewContext = 'saved';
  else a.viewContext = 'home';
  applyViewContextUI();
  se(s);
  // ensure home route re-renders the featured/videos list (prevents saved list from persisting)
  if (s === 'home') {
    a.viewContext = 'home';
    a.currentPage = 1; // Dashboard: always show only first 9
    applyViewContextUI();
    g();
  }
}
function te(e, i) {
  e.preventDefault();
  const s = i.dataset.category;
  R();
  a.activeFilters = [s];
  a.viewContext = 'videos';
  a.currentPage = 1; // Reset pagination when navigating via category
  const r = document.querySelector(`[data-filter="${s}"]`);
  r && r.classList.add("active");
  w();
  // activate My Videos nav item
  t.navItems.forEach((n) => n.classList.remove('active'));
  const myNav = Array.from(t.navItems).find((n) => n.dataset.route === 'my-videos');
  if (myNav) myNav.classList.add('active');
  applyViewContextUI();
  g();
}
function se(e) {
  switch (e) {
    case "search":
      t.searchInput.focus();
      break;
    case "my-videos":
      a.currentPage = 1; // Start with first 9 on My Videos
      applyViewContextUI();
      g();
      break;
    case "saved":
      a.viewContext = 'saved';
      a.currentPage = 1;
      applyViewContextUI();
      renderSavedSection();
      break;
    case "trending":
      (a.sortBy = "most-viewed"), (t.sortSelect.value = "most-viewed"), g();
      break;
    case "home":
      a.viewContext = 'home';
      a.currentPage = 1; // Dashboard: only first 9
      applyViewContextUI();
      g();
      break;
  }
}
function ie(e) {
  switch (e) {
    case "start-learning":
      // quick action toast suppressed
      break;
    case "ai-recommendations":
      // keep AI suggestions toast when generated successfully (handled in oe())
      break;
    case "upload-content":
      openUploadModalService();
      break;
    case "analytics":
      // suppressed
      break;
  }
}
function ae() {
  (a.sidebarCollapsed = !a.sidebarCollapsed),
    t.sidebar.classList.toggle("collapsed", a.sidebarCollapsed),
    Q();
}
function ne() {
  // Toggle mobile sidebar
  t.sidebar.classList.toggle("mobile-open");
  t.mobileOverlay.classList.toggle("active");
  document.body.classList.toggle("sidebar-open");

  // Ensure the sidebar is visible when opened
  if (t.sidebar.classList.contains("mobile-open")) {
    t.sidebar.style.transform = "translate(0)";
  } else {
    t.sidebar.style.transform = "translate(-100%)";
  }
}
function re() {
  t.sidebar.classList.remove("mobile-open");
  t.mobileOverlay.classList.remove("active");
  document.body.classList.remove("sidebar-open");
  // Reset transform when closing
  t.sidebar.style.transform = "translate(-100%)";
}
function Q() {
  window.innerWidth > 768
    ? (t.mainContent.style.marginLeft = a.sidebarCollapsed ? "80px" : "280px")
    : (t.mainContent.style.marginLeft = "0");
}
async function oe() {
  // If searchQuery is empty, try quick search input or provide generic suggestions
  if (!a.searchQuery.trim()) {
    const quick = (t.quickSearchInput && t.quickSearchInput.value) ? t.quickSearchInput.value.trim() : "";
    if (quick) {
      a.searchQuery = quick;
      t.searchInput.value = quick;
    } else {
      // fallback generic topics so AI Assist still returns suggestions
      a.searchQuery = "learning";
      // don't overwrite the visible input if user left it blank intentionally
    }
  }
  try {
    (a.isSearching = !0), P();
    const e = [
      `${a.searchQuery} for beginners`,
      `Advanced ${a.searchQuery} techniques`,
      `${a.searchQuery} best practices`,
      `${a.searchQuery} real-world applications`,
    ];
    await new Promise((i) => setTimeout(i, 1500)),
      ce(e),
      t.suggestionsDropdown.classList.remove("hidden"),
      c("AI suggestions generated!", "success");
  } catch (e) {
    console.error("AI search failed:", e),
      c("AI search temporarily unavailable", "error"),
      p();
  } finally {
    (a.isSearching = !1), P();
  }
}
function ce(e) {
  const i = document.querySelector(".suggestions-list");
  (i.innerHTML = ""),
    e.forEach((s) => {
      const r = document.createElement("button");
      (r.className = "suggestion-item"),
        (r.textContent = s),
        r.addEventListener("click", () => {
          (t.searchInput.value = s),
            (a.searchQuery = s),
            t.suggestionsDropdown.classList.add("hidden"),
            p();
        }),
        i.appendChild(r);
    });
}
function P() {
  a.isSearching
    ? ((t.searchBtn.innerHTML =
      '<i data-lucide="loader-2" class="animate-spin"></i>'),
      (t.aiAssistBtn.innerHTML =
        '<i data-lucide="sparkles"></i> AI Thinking...'),
      (t.aiAssistBtn.disabled = !0))
    : ((t.searchBtn.innerHTML = '<i data-lucide="search"></i>'),
      (t.aiAssistBtn.innerHTML = '<i data-lucide="sparkles"></i> AI Assist'),
      (t.aiAssistBtn.disabled = !1)),
    lucide.createIcons();
}
function L(e, i = 0) {
  (t.resultsCount.textContent = `${e} result${e !== 1 ? "s" : ""}`),
    i > 0 && (t.searchTime.textContent = `in ${i}ms`),
    t.searchStats.classList.remove("hidden");
}
function le() {
  t.videosGrid.innerHTML = `
    <div class="no-results">
      <div class="no-results-icon">
        <i data-lucide="search-x"></i>
      </div>
      <h3>No videos found</h3>
      <p>Try adjusting your search terms or filters</p>
      <div class="no-results-actions">
        <button class="btn btn-secondary" id="no-results-clear-filters-btn">
          <i data-lucide="refresh-cw"></i>
          Clear Filters
        </button>
        <button class="btn btn-outline" id="no-results-clear-search-btn">
          <i data-lucide="x"></i>
          Clear Search
        </button>
      </div>
    </div>
  `;
  if (t.loadMoreContainer) t.loadMoreContainer.classList.add("hidden");
  lucide.createIcons();
  const clearFiltersBtn = document.getElementById("no-results-clear-filters-btn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearAllFilters);
  }
  const clearSearchBtn = document.getElementById("no-results-clear-search-btn");
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (t.searchInput)
        t.searchInput.value = "";
      a.searchQuery = "";
      g();
    });
  }
}
function c(e, i = "info") {
  // Delegate to service toast implementation
  try {
    TOAST(e, i);
  } catch (err) {
    console.warn('Toast service failed, message:', e, 'type:', i, err);
  }
}
function de() {
  document.querySelectorAll("[data-count]").forEach((i) => {
    const s = parseInt(i.dataset.count),
      n = s / (2e3 / 16);
    let o = 0;
    const d = setInterval(() => {
      (o += n),
        o >= s
          ? ((i.textContent = f(s)), clearInterval(d))
          : (i.textContent = f(Math.floor(o)));
    }, 16);
  });
}
function f(e) {
  return e >= 1e6
    ? (e / 1e6).toFixed(1) + "M"
    : e >= 1e3
      ? (e / 1e3).toFixed(1) + "K"
      : e.toString();
}
function ue(e, i) {
  let s;
  return function (...n) {
    const o = () => {
      clearTimeout(s), e(...n);
    };
    clearTimeout(s), (s = setTimeout(o, i));
  };
}
function ge(e) {
  !t.searchInput.contains(e.target) &&
    !t.searchResultsDropdown.contains(e.target) &&
    m(),
    !t.searchInput.contains(e.target) &&
    !t.suggestionsDropdown.contains(e.target) &&
    t.suggestionsDropdown.classList.add("hidden");
}
function q() {
  a.isMobile = window.innerWidth <= 768;

  if (a.isMobile) {
    t.sidebar.classList.add("mobile");
    t.mainContent.style.marginLeft = "0";
    // Ensure mobile menu toggle is visible and functional
    if (t.mobileMenuToggle) {
      t.mobileMenuToggle.style.display = "block";
    }
  } else {
    t.sidebar.classList.remove("mobile", "mobile-open");
    t.mobileOverlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    // Hide mobile menu toggle on desktop
    if (t.mobileMenuToggle) {
      t.mobileMenuToggle.style.display = "none";
    }
    Q();
  }
}
function renderVideos() {
  // Re-render videos with current state
  g();
}

function showQuickSearchResults(results) {
  // This function shows quick search results in the top bar
  // For now, we'll just log the results to avoid errors
  console.log('Quick search results:', results);
}

function clearAllFilters() {
  // Clear all active filters
  a.activeFilters = [];
  a.sortBy = "relevance";

  // Clear filter badges
  if (t.filterBadges) {
    t.filterBadges.forEach(badge => {
      badge.classList.remove("active");
    });
  }

  // Reset sort select
  if (t.sortSelect) {
    t.sortSelect.value = "relevance";
  }

  // Hide clear button
  if (t.clearFiltersBtn) {
    t.clearFiltersBtn.classList.add("hidden");
  }

  // Re-render videos
  g();

  // Show success message
  c("All filters cleared", "success");
}

// Initialize chatbot
async function initializeChatbot() {
  try {
    // Import chatbot module
    const { default: ChatbotUI } = await import('./chatbot.js');

    // Initialize chatbot UI
    window.chatbotUI = new ChatbotUI();

    // Set up database connection
    if (window.chatbotUI && supabase) {
      window.chatbotUI.setDatabase(supabase);
    }

    console.log('SachiDev chatbot initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize chatbot:', error);
  }
}

// Initialize chatbot after main app initialization
N();
initializeChatbot();