// 作業予定と「資機材・ゲート予約」の紐づけ。
//
// 作業予定のレコードは、使用する資機材・ゲートを resources として持つ。
//   resources: [{ kind, name, rsvId }]
// rsvId は紐づけ先の予約ID。予約を作らずに資機材だけ選んだ場合は null。
// 表示時は rsvId を優先し、見つからなければ「同じ日・同じ資源・同じ協力会社」の
// 予約を探して紐づけ直す（あとから予約が作られた場合に追随させるため）。

export const RSV_KIND_LABEL = { lift: "揚重機", gate: "ゲート", aerial: "資機材・その他" };

// 資源のキー（kind と name の組で一意）
export const resKey = (kind, name) => `${kind}|${name}`;

// 予約対象にできる資源の一覧（資機材・ゲート登録で「予約表示ON」のもの）
export function resourceOptions({ lifts = [], gates = [], equipment = [] }) {
  return [
    ...lifts.filter((x) => x.show).map((x) => ({ kind: "lift", name: x.name })),
    ...gates.filter((x) => x.show).map((x) => ({ kind: "gate", name: x.name })),
    ...equipment.filter((x) => x.show).map((x) => ({ kind: "aerial", name: x.name })),
  ];
}

// 予約ID → その予約を掴んでいる作業予定 の対応表。
// 1つの予約に紐づけられる作業予定は1件までとするため、取り合いの判定に使う。
export function claimsOf(schedules) {
  const map = new Map();
  schedules.forEach((rec) => {
    (rec.resources || []).forEach((res) => {
      if (res.rsvId && !map.has(res.rsvId)) map.set(res.rsvId, rec);
    });
  });
  return map;
}

// 作業予定の見出し（予約側に「どの作業に使われるか」を出すときのラベル）
export function scheduleLabel(rec) {
  return [rec.company, rec.content].filter(Boolean).join("／");
}

// ある予約に紐づいている作業予定（無ければ null）
export function scheduleOfReservation(schedules, rsvId) {
  return claimsOf(schedules).get(rsvId) || null;
}

// 同じ日・同じ資源・同じ協力会社の予約（＝紐づけ候補）。開始時刻の早い順。
export function matchReservations(reservations, { date, kind, name, company }) {
  return reservations
    .filter(
      (r) =>
        r.date === date && r.kind === kind && r.resource === name && r.company === company
    )
    .sort((a, b) => a.start.localeCompare(b.start));
}

// 資源1件の紐づけ状態を求める。
//   { reservation, state: "linked" | "claimed" | "none" | "others" | "nocompany" }
//   linked のとき dateMismatch=true なら、予約の日付が作業予定と違う（日付変更後も紐づけは保持）
//   others = 自社の予約は無いが、同じ資源に他社の予約が入っている状態
export function linkState(reservations, ctx, res) {
  const { date, company, claims, selfId } = ctx;
  // 予約IDで紐づいていれば、それを最優先で保持する。
  // 予定の日付を変えても紐づけは外れない（日付違いは dateMismatch で示す）。
  if (res.rsvId) {
    const hit = reservations.find((r) => r.id === res.rsvId);
    if (hit) return { reservation: hit, state: "linked", dateMismatch: hit.date !== date };
  }
  // 協力会社が未入力のうちは照合できない（予約は会社単位で持つため）
  if (!company || !company.trim()) return { reservation: null, state: "nocompany" };
  // IDが無い場合だけ「同じ日・同じ資源・同じ協力会社」で照合する。
  // ただし他の作業予定がすでに掴んでいる予約は対象外（1予約＝1予定）。
  const mine = matchReservations(reservations, { date, ...res, company });
  const free = mine.find((r) => {
    const owner = claims?.get(r.id);
    return !owner || owner.id === selfId;
  });
  if (free) return { reservation: free, state: "linked", dateMismatch: false };
  if (mine.length) {
    // 空きは無いが自社の予約自体はある＝他の作業予定に取られている
    const owner = claims?.get(mine[0].id) || null;
    return { reservation: mine[0], state: "claimed", owner };
  }
  const others = reservations.some(
    (r) => r.date === date && r.kind === res.kind && r.resource === res.name
  );
  return { reservation: null, state: others ? "others" : "none" };
}

// 予約の時間帯ラベル
export const rsvTimeLabel = (r) => `${r.start}〜${r.end}`;

// 予約作成の初期時刻。候補にあれば 08:00〜10:00、無ければ先頭と3つ目を使う。
export function defaultTimes(opts) {
  const has = (t) => opts.includes(t);
  return {
    start: has("08:00") ? "08:00" : opts[0] || "08:00",
    end: has("10:00") ? "10:00" : opts[Math.min(2, opts.length - 1)] || "10:00",
  };
}
