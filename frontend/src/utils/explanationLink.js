// We link to a YouTube search instead of one specific video: a single hand-picked
// video URL could go dead or be wrong, while a search always returns real, relevant results.
export function explanationUrl(exerciseName) {
  const query = encodeURIComponent(`${exerciseName} oefening uitleg`);
  return `https://www.youtube.com/results?search_query=${query}`;
}
