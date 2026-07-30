// 予約タイムラインの共通計算（画面／出力プレビュー共用）
export const DAY_START = 7;
export const DAY_END = 19;
export const HOURS = Array.from(
  { length: DAY_END - DAY_START + 1 },
  (_, i) => DAY_START + i
);

export function toHour(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}
// 予約時間設定に応じて表示範囲（start〜end 時）を可変にする。既定は 7〜19 時。
export function makeHours(start = DAY_START, end = DAY_END) {
  const s = Math.floor(start);
  const e = Math.ceil(end);
  return Array.from({ length: Math.max(1, e - s + 1) }, (_, i) => s + i);
}
export function pct(hhmm, start = DAY_START, end = DAY_END) {
  return ((toHour(hhmm) - start) / (end - start)) * 100;
}
export function pctHour(h, start = DAY_START, end = DAY_END) {
  return ((h - start) / (end - start)) * 100;
}

// 予約タブ（資源種別）のラベル
export const KIND_LABEL = { lift: "揚重機", gate: "ゲート", aerial: "資機材・その他" };

// 1トラック内の「通常予約」が重複している時間帯（≥2件）を返す。[[startH,endH], ...]
export function overlapBands(blocks) {
  const evts = [];
  blocks
    .filter((b) => b.resvType !== "spot")
    .forEach((b) => {
      evts.push([toHour(b.start), 1]);
      evts.push([toHour(b.end), -1]);
    });
  // 同時刻は終了(-1)を先に処理（接するだけは重複としない）
  evts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let count = 0, segStart = null;
  const bands = [];
  for (const [t, d] of evts) {
    const prev = count;
    count += d;
    if (prev < 2 && count >= 2) segStart = t;
    else if (prev >= 2 && count < 2) { bands.push([segStart, t]); segStart = null; }
  }
  return bands;
}

// 指定日の「通常予約」の重複一覧（ヘッダー通知用）。スポットは除外。
// 同一資源で通常予約が2件以上重なる時間帯（バンド）ごとに、
// その時間帯に該当する会社を優劣なく列挙する（3社以上のバッティングにも対応）。
export function listOverlaps(reservations, date) {
  const day = reservations.filter((r) => r.date === date && r.resvType !== "spot");
  const groups = {};
  day.forEach((r) => {
    const k = r.kind + "|" + r.resource;
    (groups[k] = groups[k] || []).push(r);
  });
  const out = [];
  Object.values(groups).forEach((arr) => {
    // ≥2件が重なる時間帯を抽出し、各時間帯に関わる予約をすべて列挙
    overlapBands(arr).forEach(([bs, be]) => {
      const members = arr
        .filter((r) => toHour(r.start) < be && toHour(r.end) > bs)
        .sort((a, b) => toHour(a.start) - toHour(b.start));
      out.push({ kind: arr[0].kind, resource: arr[0].resource, os: bs, oe: be, members });
    });
  });
  return out;
}
// 小数時 → "H:MM"
export function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}:${String(mm).padStart(2, "0")}`;
}

// レイアウト定数
export const ROW_H = 32; // 1段の高さ（通常＝1行）
export const ROW_H_GATE = 52; // ゲートは車種を改行するため2行分
export const LABEL_COL = 120; // 資源名（左列）の幅
export const INSET = 6; // テキストのバー内インセット
const MIN_GAP = 8; // 同一段のフットプリント間の最小間隔

export function rowHeight(isGate) {
  return isGate ? ROW_H_GATE : ROW_H;
}
export function barHeight(isGate) {
  return rowHeight(isGate) - 8;
}

// 文字幅の概算（半角/全角を区別）
function charWidth(ch) {
  return /[\x00-\xff]/.test(ch) ? 6.2 : 11;
}
export function estWidth(text) {
  let w = 0;
  for (const ch of text) w += charWidth(ch);
  return Math.ceil(w);
}

// テキスト（会社名・車種・作業内容・時間）はバー左端から表示し、
// 幅が足りなければ枠外（右）へ流す。右端で収まらない場合は左へ流す。
// 重なる場合は後の予約から下段へずらす（クリップは一切しない）。
export function layoutLabeled(blocks, W, isGate, start = DAY_START, end = DAY_END) {
  const width = Math.max(W || 0, 1);
  const RH = rowHeight(isGate);
  const sorted = [...blocks].sort(
    (a, b) => toHour(a.start) - toHour(b.start) || toHour(a.end) - toHour(b.end)
  );
  const rowEnds = []; // 各段のフットプリント右端px
  const placed = sorted.map((b) => {
    const barLeft = (pct(b.start, start, end) / 100) * width;
    const barRight = (pct(b.end, start, end) / 100) * width;
    const barW = Math.max(barRight - barLeft, 6);
    const time = `${b.start}〜${b.end}`;
    // 1行目: 会社名＋作業内容＋時間。ゲートは車種を2行目に改行するため幅に含めない
    const line1 = b.company + (b.content ? ` ${b.content}` : "") + ` ${time}`;
    let textW = estWidth(line1) + 22;
    if (isGate && b.vehicleType) {
      // 2行目（車種バッジ）の幅も考慮し、広い方を占有幅とする
      const line2W = estWidth(b.vehicleType) + 30;
      textW = Math.max(textW, line2W);
    }

    let side, fpLeft, fpRight;
    if (barLeft + INSET + textW <= width) {
      // 右へ流す（テキスト先頭はバー左端）
      side = "right";
      fpLeft = barLeft;
      fpRight = barLeft + INSET + textW;
    } else {
      // 右端に収まらない → 左へ流す（テキスト末尾はバー右端）
      side = "left";
      fpRight = barRight;
      fpLeft = barRight - INSET - textW;
    }

    // 空いている最上段へ。無ければ新しい段（後の予約ほど下段）
    let row = rowEnds.findIndex((end) => end <= fpLeft - MIN_GAP);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(fpRight);
    } else {
      rowEnds[row] = fpRight;
    }
    return { ...b, side, barLeft, barRight, barW, row };
  });
  const rows = Math.max(rowEnds.length, 1);
  return { rows, height: rows * RH, rowH: RH, barH: barHeight(isGate), placed };
}
