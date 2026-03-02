import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function parseUploadDate(value) {
  if (!value) return new Date();
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeVideoRow(id, row) {
  const normalizedDate = parseUploadDate(row.upload_date || row.created_at);
  return {
    id,
    title: row.title || "",
    description: row.description || "",
    duration: row.duration || "0:00",
    views: row.views || 0,
    category: row.category || "",
    youtubeLink: row.youtube_link || row.youtubeLink || null,
    uploadDate: normalizedDate,
    aiTags: row.ai_tags || row.aiTags || [],
    difficulty: row.difficulty || "Beginner",
    rating: typeof row.rating === "number" ? row.rating : parseFloat(row.rating) || null,
    thumbnail: row.thumbnail || row.thumbnail_url || "",
    videoUrl: row.video_url || null,
    playlistName: row.playlist_name || row.playlistName || row.playlist || "",
    playlistDescription: row.playlist_description || row.playlistDescription || ""
  };
}

export function initDB(firebaseConfig) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export async function loadVideosFromDB(db) {
  const snapshot = await getDocs(collection(db, "EduVideoDB"));
  return snapshot.docs
    .map((doc) => normalizeVideoRow(doc.id, doc.data()))
    .sort((a, b) => {
      const at = a?.uploadDate instanceof Date ? a.uploadDate.getTime() : 0;
      const bt = b?.uploadDate instanceof Date ? b.uploadDate.getTime() : 0;
      return bt - at;
    });
}

export async function updateVideoInDB(db, id, payload = {}) {
  if (!db) throw new Error("Missing Firestore DB");
  if (!id) throw new Error("Missing video id");
  const ref = doc(db, "EduVideoDB", String(id));
  await updateDoc(ref, {
    ...payload,
    updated_at: serverTimestamp(),
  });
}

export async function deleteVideoFromDB(db, id) {
  if (!db) throw new Error("Missing Firestore DB");
  if (!id) throw new Error("Missing video id");
  const ref = doc(db, "EduVideoDB", String(id));
  await deleteDoc(ref);
}
