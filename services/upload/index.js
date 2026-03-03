import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function extractYouTubeVideoId(url) {
  try {
    const u = new URL(String(url || "").trim());
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").trim() || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v.trim();
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1].trim();
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1].trim();
    }
  } catch {
    return null;
  }
  return null;
}

function extractYouTubePlaylistId(url) {
  try {
    const u = new URL(String(url || "").trim());
    if (!u.hostname.includes("youtube.com") && !u.hostname.includes("youtu.be")) return null;
    const list = u.searchParams.get("list");
    if (list) return list.trim();
    if (u.hostname.includes("youtube.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "playlist" && list) return list.trim();
    }
  } catch {
    return null;
  }
  return null;
}

function buildYouTubeWatchUrl(videoId, playlistId = "") {
  if (!videoId) return "";
  if (playlistId) return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&list=${encodeURIComponent(playlistId)}`;
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function youtubeDurationToClock(isoDuration) {
  const m = String(isoDuration || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "0:00";
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

function deriveAiTags({ title = "", description = "", category = "" } = {}) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  const byKeyword = [
    ["javascript", "JavaScript"],
    ["python", "Python"],
    ["react", "React"],
    ["node", "Node.js"],
    ["firebase", "Firebase"],
    ["machine learning", "Machine Learning"],
    ["ai", "AI"],
    ["data", "Data"],
    ["algebra", "Algebra"],
    ["calculus", "Calculus"],
    ["physics", "Physics"],
    ["chemistry", "Chemistry"],
    ["biology", "Biology"],
    ["history", "History"],
    ["english", "English"],
    ["tutorial", "Tutorial"],
    ["beginner", "Beginner"],
    ["advanced", "Advanced"],
  ];

  byKeyword.forEach(([needle, tag]) => {
    if (text.includes(needle)) tags.push(tag);
  });

  if (category && String(category).trim()) {
    tags.push(String(category).trim());
  }

  // Add a few title words as fallback topic tags
  if (tags.length < 3) {
    const stop = new Set(["the", "and", "for", "with", "from", "into", "your", "this", "that", "how", "what"]);
    const words = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4 && !stop.has(w));
    words.slice(0, 4).forEach((w) => tags.push(w.charAt(0).toUpperCase() + w.slice(1)));
  }

  return Array.from(new Set(tags)).slice(0, 8);
}

function deriveRating({ views = 0, duration = "0:00", title = "", description = "" } = {}) {
  // Heuristic rating in range [3.5, 5.0] so user can still adjust manually.
  const seconds = (() => {
    const parts = String(duration).split(":").map((n) => parseInt(n, 10) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  })();

  const text = `${title} ${description}`.toLowerCase();
  const informativeBoost = ["tutorial", "guide", "course", "explained", "beginner", "advanced"].some((k) => text.includes(k)) ? 0.2 : 0;
  const viewsBoost = Math.min(0.9, Math.log10(Math.max(views, 1)) * 0.12);
  const durationBoost = seconds >= 600 ? 0.15 : 0.05;
  const score = 3.5 + informativeBoost + viewsBoost + durationBoost;
  return Math.min(5, Math.max(3.5, Number(score.toFixed(1))));
}

async function fetchYouTubeMetadata(youtubeLink) {
  const apiKey = window.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing window.YOUTUBE_API_KEY");
  }

  const videoId = extractYouTubeVideoId(youtubeLink);
  if (!videoId) throw new Error("Invalid YouTube link");

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const json = await res.json();
  const item = json?.items?.[0];
  if (!item) throw new Error("Video not found in YouTube API");

  return {
    type: "video",
    videoId,
    duration: youtubeDurationToClock(item?.contentDetails?.duration),
    views: parseInt(item?.statistics?.viewCount || "0", 10) || 0,
    title: item?.snippet?.title || "",
    description: item?.snippet?.description || "",
    thumbnail: item?.snippet?.thumbnails?.high?.url || item?.snippet?.thumbnails?.default?.url || "",
    category: item?.snippet?.categoryId || "",
  };
}

async function fetchYouTubePlaylistMetadata(youtubeLink) {
  const apiKey = window.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing window.YOUTUBE_API_KEY");
  }

  const playlistId = extractYouTubePlaylistId(youtubeLink);
  if (!playlistId) throw new Error("Invalid YouTube playlist link");

  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`;
  const playlistRes = await fetch(playlistUrl);
  if (!playlistRes.ok) throw new Error(`YouTube API error: ${playlistRes.status}`);
  const playlistJson = await playlistRes.json();
  const playlistItem = playlistJson?.items?.[0];
  if (!playlistItem) throw new Error("Playlist not found in YouTube API");

  const firstPageUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${encodeURIComponent(apiKey)}`;
  const listRes = await fetch(firstPageUrl);
  if (!listRes.ok) throw new Error(`YouTube API error: ${listRes.status}`);
  const listJson = await listRes.json();
  const rawItems = Array.isArray(listJson?.items) ? listJson.items : [];
  const videoIds = rawItems
    .map((x) => x?.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .slice(0, 50);

  if (!videoIds.length) {
    return {
      type: "playlist",
      playlistId,
      playlistTitle: playlistItem?.snippet?.title || "",
      playlistDescription: playlistItem?.snippet?.description || "",
      playlistThumbnail:
        playlistItem?.snippet?.thumbnails?.high?.url ||
        playlistItem?.snippet?.thumbnails?.default?.url ||
        "",
      items: [],
    };
  }

  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(videoIds.join(","))}&key=${encodeURIComponent(apiKey)}`;
  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) throw new Error(`YouTube API error: ${videosRes.status}`);
  const videosJson = await videosRes.json();
  const byId = new Map((videosJson?.items || []).map((v) => [v?.id, v]));

  const items = videoIds
    .map((videoId) => {
      const detailed = byId.get(videoId);
      const fallback = rawItems.find((x) => x?.snippet?.resourceId?.videoId === videoId);
      const title = detailed?.snippet?.title || fallback?.snippet?.title || "";
      const description = detailed?.snippet?.description || fallback?.snippet?.description || "";
      const thumbnail =
        detailed?.snippet?.thumbnails?.high?.url ||
        detailed?.snippet?.thumbnails?.default?.url ||
        fallback?.snippet?.thumbnails?.high?.url ||
        fallback?.snippet?.thumbnails?.default?.url ||
        "";
      const duration = youtubeDurationToClock(detailed?.contentDetails?.duration);
      const views = parseInt(detailed?.statistics?.viewCount || "0", 10) || 0;
      const category = detailed?.snippet?.categoryId || "";
      return {
        videoId,
        title,
        description,
        thumbnail,
        duration,
        views,
        category,
      };
    })
    .filter((x) => x.videoId && x.title);

  return {
    type: "playlist",
    playlistId,
    playlistTitle: playlistItem?.snippet?.title || "",
    playlistDescription: playlistItem?.snippet?.description || "",
    playlistThumbnail:
      playlistItem?.snippet?.thumbnails?.high?.url ||
      playlistItem?.snippet?.thumbnails?.default?.url ||
      "",
    items,
  };
}

export function createUploadModal({ db, state, notify, onUploaded } = {}) {
  if (document.getElementById("uploadModal")) return;
  const requiredUploadPassword = String(window.UPLOAD_PASSWORD || "").trim();

  const modal = document.createElement("div");
  modal.id = "uploadModal";
  modal.className = "upload-modal";
  modal.innerHTML = `
    <div class="upload-modal-backdrop"></div>
    <div class="upload-modal-content">
      <button class="upload-modal-close" aria-label="Close">
        <i data-lucide="x"></i>
      </button>
      <div class="upload-modal-head">
        <h2>Upload Video</h2>
        <p class="upload-subhead">Paste a YouTube link, review details, and save.</p>
      </div>
      <form id="uploadForm" class="upload-form" autocomplete="off" autocorrect="off" spellcheck="false">
        <div class="row">
          <input id="u_youtube" placeholder="YouTube Link" autocomplete="off">
        </div>

        <div class="row">
          <input id="u_title" placeholder="Title" autocomplete="off">
        </div>
        <div class="row">
          <textarea id="u_description" placeholder="Description (Optional)" style="resize: none"></textarea>
        </div>
        <div class="row">
          <input id="u_playlist_name" placeholder="Playlist Name (Optional)" autocomplete="off">
        </div>
        <div class="row">
          <textarea id="u_playlist_description" placeholder="Playlist Description (Optional)" style="resize: none"></textarea>
        </div>

        <div class="row inline">
          <input id="u_thumbnail" placeholder="Thumbnail URL" autocomplete="off">
        </div>

        <div class="row">
          <input id="u_tags" placeholder="AI Tags (Comma Separated)" autocomplete="off">
        </div>

        <div class="row">
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
  try {
    window.lucide?.createIcons();
  } catch {
    // icon fallback
  }
  requestAnimationFrame(() => modal.classList.add("upload-modal-open"));

  const youtubeInput = modal.querySelector("#u_youtube");
  const statusEl = modal.querySelector("#u_meta_status");

  const titleInput = modal.querySelector("#u_title");
  const descInput = modal.querySelector("#u_description");
  const playlistNameInput = modal.querySelector("#u_playlist_name");
  const playlistDescInput = modal.querySelector("#u_playlist_description");
  const thumbInput = modal.querySelector("#u_thumbnail");
  const tagsInput = modal.querySelector("#u_tags");
  const passwordInput = modal.querySelector("#u_password");
  const titleRow = titleInput?.closest(".row");
  const descRow = descInput?.closest(".row");
  const playlistNameRow = playlistNameInput?.closest(".row");
  const playlistDescRow = playlistDescInput?.closest(".row");
  const passwordRow = passwordInput?.closest(".row");

  if (!requiredUploadPassword && passwordRow) {
    passwordRow.style.display = "none";
  }

  let fetchedMeta = null;

  const withText = (v) => String(v ?? "").trim();
  const isPlaylistOnlyLink = (link) => {
    const playlistId = extractYouTubePlaylistId(link);
    const videoId = extractYouTubeVideoId(link);
    return !!(playlistId && !videoId);
  };
  const updateFieldMode = (link = "") => {
    const playlistMode = isPlaylistOnlyLink(link);
    if (titleRow) titleRow.style.display = playlistMode ? "none" : "";
    if (descRow) descRow.style.display = playlistMode ? "none" : "";
    if (playlistNameRow) playlistNameRow.style.display = playlistMode ? "" : "none";
    if (playlistDescRow) playlistDescRow.style.display = playlistMode ? "" : "none";
  };
  updateFieldMode("");

  const markFieldState = (el) => {
    const field = el?.closest(".floating-field");
    if (!field) return;
    const hasValue = withText(el.value).length > 0;
    field.classList.toggle("is-active", hasValue);
  };

  const prepareTabAutofillField = (el) => {
    if (!el) return;

    el.addEventListener("keydown", (ev) => {
      if (ev.key !== "Tab") return;
      const suggestion = withText(el.dataset.autofillSuggestion);
      if (!suggestion) return;
      const current = String(el.value || "");
      const currentTrim = current.trim();
      const currentLower = currentTrim.toLowerCase();
      const suggestionLower = suggestion.toLowerCase();

      if (!currentTrim || (suggestionLower.startsWith(currentLower) && suggestion.length > currentTrim.length)) {
        ev.preventDefault();
        el.value = suggestion;
        markFieldState(el);
      }
    });

    el.addEventListener("input", () => markFieldState(el));
    el.addEventListener("blur", () => markFieldState(el));
    markFieldState(el);
  };

  const setAutofillSuggestion = (el, suggestion) => {
    if (!el) return;
    const cleanSuggestion = withText(suggestion);
    const hasUserValue = withText(el.value).length > 0;

    el.dataset.autofillSuggestion = cleanSuggestion;
    // Never overwrite what user already typed manually.
    if (!hasUserValue && cleanSuggestion) {
      el.value = cleanSuggestion;
    }
    markFieldState(el);
  };

  [
    youtubeInput,
    titleInput,
    descInput,
    playlistNameInput,
    playlistDescInput,
    thumbInput,
    tagsInput,
    passwordInput,
  ].forEach(prepareTabAutofillField);

  const applyMetadata = (meta) => {
    if (!meta) return;
    setAutofillSuggestion(titleInput, meta.title);
    setAutofillSuggestion(descInput, meta.description);
    setAutofillSuggestion(thumbInput, meta.thumbnail);

    if (meta.type === "playlist") {
      setAutofillSuggestion(playlistNameInput, meta.playlistTitle);
      setAutofillSuggestion(playlistDescInput, meta.playlistDescription);
    }

    if (tagsInput && !withText(tagsInput.value)) {
      const autoTags = deriveAiTags({
        title: meta.title,
        description: meta.description,
        category: meta.category,
      });
      setAutofillSuggestion(tagsInput, autoTags.join(", "));
    }
  };

  const fetchAndPopulate = async () => {
    const link = youtubeInput.value || "";
    updateFieldMode(link);
    if (!link.trim()) {
      notify && notify("Please enter a YouTube link", "error");
      return null;
    }

    if (statusEl) statusEl.textContent = "Looking up details from YouTube...";

    try {
      const playlistId = extractYouTubePlaylistId(link);
      const videoId = extractYouTubeVideoId(link);
      let meta = null;

      if (playlistId && !videoId) {
        const playlistMeta = await fetchYouTubePlaylistMetadata(link);
        const first = playlistMeta.items?.[0] || {};
        meta = {
          ...first,
          type: "playlist",
          playlistId: playlistMeta.playlistId,
          playlistTitle: playlistMeta.playlistTitle,
          playlistDescription: playlistMeta.playlistDescription,
          playlistThumbnail: playlistMeta.playlistThumbnail,
          items: playlistMeta.items,
          thumbnail: first.thumbnail || playlistMeta.playlistThumbnail || "",
        };
      } else {
        meta = await fetchYouTubeMetadata(link);
      }

      fetchedMeta = meta;
      applyMetadata(meta);
      updateFieldMode(link);
      if (statusEl) statusEl.textContent = "Details are ready. Review anything before you save.";
      if (meta.type === "playlist") {
        notify && notify(`Playlist loaded (${meta.items.length} videos)`, "success");
      } else {
        notify && notify("YouTube details loaded", "success");
      }
      return meta;
    } catch (e) {
      const msg = String(e?.message || "");
      if (statusEl) statusEl.textContent = "Could not auto-load details. You can still fill fields manually.";
      if (msg.includes("YOUTUBE_API_KEY")) {
        notify && notify("Set window.YOUTUBE_API_KEY in index.html", "error");
      } else if (msg.includes("Invalid YouTube link") || msg.includes("Invalid YouTube playlist link")) {
        notify && notify("Invalid YouTube link", "error");
      } else {
        notify && notify("Unable to fetch YouTube details", "error");
      }
      return null;
    }
  };

  const close = () => {
    modal.classList.remove("upload-modal-open");
    modal.classList.add("upload-modal-closing");
    setTimeout(() => modal.remove(), 320);
  };

  modal.querySelector(".upload-modal-backdrop")?.addEventListener("click", close);
  modal.querySelector(".upload-modal-close")?.addEventListener("click", close);
  modal.querySelector("#u_cancel")?.addEventListener("click", close);

  let fetchTimer = null;
  let lastFetchedKey = null;
  let isFetching = false;

  const triggerAutoFetch = async () => {
    const link = youtubeInput.value || "";
    if (!link.trim()) return;
    const currentVideoId = extractYouTubeVideoId(link);
    const currentPlaylistId = extractYouTubePlaylistId(link);
    const currentKey = currentPlaylistId && !currentVideoId
      ? `pl:${currentPlaylistId}`
      : currentVideoId
        ? `v:${currentVideoId}`
        : null;
    if (!currentKey) return;
    if (isFetching) return;
    if (lastFetchedKey && lastFetchedKey === currentKey) return;
    isFetching = true;
    await fetchAndPopulate();
    isFetching = false;
    if (fetchedMeta?.type === "playlist" && fetchedMeta?.playlistId) {
      lastFetchedKey = `pl:${fetchedMeta.playlistId}`;
    } else if (fetchedMeta?.videoId) {
      lastFetchedKey = `v:${fetchedMeta.videoId}`;
    }
  };

  youtubeInput?.addEventListener("input", () => {
    updateFieldMode(youtubeInput.value || "");
    if (fetchTimer) clearTimeout(fetchTimer);
    fetchTimer = setTimeout(() => {
      triggerAutoFetch();
    }, 700);
  });

  youtubeInput?.addEventListener("blur", async () => {
    updateFieldMode(youtubeInput.value || "");
    if (fetchTimer) {
      clearTimeout(fetchTimer);
      fetchTimer = null;
    }
    await triggerAutoFetch();
  });

  modal.querySelector("#uploadForm")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    if (requiredUploadPassword) {
      const pass = modal.querySelector("#u_password")?.value || "";
      if (pass !== requiredUploadPassword) {
        notify && notify("Invalid upload password", "error");
        return;
      }
    }

    const youtubeLink = modal.querySelector("#u_youtube")?.value || "";
    if (!youtubeLink.trim()) {
      notify && notify("Please enter a YouTube link", "error");
      return;
    }

    try {
      const currentId = extractYouTubeVideoId(youtubeLink);
      const currentPlaylistId = extractYouTubePlaylistId(youtubeLink);
      const isPlaylistLink = !!(currentPlaylistId && !currentId);

      if (
        !fetchedMeta ||
        (isPlaylistLink && (fetchedMeta.type !== "playlist" || fetchedMeta.playlistId !== currentPlaylistId)) ||
        (!isPlaylistLink && (!currentId || fetchedMeta.videoId !== currentId))
      ) {
        const meta = await fetchAndPopulate();
        if (!meta) return;
      }

      if (isPlaylistLink) {
        const playlistName =
          modal.querySelector("#u_playlist_name")?.value ||
          fetchedMeta?.playlistTitle ||
          "Playlist";
        const playlistDescription =
          modal.querySelector("#u_playlist_description")?.value ||
          fetchedMeta?.playlistDescription ||
          "";
        const manualTags = (modal.querySelector("#u_tags")?.value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const videos = Array.isArray(fetchedMeta?.items) ? fetchedMeta.items : [];
        if (!videos.length) {
          notify && notify("Playlist has no public videos", "error");
          return;
        }

        for (const item of videos) {
          const tags = manualTags.length
            ? manualTags
            : deriveAiTags({
              title: item.title,
              description: item.description,
              category: item.category,
            });

          await addDoc(collection(db, "EduVideoDB"), {
            title: item.title || "",
            description: item.description || "",
            playlist_name: playlistName,
            playlist_description: playlistDescription,
            duration: item.duration || "0:00",
            views: parseInt(String(item.views || 0), 10) || 0,
            youtube_link: buildYouTubeWatchUrl(item.videoId, currentPlaylistId),
            ai_tags: tags,
            thumbnail: item.thumbnail || fetchedMeta?.playlistThumbnail || "",
            created_at: serverTimestamp(),
          });
        }

        notify && notify(`Playlist uploaded (${videos.length} videos)`, "success");
        close();
        try {
          await onUploaded?.();
        } catch {
          // no-op
        }
        return;
      }

      const video = {
        title: modal.querySelector("#u_title")?.value || fetchedMeta?.title || "",
        description: modal.querySelector("#u_description")?.value || fetchedMeta?.description || "",
        playlist_name: modal.querySelector("#u_playlist_name")?.value || "",
        playlist_description: modal.querySelector("#u_playlist_description")?.value || "",
        duration: fetchedMeta?.duration || "0:00",
        views: parseInt(String(fetchedMeta?.views || 0), 10) || 0,
        youtube_link: youtubeLink,
        ai_tags: (modal.querySelector("#u_tags")?.value || "").split(",").map((s) => s.trim()).filter(Boolean),
        thumbnail: modal.querySelector("#u_thumbnail")?.value || fetchedMeta?.thumbnail || "",
      };

      if (!video.title) {
        notify && notify("Unable to detect video title from YouTube link", "error");
        return;
      }

      await addDoc(collection(db, "EduVideoDB"), {
        ...video,
        created_at: serverTimestamp(),
      });

      notify && notify("Video uploaded", "success");
      close();
      try {
        await onUploaded?.();
      } catch {
        // no-op
      }
    } catch (e) {
      console.error("upload exception", e);
      const msg = String(e?.message || "");
      if (msg.includes("YOUTUBE_API_KEY")) {
        notify && notify("Set window.YOUTUBE_API_KEY in index.html", "error");
      } else {
        notify && notify("Upload failed", "error");
      }
    }
  });
}
