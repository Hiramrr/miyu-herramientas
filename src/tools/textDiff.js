// Above this many differing lines the alignment stops and the rest is shown as one replaced block.
export const MAX_DIFF_EDITS = 2000;

function splitLines(text) {
  return text === '' ? [] : text.split(/\r?\n/);
}

// Myers O((N+M)·D) diff. Stores only the [-d, d] frontier per step, so memory is O(D²), never O(N·M).
function myers(a, b, maxEdits) {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, maxEdits);
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      while (x < n && x - k < m && a[x] === b[x - k]) x++;
      const y = x - k;
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, n, m);
    }
  }
  return null;
}

function backtrack(trace, n, m) {
  const ops = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const frontier = trace[d];
    const at = (k) => frontier[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = d === 0 ? 0 : at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) ops.push(['same', --x, --y]);
    if (d > 0) ops.push(x === prevX ? ['added', null, y - 1] : ['removed', x - 1, null]);
    x = prevX;
    y = prevY;
  }
  return ops.reverse();
}

export function buildDiffRows(originalText, nextText, maxEdits = MAX_DIFF_EDITS) {
  const left = splitLines(originalText);
  const right = splitLines(nextText);
  let start = 0;
  while (start < left.length && start < right.length && left[start] === right[start]) start++;
  let endLeft = left.length;
  let endRight = right.length;
  while (endLeft > start && endRight > start && left[endLeft - 1] === right[endRight - 1]) { endLeft--; endRight--; }

  // Compare integer ids instead of strings inside the hot loop.
  const ids = new Map();
  const toId = (line) => { if (!ids.has(line)) ids.set(line, ids.size); return ids.get(line); };
  const a = left.slice(start, endLeft).map(toId);
  const b = right.slice(start, endRight).map(toId);
  let ops = myers(a, b, maxEdits);
  const truncated = !ops;
  if (!ops) ops = [...a.map((_, i) => ['removed', i, null]), ...b.map((_, j) => ['added', null, j])];

  const rows = [];
  for (let i = 0; i < start; i++) rows.push({ type: 'same', left: left[i], right: right[i], leftNumber: i + 1, rightNumber: i + 1 });

  let removed = [];
  let added = [];
  const flush = () => {
    const pairs = Math.max(removed.length, added.length);
    for (let p = 0; p < pairs; p++) {
      const li = removed[p];
      const rj = added[p];
      rows.push({
        type: li != null && rj != null ? 'changed' : li != null ? 'removed' : 'added',
        left: li != null ? left[li] : null,
        right: rj != null ? right[rj] : null,
        leftNumber: li != null ? li + 1 : null,
        rightNumber: rj != null ? rj + 1 : null
      });
    }
    removed = [];
    added = [];
  };
  for (const [type, i, j] of ops) {
    if (type === 'removed') removed.push(i + start);
    else if (type === 'added') added.push(j + start);
    else {
      flush();
      rows.push({ type: 'same', left: left[i + start], right: right[j + start], leftNumber: i + start + 1, rightNumber: j + start + 1 });
    }
  }
  flush();
  for (let i = endLeft, j = endRight; i < left.length; i++, j++) {
    rows.push({ type: 'same', left: left[i], right: right[j], leftNumber: i + 1, rightNumber: j + 1 });
  }
  return { rows, truncated };
}
