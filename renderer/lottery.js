export function draw(names, count, allowRepeat) {
  if (names.length === 0) return [];
  if (!allowRepeat && count > names.length) {
    count = names.length;
  }

  const pool = [...names];
  const result = [];

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    if (!allowRepeat) {
      pool.splice(idx, 1);
    }
  }

  return result;
}
