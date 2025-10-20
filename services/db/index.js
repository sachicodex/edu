import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function initDB(url, anonKey) {
  return createClient(url, anonKey);
}

export async function loadVideosFromDB(supabase) {
  const { data, error } = await supabase
    .from('EduVideoDB')
    .select('*')
    .order('upload_date', { ascending: false });
  if (error) throw error;
  const rows = data || [];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    duration: row.duration || '0:00',
    views: row.views || 0,
    category: row.category || '',
    youtubeLink: row.youtube_link || row.youtubeLink || null,
    uploadDate: row.upload_date ? new Date(row.upload_date) : new Date(),
    aiTags: row.ai_tags || row.aiTags || [],
    difficulty: row.difficulty || 'Beginner',
    rating: typeof row.rating === 'number' ? row.rating : parseFloat(row.rating) || null,
    thumbnail: row.thumbnail || row.thumbnail_url || '',
    videoUrl: row.video_url || null,
  }));
}
