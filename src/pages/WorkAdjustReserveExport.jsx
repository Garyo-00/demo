import { useState, useMemo } from "react";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";
import TablePagination from "../components/wa/TablePagination.jsx";

// 予約実績出力：資源（揚重機／ゲート／資機材・その他）を選択し、対象月の予約実績をCSV出力する。
const KINDS = [
  { key: "lift", label: "揚重機" },
  { key: "gate", label: "ゲート" },
  { key: "aerial", label: "資機材・その他" },
];

// "YYYY-MM" を delta ヶ月ずらす
function shiftMonth(ym, delta) {
  let [y, m] = ym.split("-").map(Number);
  m += delta;
  while (m < 1) { m += 12; y -= 1; }
  while (m > 12) { m -= 12; y += 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}
const fmtMonth = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return `${y}年${m}月`;
};
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}/${m}/${d}`;
};

// CSVセルのエスケープ
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default function WorkAdjustReserveExport() {
  const { date, gates, lifts, equipment, reservations } = useWaSettings();
  const [kind, setKind] = useState("lift");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [cat, setCat] = useState("すべて");
  const [month, setMonth] = useState((date || "2026-07-09").slice(0, 7)); // 予約年月 YYYY-MM
  const [sel, setSel] = useState(() => new Set()); // 選択した資源名
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // タブに対応する資源一覧
  const registryForKind = kind === "lift" ? lifts : kind === "gate" ? gates : equipment;
  const catList = ["すべて", ...new Set(registryForKind.map((x) => x.category).filter(Boolean))];

  // 当月・当タブの予約（resource名でひく）
  const monthRsv = useMemo(
    () => reservations.filter((r) => r.kind === kind && (r.date || "").startsWith(month)),
    [reservations, kind, month]
  );

  // 検索・カテゴリで絞り込み
  const filtered = registryForKind.filter((x) => {
    if (cat !== "すべて" && x.category !== cat) return false;
    const q = applied.trim();
    if (!q) return true;
    return [x.name, x.category, x.location].filter(Boolean).some((v) => v.includes(q));
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const allSelected = filtered.length > 0 && filtered.every((x) => sel.has(x.name));
  function toggleAll() {
    setSel((s) => {
      const next = new Set(s);
      if (allSelected) filtered.forEach((x) => next.delete(x.name));
      else filtered.forEach((x) => next.add(x.name));
      return next;
    });
  }
  function toggle(name) {
    setSel((s) => {
      const next = new Set(s);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function switchKind(k) {
    setKind(k);
    setCat("すべて");
    setPage(0);
    setSel(new Set());
  }

  // CSV出力（選択した資源の当月予約を1予約1行で出力）
  function exportCsv() {
    const resByName = new Map(registryForKind.map((x) => [x.name, x]));
    const targets = monthRsv
      .filter((r) => sel.has(r.resource))
      .sort((a, b) => (a.resource + a.date + a.start).localeCompare(b.resource + b.date + b.start, "ja"));
    if (targets.length === 0) {
      window.alert("出力対象の予約がありません（資源の選択・対象月をご確認ください）。");
      return;
    }
    const header = [
      "機械名", "現場内呼称", "ArchID", "予約日", "予約枠", "種類",
      "作業内容", "作業場所", "会社名", "予約者所属企業", "予約者名", "備考",
    ];
    const rows = targets.map((r) => {
      const res = resByName.get(r.resource) || {};
      const machine = res.category || (kind === "gate" ? "ゲート" : "");
      return [
        machine,
        res.name || r.resource,
        res.id || "",
        fmtDate(r.date),
        `${r.start}〜${r.end}`,
        r.resvType === "spot" ? "スポット予約" : "通常予約",
        r.content || "",
        r.workPlace || "",
        r.company || "",
        r.company || "",
        r.reserverName || "",
        r.remark || "",
      ];
    });
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `予約実績_${KINDS.find((k) => k.key === kind).label}_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="page-title">予約実績出力</div>

      <div className="tabs">
        {KINDS.map((k) => (
          <button key={k.key} className={"tab" + (kind === k.key ? " on" : "")} onClick={() => switchKind(k.key)}>
            {k.label}
          </button>
        ))}
      </div>

      {/* 検索カード */}
      <div className="rex-search">
        <div className="rex-search-row">
          <select className="rex-cat" value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }}>
            {catList.map((c) => (
              <option key={c} value={c}>{c === "すべて" ? "カテゴリ" : c}</option>
            ))}
          </select>
          <div className="rex-search-field">
            <input
              placeholder="機械名、現場内呼称等で検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setApplied(query), setPage(0))}
            />
          </div>
        </div>
        <div className="rex-search-btns">
          <button className="primary-btn" onClick={() => { setApplied(query); setPage(0); }}>検索</button>
          <button className="ghost-btn accent-outline" onClick={() => { setQuery(""); setApplied(""); setPage(0); }}>✕ クリア</button>
        </div>
      </div>

      {/* 一覧カード */}
      <div className="rex-list">
        <div className="rex-list-head">
          <div className="rex-month">
            予約年月：<strong>{fmtMonth(month)}</strong>
            <button className="rex-mbtn" onClick={() => { setMonth(shiftMonth(month, -1)); setPage(0); }} title="前の月">‹</button>
            <input
              type="month"
              className="rex-month-input"
              value={month}
              onChange={(e) => { setMonth(e.target.value || month); setPage(0); }}
            />
            <button className="rex-mbtn" onClick={() => { setMonth(shiftMonth(month, 1)); setPage(0); }} title="次の月">›</button>
          </div>
          <button className="primary-btn" onClick={exportCsv} disabled={sel.size === 0} title={sel.size === 0 ? "資源を選択してください" : "選択した資源の当月予約をCSV出力"}>
            出力
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">該当する資源がありません。</div>
        ) : (
          <>
            <table className="rex-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} title="すべて選択" />
                  </th>
                  <th>機械名</th>
                  <th>現場内呼称</th>
                  <th>カテゴリ</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((x) => (
                  <tr key={x.id} className={sel.has(x.name) ? "rex-row-on" : ""}>
                    <td className="col-check">
                      <input type="checkbox" checked={sel.has(x.name)} onChange={() => toggle(x.name)} />
                    </td>
                    <td>{x.category || (kind === "gate" ? "ゲート" : "—")}</td>
                    <td>{x.name}</td>
                    <td>{x.category || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <TablePagination
              total={filtered.length}
              page={safePage}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(n) => { setPageSize(n); setPage(0); }}
            />
          </>
        )}
      </div>

      <p className="rsv-note">
        ※ 対象月・タブ（揚重機／ゲート／資機材・その他）の予約を、選択した資源ぶんCSV出力します。
        列は「機械名・現場内呼称・ArchID・予約日・予約枠・種類・作業内容・作業場所・会社名・予約者所属企業・予約者名・<strong>備考</strong>」。
        <br />
        ※ デモは時間制予約（通常／スポット）を対象に出力します。2部制予約の出力は本番仕様として要実装。
      </p>
    </div>
  );
}
