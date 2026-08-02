export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export function buildWeeklyBuckets(entries, weeksCount) {
  const thisWeekStart = startOfWeek(new Date());
  const buckets = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    buckets.push({ start, end, count: 0 });
  }
  for (const entry of entries) {
    const created = new Date(entry.created_at);
    const bucket = buckets.find((b) => created >= b.start && created < b.end);
    if (bucket) bucket.count += 1;
  }
  return buckets.map((b) => ({
    label: b.start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
    count: b.count,
  }));
}

// Aantal opeenvolgende weken (incl. deze week) met minstens 1 workout, terugtellend vanaf nu.
// `weeks` is buildWeeklyBuckets()'s output, dus al oplopend gesorteerd (oudste eerst, huidige
// week laatste) - we lopen van achteren naar voren tot de eerste lege week.
export function currentStreakWeeks(weeks) {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].count === 0) break;
    streak += 1;
  }
  return streak;
}

// A "generated" entry's wod_json is the full GeneratedWod shape (blocks -> exercises); a
// "fixed" entry's wod_json is just {name, structure, time_cap_minutes} - no muscle group data.
function mainBlockOf(entry) {
  if (entry.source !== "generated" || !entry.wod_json?.blocks) return null;
  return entry.wod_json.blocks.find((b) => b.block_type === "main") ?? null;
}

export function trainingTypeCounts(entries) {
  const counts = {};
  for (const entry of entries) {
    const label = entry.source === "fixed" ? "Benchmark" : mainBlockOf(entry)?.training_type ?? "Onbekend";
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function muscleGroupCounts(entries) {
  const counts = {};
  for (const entry of entries) {
    const block = mainBlockOf(entry);
    if (!block) continue;
    const seen = new Set();
    for (const exercise of block.exercises) {
      if (seen.has(exercise.muscle_group)) continue;
      seen.add(exercise.muscle_group);
      counts[exercise.muscle_group] = (counts[exercise.muscle_group] ?? 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
