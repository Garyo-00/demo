import { useState } from "react";
import {
  WA_WORK_SCHEDULES,
  WA_COMPANIES,
  WA_INDUSTRIES,
  WA_JOBTYPES_BY_INDUSTRY,
  WA_FOREMEN,
  defaultForeman,
  WA_HISTORY,
  WA_STATUS_LABEL,
  WA_STATUS_PILL,
  WA_PRIME_USERS,
  WA_MY_COMPANY,
  WA_DNN_ATTENDANCE,
  hasDnnAttendance,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import PrintPreview from "../components/wa/PrintPreview.jsx";
import SchedulePrint from "../components/wa/SchedulePrint.jsx";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";
import printIcon from "../assets/icons/print.svg";
import TablePagination from "../components/wa/TablePagination.jsx";
import {
  SuggestField,
  SelectField,
  TextAreaField,
  DateField,
} from "../components/wa/Field.jsx";

// 実績入力ダイアログ用：ドラフトを会社ごとにまとめる（元の並び順・indexは保持）。
// 同一会社に複数作業があっても1つの会社グループにまとめて表示するため。
function groupDraftByCompany(draft) {
  const order = [];
  const map = new Map();
  draft.forEach((item, index) => {
    if (!map.has(item.company)) {
      map.set(item.company, []);
      order.push(item.company);
    }
    map.get(item.company).push({ item, index });
  });
  return order.map((company) => {
    const items = map.get(company);
    const plannedTotal = items.reduce((s, { item }) => s + (item.planned || 0), 0);
    // 入場人数：DNN連携がある会社のみ表示（無ければ非表示）
    const hasAttendance = hasDnnAttendance(company);
    const attendance = hasAttendance ? WA_DNN_ATTENDANCE[company] : null;
    return { company, items, plannedTotal, hasAttendance, attendance };
  });
}

// 作業ブロック（棟・階・エリア・工区・作業内容・作業人数・工数）
function emptyBlock() {
  return {
    building: "", floor: "", area: "", zone: "", content: "",
    normalWorkers: 1, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
  };
}
// 新規作成フォーム（共通項目＋作業ブロックを複数）
function emptyForm(date) {
  return {
    id: "",
    date,
    company: "",
    industry: "",
    jobType: "",
    foreman: "",
    blocks: [emptyBlock()],
  };
}
// 既存レコード → 編集フォーム（ブロック1つ）
function toForm(r) {
  return {
    id: r.id,
    date: r.date,
    company: r.company,
    industry: r.industry,
    jobType: r.jobType,
    foreman: r.foreman,
    blocks: [
      {
        building: r.building, floor: r.floor, area: r.area, zone: r.zone, content: r.content,
        normalWorkers: r.normalWorkers, normalHours: r.normalHours,
        overtimeWorkers: r.overtimeWorkers, overtimeHours: r.overtimeHours,
      },
    ],
  };
}

// 各パターンの作業人数の選択肢（0〜30名）
const WORKER_OPTS = Array.from({ length: 31 }, (_, i) => i);
// 予定の作業人数（通常作業のみをカウント／テーブル表示用）
function totalWorkers(r) {
  return Number(r.normalWorkers) || 0;
}
// 実績の作業人数（通常作業のみ。未入力なら null）
function actualTotal(r) {
  if (r.actualNormalWorkers == null) return null;
  return Number(r.actualNormalWorkers) || 0;
}

export default function WorkAdjustSchedule() {
  const { date, role } = useWaSettings(); // 共通の作業日（ヘッダーで操作）／閲覧ロール
  const [rows, setRows] = useState(WA_WORK_SCHEDULES);
  const [editing, setEditing] = useState(null); // 作成/編集中の行
  const [confirmDraft, setConfirmDraft] = useState(null); // 確定ダイアログ（全未確定の下書き）
  const [actualDraft, setActualDraft] = useState(null); // 実績入力ダイアログ（全確定の下書き）
  const [seq, setSeq] = useState(1000);
  const [showPrint, setShowPrint] = useState(false);
  const [copyMode, setCopyMode] = useState(null); // "prime" | "foreman" | null
  const [copySel, setCopySel] = useState(() => new Set()); // 複製元として選択したID
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState(""); // 協力会社名での検索
  const [sortKey, setSortKey] = useState("industry"); // 初期は業種ソート
  const [sortDir, setSortDir] = useState("asc");

  // 列ごとの比較（全カラムでソート可能）
  function cmpBy(a, b, key) {
    switch (key) {
      case "status": return a.status.localeCompare(b.status);
      case "company": return a.company.localeCompare(b.company, "ja");
      case "industry": return a.industry.localeCompare(b.industry, "ja");
      case "jobType": return a.jobType.localeCompare(b.jobType, "ja");
      case "location": return (a.building || "").localeCompare(b.building || "", "ja");
      case "content": return (a.content || "").localeCompare(b.content || "", "ja");
      case "planned": return totalWorkers(a) - totalWorkers(b);
      case "actual": return (actualTotal(a) ?? -1) - (actualTotal(b) ?? -1);
      case "safety": return (a.safetyNote || "").localeCompare(b.safetyNote || "", "ja");
      default: return 0;
    }
  }
  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }
  function sortMark(key) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  // 表示中の日付の作業予定（確定・実績・出力はこの全件が対象）
  const dateRows = rows.filter((r) => r.date === date);
  // 一覧表示用：協力会社名で検索し、指定カラムでソート
  const dayRows = dateRows
    .filter((r) => !search.trim() || r.company.includes(search.trim()))
    .slice()
    .sort((a, b) => {
      const c = cmpBy(a, b, sortKey);
      return sortDir === "asc" ? c : -c;
    });

  // ページネーション（表示行のみ切り出し）
  const pageCount = Math.max(1, Math.ceil(dayRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = dayRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  // 確定状態の集計（確定・実績・出力は当日の全作業が対象）
  const pendingRows = dateRows.filter((r) => r.status !== "approved");
  const approvedRows = dateRows.filter((r) => r.status === "approved");
  const hasPending = pendingRows.length > 0;
  const allConfirmed = dateRows.length > 0 && !hasPending;

  function openCreate() {
    setEditing(emptyForm(date));
  }
  function openEdit(row) {
    if (row.status === "approved") return; // 確定中は編集不可（要・確定解除）
    setEditing(toForm(row));
  }
  function remove(row) {
    if (row.status === "approved") return; // 確定中は削除不可
    if (window.confirm(`作業予定「${row.content || row.id}」を削除しますか？`)) {
      setRows((rs) => rs.filter((r) => r.id !== row.id));
    }
  }

  function save() {
    const f = editing;
    // 必須：協力会社名・業種・職種・職長名
    if (!f.company || !f.company.trim()) {
      window.alert("協力会社名を入力してください。");
      return;
    }
    if (!f.industry) {
      window.alert("業種を選択してください。");
      return;
    }
    if (!f.jobType) {
      window.alert("職種を選択してください。");
      return;
    }
    if (!f.foreman) {
      window.alert("職長を選択してください。");
      return;
    }
    if (f.id) {
      // 編集：既存レコードを更新（ステータス・安全指示・実績は保持）
      const b = f.blocks[0];
      setRows((rs) =>
        rs.map((r) =>
          r.id === f.id
            ? {
                ...r,
                date: f.date, company: f.company, industry: f.industry,
                jobType: f.jobType, foreman: f.foreman,
                building: b.building, floor: b.floor, area: b.area, zone: b.zone, content: b.content,
                normalWorkers: b.normalWorkers, normalHours: b.normalHours,
                overtimeWorkers: b.overtimeWorkers, overtimeHours: b.overtimeHours,
              }
            : r
        )
      );
    } else {
      // 新規：作業ブロックごとにレコードを作成
      let n = seq;
      const newRows = f.blocks.map((b) => {
        n += 1;
        return {
          id: "W-" + String(n).padStart(3, "0"),
          date: f.date, status: "pending",
          company: f.company, industry: f.industry, jobType: f.jobType, foreman: f.foreman,
          building: b.building, floor: b.floor, area: b.area, zone: b.zone, content: b.content,
          normalWorkers: b.normalWorkers, normalHours: b.normalHours,
          overtimeWorkers: b.overtimeWorkers, overtimeHours: b.overtimeHours,
          safetyNote: "",
          actualNormalWorkers: null, actualNormalHours: null,
          actualOvertimeWorkers: null, actualOvertimeHours: null,
        };
      });
      setSeq(n);
      setRows((rs) => [...rs, ...newRows]);
    }
    setEditing(null);
  }

  // 協力会社を選ぶと職長の選択肢を自動で埋め、既定で表示順の先頭を適用（複数いる場合は選択可）
  function setCompany(company) {
    setEditing((e) => ({ ...e, company, foreman: defaultForeman(company) }));
  }
  // 作業ブロックの操作
  function setBlock(i, patch) {
    setEditing((e) => ({
      ...e,
      blocks: e.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  }
  const setBlockObj = (i) => (updater) =>
    setEditing((e) => ({
      ...e,
      blocks: e.blocks.map((b, idx) => (idx === i ? updater(b) : b)),
    }));
  function addBlock() {
    setEditing((e) => ({ ...e, blocks: [...e.blocks, emptyBlock()] }));
  }
  function removeBlock(i) {
    setEditing((e) => ({ ...e, blocks: e.blocks.filter((_, idx) => idx !== i) }));
  }

  // --- コピー作成（過去の作業予定を本日ぶんとして複製）---
  // 表示中日付より前の予定（複製元の候補）。ISO日付なので文字列比較でOK。
  const pastRows = rows.filter((r) => r.date < date);
  // 直近 n 日ぶん（日付の新しい順に n 日）を対象に絞り込む
  function recentDays(list, n) {
    const days = [...new Set(list.map((r) => r.date))].sort().reverse().slice(0, n);
    const keep = new Set(days);
    return list.filter((r) => keep.has(r.date));
  }
  // 元請版：全協力会社ぶん・直近3日 ／ 職長版：自社ぶん・直近5日
  const copySource =
    copyMode === "prime"
      ? recentDays(pastRows, 3)
      : copyMode === "foreman"
      ? recentDays(pastRows.filter((r) => r.company === WA_MY_COMPANY), 5)
      : [];
  // 会社→レコード配列（元請版の大カテゴリ見出し用）／ 会社は50音で安定表示
  const copyGroups = [...new Set(copySource.map((r) => r.company))]
    .sort((a, b) => a.localeCompare(b, "ja"))
    .map((company) => ({
      company,
      items: copySource
        .filter((r) => r.company === company)
        .sort((a, b) => b.date.localeCompare(a.date)),
    }));

  function openCopy(mode) {
    setCopyMode(mode);
    setCopySel(new Set());
  }
  function toggleCopy(id) {
    setCopySel((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleCopyGroup(items) {
    const ids = items.map((r) => r.id);
    const allOn = ids.every((id) => copySel.has(id));
    setCopySel((s) => {
      const next = new Set(s);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  }
  function commitCopy() {
    const picked = copySource.filter((r) => copySel.has(r.id));
    let n = seq;
    const newRows = picked.map((r) => {
      n += 1;
      return {
        ...r,
        id: "W-" + String(n).padStart(3, "0"),
        date, // 表示中の日付ぶんとして登録
        status: "pending", // 未確定でコピー（元請の確定はこれから）
        safetyNote: "", // 元請安全指示事項は確定時に入力
        actualNormalWorkers: null, actualNormalHours: null,
        actualOvertimeWorkers: null, actualOvertimeHours: null,
      };
    });
    setSeq(n);
    setRows((rs) => [...rs, ...newRows]);
    setCopyMode(null);
    setCopySel(new Set());
  }

  // 確定（全未確定を対象に、元請安全指示事項を入力するダイアログを開く）
  function openConfirm() {
    if (!hasPending) return;
    setConfirmDraft(
      pendingRows.map((r) => ({
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        building: r.building, floor: r.floor, safetyNote: r.safetyNote || "",
      }))
    );
  }
  function commitConfirm() {
    // 元請安全指示事項は必須（全件入力されていること）
    if (confirmDraft.some((d) => !d.safetyNote || !d.safetyNote.trim())) {
      window.alert("すべての作業の元請安全指示事項を入力してください（必須）。");
      return;
    }
    const map = new Map(confirmDraft.map((d) => [d.id, d.safetyNote]));
    setRows((rs) =>
      rs.map((r) =>
        map.has(r.id) ? { ...r, status: "approved", safetyNote: map.get(r.id) } : r
      )
    );
    setConfirmDraft(null);
  }
  // 確定解除（全確定済みを未確定に戻す）
  function releaseAll() {
    const ids = new Set(approvedRows.map((r) => r.id));
    setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, status: "pending" } : r)));
  }
  // 協力会社単位の元請安全指示事項の履歴（重複排除・最新5件・新しい作成データ優先）
  function safetyHistoryFor(company) {
    const seen = new Set();
    const out = [];
    for (let i = rows.length - 1; i >= 0 && out.length < 5; i--) {
      const r = rows[i];
      const note = (r.safetyNote || "").trim();
      if (r.company === company && note && !seen.has(note)) {
        seen.add(note);
        out.push(note);
      }
    }
    return out;
  }
  // 1レコードだけを対象に実績入力ダイアログを開く（職長画面の各レコードのボタン用）
  function openActualOne(r) {
    setActualDraft([
      {
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        planned: totalWorkers(r),
        plannedNormalWorkers: Number(r.normalWorkers) || 0,
        plannedOvertimeWorkers: Number(r.overtimeWorkers) || 0,
        actualNormalWorkers: r.actualNormalWorkers ?? 0,
        actualNormalHours: r.actualNormalHours ?? 0,
        actualOvertimeWorkers: r.actualOvertimeWorkers ?? 0,
        actualOvertimeHours: r.actualOvertimeHours ?? 0,
      },
    ]);
  }
  // 実績入力（全確定済みを対象にダイアログを開く）
  function openActual() {
    setActualDraft(
      approvedRows.map((r) => ({
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        planned: totalWorkers(r),
        plannedNormalWorkers: Number(r.normalWorkers) || 0,
        plannedOvertimeWorkers: Number(r.overtimeWorkers) || 0,
        actualNormalWorkers: r.actualNormalWorkers ?? 0,
        actualNormalHours: r.actualNormalHours ?? 0,
        actualOvertimeWorkers: r.actualOvertimeWorkers ?? 0,
        actualOvertimeHours: r.actualOvertimeHours ?? 0,
      }))
    );
  }
  function commitActual() {
    const map = new Map(actualDraft.map((d) => [d.id, d]));
    setRows((rs) =>
      rs.map((r) => {
        const a = map.get(r.id);
        return a
          ? {
              ...r,
              actualNormalWorkers: a.actualNormalWorkers,
              actualNormalHours: a.actualNormalHours,
              actualOvertimeWorkers: a.actualOvertimeWorkers,
              actualOvertimeHours: a.actualOvertimeHours,
            }
          : r;
      })
    );
    setActualDraft(null);
  }
  // ダイアログ内の配列アイテム更新用セッター
  const setDraftItem = (setter) => (i) => (updater) =>
    setter((d) => d.map((it, idx) => (idx === i ? updater(it) : it)));
  const setConfirmItem = setDraftItem(setConfirmDraft);
  const setActualItem = setDraftItem(setActualDraft);

  // 作業人数・工数の1パターン分の行（任意のstateに対して）
  // plannedWorkers を渡すと、作業人数（実績）の左に「作業人数（予定）」列を表示する（実績入力用）
  function patternRow(obj, setObj, label, wKey, hKey, plannedWorkers) {
    return (
      <div className={"wg-row" + (plannedWorkers != null ? " has-planned" : "")} key={wKey}>
        <span className="wg-label">{label}</span>
        {plannedWorkers != null && (
          <div className="wg-cell wg-planned">
            <small>作業人数（予定）</small>
            <span className="wg-planned-val">{plannedWorkers}</span>
          </div>
        )}
        <label className="wg-cell">
          <small>{plannedWorkers != null ? "作業人数（実績）" : "作業人数"}</small>
          <select
            value={obj[wKey] ?? 0}
            onChange={(e) => setObj((x) => ({ ...x, [wKey]: Number(e.target.value) }))}
          >
            {WORKER_OPTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="wg-cell">
          <small>工数</small>
          <span className="wg-hours">
            <input
              type="number"
              min="0"
              step="0.5"
              value={obj[hKey] ?? 0}
              onChange={(e) => setObj((x) => ({ ...x, [hKey]: Number(e.target.value) }))}
            />
            <em>h</em>
          </span>
        </label>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">作業予定一覧</div>
      <div className="toolbar">
        <span className="subtle">{dayRows.length} 件</span>
        <input
          className="wa-search"
          placeholder="協力会社名で検索"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        {role === "prime" && (
          <button
            className="ghost-btn spacer"
            onClick={() => setShowPrint(true)}
            disabled={approvedRows.length === 0}
            title={approvedRows.length === 0 ? "確定済みの作業予定がありません" : "確定済みのみ出力します"}
          >
            <img className="ic-btn" src={printIcon} alt="" />出力
          </button>
        )}
        {/* コピー作成はビューに応じて元請/職長のロジックを適用（ボタンは1つ）。
            出力が非表示になる職長ビューでは右寄せ用のspacerを引き継ぐ */}
        <button
          className={"ghost-btn" + (role === "prime" ? "" : " spacer")}
          onClick={() => openCopy(role)}
        >
          コピー作成
        </button>
        <button className="primary-btn" onClick={openCreate}>
          ＋ 新規作成
        </button>
      </div>

      <p className="wa-note">
        ※ 各カラムのヘッダークリックでソートできます（初期は業種順）。協力会社名で検索できます。
        <br />
        ※ 運用フロー：職長が予定を作成 → 元請が確定（元請安全指示事項を入力）→ 元請または職長が実績を入力。
        <br />
        ※ 確定後のレコードは「編集」で確定を解除するまで編集・削除できません。
      </p>

      {dayRows.length === 0 ? (
        <div className="empty">この日の作業予定はありません。</div>
      ) : (
        <>
          {/* デスクトップ：テーブル表示 */}
          <table className="wa-schedule-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort("status")}>ステータス{sortMark("status")}</th>
                <th className="sortable" onClick={() => toggleSort("company")}>協力会社名{sortMark("company")}</th>
                <th className="sortable" onClick={() => toggleSort("industry")}>業種{sortMark("industry")}</th>
                <th className="sortable" onClick={() => toggleSort("jobType")}>職種{sortMark("jobType")}</th>
                <th className="sortable" onClick={() => toggleSort("location")}>作業場所（棟/階/エリア/工区）{sortMark("location")}</th>
                <th className="sortable" onClick={() => toggleSort("content")}>作業内容{sortMark("content")}</th>
                <th className="sortable" onClick={() => toggleSort("planned")}>作業人数（予定）{sortMark("planned")}</th>
                <th className="sortable" onClick={() => toggleSort("actual")}>作業人数（実績）{sortMark("actual")}</th>
                <th className="sortable" onClick={() => toggleSort("safety")}>元請安全指示事項{sortMark("safety")}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className={r.status === "approved" ? "row-confirmed" : ""}>
                  <td>
                    <span className={"pill " + WA_STATUS_PILL[r.status]}>
                      {WA_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td>{r.company}</td>
                  <td>{r.industry}</td>
                  <td>{r.jobType}</td>
                  <td className="loc-cell">
                    {r.building} / {r.floor} / {r.area} /{" "}
                    <span className="muted">{r.zone}</span>
                  </td>
                  <td>{r.content}</td>
                  <td>{totalWorkers(r)} 名</td>
                  <td>
                    {actualTotal(r) != null ? (
                      actualTotal(r) + " 名"
                    ) : (
                      <span className="subtle">—</span>
                    )}
                  </td>
                  <td>
                    {r.safetyNote ? r.safetyNote : <span className="subtle">—</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="mini-btn"
                        onClick={() => openEdit(r)}
                        disabled={r.status === "approved"}
                        title={r.status === "approved" ? "確定済みのため編集できません" : ""}
                      >
                        編集
                      </button>
                      <button
                        className="mini-btn danger"
                        onClick={() => remove(r)}
                        disabled={r.status === "approved"}
                        title={r.status === "approved" ? "確定済みのため削除できません" : ""}
                      >
                        削除
                      </button>
                      {role === "foreman" && (
                        <button
                          className="mini-btn accent"
                          onClick={() => openActualOne(r)}
                          disabled={r.status !== "approved"}
                          title={r.status !== "approved" ? "確定後に実績入力できます" : "実績を入力"}
                        >
                          実績入力
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* モバイル：カード表示（横スクロールなしで全項目を表示） */}
          <div className="wa-card-list">
            {pageRows.map((r) => (
              <div
                key={r.id}
                className={"wa-card" + (r.status === "approved" ? " confirmed" : "")}
              >
                <div className="wa-card-top">
                  <span className={"pill " + WA_STATUS_PILL[r.status]}>
                    {WA_STATUS_LABEL[r.status]}
                  </span>
                  <strong className="wa-card-co">{r.company}</strong>
                </div>
                <div className="wa-card-grid">
                  <div className="wa-card-field">
                    <span className="wa-card-label">業種／職種</span>
                    <span>{r.industry}／{r.jobType}</span>
                  </div>
                  <div className="wa-card-field">
                    <span className="wa-card-label">作業場所</span>
                    <span>{[r.building, r.floor, r.area, r.zone].filter(Boolean).join(" / ")}</span>
                  </div>
                  <div className="wa-card-field">
                    <span className="wa-card-label">作業内容</span>
                    <span>{r.content || "—"}</span>
                  </div>
                  <div className="wa-card-field">
                    <span className="wa-card-label">作業人数（予定／実績）</span>
                    <span>
                      {totalWorkers(r)} 名 ／{" "}
                      {actualTotal(r) != null ? actualTotal(r) + " 名" : "—"}
                    </span>
                  </div>
                  <div className="wa-card-field">
                    <span className="wa-card-label">元請安全指示事項</span>
                    <span>{r.safetyNote || "—"}</span>
                  </div>
                </div>
                <div className="wa-card-actions">
                  <button
                    className="mini-btn"
                    onClick={() => openEdit(r)}
                    disabled={r.status === "approved"}
                    title={r.status === "approved" ? "確定済みのため編集できません" : ""}
                  >
                    編集
                  </button>
                  <button
                    className="mini-btn danger"
                    onClick={() => remove(r)}
                    disabled={r.status === "approved"}
                    title={r.status === "approved" ? "確定済みのため削除できません" : ""}
                  >
                    削除
                  </button>
                  {role === "foreman" && (
                    <button
                      className="mini-btn accent"
                      onClick={() => openActualOne(r)}
                      disabled={r.status !== "approved"}
                      title={r.status !== "approved" ? "確定後に実績入力できます" : "実績を入力"}
                    >
                      実績入力
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <TablePagination
            total={dayRows.length}
            page={safePage}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(0); }}
          />

          {/* テーブル下：全作業共通の確定／確定解除／実績入力（元請ビューのみ） */}
          {role === "prime" && (
          <div className="confirm-bar bare">
            {allConfirmed ? (
              <>
                <button className="ghost-btn" onClick={releaseAll}>
                  確定解除
                </button>
                <button className="primary-btn big" onClick={openActual}>
                  実績入力
                </button>
              </>
            ) : (
              <button
                className="primary-btn big"
                onClick={openConfirm}
                disabled={!hasPending}
              >
                確定
              </button>
            )}
          </div>
          )}
        </>
      )}

      {/* 新規作成／編集 */}
      {editing && (
        <Modal
          wide
          title={editing.id ? "作業予定の編集" : "作業予定の新規作成"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setEditing(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={save}>
                保存
              </button>
            </>
          }
        >
          {/* 共通項目 */}
          <div className="form-grid">
            <DateField
              label="日付"
              required
              value={editing.date}
              onChange={(v) => setEditing((x) => ({ ...x, date: v }))}
              hint="この日付の作業予定として登録されます"
            />
            <SuggestField
              label="協力会社名"
              required
              value={editing.company}
              onChange={setCompany}
              options={WA_COMPANIES}
              hint="選択式＋自由記述（DNNの設定を参照）"
            />
            <SelectField
              label="業種"
              required
              value={editing.industry}
              onChange={(v) =>
                setEditing((x) => ({ ...x, industry: v, jobType: "" }))
              }
              options={[
                { value: "", label: "業種を選択してください" },
                ...WA_INDUSTRIES.map((v) => ({ value: v, label: v })),
              ]}
              hint="一覧から選択してください（自由記述不可）"
            />
            <SelectField
              label="職種"
              required
              value={editing.jobType}
              onChange={(v) => setEditing((x) => ({ ...x, jobType: v }))}
              options={
                editing.industry
                  ? [
                      { value: "", label: "職種を選択してください" },
                      ...(WA_JOBTYPES_BY_INDUSTRY[editing.industry] || []).map((v) => ({
                        value: v,
                        label: v,
                      })),
                    ]
                  : [{ value: "", label: "先に業種を選択してください" }]
              }
              hint={
                editing.industry
                  ? "選択中の業種に紐づく職種から選択してください（自由記述不可）"
                  : "先に業種を選択してください"
              }
            />
            <SelectField
              label="職長"
              required
              value={editing.foreman}
              onChange={(v) => setEditing((x) => ({ ...x, foreman: v }))}
              options={
                (WA_FOREMEN[editing.company] || []).length
                  ? (WA_FOREMEN[editing.company] || []).map((v) => ({ value: v, label: v }))
                  : [{ value: "", label: "先に協力会社を選択してください" }]
              }
              hint="協力会社の職長ユーザーから選択（自動反映。既定は表示順の先頭）"
            />
          </div>

          {/* 作業ブロック（棟・階・エリア・工区・作業内容・作業人数・工数）。新規は複数追加可 */}
          {editing.blocks.map((bk, i) => (
            <div className="cmp-block" key={i}>
              <div className="cmp-block-head">
                <span className="cmp-block-title">作業 {i + 1}</span>
                {editing.blocks.length > 1 && (
                  <button className="mini-btn danger" onClick={() => removeBlock(i)}>
                    削除
                  </button>
                )}
              </div>
              <div className="form-grid">
                <SuggestField
                  label="棟"
                  value={bk.building}
                  onChange={(v) => setBlock(i, { building: v })}
                  options={WA_HISTORY.building}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  label="階"
                  value={bk.floor}
                  onChange={(v) => setBlock(i, { floor: v })}
                  options={WA_HISTORY.floor}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  label="エリア"
                  value={bk.area}
                  onChange={(v) => setBlock(i, { area: v })}
                  options={WA_HISTORY.area}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  label="工区"
                  value={bk.zone}
                  onChange={(v) => setBlock(i, { zone: v })}
                  options={WA_HISTORY.zone}
                  hint="自由記述＋履歴から選択"
                />
                <SuggestField
                  full
                  label="作業内容"
                  value={bk.content}
                  onChange={(v) => setBlock(i, { content: v })}
                  options={WA_HISTORY.content}
                  hint="自由記述＋履歴から選択"
                />
                <div className="field full">
                  <label>作業人数・工数</label>
                  <div className="worker-grid">
                    {patternRow(bk, setBlockObj(i), "通常作業", "normalWorkers", "normalHours")}
                    {patternRow(bk, setBlockObj(i), "早出・残業作業", "overtimeWorkers", "overtimeHours")}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!editing.id && (
            <div className="cmp-addrow">
              <button className="linklike" onClick={addBlock}>
                ＋ 作業を追加
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* コピー作成（過去の予定を選択して本日ぶんとして複製） */}
      {copyMode && (
        <Modal
          wide
          title={
            copyMode === "prime"
              ? "コピー作成（元請）－ 全協力会社・直近3日"
              : "コピー作成（職長）－ 自社・直近5日"
          }
          onClose={() => setCopyMode(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setCopyMode(null)}>
                キャンセル
              </button>
              <button
                className="primary-btn"
                onClick={commitCopy}
                disabled={copySel.size === 0}
              >
                選択した内容を {formatDateStr(date)} の予定として登録（{copySel.size} 件）
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            {copyMode === "prime" ? (
              <>
                過去（直近3日）の作業予定を協力会社別に表示しています。複製する作業を選択すると、
                <b>{formatDateStr(date)}</b> の作業予定として一括登録されます（未確定で登録）。
              </>
            ) : (
              <>
                自社（<b>{WA_MY_COMPANY}</b>）が作成した過去（直近5日）の作業予定を表示しています。
                複製する作業を選択すると、<b>{formatDateStr(date)}</b> の作業予定として登録されます（未確定で登録）。
              </>
            )}
          </p>

          {copyGroups.length === 0 ? (
            <div className="empty">複製できる過去の作業予定がありません。</div>
          ) : (
            <div className="copy-list">
              {copyGroups.map((g) => {
                const allOn = g.items.every((r) => copySel.has(r.id));
                return (
                  <div className="copy-group" key={g.company}>
                    <div className="copy-group-head">
                      <span className="copy-group-name">{g.company}</span>
                      <button className="linklike" onClick={() => toggleCopyGroup(g.items)}>
                        {allOn ? "選択を解除" : "すべて選択"}
                      </button>
                    </div>
                    {g.items.map((r) => (
                      <label
                        className={"copy-row" + (copySel.has(r.id) ? " on" : "")}
                        key={r.id}
                      >
                        <input
                          type="checkbox"
                          checked={copySel.has(r.id)}
                          onChange={() => toggleCopy(r.id)}
                        />
                        <span className="copy-date">{formatDateStr(r.date)}</span>
                        <span className="copy-job">
                          {r.industry}／{r.jobType}
                        </span>
                        <span className="copy-loc">
                          {[r.building, r.floor, r.area, r.zone].filter(Boolean).join(" / ")}
                        </span>
                        <span className="copy-content">{r.content}</span>
                        <span className="copy-workers">{totalWorkers(r)} 名</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* 確定ダイアログ（全未確定を一括確定・元請安全指示事項を入力） */}
      {confirmDraft && (
        <Modal
          wide
          title="作業予定の確定"
          onClose={() => setConfirmDraft(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setConfirmDraft(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitConfirm}>
                確定する（{confirmDraft.length} 件）
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            未確定の作業予定をまとめて確定します。各作業の元請安全指示事項を入力してください。
          </p>
          <div className="batch-list">
            {confirmDraft.map((d, i) => (
              <div className="batch-item" key={d.id}>
                <div className="batch-head">
                  {d.company}／{d.jobType}／{d.content}（{d.building} {d.floor}）
                </div>
                <TextAreaField
                  full
                  required
                  maxLength={255}
                  label="元請安全指示事項"
                  value={d.safetyNote}
                  onChange={(v) =>
                    setConfirmItem(i)((x) => ({ ...x, safetyNote: v }))
                  }
                  placeholder="確定にあたっての安全指示を記入（必須・255文字まで）"
                  history={safetyHistoryFor(d.company)}
                />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* 実績入力ダイアログ（全確定済みを一括入力） */}
      {actualDraft && (
        <Modal
          wide
          title="作業人数（実績）の入力"
          onClose={() => setActualDraft(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setActualDraft(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitActual}>
                保存（{actualDraft.length} 件）
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            確定済みの各作業について、作業人数（実績）を入力してください。
          </p>
          <div className="batch-list">
            {groupDraftByCompany(actualDraft).map((g) => (
              <div className="batch-company" key={g.company}>
                <div className="batch-company-head">
                  <span className="bc-name">{g.company}</span>
                  {g.hasAttendance && (
                    <span className="bc-attend" title="DNN（出面管理）連携の入場人数">
                      入場人数 <strong>{g.attendance}</strong> 名
                    </span>
                  )}
                </div>
                {g.items.map(({ item: d, index: i }) => (
                  <div className="batch-item" key={d.id}>
                    <div className="batch-head">
                      {d.jobType}／{d.content}
                    </div>
                    <div className="worker-grid">
                      {patternRow(d, setActualItem(i), "通常作業", "actualNormalWorkers", "actualNormalHours", d.plannedNormalWorkers)}
                      {patternRow(d, setActualItem(i), "早出・残業作業", "actualOvertimeWorkers", "actualOvertimeHours", d.plannedOvertimeWorkers)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* 出力プレビュー（確定済みのみ） */}
      {showPrint && (
        <PrintPreview
          title="作業予定一覧 － 出力プレビュー"
          onClose={() => setShowPrint(false)}
        >
          <SchedulePrint
            date={date}
            rows={approvedRows}
            manager={WA_PRIME_USERS[0].name}
          />
        </PrintPreview>
      )}
    </div>
  );
}
