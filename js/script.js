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

// connect to Cloud Firestore (set values from Firebase project settings)
const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyB3W9JfnwHshArkdvry784VRdLZMaM8e1Y",
  authDomain: "sachicodex-edu-test.firebaseapp.com",
  projectId: "sachicodex-edu-test",
  storageBucket: "sachicodex-edu-test.firebasestorage.app",
  messagingSenderId: "990789366745",
  appId: "1:990789366745:web:a15d456505c5e28db29fc8"
};

const db = DB.initDB(firebaseConfig);
window.firestoreDb = db;

// Wrapper to open Upload modal via service
function openUploadModalService() {
  UPLOAD.createUploadModal({
    db,
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
  previousViewContext: "home",
  sidebarCollapsed: !1,
  isSearching: !1,
  searchResults: [],
  currentPage: 1,
  itemsPerPage: 9,
  totalResults: 0,
  searchStartTime: 0,
  videos: [],
  playlists: [],
  selectedPlaylist: null,
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
    playlistGrid: document.getElementById("playlist-grid"),
    playlistDetailScreen: document.getElementById("playlist-detail-screen"),
    playlistBackBtn: document.getElementById("playlist-back-btn"),
    playlistDetailTitle: document.getElementById("playlist-detail-title"),
    playlistDetailDescription: document.getElementById("playlist-detail-description"),
    playlistItemsGrid: document.getElementById("playlist-items-grid"),
  };
async function N() {
  V();
  updateSearchInputPlaceholder(true);
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

// Load videos from Firestore and map to app shape
async function loadVideosFromDB() {
  try {
    const rows = await DB.loadVideosFromDB(db);
    a.videos = rows;
    buildPlaylistsFromVideos();
    renderPlaylists();
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
    (t.playlistBackBtn) == null || t.playlistBackBtn.addEventListener("click", handlePlaylistBack),
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
    updateSearchInputPlaceholder(),
    a.searchQuery.length > 2 ? ue(U, 300)() : (m(), g());
}
function O(e) {
  if (e.key === "Tab") {
    const suggestion = getSearchInputSuggestion(t.searchInput.value);
    if (suggestion) {
      e.preventDefault();
      t.searchInput.value = suggestion;
      a.searchQuery = suggestion;
      updateSearchInputPlaceholder();
    }
  } else if (e.key === "Enter") {
    a.searchQuery = t.searchInput.value;
    const myVideosNav = document.querySelector('.nav-item[data-route="my-videos"]');
    if (myVideosNav) {
      ee({ preventDefault: () => { } }, myVideosNav);
    }
  } else if (e.key === "Escape") {
    m();
    if (t.suggestionsDropdown) t.suggestionsDropdown.classList.add("hidden");
  }
}
function H() {
  updateSearchInputPlaceholder();
  a.searchQuery.length > 2 &&
    t.searchResultsDropdown.classList.remove("hidden");
}
function z(e) {
  setTimeout(() => {
    t.searchResultsDropdown.contains(e.relatedTarget) || m();
    updateSearchInputPlaceholder();
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

const searchInputSuggestions = [
  "Data structures and algorithms",
  "JavaScript basics for beginners",
  "React project setup tutorial",
  "Database design fundamentals",
];
let currentSearchInputSuggestion = "";
const defaultSearchInputPlaceholder = "Search videos and topics...";

function getSearchInputSuggestion(currentValue = "") {
  const typed = String(currentValue || "").trim().toLowerCase();
  if (!typed) {
    if (!currentSearchInputSuggestion) {
      currentSearchInputSuggestion =
        searchInputSuggestions[
        Math.floor(Math.random() * searchInputSuggestions.length)
        ];
    }
    return currentSearchInputSuggestion;
  }

  return (
    searchInputSuggestions.find(
      (suggestion) =>
        suggestion.toLowerCase().startsWith(typed) &&
        suggestion.length > typed.length
    ) || ""
  );
}

function updateSearchInputPlaceholder(forceNew = false) {
  if (!t.searchInput) return;

  if (forceNew) {
    currentSearchInputSuggestion = "";
  }

  if (t.searchInput.value.trim()) {
    t.searchInput.placeholder = defaultSearchInputPlaceholder;
    return;
  }

  const suggestion = getSearchInputSuggestion("");
  t.searchInput.placeholder = suggestion || defaultSearchInputPlaceholder;
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
  const playlists = document.querySelector('.playlists-section');
  const quick = document.querySelector('.quick-actions');
  const search = document.querySelector('.search-section');
  const playlistDetailScreen = t.playlistDetailScreen;
  if (a.viewContext === 'home') {
    if (hero) hero.style.display = '';
    if (stats) stats.style.display = '';
    if (featured) featured.style.display = '';
    if (playlists) playlists.style.display = '';
    if (quick) quick.style.display = '';
    if (search) search.style.display = '';
    if (playlistDetailScreen) playlistDetailScreen.classList.add('hidden');
  } else if (a.viewContext === 'videos') {
    if (hero) hero.style.display = 'none';
    if (stats) stats.style.display = 'none';
    // show featured/videos grid when viewing videos
    if (featured) featured.style.display = '';
    if (playlists) playlists.style.display = '';
    if (quick) quick.style.display = 'none';
    if (search) search.style.display = '';
    if (playlistDetailScreen) playlistDetailScreen.classList.add('hidden');
  } else if (a.viewContext === 'saved') {
    if (hero) hero.style.display = 'none';
    if (stats) stats.style.display = 'none';
    // show featured/videos grid for saved view as well
    if (featured) featured.style.display = '';
    if (playlists) playlists.style.display = 'none';
    if (quick) quick.style.display = 'none';
    if (search) search.style.display = 'none';
    if (playlistDetailScreen) playlistDetailScreen.classList.add('hidden');
  } else if (a.viewContext === 'playlist-detail') {
    if (hero) hero.style.display = 'none';
    if (stats) stats.style.display = 'none';
    if (featured) featured.style.display = 'none';
    if (playlists) playlists.style.display = 'none';
    if (quick) quick.style.display = 'none';
    if (search) search.style.display = 'none';
    if (playlistDetailScreen) playlistDetailScreen.classList.remove('hidden');
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
    // Keep playlist items out of the main feed in My Videos.
    if (a.viewContext === 'videos') {
      videos = videos.filter((v) => !isPlaylistVideo(v));
    }
  }

  // Sort the videos
  videos = X(videos, a.sortBy);

  // Dashboard rule: show exactly 3 cards above playlists.
  // Prefer non-playlist videos; if unavailable, fall back to any videos.
  let endIndex = (a.currentPage - 1) * a.itemsPerPage + a.itemsPerPage;
  if (a.viewContext === 'home') {
    const nonPlaylist = videos.filter((v) => !isPlaylistVideo(v));
    videos = nonPlaylist.length ? nonPlaylist : videos;
    endIndex = 3;
  }
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

function isPlaylistVideo(video) {
  const playlistName = video?.playlistName || video?.playlist || "";
  return String(playlistName).trim().length > 0;
}

function buildPlaylistsFromVideos() {
  const groups = new Map();
  a.videos.forEach((video) => {
    const rawName = video.playlistName || video.playlist || "";
    const playlistName = String(rawName || "").trim();
    if (!playlistName) return;
    if (!groups.has(playlistName)) {
      groups.set(playlistName, {
        id: playlistName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: playlistName,
        description: video.playlistDescription || "",
        items: [],
      });
    }
    groups.get(playlistName).items.push(video);
  });

  a.playlists = Array.from(groups.values()).map((playlist) => ({
    ...playlist,
    thumbnail: playlist.items[0]?.thumbnail || "",
    description:
      playlist.description ||
      `${playlist.items.length} video${playlist.items.length === 1 ? "" : "s"} in this playlist`,
  }));
}

function renderPlaylists() {
  if (!t.playlistGrid) return;
  t.playlistGrid.innerHTML = "";

  if (!a.playlists.length) {
    t.playlistGrid.innerHTML = `
      <div class="playlist-empty-state">
        <h4>No playlists yet</h4>
        <p>Upload videos with playlist fields to see playlist cards.</p>
      </div>
    `;
    return;
  }

  a.playlists.forEach((playlist, index) => {
    const card = createPlaylistCard(playlist, index);
    t.playlistGrid.appendChild(card);
  });
  lucide.createIcons();
}

function createPlaylistCard(playlist, index) {
  const card = document.createElement("div");
  card.className = "playlist-card video-card animate-fade-in grid-card";
  card.style.animationDelay = `${index * 0.1}s`;
  const safeName = escapeHtml(playlist.name || "Playlist");
  const safeDescription = escapeHtml(
    playlist.description ||
    `${playlist.items.length} video${playlist.items.length === 1 ? "" : "s"} in this playlist`
  );
  const firstItem = Array.isArray(playlist.items) ? playlist.items[0] : null;
  const totalViews = (playlist.items || []).reduce(
    (sum, item) => sum + (parseInt(String(item?.views || 0), 10) || 0),
    0
  );
  const shareUrl = firstItem?.youtubeLink || firstItem?.videoUrl || window.location.href;
  card.innerHTML = `
    <div class="video-thumbnail">
      <img src="${playlist.thumbnail}" alt="${safeName}" loading="lazy">
      <div class="video-duration">${firstItem?.duration || "0:00"}</div>
      <div class="video-overlay">
        <button class="play-btn" aria-label="Open playlist">
          <i data-lucide="play"></i>
        </button>
      </div>
    </div>
    <div class="video-content">
      <div class="video-header">
        <h3 class="video-title">${safeName}</h3>
      </div>
      <p class="video-description">${safeDescription}</p>
      <div class="video-meta">
        <div class="video-views">
          <i data-lucide="eye"></i>
          <span>${f(totalViews)} views</span>
        </div>
        <div class="video-actions">
          <button class="video-action-btn" title="Save">
            ${_svgBookmark("bookmark")}
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

  const playBtn = card.querySelector(".play-btn");
  const saveBtn = card.querySelector('.video-action-btn[title="Save"]');
  const shareBtn = card.querySelector('.video-action-btn[title="Share"]');
  const moreBtn = card.querySelector('.video-action-btn[title="More"]');
  let playlistSaved = false;

  if (playBtn) {
    playBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openPlaylistDetail(playlist);
    });
  }
  if (saveBtn) {
    saveBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      playlistSaved = !playlistSaved;
      saveBtn.classList.toggle("active", playlistSaved);
      saveBtn.innerHTML = _svgBookmark(playlistSaved ? "bookmark-check" : "bookmark");
    });
  }
  if (shareBtn) {
    shareBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigator.clipboard.writeText(shareUrl).then(() => {
        c("Playlist link copied to clipboard!", "success");
      });
    });
  }
  if (moreBtn) {
    moreBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openPlaylistDetail(playlist);
    });
  }

  card.addEventListener("click", () => openPlaylistDetail(playlist));
  return card;
}

function openPlaylistDetail(playlist) {
  if (!playlist) return;
  a.selectedPlaylist = playlist;
  a.previousViewContext = a.viewContext === "playlist-detail" ? "home" : a.viewContext;
  a.viewContext = "playlist-detail";
  applyViewContextUI();
  renderPlaylistDetail();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPlaylistDetail() {
  if (!a.selectedPlaylist || !t.playlistItemsGrid) return;
  if (t.playlistDetailTitle) t.playlistDetailTitle.textContent = a.selectedPlaylist.name;
  if (t.playlistDetailDescription) {
    t.playlistDetailDescription.textContent = a.selectedPlaylist.description;
  }

  t.playlistItemsGrid.innerHTML = "";
  a.selectedPlaylist.items.forEach((video, index) => {
    const card = createPlaylistItemCard(video, index);
    t.playlistItemsGrid.appendChild(card);
  });
  lucide.createIcons();
}

function createPlaylistItemCard(video, index) {
  const card = document.createElement("div");
  card.className = "video-card animate-fade-in grid-card";
  card.dataset.id = video.id;
  card.style.animationDelay = `${index * 0.08}s`;
  const safeTitle = escapeHtml(video.title || "Untitled Video");
  const safeDescription = escapeHtml(video.description || "No description available.");
  card.innerHTML = `
    <div class="video-thumbnail">
      <img src="${video.thumbnail}" alt="${safeTitle}" loading="lazy">
      <div class="video-duration">${video.duration || "0:00"}</div>
      <div class="video-overlay">
        <button class="play-btn">
          <i data-lucide="play"></i>
        </button>
      </div>
    </div>
    <div class="video-content">
      <div class="video-header">
        <h3 class="video-title">${safeTitle}</h3>
      </div>
      <p class="video-description">${safeDescription}</p>
      <div class="video-meta">
        <div class="video-views">
          <i data-lucide="eye"></i>
          <span>${f(video.views || 0)} views</span>
        </div>
        <div class="video-actions">
          <button class="video-action-btn" title="Save">
            ${_svgBookmark(isSaved(video.id) ? 'bookmark-check' : 'bookmark')}
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

  const playBtn = card.querySelector(".play-btn");
  const saveBtn = card.querySelector('.video-action-btn[title="Save"]');
  const shareBtn = card.querySelector('.video-action-btn[title="Share"]');
  const moreBtn = card.querySelector('.video-action-btn[title="More"]');

  if (playBtn) {
    playBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openVideoModal(video);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleSave(video.id);
      const active = isSaved(video.id);
      saveBtn.classList.toggle("active", active);
      saveBtn.innerHTML = _svgBookmark(active ? 'bookmark-check' : 'bookmark');
    });
    saveBtn.classList.toggle("active", isSaved(video.id));
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const url = video.youtubeLink || video.videoUrl || window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        c("Link copied to clipboard!", "success");
      });
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openEditModal(video);
    });
  }

  card.addEventListener("click", () => openVideoModal(video));
  return card;
}

function handlePlaylistBack() {
  a.viewContext = a.previousViewContext || "home";
  a.selectedPlaylist = null;
  applyViewContextUI();
  if (a.viewContext === "saved") {
    renderSavedSection();
  } else {
    g();
  }
}

function K(e, i) {
  const s = document.createElement("div");
  (s.className = `video-card animate-fade-in ${a.viewMode}-card`),
    s.dataset.id = e.id;
  (s.style.animationDelay = `${i * 0.1}s`);
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
      </div>
      <p class="video-description">${e.description}</p>
      <div class="video-meta">
        <div class="video-views">
          <i data-lucide="eye"></i>
          <span>${f(e.views)} views</span>
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
    // open Edit modal when More button clicked
    moreBtn && moreBtn.addEventListener('click', (u) => {
      u.stopPropagation();
      openEditModal(e);
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
function isYouTubeUrl(value) {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  return /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(v);
}

function extractYouTubeVideoId(value) {
  if (!value || typeof value !== "string") return null;
  const input = value.trim();
  if (!input) return null;

  // Plain ID support (11 chars) for resilience.
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const parsed = new URL(input);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.includes("youtu.be")) {
      const shortId = path.split("/").filter(Boolean)[0];
      return shortId || null;
    }

    if (
      host.includes("youtube.com") ||
      host.includes("youtube-nocookie.com")
    ) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return watchId;

      const parts = path.split("/").filter(Boolean);
      const markers = ["embed", "shorts", "live", "v"];
      const markerIndex = parts.findIndex((p) => markers.includes(p));
      if (markerIndex >= 0 && parts[markerIndex + 1]) return parts[markerIndex + 1];
    }
  } catch (_) {
    // fallback regex below
  }

  const match = input.match(
    /(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/live\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

let currentModalYTPlayer = null;
let currentModalHtml5Player = null;
let currentModalPlayerTick = null;
let ytIframeApiPromise = null;
let currentModalInlineControls = null;

function formatPlayerTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function clearModalPlayerResources() {
  if (currentModalPlayerTick) {
    clearInterval(currentModalPlayerTick);
    currentModalPlayerTick = null;
  }
  if (currentModalYTPlayer && typeof currentModalYTPlayer.destroy === "function") {
    try { currentModalYTPlayer.destroy(); } catch (_) { }
  }
  currentModalYTPlayer = null;
  currentModalHtml5Player = null;
}

function ensureYouTubeIframeAPI() {
  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }
  if (ytIframeApiPromise) return ytIframeApiPromise;

  ytIframeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        if (typeof previousReady === "function") previousReady();
      } catch (_) { }
      resolve(window.YT);
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return ytIframeApiPromise;
}

function _svgControlIcon(name) {
  const attrs = 'xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case "pause":
      return `<svg ${attrs}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    case "mute":
      return `<svg ${attrs}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>`;
    case "volume":
      return `<svg ${attrs}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path></svg>`;
    case "share":
      return `<svg ${attrs}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line></svg>`;
    case "play":
    default:
      return `<svg ${attrs}><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`;
  }
}

function createCustomPlayerControls(playerWrap) {
  const controls = document.createElement("div");
  controls.className = "custom-video-controls";
  controls.innerHTML = `
    <button class="cvc-btn cvc-icon-btn" type="button" data-cvc="play" aria-label="Play" title="Play">${_svgControlIcon("play")}</button>
    <input class="cvc-seek" type="range" min="0" max="1000" value="0" data-cvc="seek" aria-label="Seek">
    <span class="cvc-time" data-cvc="time">0:00 / 0:00</span>
    <div class="cvc-actions-row" data-cvc="actions-row">
      <div class="cvc-volume-wrap" data-cvc="vol-wrap">
        <button class="cvc-btn cvc-icon-btn" type="button" data-cvc="mute" aria-label="Mute" title="Mute">${_svgControlIcon("volume")}</button>
        <input class="cvc-volume" type="range" min="0" max="100" value="100" data-cvc="volume" aria-label="Volume">
      </div>
      <button class="cvc-btn cvc-icon-btn" type="button" data-cvc="save" aria-label="Save" title="Save">${_svgBookmark("bookmark")}</button>
      <button class="cvc-btn cvc-icon-btn" type="button" data-cvc="share" aria-label="Share" title="Share">${_svgControlIcon("share")}</button>
    </div>
  `;
  playerWrap.appendChild(controls);
  const api = {
    root: controls,
    playBtn: controls.querySelector('[data-cvc="play"]'),
    seek: controls.querySelector('[data-cvc="seek"]'),
    time: controls.querySelector('[data-cvc="time"]'),
    volumeWrap: controls.querySelector('[data-cvc="vol-wrap"]'),
    muteBtn: controls.querySelector('[data-cvc="mute"]'),
    volume: controls.querySelector('[data-cvc="volume"]'),
    saveBtn: controls.querySelector('[data-cvc="save"]'),
    shareBtn: controls.querySelector('[data-cvc="share"]'),
    setPlayIcon: (isPlaying) => {
      const on = !!isPlaying;
      const btn = api.playBtn;
      if (!btn) return;
      btn.innerHTML = _svgControlIcon(on ? "pause" : "play");
      btn.setAttribute("aria-label", on ? "Pause" : "Play");
      btn.title = on ? "Pause" : "Play";
    },
    setMuteIcon: (isMuted) => {
      const muted = !!isMuted;
      const btn = api.muteBtn;
      if (!btn) return;
      btn.innerHTML = _svgControlIcon(muted ? "mute" : "volume");
      btn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
      btn.title = muted ? "Unmute" : "Mute";
    },
    setSaveIcon: (saved) => {
      const active = !!saved;
      const btn = api.saveBtn;
      if (!btn) return;
      btn.innerHTML = _svgBookmark(active ? "bookmark-check" : "bookmark");
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-label", active ? "Saved" : "Save");
      btn.title = active ? "Saved" : "Save";
    }
  };
  // Volume slider UX: small open delay + delayed close after hover exit.
  if (api.volumeWrap) {
    let openTimer = null;
    let closeTimer = null;
    const openWithDelay = () => {
      if (closeTimer) clearTimeout(closeTimer);
      if (openTimer) clearTimeout(openTimer);
      openTimer = setTimeout(() => {
        api.volumeWrap.classList.add("vol-open");
      }, 110);
    };
    const closeWithDelay = () => {
      if (openTimer) clearTimeout(openTimer);
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (api.volumeWrap && !api.volumeWrap.matches(":hover")) {
          api.volumeWrap.classList.remove("vol-open");
        }
      }, 2000);
    };
    api.volumeWrap.addEventListener("mouseenter", openWithDelay);
    api.volumeWrap.addEventListener("focusin", openWithDelay);
    api.volumeWrap.addEventListener("mouseleave", closeWithDelay);
    api.volumeWrap.addEventListener("focusout", () => {
      setTimeout(() => {
        closeWithDelay();
      }, 0);
    });
    // When user finishes drag/touch on slider, start close timer.
    if (api.volume) {
      api.volume.addEventListener("pointerup", closeWithDelay);
      api.volume.addEventListener("touchend", closeWithDelay, { passive: true });
      api.volume.addEventListener("mouseup", closeWithDelay);
    }
  }
  api.setPlayIcon(false);
  api.setMuteIcon(false);
  return api;
}

function wireInlineSaveShareControls(controls, video) {
  if (!controls || !video) return;
  controls.setSaveIcon(isSaved(video.id));
  controls.saveBtn && controls.saveBtn.addEventListener("click", () => {
    toggleSave(video.id);
    const active = isSaved(video.id);
    controls.setSaveIcon(active);
    if (t.modalSaveBtn) setModalSaveButtonUI();
  });
  controls.shareBtn && controls.shareBtn.addEventListener("click", async () => {
    const url = video.youtubeLink || video.videoUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title || "Video", url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        c("Link copied to clipboard!", "success");
      } else {
        window.open(url, "_blank");
      }
    } catch (_) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          c("Link copied to clipboard!", "success");
        }
      } catch (_) { }
    }
  });
  currentModalInlineControls = controls;
}

function createCustomPauseOverlay(stage, onResume) {
  const overlay = document.createElement("div");
  overlay.className = "custom-player-overlay";
  overlay.innerHTML = `<button class="custom-overlay-play" type="button">Resume</button>`;
  const btn = overlay.querySelector(".custom-overlay-play");
  if (btn) {
    btn.addEventListener("click", () => onResume && onResume());
  }
  stage.appendChild(overlay);
  return {
    show: () => overlay.classList.add("show"),
    hide: () => overlay.classList.remove("show")
  };
}

function addYouTubeChromeMasks(stage) {
  const topMask = document.createElement("div");
  topMask.className = "yt-chrome-mask yt-mask-top";
  const bottomMask = document.createElement("div");
  bottomMask.className = "yt-chrome-mask yt-mask-bottom";
  stage.appendChild(topMask);
  stage.appendChild(bottomMask);
  return { topMask, bottomMask };
}

function openVideoModal(video) {
  currentModalVideoId = video.id;
  if (!t.videoModal || !t.videoPlayerContainer) return;
  clearModalPlayerResources();
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
  if (isYouTubeUrl(video.youtubeLink)) {
    const vid = extractYouTubeVideoId(video.youtubeLink);
    if (vid) {
      const stage = document.createElement("div");
      stage.className = "custom-player-stage";
      playerWrap.appendChild(stage);
      const frameHost = document.createElement("div");
      frameHost.id = `yt-player-${Date.now()}`;
      frameHost.className = "custom-youtube-host";
      stage.appendChild(frameHost);
      const masks = addYouTubeChromeMasks(stage);
      const controls = createCustomPlayerControls(playerWrap);
      wireInlineSaveShareControls(controls, video);
      const pauseOverlay = createCustomPauseOverlay(stage, () => {
        try { currentModalYTPlayer?.playVideo?.(); } catch (_) { }
      });
      let lastYTVolumeBeforeMute = 100;

      ensureYouTubeIframeAPI().then((YT) => {
        if (!YT || !YT.Player) {
          playerWrap.textContent = "Video cannot be played.";
          return;
        }

        const mountYouTubePlayer = ({ startSeconds = 0, autoplay = true } = {}) =>
          new Promise((resolve) => {
            if (currentModalYTPlayer && typeof currentModalYTPlayer.destroy === "function") {
              try { currentModalYTPlayer.destroy(); } catch (_) { }
            }
            currentModalYTPlayer = new YT.Player(frameHost.id, {
              videoId: vid,
              playerVars: {
                autoplay: autoplay ? 1 : 0,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3,
                fs: 0,
                disablekb: 1,
                playsinline: 1,
                origin: window.location.origin,
                start: Math.max(0, Math.floor(startSeconds))
              },
              events: {
                onReady: () => {
                  const duration = currentModalYTPlayer.getDuration?.() || 0;
                  controls.time.textContent = `${formatPlayerTime(0)} / ${formatPlayerTime(duration)}`;
                  const initialVol = Math.max(0, Math.min(100, Number(currentModalYTPlayer.getVolume?.() ?? 100)));
                  controls.volume.value = String(initialVol);
                  if (initialVol > 0) lastYTVolumeBeforeMute = initialVol;
                  controls.setMuteIcon(currentModalYTPlayer.isMuted?.());
                  try { currentModalYTPlayer.unMute?.(); } catch (_) { }
                  if (autoplay) {
                    try { currentModalYTPlayer.playVideo?.(); } catch (_) { }
                  } else {
                    try { currentModalYTPlayer.pauseVideo?.(); } catch (_) { }
                  }
                  resolve();
                },
                onStateChange: () => {
                  const state = currentModalYTPlayer.getPlayerState?.();
                  if (state === YT.PlayerState.ENDED) {
                    try { currentModalYTPlayer.seekTo(0, true); } catch (_) { }
                    try { currentModalYTPlayer.pauseVideo(); } catch (_) { }
                  }
                  if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) pauseOverlay.hide();
                  if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED || state === YT.PlayerState.CUED) pauseOverlay.show();
                  controls.setPlayIcon(state === YT.PlayerState.PLAYING);
                }
              }
            });
          });

        const togglePlayPause = () => {
          if (!currentModalYTPlayer) return;
          const state = currentModalYTPlayer.getPlayerState?.();
          if (state === YT.PlayerState.PLAYING) {
            currentModalYTPlayer.pauseVideo();
            pauseOverlay.show();
          } else {
            currentModalYTPlayer.playVideo();
            pauseOverlay.hide();
          }
        };

        controls.playBtn.addEventListener("click", () => {
          togglePlayPause();
        });
        masks?.topMask && masks.topMask.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          togglePlayPause();
        });

        controls.seek.addEventListener("input", () => {
          if (!currentModalYTPlayer) return;
          const duration = currentModalYTPlayer.getDuration?.() || 0;
          const target = (Number(controls.seek.value) / 1000) * duration;
          currentModalYTPlayer.seekTo(target, true);
        });

        controls.muteBtn.addEventListener("click", () => {
          if (!currentModalYTPlayer) return;
          if (currentModalYTPlayer.isMuted?.()) {
            const restore = Math.max(1, Math.min(100, Number(lastYTVolumeBeforeMute) || 50));
            currentModalYTPlayer.unMute();
            currentModalYTPlayer.setVolume(restore);
            controls.volume.value = String(restore);
          } else {
            const cur = Math.max(0, Math.min(100, Number(currentModalYTPlayer.getVolume?.() ?? controls.volume.value ?? 100)));
            if (cur > 0) lastYTVolumeBeforeMute = cur;
            currentModalYTPlayer.mute();
            currentModalYTPlayer.setVolume(0);
            controls.volume.value = "0";
          }
          controls.setMuteIcon(currentModalYTPlayer.isMuted?.());
        });

        controls.volume.addEventListener("input", () => {
          if (!currentModalYTPlayer) return;
          const raw = Number(controls.volume.value);
          const vol = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 100));
          currentModalYTPlayer.setVolume(vol);
          if (vol > 0) {
            lastYTVolumeBeforeMute = vol;
            if (currentModalYTPlayer.isMuted?.()) currentModalYTPlayer.unMute();
          }
          if (vol === 0 && !currentModalYTPlayer.isMuted?.()) currentModalYTPlayer.mute();
          controls.setMuteIcon(currentModalYTPlayer.isMuted?.());
        });

        mountYouTubePlayer({
          startSeconds: 0,
          autoplay: true
        });

        currentModalPlayerTick = setInterval(() => {
          if (!currentModalYTPlayer || !currentModalYTPlayer.getCurrentTime) return;
          const current = currentModalYTPlayer.getCurrentTime() || 0;
          const duration = currentModalYTPlayer.getDuration?.() || 0;
          if (duration > 0) {
            controls.seek.value = String(Math.min(1000, Math.round((current / duration) * 1000)));
          }
          controls.time.textContent = `${formatPlayerTime(current)} / ${formatPlayerTime(duration)}`;
          controls.setMuteIcon(currentModalYTPlayer.isMuted?.());
          const effectiveVol = currentModalYTPlayer.isMuted?.() ? 0 : Math.max(0, Math.min(100, Number(currentModalYTPlayer.getVolume?.() ?? 0)));
          controls.volume.value = String(effectiveVol);
        }, 250);
      }).catch(() => {
        playerWrap.textContent = "Video cannot be played.";
      });
    } else {
      playerWrap.textContent = "Video cannot be played.";
    }
  } else if (video.videoUrl) {
    const stage = document.createElement("div");
    stage.className = "custom-player-stage";
    playerWrap.appendChild(stage);
    const vid = document.createElement("video");
    vid.src = video.videoUrl;
    vid.controls = false;
    vid.autoplay = true;
    vid.playsInline = true;
    vid.style.width = '100%';
    vid.style.height = 'auto';
    vid.style.aspectRatio = '16 / 9';
    vid.style.display = 'block';
    vid.style.margin = '0 auto';
    stage.appendChild(vid);
    currentModalHtml5Player = vid;

    const controls = createCustomPlayerControls(playerWrap);
    wireInlineSaveShareControls(controls, video);
    const pauseOverlay = createCustomPauseOverlay(stage, async () => {
      try { await currentModalHtml5Player?.play?.(); } catch (_) { }
    });
    let lastHtml5VolumeBeforeMute = Math.max(1, Math.round((vid.volume || 1) * 100));
    controls.playBtn.addEventListener("click", async () => {
      if (!currentModalHtml5Player) return;
      if (currentModalHtml5Player.paused) {
        try { await currentModalHtml5Player.play(); } catch (_) { }
        pauseOverlay.hide();
      } else {
        currentModalHtml5Player.pause();
        pauseOverlay.show();
      }
      controls.setPlayIcon(!currentModalHtml5Player.paused);
    });

    controls.seek.addEventListener("input", () => {
      if (!currentModalHtml5Player || !Number.isFinite(currentModalHtml5Player.duration)) return;
      currentModalHtml5Player.currentTime = (Number(controls.seek.value) / 1000) * currentModalHtml5Player.duration;
    });

    controls.muteBtn.addEventListener("click", () => {
      if (!currentModalHtml5Player) return;
      if (currentModalHtml5Player.muted) {
        currentModalHtml5Player.muted = false;
        const restore = Math.max(1, Math.min(100, Number(lastHtml5VolumeBeforeMute) || 50));
        currentModalHtml5Player.volume = restore / 100;
        controls.volume.value = String(restore);
      } else {
        const cur = Math.max(0, Math.min(100, Math.round((currentModalHtml5Player.volume || 0) * 100)));
        if (cur > 0) lastHtml5VolumeBeforeMute = cur;
        currentModalHtml5Player.muted = true;
        controls.volume.value = "0";
      }
      controls.setMuteIcon(currentModalHtml5Player.muted);
    });

    controls.volume.addEventListener("input", () => {
      if (!currentModalHtml5Player) return;
      const raw = Number(controls.volume.value);
      const vol = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 100));
      currentModalHtml5Player.volume = vol / 100;
      if (vol > 0) {
        lastHtml5VolumeBeforeMute = vol;
        currentModalHtml5Player.muted = false;
      } else {
        currentModalHtml5Player.muted = true;
      }
      controls.setMuteIcon(currentModalHtml5Player.muted);
    });

    vid.addEventListener("loadedmetadata", () => {
      controls.time.textContent = `${formatPlayerTime(0)} / ${formatPlayerTime(vid.duration || 0)}`;
    });
    Promise.resolve()
      .then(() => vid.play())
      .catch(() => { });
    vid.addEventListener("timeupdate", () => {
      const current = vid.currentTime || 0;
      const duration = vid.duration || 0;
      if (duration > 0) controls.seek.value = String(Math.min(1000, Math.round((current / duration) * 1000)));
      controls.time.textContent = `${formatPlayerTime(current)} / ${formatPlayerTime(duration)}`;
    });
    vid.addEventListener("play", () => { controls.setPlayIcon(true); pauseOverlay.hide(); });
    vid.addEventListener("pause", () => { controls.setPlayIcon(false); pauseOverlay.show(); });
    vid.addEventListener("volumechange", () => {
      controls.setMuteIcon(vid.muted);
      controls.volume.value = String(vid.muted ? 0 : Math.round((vid.volume || 0) * 100));
    });
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
  clearModalPlayerResources();
  currentModalInlineControls = null;
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
    if (currentModalInlineControls && typeof currentModalInlineControls.setSaveIcon === "function") {
      currentModalInlineControls.setSaveIcon(active);
    }
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

/* ============================================
   EDIT MODAL FUNCTIONS
   ============================================ */

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editModalClose = document.querySelector('.edit-modal-close');
const editSaveBtn = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const editDeleteBtn = document.getElementById('edit-delete-btn');
const editModalBackdrop = document.querySelector('.edit-modal-backdrop');

let currentEditVideo = null;

// helper functions for edit modal
function closeEditModal() {
  if (!editModal) return;
  editModal.classList.add('hidden');
  editModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('edit-modal-open');
  releaseFocusTrap(editModal);
  currentEditVideo = null;
}

async function saveEditForm() {
  if (!currentEditVideo || !editForm) return;

  try {
    const formData = new FormData(editForm);
    const updates = {};
    for (let [key, value] of formData.entries()) {
      updates[key] = value;
    }

    editSaveBtn.disabled = true;
    editSaveBtn.textContent = 'Saving...';

    await DB.updateVideoInDB(db, currentEditVideo.id, updates);
    currentEditVideo = { ...currentEditVideo, ...updates };
    const idx = a.videos.findIndex(v => v.id === currentEditVideo.id);
    if (idx >= 0) a.videos[idx] = { ...a.videos[idx], ...updates };

    await loadVideosFromDB();
    // Refresh all icons after update
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
    c('Video updated successfully!', 'success');
    closeEditModal();
  } catch (err) {
    console.error('Error saving video:', err);
    c('Failed to save changes: ' + err.message, 'error');
  } finally {
    editSaveBtn.disabled = false;
    editSaveBtn.textContent = 'Save';
  }
}

async function deleteEditVideo() {
  if (!currentEditVideo || !editModal) return;
  if (!confirm(`Are you sure you want to delete "${currentEditVideo.title}"? This action cannot be undone.`)) return;
  try {
    editDeleteBtn.disabled = true;
    editDeleteBtn.textContent = 'Deleting...';
    await DB.deleteVideoFromDB(db, currentEditVideo.id);
    a.videos = a.videos.filter(v => v.id !== currentEditVideo.id);
    buildPlaylistsFromVideos();
    renderPlaylists();
    updateStatsCounts();
    updateSavedCount();
    g();
    // Refresh all icons after deletion
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
    // Scroll to top to show updated grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
    c('Video deleted successfully!', 'success');
    closeEditModal();
  } catch (err) {
    console.error('Error deleting video:', err);
    c('Failed to delete video: ' + err.message, 'error');
  } finally {
    editDeleteBtn.disabled = false;
    editDeleteBtn.textContent = 'Delete';
  }
}

// attach event listeners once
editModalClose && editModalClose.addEventListener('click', closeEditModal);
editModalBackdrop && editModalBackdrop.addEventListener('click', closeEditModal);
editCancelBtn && editCancelBtn.addEventListener('click', closeEditModal);
editSaveBtn && editSaveBtn.addEventListener('click', saveEditForm);
editDeleteBtn && editDeleteBtn.addEventListener('click', deleteEditVideo);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editModal && !editModal.classList.contains('hidden')) closeEditModal();
});

function openEditModal(video) {
  if (!video || !editModal) return;
  currentEditVideo = video;

  // Populate form with video data
  editForm.elements['title'].value = video.title || '';
  editForm.elements['description'].value = video.description || '';
  editForm.elements['thumbnail'].value = video.thumbnail || '';
  editForm.elements['youtubeLink'].value = video.youtubeLink || '';

  document.body.classList.add('edit-modal-open');
  editModal.classList.remove('hidden');
  editModal.setAttribute('aria-hidden', 'false');
  trapFocusInModal(editModal);
}

// small util: escape html
function escapeHtml(s) {
  return String(s).replace(/[&<>"']+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
  if (t.clearFiltersBtn && t.activeFiltersSummary) {
    a.activeFilters.length > 0
      ? (t.clearFiltersBtn.classList.remove("hidden"),
        t.activeFiltersSummary.classList.remove("hidden"),
        (t.activeFiltersSummary.textContent = `Filtering by: ${a.activeFilters.join(
          ", "
        )}`))
      : (t.clearFiltersBtn.classList.add("hidden"),
        t.activeFiltersSummary.classList.add("hidden"));
  }

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
  performMobileSearch();
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
  p();
}
function ce(e) {
  const i = document.querySelector(".suggestions-list");
  if (!i || !t.suggestionsDropdown || !t.searchInput) return;
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
  if (t.searchBtn) {
    t.searchBtn.innerHTML = a.isSearching
      ? '<i data-lucide="loader-2" class="animate-spin"></i>'
      : '<i data-lucide="search"></i>';
  }
  if (t.aiAssistBtn) {
    if (a.isSearching) {
      t.aiAssistBtn.innerHTML = '<i data-lucide="sparkles"></i> AI Thinking...';
      t.aiAssistBtn.disabled = !0;
    } else {
      t.aiAssistBtn.innerHTML = '<i data-lucide="sparkles"></i> AI Assist';
      t.aiAssistBtn.disabled = !1;
    }
  }
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
      <p>Try adjusting your search terms</p>
      <div class="no-results-actions">
        <button class="btn btn-outline" id="no-results-clear-search-btn">
          <i data-lucide="x"></i>
          Clear Search
        </button>
      </div>
    </div>
  `;
  if (t.loadMoreContainer) t.loadMoreContainer.classList.add("hidden");
  lucide.createIcons();
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
  if (t.searchInput && t.searchResultsDropdown) {
    !t.searchInput.contains(e.target) &&
      !t.searchResultsDropdown.contains(e.target) &&
      m();
  }
  if (t.searchInput && t.suggestionsDropdown) {
    !t.searchInput.contains(e.target) &&
      !t.suggestionsDropdown.contains(e.target) &&
      t.suggestionsDropdown.classList.add("hidden");
  }
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
    if (window.chatbotUI && db) {
      window.chatbotUI.setDatabase(db);
    }

    console.log('SachiDev chatbot initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize chatbot:', error);
  }
}

// Initialize chatbot after main app initialization
N();
initializeChatbot();
