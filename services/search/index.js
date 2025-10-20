export function filterVideos(state, query) {
  let result = (state?.videos || []).slice();
  const e = query;
  if (e && String(e).trim()) {
    const searchTerms = String(e)
      .toLowerCase()
      .split(' ')
      .filter((s) => s.length > 0);
    result = result.filter((video) => {
      const searchableText = [
        video.title,
        video.description,
        video.category,
        ...(video.aiTags || []),
        video.difficulty,
      ]
        .join(' ')
        .toLowerCase();
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }
  if (state?.activeFilters && state.activeFilters.length > 0) {
    result = result.filter((video) =>
      state.activeFilters.some((filter) => {
        return video.category && video.category.toLowerCase() === filter.toLowerCase();
      })
    );
  }
  return result;
}

export function highlightText(text, query) {
  const e = String(text ?? '');
  const i = String(query ?? '');
  if (!i.trim()) return e;
  const tokens = i.toLowerCase().split(' ').filter(n => n.length > 0);
  let out = e;
  tokens.forEach((n) => {
    const o = new RegExp(`(${n})`, 'gi');
    out = out.replace(o, '<mark>$1</mark>');
  });
  return out;
}

export function parseDuration(d) {
  const i = String(d || '').split(':').map(Number);
  return i.length === 3 ? i[0] * 3600 + i[1] * 60 + i[2] : (i[0] || 0) * 60 + (i[1] || 0);
}

export function sortVideos(videos, sortBy) {
  const s = [...(videos || [])];
  switch (sortBy) {
    case 'newest':
      return s.sort((r, n) => (n.uploadDate || 0) - (r.uploadDate || 0));
    case 'oldest':
      return s.sort((r, n) => (r.uploadDate || 0) - (n.uploadDate || 0));
    case 'most-viewed':
      return s.sort((r, n) => (n.views || 0) - (r.views || 0));
    case 'duration-short':
      return s.sort((r, n) => parseDuration(r.duration) - parseDuration(n.duration));
    case 'duration-long':
      return s.sort((r, n) => parseDuration(n.duration) - parseDuration(r.duration));
    case 'alphabetical':
      return s.sort((r, n) => String(r.title || '').localeCompare(String(n.title || '')));
    case 'relevance':
    default:
      return s;
  }
}
