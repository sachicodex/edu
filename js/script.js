
import { DB, UPLOAD, SAVED, SEARCH, TOAST } from "../services/index.js";

const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "",
  authDomain: "",
  projectId: "",
};

const db = DB.initDB(firebaseConfig);
window.firestoreDb = db;

const COMPLETED_KEY = "eduflow_completed";
const HISTORY_KEY = "eduflow_history";

const state = {
  route: "overview",
  videos: [],
  searchQuery: "",
  activeCategory: "all",
  activeDifficulty: "all",
  sortBy: "newest",
  viewMode: "grid",
  selectedPlaylist: null,
  activeVideoId: null,
  editingVideoId: null,
  editingPlaylistName: null,
  completedIds: loadSet(COMPLETED_KEY),
  watchHistory: loadHistory(),
  savedIds: new Set(),
};

const SORT_LABELS = {
  newest: "Newest",
  oldest: "Oldest",
  "most-viewed": "Most Viewed",
  "duration-long": "Duration: Longest",
  "duration-short": "Duration: Shortest",
  alphabetical: "A to Z",
};

let modalPlayer = null;
let modalPlayerKind = "";
let modalPlayerTick = null;
let ytApiReadyPromise = null;
let modalVolumeHideTimer = null;

const dom = {
  loadingScreen: document.getElementById("loading-screen"),
  sidebar: document.getElementById("sidebar"),
  mobileOverlay: document.getElementById("mobile-overlay"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  navLinks: Array.from(document.querySelectorAll(".nav-link[data-route]")),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  sortSelect: document.getElementById("sort-select"),
  sortTrigger: document.getElementById("sort-trigger"),
  sortTriggerLabel: document.getElementById("sort-trigger-label"),
  sortMenu: document.getElementById("sort-menu"),
  sortOptions: Array.from(document.querySelectorAll(".sort-option[data-sort]")),
  viewToggle: document.getElementById("view-toggle"),
  uploadBtn: document.getElementById("upload-btn"),
  routeTitle: document.getElementById("route-title"),
  routeSubtitle: document.getElementById("route-subtitle"),
  statVideos: document.getElementById("stat-videos"),
  statHours: document.getElementById("stat-hours"),
  statSaved: document.getElementById("stat-saved"),
  statCompletion: document.getElementById("stat-completion"),
  statVideosLabel: document.querySelector(".hero-kpis article:nth-child(1) span"),
  statHoursLabel: document.querySelector(".hero-kpis article:nth-child(2) span"),
  statSavedLabel: document.querySelector(".hero-kpis article:nth-child(3) span"),
  statCompletionLabel: document.querySelector(".hero-kpis article:nth-child(4) span"),
  savedCount: document.getElementById("saved-count"),
  categoryFilters: document.getElementById("category-filters"),
  difficultyFilters: document.getElementById("difficulty-filters"),
  filtersWrap: document.querySelector(".filters-wrap"),
  contentMeta: document.getElementById("results-text"),
  clearFilters: document.getElementById("clear-filters"),
  contentGrid: document.getElementById("content-grid"),
  playlistDetail: document.getElementById("playlist-detail"),
  playlistTitle: document.getElementById("playlist-title"),
  playlistDescription: document.getElementById("playlist-description"),
  playlistGrid: document.getElementById("playlist-grid"),
  playlistBack: document.getElementById("playlist-back"),
  videoModal: document.getElementById("video-modal"),
  videoIframeWrap: document.getElementById("video-iframe-wrap"),
  videoModalTitle: document.getElementById("video-modal-title"),
  videoModalDesc: document.getElementById("video-modal-desc"),
  videoModalMeta: document.getElementById("video-modal-meta"),
  modalOpenSource: document.getElementById("modal-open-source"),
  modalSave: document.getElementById("modal-save"),
  modalComplete: document.getElementById("modal-complete"),
  modalShare: document.getElementById("modal-share"),
  modalEdit: document.getElementById("modal-edit"),
  editModal: document.getElementById("edit-modal"),
  editModalHeading: document.querySelector("#edit-modal .edit-modal-card h3"),
  editForm: document.getElementById("edit-form"),
  editTitle: document.getElementById("edit-title"),
  editDescription: document.getElementById("edit-description"),
  editCategory: document.getElementById("edit-category"),
  editDifficulty: document.getElementById("edit-difficulty"),
  editThumbnail: document.getElementById("edit-thumbnail"),
  editYoutube: document.getElementById("edit-youtube"),
  editDelete: document.getElementById("edit-delete"),
};

const ROUTE_COPY = {
  overview: {
    title: "Overview",
    subtitle:
      "Prioritize what matters now: high-impact videos, active backlog, and measurable learning momentum.",
  },
  library: {
    title: "Library",
    subtitle:
      "Explore the complete catalog with precise filtering, fast sorting, and structured metadata.",
  },
  playlists: {
    title: "Playlists",
    subtitle:
      "Group lessons by learning path and execute topic-by-topic without losing context.",
  },
  saved: {
    title: "Saved",
    subtitle:
      "Your priority queue. Keep promising content here and process it intentionally.",
  },
  analytics: {
    title: "Analytics",
    subtitle:
      "Track completion, content mix, watch behavior, and operational learning health.",
  },
};

function init() {
  syncSavedState();
  bindEvents();
  syncSortUi();
  renderFilters();
  renderAll();

  loadVideos()
    .then(() => {
      renderAll();
      notify("Workspace synced", "success");
    })
    .catch((error) => {
      console.error("Load error:", error);
      notify("Unable to load cloud videos. You can still use local saved items.", "error");
      renderAll();
    })
    .finally(() => {
      window.setTimeout(() => {
        dom.loadingScreen?.classList.add("hidden");
      }, 500);
    });
}

function bindEvents() {
  dom.sidebarToggle?.addEventListener("click", () => {
    dom.sidebar?.classList.add("open");
    dom.mobileOverlay?.classList.add("open");
  });

  dom.mobileOverlay?.addEventListener("click", closeSidebar);

  dom.navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const route = String(link.dataset.route || "overview");
      setRoute(route);
      closeSidebar();
    });
  });

  let searchTimer = null;
  dom.searchInput?.addEventListener("input", (event) => {
    const value = String(event.target.value || "");
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.searchQuery = value.trim();
      state.selectedPlaylist = null;
      renderAll();
    }, 160);
  });

  dom.searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.searchQuery = String(dom.searchInput?.value || "").trim();
    renderAll();
  });

  dom.sortTrigger?.addEventListener("click", () => {
    const nextOpen = !dom.sortMenu?.classList.contains("open");
    setSortMenuOpen(nextOpen);
  });

  dom.sortOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const nextSort = String(option.dataset.sort || "newest");
      state.sortBy = nextSort in SORT_LABELS ? nextSort : "newest";
      syncSortUi();
      setSortMenuOpen(false);
      renderAll();
    });
  });

  dom.viewToggle?.addEventListener("click", () => {
    state.viewMode = state.viewMode === "grid" ? "list" : "grid";
    updateViewToggleIcon();
    renderAll();
  });

  dom.uploadBtn?.addEventListener("click", () => {
    UPLOAD.createUploadModal({
      db,
      state,
      notify,
      onUploaded: async () => {
        await loadVideos();
        renderAll();
      },
    });
  });

  dom.clearFilters?.addEventListener("click", () => {
    state.searchQuery = "";
    state.activeCategory = "all";
    state.activeDifficulty = "all";
    state.selectedPlaylist = null;

    if (dom.searchInput) {
      dom.searchInput.value = "";
    }
    renderAll();
  });

  dom.categoryFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.activeCategory = String(button.dataset.category || "all");
    state.selectedPlaylist = null;
    renderAll();
  });

  dom.difficultyFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-difficulty]");
    if (!button) return;
    state.activeDifficulty = String(button.dataset.difficulty || "all");
    state.selectedPlaylist = null;
    renderAll();
  });

  dom.contentGrid?.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    void handleCardAction(actionEl);
  });

  dom.playlistGrid?.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    void handleCardAction(actionEl);
  });

  const keyboardActivate = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const tag = String(event.target?.tagName || "").toLowerCase();
    if (tag === "button" || tag === "a" || tag === "input" || tag === "textarea" || tag === "select") {
      return;
    }
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    const action = String(actionEl.dataset.action || "");
    if (action !== "watch" && action !== "open-playlist") return;
    event.preventDefault();
    void handleCardAction(actionEl);
  };
  dom.contentGrid?.addEventListener("keydown", keyboardActivate);
  dom.playlistGrid?.addEventListener("keydown", keyboardActivate);

  dom.playlistBack?.addEventListener("click", () => {
    state.selectedPlaylist = null;
    renderAll();
  });

  document.querySelectorAll("[data-close='video']").forEach((el) => {
    el.addEventListener("click", closeVideoModal);
  });

  document.querySelectorAll("[data-close='edit']").forEach((el) => {
    el.addEventListener("click", closeEditModal);
  });

  dom.modalSave?.addEventListener("click", () => {
    if (!state.activeVideoId) return;
    toggleSave(state.activeVideoId);
    syncModalButtons();
  });

  dom.modalComplete?.addEventListener("click", () => {
    if (!state.activeVideoId) return;
    toggleCompleted(state.activeVideoId);
    syncModalButtons();
  });

  dom.modalOpenSource?.addEventListener("click", () => {
    const video = findVideoById(state.activeVideoId);
    const url = getSourceUrl(video);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      notify("No valid source URL found", "warning");
    }
  });

  dom.modalShare?.addEventListener("click", async () => {
    const video = findVideoById(state.activeVideoId);
    const url = getSourceUrl(video);
    if (!url) return;

    const ok = await copyText(url);
    notify(ok ? "Link copied" : "Unable to copy link", ok ? "success" : "error");
  });

  dom.modalEdit?.addEventListener("click", () => {
    if (!state.activeVideoId) return;
    openEditModal(state.activeVideoId);
  });

  dom.editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveEdit();
  });

  dom.editDelete?.addEventListener("click", async () => {
    if (state.editingPlaylistName) {
      await deletePlaylist(state.editingPlaylistName);
      return;
    }
    if (!state.editingVideoId) return;
    await deleteVideo(state.editingVideoId);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSortMenuOpen(false);
      closeVideoModal();
      closeEditModal();
      closeSidebar();
    }

    if (
      event.key.toLowerCase() === "f" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !isTextInput(document.activeElement) &&
      dom.videoModal &&
      !dom.videoModal.classList.contains("hidden")
    ) {
      event.preventDefault();
      void toggleVideoFullscreen();
      return;
    }

    if (event.key === "/" && !isTextInput(document.activeElement)) {
      event.preventDefault();
      dom.searchInput?.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeSidebar();
    }
  });

  document.addEventListener("click", (event) => {
    if (!dom.sortSelect) return;
    if (dom.sortSelect.contains(event.target)) return;
    setSortMenuOpen(false);
  });
}

function setSortMenuOpen(isOpen) {
  if (!dom.sortMenu || !dom.sortTrigger) return;
  dom.sortMenu.classList.toggle("hidden", !isOpen);
  dom.sortMenu.classList.toggle("open", Boolean(isOpen));
  dom.sortTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function syncSortUi() {
  if (dom.sortTriggerLabel) {
    dom.sortTriggerLabel.textContent = SORT_LABELS[state.sortBy] || SORT_LABELS.newest;
  }

  dom.sortOptions.forEach((option) => {
    const active = option.dataset.sort === state.sortBy;
    option.classList.toggle("active", active);
    option.setAttribute("aria-selected", active ? "true" : "false");
  });
}

async function handleCardAction(actionEl) {
  const action = String(actionEl.dataset.action || "");
  const id = String(actionEl.dataset.id || "");

  if (action === "watch") {
    openVideoModal(id);
    return;
  }

  if (action === "save") {
    toggleSave(id);
    return;
  }

  if (action === "open") {
    const video = findVideoById(id);
    const url = getSourceUrl(video);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  if (action === "share") {
    const video = findVideoById(id);
    const url = getSourceUrl(video);
    if (!url) {
      notify("No valid source URL found", "warning");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title || "Video", url });
      } else {
        const ok = await copyText(url);
        notify(ok ? "Link copied" : "Unable to copy link", ok ? "success" : "error");
      }
    } catch {
      const ok = await copyText(url);
      notify(ok ? "Link copied" : "Unable to copy link", ok ? "success" : "error");
    }
    return;
  }

  if (action === "edit") {
    openEditModal(id);
    return;
  }

  if (action === "toggle-complete") {
    toggleCompleted(id);
    return;
  }

  if (action === "open-playlist") {
    state.selectedPlaylist = decodeURIComponent(String(actionEl.dataset.playlist || ""));
    renderAll();
    return;
  }

  if (action === "share-playlist") {
    const encoded = String(actionEl.dataset.playlist || "");
    const playlistName = decodeURIComponent(encoded);
    const playlist = getPlaylists().find((item) => item.name === playlistName);
    const shareUrl =
      sanitizeUrl(String(actionEl.dataset.shareUrl || "")) ||
      getSourceUrl(playlist?.items?.[0]);

    if (!shareUrl) {
      notify("No playlist link available", "warning");
      return;
    }

    const ok = await copyText(shareUrl);
    notify(ok ? "Playlist link copied" : "Unable to copy link", ok ? "success" : "error");
    return;
  }

  if (action === "edit-playlist") {
    const encoded = String(actionEl.dataset.playlist || "");
    const playlistName = decodeURIComponent(encoded);
    openPlaylistEditModal(playlistName);
    return;
  }
}

async function loadVideos() {
  const rows = await DB.loadVideosFromDB(db);
  state.videos = rows.map(normalizeVideo).filter((video) => video.title);
}

function normalizeVideo(video) {
  const id = String(video.id || "").trim().replace(/\s+/g, "-") || randomId();
  const youtubeLink = video.youtubeLink || video.youtube_link || "";
  const ytId = youtubeId(youtubeLink);
  const fallbackThumb = ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : "";

  const category = normalizeCategory(video.category);
  const difficulty = normalizeDifficulty(video.difficulty, video.aiTags, video.description);

  return {
    id,
    title: String(video.title || "Untitled"),
    description: String(video.description || "No description."),
    duration: String(video.duration || "0:00"),
    views: Number(video.views || 0),
    category,
    difficulty,
    rating: Number(video.rating || deriveRating(video.views, video.duration)),
    thumbnail: normalizeThumbnailUrl(video.thumbnail, fallbackThumb),
    youtubeLink: String(youtubeLink || ""),
    videoUrl: String(video.videoUrl || video.video_url || ""),
    playlistName: String(video.playlistName || video.playlist_name || ""),
    playlistDescription: String(video.playlistDescription || video.playlist_description || ""),
    aiTags: Array.isArray(video.aiTags) ? video.aiTags : [],
    uploadDate: parseDate(video.uploadDate || video.upload_date || video.created_at),
  };
}

function normalizeThumbnailUrl(rawThumb, fallback = "") {
  const source = sanitizeUrl(String(rawThumb || "")) || sanitizeUrl(String(fallback || "")) || "";
  if (!source) return "";

  if (source.includes("i.ytimg.com/vi/") || source.includes("img.youtube.com/vi/")) {
    return source.replace(/\/(hqdefault|sddefault|default|0)\.jpg(\?.*)?$/i, "/mqdefault.jpg");
  }

  return source;
}

function renderAll() {
  renderRouteHeader();
  updateFilterVisibility();
  renderFilters();
  updateMetrics();
  updateViewToggleIcon();

  if (state.route === "analytics") {
    renderAnalytics();
    dom.playlistDetail?.classList.add("hidden");
  } else if (state.route === "playlists") {
    renderPlaylistsRoute();
  } else {
    renderVideoRoute();
    dom.playlistDetail?.classList.add("hidden");
  }

  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
}

function updateFilterVisibility() {
  const hideFilters = state.route === "playlists";
  dom.filtersWrap?.classList.toggle("hidden", hideFilters);
  dom.clearFilters?.classList.toggle("hidden", hideFilters);
}

function setRoute(route) {
  state.route = route in ROUTE_COPY ? route : "overview";
  state.selectedPlaylist = null;

  dom.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.route === state.route);
  });

  renderAll();
}

function renderRouteHeader() {
  const copy = ROUTE_COPY[state.route] || ROUTE_COPY.overview;
  if (dom.routeTitle) dom.routeTitle.textContent = copy.title;
  if (dom.routeSubtitle) dom.routeSubtitle.textContent = copy.subtitle;
}

function renderFilters() {
  const categories = ["all", ...uniqueValues(state.videos.map((v) => v.category))];
  const difficulties = ["all", ...uniqueValues(state.videos.map((v) => v.difficulty))];

  if (dom.categoryFilters) {
    dom.categoryFilters.innerHTML = categories
      .map((value) => `<button class="chip ${state.activeCategory === value ? "active" : ""}" data-category="${escapeAttr(value)}">${escapeHtml(capLabel(value))}</button>`)
      .join("");
  }

  if (dom.difficultyFilters) {
    dom.difficultyFilters.innerHTML = difficulties
      .map((value) => `<button class="chip ${state.activeDifficulty === value ? "active" : ""}" data-difficulty="${escapeAttr(value)}">${escapeHtml(capLabel(value))}</button>`)
      .join("");
  }
}

function getBaseFilteredVideos() {
  const activeFilters = state.activeCategory === "all" ? [] : [state.activeCategory];

  let filtered = SEARCH.filterVideos({ videos: state.videos, activeFilters }, state.searchQuery);

  if (state.activeDifficulty !== "all") {
    const selected = state.activeDifficulty.toLowerCase();
    filtered = filtered.filter((video) => String(video.difficulty || "").toLowerCase() === selected);
  }

  return SEARCH.sortVideos(filtered, state.sortBy);
}

function getRouteVideos() {
  const filtered = getBaseFilteredVideos();

  if (state.route === "saved") {
    return filtered.filter((video) => state.savedIds.has(String(video.id)));
  }

  if (state.route === "overview") {
    const ranked = filtered
      .map((video) => ({ video, score: overviewScore(video) }))
      .sort((a, b) => b.score - a.score)
      .map((row) => row.video);
    return ranked.slice(0, 9);
  }

  return filtered;
}

function renderVideoRoute() {
  const videos = getRouteVideos();
  const visibleVideos = state.route === "overview" ? videos.slice(0, 9) : videos;
  dom.playlistDetail?.classList.add("hidden");
  dom.contentGrid?.classList.remove("hidden");

  if (dom.contentGrid) {
    dom.contentGrid.classList.toggle("list-view", state.viewMode === "list");
  }

  if (!visibleVideos.length) {
    if (dom.contentGrid) {
      dom.contentGrid.innerHTML = emptyCard(
        state.route === "saved"
          ? "No saved videos yet. Save videos from library or overview to build your queue."
          : "No videos match the current search and filters."
      );
    }
  } else if (dom.contentGrid) {
    dom.contentGrid.innerHTML = visibleVideos.map((video) => videoCard(video)).join("");
  }

  const noun = visibleVideos.length === 1 ? "video" : "videos";
  if (dom.contentMeta) dom.contentMeta.textContent = `${visibleVideos.length} ${noun} shown`;
}

function renderPlaylistsRoute() {
  const playlists = getPlaylists();
  const hasDetail = Boolean(state.selectedPlaylist);

  if (!hasDetail) {
    dom.playlistDetail?.classList.add("hidden");
    dom.contentGrid?.classList.remove("hidden");
    dom.contentGrid?.classList.toggle("list-view", state.viewMode === "list");

    if (dom.contentGrid) {
      dom.contentGrid.innerHTML = playlists.length
        ? playlists.map((playlist) => playlistCard(playlist)).join("")
        : emptyCard("No playlists available. Upload a YouTube playlist to populate this area.");
    }

    if (dom.contentMeta) {
      dom.contentMeta.textContent = `${playlists.length} playlist${playlists.length === 1 ? "" : "s"}`;
    }
    return;
  }

  const selected = playlists.find((playlist) => playlist.name === state.selectedPlaylist);
  if (!selected) {
    state.selectedPlaylist = null;
    renderPlaylistsRoute();
    return;
  }

  dom.contentGrid?.classList.add("hidden");
  dom.playlistDetail?.classList.remove("hidden");
  if (dom.playlistTitle) dom.playlistTitle.textContent = selected.name;
  if (dom.playlistDescription) {
    dom.playlistDescription.textContent = selected.description || "Curated learning path";
  }
  dom.playlistGrid?.classList.toggle("list-view", state.viewMode === "list");
  if (dom.playlistGrid) {
    dom.playlistGrid.innerHTML = selected.items.map((video) => videoCard(video)).join("");
  }
  if (dom.contentMeta) {
    dom.contentMeta.textContent = `${selected.items.length} video${selected.items.length === 1 ? "" : "s"} in playlist`;
  }
}

function renderAnalytics() {
  const filtered = getBaseFilteredVideos();
  const total = filtered.length;
  const completedCount = filtered.filter((video) => state.completedIds.has(String(video.id))).length;
  const completionRate = total ? Math.round((completedCount / total) * 100) : 0;
  const totalViews = filtered.reduce((sum, video) => sum + (Number(video.views) || 0), 0);
  const avgMinutes = total
    ? Math.round(filtered.reduce((sum, video) => sum + durationToSeconds(video.duration), 0) / total / 60)
    : 0;

  const categoryCounts = Object.entries(
    filtered.reduce((map, video) => {
      const key = video.category || "General";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const historyRows = state.watchHistory.slice(0, 5).map((row) => {
    const video = findVideoById(row.id);
    return {
      title: video?.title || "Removed video",
      watchedAt: row.at,
    };
  });

  const maxCategoryCount = Math.max(1, ...categoryCounts.map((entry) => entry[1]));

  dom.contentGrid?.classList.remove("list-view");
  dom.contentGrid?.classList.remove("hidden");

  if (dom.contentGrid) {
    dom.contentGrid.innerHTML = `
      <article class="analytics-card">
        <h3>Completion Quality</h3>
        <p>${completedCount} of ${total} filtered videos completed</p>
        <div class="analytics-line"><span style="width: ${completionRate}%"></span></div>
        <strong>${completionRate}% completion</strong>
      </article>

      <article class="analytics-card">
        <h3>Audience Signal</h3>
        <p>Total observed views across filtered set</p>
        <strong>${formatCompact(totalViews)} views</strong>
        <p>Average duration ${avgMinutes} min</p>
      </article>

      <article class="analytics-card">
        <h3>Category Distribution</h3>
        ${categoryCounts.length
          ? categoryCounts
              .map(
                ([name, count]) => `
                    <p>${escapeHtml(name)} (${count})</p>
                    <div class="analytics-line"><span style="width:${Math.round((count / maxCategoryCount) * 100)}%"></span></div>
                  `
              )
              .join("")
          : "<p>No category data yet.</p>"}
      </article>

      <article class="analytics-card">
        <h3>Recent Watch History</h3>
        ${historyRows.length
          ? historyRows
              .map((item) => `<p>${escapeHtml(item.title)} <br /><small>${new Date(item.watchedAt).toLocaleString()}</small></p>`)
              .join("")
          : "<p>No watch events yet.</p>"}
      </article>
    `;
  }

  if (dom.contentMeta) {
    dom.contentMeta.textContent = `Analytics built from ${filtered.length} filtered videos`;
  }
  dom.playlistDetail?.classList.add("hidden");
}

function videoCard(video) {
  const id = escapeAttr(String(video.id));
  const thumb = sanitizeUrl(video.thumbnail);
  const completed = state.completedIds.has(String(video.id));
  const saved = state.savedIds.has(String(video.id));

  return `
    <article class="video-card interactive-card" data-action="watch" data-id="${id}" tabindex="0" role="button" aria-label="Watch ${escapeAttr(video.title)}">
      <div class="card-thumb">
        <img src="${thumb || "https://placehold.co/1280x720/10283a/e7f0f6?text=EduFlow"}" alt="${escapeAttr(video.title)} thumbnail" loading="lazy" />
        <span class="card-duration">${escapeHtml(video.duration || "0:00")}</span>
        ${completed ? '<span class="card-completed">Completed</span>' : ""}
        <div class="card-overlay">
          <button class="card-play-btn" data-action="watch" data-id="${id}" aria-label="Play ${escapeAttr(video.title)}">
            <i data-lucide="play"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(video.title)}</h3>
        <p class="card-desc">${escapeHtml(trimText(video.description, 130))}</p>
        <div class="meta-row">
          <span class="badge">${escapeHtml(video.category)}</span>
          <span class="badge">${escapeHtml(video.difficulty)}</span>
          <span class="badge">${formatCompact(video.views)} views</span>
        </div>
        <div class="card-actions compact">
          <button class="card-action-icon ${saved ? "bookmarked" : ""}" data-action="save" data-id="${id}" title="${saved ? "Saved" : "Save"}" aria-label="${saved ? "Saved" : "Save"}">
            <i data-lucide="bookmark"></i>
          </button>
          <button class="card-action-icon" data-action="share" data-id="${id}" title="Share" aria-label="Share">
            <i data-lucide="share-2"></i>
          </button>
          <button class="card-action-icon" data-action="edit" data-id="${id}" title="Edit" aria-label="Edit">
            <i data-lucide="square-pen"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

function playlistCard(playlist) {
  const encodedPlaylist = encodeURIComponent(playlist.name);
  const firstItem = playlist.items[0];
  const thumbnail = sanitizeUrl(firstItem?.thumbnail);
  const firstSource = getSourceUrl(firstItem);
  const totalViews = playlist.items.reduce((sum, item) => sum + (Number(item.views) || 0), 0);

  return `
    <article class="playlist-card video-card interactive-card" data-action="open-playlist" data-playlist="${encodedPlaylist}" tabindex="0" role="button" aria-label="Open playlist ${escapeAttr(playlist.name)}">
      <div class="card-thumb">
        <img src="${thumbnail || "https://placehold.co/1280x720/10283a/e7f0f6?text=Playlist"}" alt="${escapeAttr(playlist.name)} thumbnail" loading="lazy" />
        <span class="card-duration">${playlist.items.length} videos</span>
        <div class="card-overlay">
          <button class="card-play-btn" data-action="open-playlist" data-playlist="${encodedPlaylist}" aria-label="Open playlist ${escapeAttr(playlist.name)}">
            <i data-lucide="play"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(playlist.name)}</h3>
        <p class="card-desc">${escapeHtml(trimText(playlist.description || "Curated learning path", 145))}</p>
        <div class="meta-row">
          <span class="badge">${playlist.items.length} videos</span>
          <span class="badge">${totalPlaylistHours(playlist.items)}h total</span>
          <span class="badge">${formatCompact(totalViews)} views</span>
        </div>
        <div class="card-actions compact">
          <button class="card-action-icon" data-action="open-playlist" data-playlist="${encodedPlaylist}" title="Open playlist" aria-label="Open playlist">
            <i data-lucide="list-video"></i>
          </button>
          <button class="card-action-icon" data-action="share-playlist" data-playlist="${encodedPlaylist}" data-share-url="${escapeAttr(firstSource)}" title="Share playlist" aria-label="Share playlist">
            <i data-lucide="share-2"></i>
          </button>
          <button class="card-action-icon" data-action="edit-playlist" data-playlist="${encodedPlaylist}" title="Edit playlist" aria-label="Edit playlist">
            <i data-lucide="square-pen"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

function emptyCard(message) {
  return `<article class="empty-card"><h3>No Data</h3><p>${escapeHtml(message)}</p></article>`;
}

function getPlaylists() {
  const byName = new Map();

  state.videos.forEach((video) => {
    const rawName = String(video.playlistName || "").trim();
    if (!rawName) return;

    if (!byName.has(rawName)) {
      byName.set(rawName, {
        name: rawName,
        description: String(video.playlistDescription || "").trim(),
        items: [],
      });
    }

    byName.get(rawName).items.push(video);
  });

  return Array.from(byName.values()).sort((a, b) => b.items.length - a.items.length);
}

function updateMetrics() {
  const setCard = (labelEl, valueEl, label, value) => {
    if (labelEl) labelEl.textContent = label;
    if (valueEl) valueEl.textContent = value;
  };

  if (state.route === "playlists") {
    const playlists = getPlaylists();
    const selectedPlaylist = state.selectedPlaylist
      ? playlists.find((item) => item.name === state.selectedPlaylist) || null
      : null;

    const scopedVideos = selectedPlaylist
      ? selectedPlaylist.items
      : playlists.flatMap((playlist) => playlist.items);

    const scopedHours = scopedVideos.reduce((sum, video) => sum + durationToSeconds(video.duration), 0) / 3600;
    const scopedCompletion = scopedVideos.length
      ? Math.round(
          (scopedVideos.filter((video) => state.completedIds.has(String(video.id))).length /
            scopedVideos.length) *
            100
        )
      : 0;

    if (selectedPlaylist) {
      const savedInPlaylist = scopedVideos.filter((video) => state.savedIds.has(String(video.id))).length;
      setCard(dom.statVideosLabel, dom.statVideos, "Playlist Videos", String(scopedVideos.length));
      setCard(dom.statHoursLabel, dom.statHours, "Playlist Hours", `${scopedHours.toFixed(1)}h`);
      setCard(dom.statSavedLabel, dom.statSaved, "Saved in Playlist", String(savedInPlaylist));
      setCard(dom.statCompletionLabel, dom.statCompletion, "Completion", `${scopedCompletion}%`);
    } else {
      setCard(dom.statVideosLabel, dom.statVideos, "Total Playlists", String(playlists.length));
      setCard(dom.statHoursLabel, dom.statHours, "Playlist Videos", String(scopedVideos.length));
      setCard(dom.statSavedLabel, dom.statSaved, "Playlist Hours", `${scopedHours.toFixed(1)}h`);
      setCard(dom.statCompletionLabel, dom.statCompletion, "Completion", `${scopedCompletion}%`);
    }
  } else if (state.route === "saved") {
    const savedVideos = state.videos.filter((video) => state.savedIds.has(String(video.id)));
    const savedHours = savedVideos.reduce((sum, video) => sum + durationToSeconds(video.duration), 0) / 3600;
    const completedSaved = savedVideos.filter((video) => state.completedIds.has(String(video.id))).length;
    const savedCompletion = savedVideos.length ? Math.round((completedSaved / savedVideos.length) * 100) : 0;

    setCard(dom.statVideosLabel, dom.statVideos, "Saved Videos", String(savedVideos.length));
    setCard(dom.statHoursLabel, dom.statHours, "Saved Hours", `${savedHours.toFixed(1)}h`);
    setCard(dom.statSavedLabel, dom.statSaved, "Completed Saved", String(completedSaved));
    setCard(dom.statCompletionLabel, dom.statCompletion, "Completion", `${savedCompletion}%`);
  } else {
    const total = state.videos.length;
    const hours = state.videos.reduce((sum, video) => sum + durationToSeconds(video.duration), 0) / 3600;
    const saved = state.savedIds.size;
    const completion = total ? Math.round((state.completedIds.size / total) * 100) : 0;

    setCard(dom.statVideosLabel, dom.statVideos, "Total Videos", String(total));
    setCard(dom.statHoursLabel, dom.statHours, "Learning Hours", `${hours.toFixed(1)}h`);
    setCard(dom.statSavedLabel, dom.statSaved, "Saved Queue", String(saved));
    setCard(dom.statCompletionLabel, dom.statCompletion, "Completion", `${completion}%`);
  }

  SAVED.updateSavedCount({ savedCountEl: dom.savedCount });
}

function updateViewToggleIcon() {
  if (!dom.viewToggle) return;
  dom.viewToggle.innerHTML =
    state.viewMode === "grid"
      ? '<i data-lucide="list"></i>'
      : '<i data-lucide="layout-grid"></i>';
}

function configureEditModalMode(mode = "video") {
  const isPlaylist = mode === "playlist";
  if (dom.editModalHeading) {
    dom.editModalHeading.textContent = isPlaylist ? "Edit Playlist" : "Edit Video";
  }
  if (dom.editDelete) {
    dom.editDelete.innerHTML = isPlaylist
      ? '<i data-lucide="trash-2"></i>Delete Playlist'
      : '<i data-lucide="trash-2"></i>Delete';
  }
  const thumbLabel = dom.editThumbnail?.closest("label");
  const youtubeLabel = dom.editYoutube?.closest("label");
  thumbLabel?.classList.toggle("hidden", isPlaylist);
  youtubeLabel?.classList.toggle("hidden", isPlaylist);
  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
}

function openPlaylistEditModal(playlistName) {
  const playlist = getPlaylists().find((item) => item.name === playlistName);
  if (!playlist) {
    notify("Playlist not found", "error");
    return;
  }

  state.editingVideoId = null;
  state.editingPlaylistName = playlist.name;
  configureEditModalMode("playlist");

  if (dom.editTitle) dom.editTitle.value = playlist.name;
  if (dom.editDescription) dom.editDescription.value = playlist.description || "";

  const categoryCounts = playlist.items.reduce((map, item) => {
    const key = String(item.category || "General");
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  const difficultyCounts = playlist.items.reduce((map, item) => {
    const key = String(item.difficulty || "Beginner");
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});

  const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";
  const dominantDifficulty = Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Beginner";

  if (dom.editCategory) dom.editCategory.value = dominantCategory;
  if (dom.editDifficulty) {
    dom.editDifficulty.value = ["Beginner", "Intermediate", "Advanced"].includes(dominantDifficulty)
      ? dominantDifficulty
      : "Beginner";
  }
  if (dom.editThumbnail) dom.editThumbnail.value = "";
  if (dom.editYoutube) dom.editYoutube.value = "";

  dom.editModal?.classList.remove("hidden");
  dom.editModal?.setAttribute("aria-hidden", "false");
  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
}

function syncSavedState() {
  const list = SAVED.getSaved();
  state.savedIds = new Set(list.map((item) => String(item.id)));
}

function toggleSave(id) {
  SAVED.toggleSave(id, {
    state,
    notify,
    updateSavedCount: () => {
      syncSavedState();
      updateMetrics();
    },
  });

  syncSavedState();
  renderAll();
}

function toggleCompleted(id) {
  const sid = String(id);
  if (state.completedIds.has(sid)) {
    state.completedIds.delete(sid);
  } else {
    state.completedIds.add(sid);
  }

  persistSet(COMPLETED_KEY, state.completedIds);
  renderAll();
}

function openVideoModal(id) {
  const video = findVideoById(id);
  if (!video) return;

  state.activeVideoId = String(video.id);
  cleanupModalPlayer();

  const source = getSourceUrl(video);
  const ytId = youtubeId(source);

  if (dom.videoIframeWrap) {
    if (ytId) {
      dom.videoIframeWrap.innerHTML = customPlayerShell("youtube");
      setupYouTubeCustomPlayer({
        videoId: ytId,
        title: video.title,
      });
    } else if (source) {
      dom.videoIframeWrap.innerHTML = customPlayerShell("video", source);
      setupHtml5CustomPlayer();
    } else {
      dom.videoIframeWrap.innerHTML = `<div class="empty-card"><p>Preview unavailable for this source.</p></div>`;
    }
  }

  if (dom.videoModalTitle) dom.videoModalTitle.textContent = video.title;
  if (dom.videoModalDesc) dom.videoModalDesc.textContent = video.description;
  if (dom.videoModalMeta) {
    dom.videoModalMeta.innerHTML = `
      <span class="badge">${escapeHtml(video.category)}</span>
      <span class="badge">${escapeHtml(video.difficulty)}</span>
      <span class="badge">${formatCompact(video.views)} views</span>
      <span class="badge">Uploaded ${video.uploadDate.toLocaleDateString()}</span>
    `;
  }

  logWatch(video.id);
  syncModalButtons();
  dom.videoModal?.classList.remove("hidden");
  dom.videoModal?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
}

function syncModalButtons() {
  if (!state.activeVideoId) return;
  const saved = state.savedIds.has(state.activeVideoId);
  const completed = state.completedIds.has(state.activeVideoId);

  if (dom.modalSave) {
    dom.modalSave.innerHTML = `<i data-lucide="bookmark"></i>${saved ? "Saved" : "Save"}`;
    dom.modalSave.classList.toggle("bookmarked", saved);
  }

  if (dom.modalComplete) {
    dom.modalComplete.innerHTML = `<i data-lucide="check-check"></i>${completed ? "Completed" : "Mark Complete"}`;
  }
}

function closeVideoModal() {
  if (!dom.videoModal || dom.videoModal.classList.contains("hidden")) return;
  cleanupModalPlayer();
  dom.videoModal.classList.add("hidden");
  dom.videoModal.setAttribute("aria-hidden", "true");
  if (dom.videoIframeWrap) dom.videoIframeWrap.innerHTML = "";
  document.body.style.overflow = "";
}

async function toggleVideoFullscreen() {
  const fullscreenEl = document.fullscreenElement;
  if (fullscreenEl) {
    try {
      await document.exitFullscreen();
    } catch {
      // noop
    }
    return;
  }

  const target =
    dom.videoIframeWrap?.querySelector(".custom-player-shell") ||
    dom.videoIframeWrap;
  if (!target || typeof target.requestFullscreen !== "function") return;

  try {
    await target.requestFullscreen();
  } catch {
    // noop
  }
}

function customPlayerShell(kind, src = "") {
  const mediaNode =
    kind === "youtube"
      ? '<div id="custom-yt-host" class="custom-yt-host"></div>'
      : `<video id="custom-html5-player" class="custom-html5-player" playsinline preload="metadata" src="${escapeAttr(src)}"></video>`;

  return `
    <div class="custom-player-shell" data-player-kind="${escapeAttr(kind)}">
      <div class="custom-player-stage">
        ${mediaNode}
        <button class="custom-player-hit-area" data-player="hit-area" type="button" aria-label="Toggle play or pause"></button>
        <button class="custom-player-pause-overlay" data-player="pause-overlay" type="button" aria-label="Resume video">
          <i data-lucide="play"></i>
        </button>
      </div>
      <div class="custom-player-controls">
        <button class="custom-player-btn" data-player="play" aria-label="Play/Pause"><i data-lucide="play"></i></button>
        <input class="custom-player-seek" data-player="seek" type="range" min="0" max="1000" value="0" aria-label="Seek" />
        <span class="custom-player-time" data-player="time">0:00 / 0:00</span>
        <div class="custom-player-volume-group" data-player="volume-group">
          <button class="custom-player-btn" data-player="mute" aria-label="Mute/Unmute"><i data-lucide="volume-2"></i></button>
          <div class="custom-player-volume-wrap" data-player="volume-wrap">
            <input class="custom-player-volume" data-player="volume" type="range" min="0" max="100" value="100" aria-label="Volume" />
          </div>
        </div>
      </div>
    </div>
  `;
}

function getCustomControls() {
  const shell = dom.videoIframeWrap?.querySelector(".custom-player-shell");
  if (!shell) return null;
  return {
    shell,
    playBtn: shell.querySelector('[data-player="play"]'),
    seek: shell.querySelector('[data-player="seek"]'),
    time: shell.querySelector('[data-player="time"]'),
    hitArea: shell.querySelector('[data-player="hit-area"]'),
    pauseOverlay: shell.querySelector('[data-player="pause-overlay"]'),
    volumeGroup: shell.querySelector('[data-player="volume-group"]'),
    volumeWrap: shell.querySelector('[data-player="volume-wrap"]'),
    muteBtn: shell.querySelector('[data-player="mute"]'),
    volume: shell.querySelector('[data-player="volume"]'),
  };
}

function formatPlayerTime(raw) {
  const total = Math.max(0, Math.floor(Number(raw) || 0));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function setCustomTimeText(controls, current, duration) {
  if (!controls?.time) return;
  controls.time.textContent = `${formatPlayerTime(current)} / ${formatPlayerTime(duration)}`;
}

function updateSeekProgressFill(seekEl) {
  if (!seekEl) return;
  const min = Number(seekEl.min || 0);
  const max = Number(seekEl.max || 1000);
  const value = Number(seekEl.value || 0);
  const pct = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;
  seekEl.style.setProperty("--seek-progress", `${pct}%`);
}

function setPausedOverlayVisible(controls, visible) {
  if (!controls?.shell) return;
  controls.shell.classList.toggle("is-paused", Boolean(visible));
}

function updateCustomButtons({ isPlaying = false, isMuted = false } = {}) {
  const controls = getCustomControls();
  if (!controls) return;

  const playState = isPlaying ? "pause" : "play";
  const muteState = isMuted ? "volume-x" : "volume-2";
  const playChanged = controls.playBtn?.dataset.icon !== playState;
  const muteChanged = controls.muteBtn?.dataset.icon !== muteState;

  if (controls.playBtn) {
    if (playChanged) {
      controls.playBtn.innerHTML = `<i data-lucide="${playState}"></i>`;
      controls.playBtn.dataset.icon = playState;
    }
  }
  if (controls.muteBtn) {
    if (muteChanged) {
      controls.muteBtn.innerHTML = `<i data-lucide="${muteState}"></i>`;
      controls.muteBtn.dataset.icon = muteState;
    }
  }
  if (playChanged || muteChanged) {
    try {
      window.lucide?.createIcons();
    } catch {
      // icon fallback
    }
  }
}

function startCustomPlayerTick(readState, options = {}) {
  if (modalPlayerTick) window.clearInterval(modalPlayerTick);
  modalPlayerTick = window.setInterval(() => {
    const controls = getCustomControls();
    if (!controls) return;
    const snapshot = readState();
    if (!snapshot) return;

    const duration = Math.max(0, Number(snapshot.duration) || 0);
    const current = Math.max(0, Number(snapshot.current) || 0);
    const scrubbing = Boolean(options.isScrubbing?.());

    if (!scrubbing && controls.seek && duration > 0) {
      controls.seek.value = String(Math.round((current / duration) * 1000));
    }
    updateSeekProgressFill(controls.seek);
    setCustomTimeText(controls, current, duration);
    updateCustomButtons({
      isPlaying: Boolean(snapshot.isPlaying),
      isMuted: Boolean(snapshot.isMuted),
    });
  }, 250);
}

function cleanupModalPlayer() {
  if (modalPlayerTick) {
    window.clearInterval(modalPlayerTick);
    modalPlayerTick = null;
  }

  if (modalPlayerKind === "youtube" && modalPlayer?.destroy) {
    try {
      modalPlayer.destroy();
    } catch {
      // noop
    }
  }

  if (modalPlayerKind === "video" && modalPlayer?.pause) {
    try {
      modalPlayer.pause();
    } catch {
      // noop
    }
  }

  modalPlayer = null;
  modalPlayerKind = "";

  if (modalVolumeHideTimer) {
    window.clearTimeout(modalVolumeHideTimer);
    modalVolumeHideTimer = null;
  }
}

function wireVolumeHoverControls(controls) {
  if (!controls?.volumeGroup || !controls?.volumeWrap) return;

  const expand = () => {
    if (modalVolumeHideTimer) {
      window.clearTimeout(modalVolumeHideTimer);
      modalVolumeHideTimer = null;
    }
    controls.volumeGroup.classList.add("expanded");
  };

  const collapseDelayed = () => {
    if (modalVolumeHideTimer) window.clearTimeout(modalVolumeHideTimer);
    modalVolumeHideTimer = window.setTimeout(() => {
      controls.volumeGroup?.classList.remove("expanded");
      modalVolumeHideTimer = null;
    }, 1500);
  };

  controls.volumeGroup.addEventListener("mouseenter", expand);
  controls.volumeGroup.addEventListener("mouseleave", collapseDelayed);
  controls.volumeGroup.addEventListener("focusin", expand);
  controls.volumeGroup.addEventListener("focusout", collapseDelayed);
}

function ensureYouTubeApiReady() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiReadyPromise) return ytApiReadyPromise;

  ytApiReadyPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        if (typeof previousReady === "function") previousReady();
      } catch {
        // noop
      }
      resolve(window.YT);
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return ytApiReadyPromise;
}

function setupYouTubeCustomPlayer({ videoId, title }) {
  const host = dom.videoIframeWrap?.querySelector("#custom-yt-host");
  const controls = getCustomControls();
  if (!host || !controls) return;
  let isScrubbing = false;

  ensureYouTubeApiReady().then((YT) => {
    if (!YT?.Player || !document.body.contains(host)) return;

    modalPlayerKind = "youtube";
    modalPlayer = new YT.Player(host, {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        fs: 0,
        iv_load_policy: 3,
        disablekb: 1,
      },
      events: {
        onReady: () => {
          try {
            modalPlayer.unMute();
            modalPlayer.setVolume(100);
          } catch {
            // noop
          }

          controls.playBtn?.addEventListener("click", () => {
            const stateCode = modalPlayer.getPlayerState?.();
            const isPlaying =
              stateCode === YT.PlayerState.PLAYING || stateCode === YT.PlayerState.BUFFERING;
            if (isPlaying) {
              modalPlayer.pauseVideo?.();
              updateCustomButtons({ isPlaying: false, isMuted: Boolean(modalPlayer.isMuted?.()) });
              setPausedOverlayVisible(controls, true);
            } else {
              modalPlayer.playVideo?.();
              updateCustomButtons({ isPlaying: true, isMuted: Boolean(modalPlayer.isMuted?.()) });
              setPausedOverlayVisible(controls, false);
            }
          });

          controls.hitArea?.addEventListener("click", () => {
            controls.playBtn?.click();
          });
          controls.pauseOverlay?.addEventListener("click", () => {
            controls.playBtn?.click();
          });

          controls.muteBtn?.addEventListener("click", () => {
            controls.volumeGroup?.classList.add("expanded");
            const muted = modalPlayer.isMuted?.();
            if (muted) modalPlayer.unMute?.();
            else modalPlayer.mute?.();
            updateCustomButtons({ isMuted: !muted });
          });

          const commitSeek = () => {
            const duration = Number(modalPlayer.getDuration?.() || 0);
            if (!duration) return;
            const ratio = (Number(controls.seek.value) || 0) / 1000;
            const target = Math.max(0, Math.min(duration, ratio * duration));
            modalPlayer.seekTo?.(target, true);
            // keep scrub lock briefly to avoid "jump back" while buffering
            window.setTimeout(() => {
              isScrubbing = false;
            }, 900);
          };

          controls.seek?.addEventListener("pointerdown", () => {
            isScrubbing = true;
          });

          controls.seek?.addEventListener("input", () => {
            const duration = Number(modalPlayer.getDuration?.() || 0);
            updateSeekProgressFill(controls.seek);
            if (!duration) return;
            const ratio = (Number(controls.seek.value) || 0) / 1000;
            const preview = Math.max(0, Math.min(duration, ratio * duration));
            setCustomTimeText(controls, preview, duration);
          });

          controls.seek?.addEventListener("change", () => {
            isScrubbing = true;
            commitSeek();
          });

          controls.volume?.addEventListener("input", () => {
            const vol = Math.max(0, Math.min(100, Number(controls.volume.value) || 0));
            modalPlayer.setVolume?.(vol);
            if (vol <= 0) modalPlayer.mute?.();
            else modalPlayer.unMute?.();
          });

          startCustomPlayerTick(() => {
            const duration = Number(modalPlayer.getDuration?.() || 0);
            const current = Number(modalPlayer.getCurrentTime?.() || 0);
            const stateCode = modalPlayer.getPlayerState?.();
            const isPlaying = stateCode === YT.PlayerState.PLAYING;
            return {
              duration,
              current,
              isPlaying,
              isMuted: Boolean(modalPlayer.isMuted?.()),
            };
          }, {
            isScrubbing: () => isScrubbing,
          });

          updateCustomButtons({ isPlaying: true, isMuted: false });
          setPausedOverlayVisible(controls, false);
          wireVolumeHoverControls(controls);
          try {
            window.lucide?.createIcons();
          } catch {
            // icon fallback
          }
        },
        onStateChange: () => {
          const stateCode = modalPlayer.getPlayerState?.();
          const isPlaying =
            stateCode === YT.PlayerState.PLAYING || stateCode === YT.PlayerState.BUFFERING;
          updateCustomButtons({
            isPlaying,
            isMuted: Boolean(modalPlayer.isMuted?.()),
          });
          setPausedOverlayVisible(controls, !isPlaying);
        },
      },
    });
  });
}

function setupHtml5CustomPlayer() {
  const player = dom.videoIframeWrap?.querySelector("#custom-html5-player");
  const controls = getCustomControls();
  if (!player || !controls) return;

  modalPlayerKind = "video";
  modalPlayer = player;
  player.controls = false;
  player.autoplay = true;
  player.muted = false;
  player.volume = 1;
  let isScrubbing = false;

  const play = () => {
    const promise = player.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
  };
  play();

  controls.playBtn?.addEventListener("click", () => {
    if (player.paused) {
      play();
      updateCustomButtons({ isPlaying: true, isMuted: Boolean(player.muted || player.volume === 0) });
      setPausedOverlayVisible(controls, false);
    } else {
      player.pause();
      updateCustomButtons({ isPlaying: false, isMuted: Boolean(player.muted || player.volume === 0) });
      setPausedOverlayVisible(controls, true);
    }
  });

  controls.hitArea?.addEventListener("click", () => {
    controls.playBtn?.click();
  });
  controls.pauseOverlay?.addEventListener("click", () => {
    controls.playBtn?.click();
  });

  controls.muteBtn?.addEventListener("click", () => {
    controls.volumeGroup?.classList.add("expanded");
    player.muted = !player.muted;
    updateCustomButtons({ isMuted: player.muted, isPlaying: !player.paused });
  });

  const commitSeek = () => {
    const duration = Number(player.duration || 0);
    if (!duration) return;
    const ratio = (Number(controls.seek.value) || 0) / 1000;
    player.currentTime = Math.max(0, Math.min(duration, ratio * duration));
    isScrubbing = false;
  };

  controls.seek?.addEventListener("pointerdown", () => {
    isScrubbing = true;
  });

  controls.seek?.addEventListener("input", () => {
    const duration = Number(player.duration || 0);
    updateSeekProgressFill(controls.seek);
    if (!duration) return;
    const ratio = (Number(controls.seek.value) || 0) / 1000;
    const preview = Math.max(0, Math.min(duration, ratio * duration));
    setCustomTimeText(controls, preview, duration);
  });

  controls.seek?.addEventListener("change", () => {
    commitSeek();
  });

  controls.volume?.addEventListener("input", () => {
    const vol = Math.max(0, Math.min(100, Number(controls.volume.value) || 0));
    player.volume = vol / 100;
    player.muted = vol <= 0;
  });

  startCustomPlayerTick(() => ({
    duration: Number(player.duration || 0),
    current: Number(player.currentTime || 0),
    isPlaying: !player.paused,
    isMuted: Boolean(player.muted || player.volume === 0),
  }), {
    isScrubbing: () => isScrubbing,
  });

  updateCustomButtons({ isPlaying: true, isMuted: false });
  setPausedOverlayVisible(controls, false);
  player.addEventListener("play", () => updateCustomButtons({ isPlaying: true, isMuted: Boolean(player.muted || player.volume === 0) }));
  player.addEventListener("play", () => setPausedOverlayVisible(controls, false));
  player.addEventListener("pause", () => updateCustomButtons({ isPlaying: false, isMuted: Boolean(player.muted || player.volume === 0) }));
  player.addEventListener("pause", () => setPausedOverlayVisible(controls, true));
  player.addEventListener("ended", () => updateCustomButtons({ isPlaying: false, isMuted: Boolean(player.muted || player.volume === 0) }));
  player.addEventListener("ended", () => setPausedOverlayVisible(controls, true));
  player.addEventListener("volumechange", () => updateCustomButtons({ isPlaying: !player.paused, isMuted: Boolean(player.muted || player.volume === 0) }));
  wireVolumeHoverControls(controls);
  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
}

function openEditModal(id) {
  const video = findVideoById(id);
  if (!video) {
    notify("Video not found", "error");
    return;
  }

  state.editingVideoId = String(video.id);
  state.editingPlaylistName = null;
  configureEditModalMode("video");
  if (dom.editTitle) dom.editTitle.value = video.title;
  if (dom.editDescription) dom.editDescription.value = video.description;
  if (dom.editCategory) dom.editCategory.value = video.category;
  if (dom.editDifficulty) {
    dom.editDifficulty.value = ["Beginner", "Intermediate", "Advanced"].includes(video.difficulty)
      ? video.difficulty
      : "Beginner";
  }
  if (dom.editThumbnail) dom.editThumbnail.value = video.thumbnail;
  if (dom.editYoutube) dom.editYoutube.value = video.youtubeLink || video.videoUrl || "";

  dom.editModal?.classList.remove("hidden");
  dom.editModal?.setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  if (!dom.editModal || dom.editModal.classList.contains("hidden")) return;
  dom.editModal.classList.add("hidden");
  dom.editModal.setAttribute("aria-hidden", "true");
  state.editingVideoId = null;
  state.editingPlaylistName = null;
  configureEditModalMode("video");
}

async function saveEdit() {
  if (state.editingPlaylistName) {
    const oldName = state.editingPlaylistName;
    const playlist = getPlaylists().find((item) => item.name === oldName);
    if (!playlist) {
      notify("Playlist not found", "error");
      return;
    }

    const nextName = String(dom.editTitle?.value || "").trim();
    const nextDescription = String(dom.editDescription?.value || "").trim();
    const nextCategory = normalizeCategory(String(dom.editCategory?.value || "").trim() || "General");
    const nextDifficulty = normalizeDifficulty(String(dom.editDifficulty?.value || "Beginner"));

    if (!nextName) {
      notify("Playlist name is required", "error");
      return;
    }

    const duplicate = getPlaylists().some(
      (item) => item.name.toLowerCase() === nextName.toLowerCase() && item.name !== oldName
    );
    if (duplicate) {
      notify("A playlist with that name already exists", "warning");
      return;
    }

    try {
      await Promise.all(
        playlist.items.map((video) =>
          DB.updateVideoInDB(db, video.id, {
            playlist_name: nextName,
            playlist_description: nextDescription,
            category: nextCategory,
            difficulty: nextDifficulty,
          })
        )
      );

      state.videos = state.videos.map((video) => {
        if (String(video.playlistName || "") !== oldName) return video;
        return normalizeVideo({
          ...video,
          id: video.id,
          playlistName: nextName,
          playlistDescription: nextDescription,
          playlist_name: nextName,
          playlist_description: nextDescription,
          category: nextCategory,
          difficulty: nextDifficulty,
        });
      });

      if (state.selectedPlaylist === oldName) {
        state.selectedPlaylist = nextName;
      }

      closeEditModal();
      renderAll();
      notify("Playlist updated", "success");
    } catch (error) {
      console.error("Playlist update failed:", error);
      notify("Playlist update failed", "error");
    }
    return;
  }

  if (!state.editingVideoId) return;

  const payload = {
    title: String(dom.editTitle?.value || "").trim(),
    description: String(dom.editDescription?.value || "").trim(),
    category: normalizeCategory(String(dom.editCategory?.value || "").trim() || "General"),
    difficulty: normalizeDifficulty(String(dom.editDifficulty?.value || "Beginner")),
    thumbnail: String(dom.editThumbnail?.value || "").trim(),
    youtube_link: String(dom.editYoutube?.value || "").trim(),
  };

  if (!payload.title) {
    notify("Title is required", "error");
    return;
  }

  try {
    await DB.updateVideoInDB(db, state.editingVideoId, payload);

    const idx = state.videos.findIndex((video) => String(video.id) === state.editingVideoId);
    if (idx >= 0) {
      state.videos[idx] = normalizeVideo({ ...state.videos[idx], ...payload, id: state.editingVideoId });
    }

    closeEditModal();
    closeVideoModal();
    renderAll();
    notify("Video updated", "success");
  } catch (error) {
    console.error("Update failed:", error);
    notify("Update failed. Check Firestore rules and connectivity.", "error");
  }
}

async function deleteVideo(id) {
  const video = findVideoById(id);
  const ok = window.confirm(`Delete "${video?.title || "this video"}" permanently?`);
  if (!ok) return;

  try {
    await DB.deleteVideoFromDB(db, id);
    state.videos = state.videos.filter((item) => String(item.id) !== String(id));

    if (state.savedIds.has(String(id))) {
      SAVED.toggleSave(id, { state, notify: () => {}, updateSavedCount: () => {} });
      syncSavedState();
    }

    if (state.completedIds.has(String(id))) {
      state.completedIds.delete(String(id));
      persistSet(COMPLETED_KEY, state.completedIds);
    }

    state.watchHistory = state.watchHistory.filter((item) => String(item.id) !== String(id));
    persistHistory();

    closeEditModal();
    closeVideoModal();
    renderAll();
    notify("Video deleted", "success");
  } catch (error) {
    console.error("Delete failed:", error);
    notify("Delete failed. Check Firestore permissions.", "error");
  }
}

async function deletePlaylist(playlistName) {
  const playlist = getPlaylists().find((item) => item.name === playlistName);
  if (!playlist) {
    notify("Playlist not found", "error");
    return;
  }

  const ok = window.confirm(`Delete playlist "${playlist.name}" and all ${playlist.items.length} videos permanently?`);
  if (!ok) return;

  try {
    await Promise.all(playlist.items.map((video) => DB.deleteVideoFromDB(db, video.id)));
    const removedIds = new Set(playlist.items.map((video) => String(video.id)));

    state.videos = state.videos.filter((video) => !removedIds.has(String(video.id)));
    state.watchHistory = state.watchHistory.filter((item) => !removedIds.has(String(item.id)));
    persistHistory();

    let completedChanged = false;
    removedIds.forEach((id) => {
      if (state.completedIds.delete(id)) completedChanged = true;
      if (state.savedIds.has(id)) {
        SAVED.toggleSave(id, { state, notify: () => {}, updateSavedCount: () => {} });
      }
    });
    if (completedChanged) {
      persistSet(COMPLETED_KEY, state.completedIds);
    }
    syncSavedState();

    if (state.selectedPlaylist === playlist.name) {
      state.selectedPlaylist = null;
    }

    closeEditModal();
    closeVideoModal();
    renderAll();
    notify("Playlist deleted", "success");
  } catch (error) {
    console.error("Playlist delete failed:", error);
    notify("Playlist delete failed", "error");
  }
}

function findVideoById(id) {
  return state.videos.find((video) => String(video.id) === String(id));
}

function getSourceUrl(video) {
  if (!video) return "";
  const youtube = sanitizeUrl(video.youtubeLink);
  const file = sanitizeUrl(video.videoUrl);
  if (youtube && youtubeId(youtube)) return youtube;
  return file || youtube || "";
}

function logWatch(id) {
  const sid = String(id);
  state.watchHistory = [{ id: sid, at: new Date().toISOString() }, ...state.watchHistory.filter((item) => item.id !== sid)].slice(0, 60);
  persistHistory();
}

function overviewScore(video) {
  const viewsScore = Math.min(30, Math.log10(Math.max(1, Number(video.views || 0))) * 10);
  const ratingScore = Number(video.rating || 0) * 7;
  const recencyScore = Math.max(0, 25 - daysSince(video.uploadDate));
  const backlogBoost = state.completedIds.has(String(video.id)) ? 0 : 10;
  return viewsScore + ratingScore + recencyScore + backlogBoost;
}

function totalPlaylistHours(items) {
  const hours = items.reduce((sum, video) => sum + durationToSeconds(video.duration), 0) / 3600;
  return hours.toFixed(1);
}

function deriveRating(views, duration) {
  const v = Number(views || 0);
  const d = durationToSeconds(duration);
  const score = 3.4 + Math.min(1.1, Math.log10(Math.max(1, v)) * 0.13) + (d > 600 ? 0.2 : 0.07);
  return Math.min(5, Number(score.toFixed(1)));
}

function normalizeCategory(value) {
  const text = String(value || "").trim();
  if (!text || /^\d+$/.test(text)) return "General";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeDifficulty(value, tags = [], description = "") {
  const text = `${String(value || "")} ${Array.isArray(tags) ? tags.join(" ") : ""} ${String(description || "")}`.toLowerCase();

  if (text.includes("advanced") || text.includes("expert")) return "Advanced";
  if (text.includes("intermediate")) return "Intermediate";
  return "Beginner";
}

function parseDate(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function durationToSeconds(raw) {
  const parts = String(raw || "0:00")
    .split(":")
    .map((item) => Number(item) || 0);

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function daysSince(date) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function youtubeId(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").trim();
    }

    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const segments = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = segments.indexOf("embed");
      if (embedIndex >= 0 && segments[embedIndex + 1]) return segments[embedIndex + 1];
      const shortsIndex = segments.indexOf("shorts");
      if (shortsIndex >= 0 && segments[shortsIndex + 1]) {
        return segments[shortsIndex + 1];
      }
    }
  } catch {
    return "";
  }

  return "";
}

function toEmbedUrl(url) {
  if (!url) return "";
  const id = youtubeId(url);
  if (!id) return "";
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
}

function uniqueValues(values) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function capLabel(value) {
  if (value === "all") return "All";
  return value;
}

function trimText(text, maxLength) {
  const clean = String(text || "").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}...`;
}

function sanitizeUrl(url) {
  const candidate = String(url || "").trim();
  if (!candidate) return "";

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "");
}

function formatCompact(value) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function isTextInput(element) {
  if (!element) return false;
  const tag = String(element.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || element.isContentEditable;
}

function notify(message, type = "info") {
  TOAST(message, type);
  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
}

function closeSidebar() {
  dom.sidebar?.classList.remove("open");
  dom.mobileOverlay?.classList.remove("open");
}

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map((item) => String(item)) : []);
  } catch {
    return new Set();
  }
}

function persistSet(key, setValue) {
  localStorage.setItem(key, JSON.stringify(Array.from(setValue)));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((item) => item && item.id && item.at)
          .map((item) => ({ id: String(item.id), at: String(item.at) }))
      : [];
  } catch {
    return [];
  }
}

function persistHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.watchHistory));
}

async function copyText(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();

    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      document.body.removeChild(area);
      return false;
    }
  }
}

function randomId() {
  return `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

init();
