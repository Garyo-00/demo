import { useState, useRef, useEffect, Fragment } from "react";
import {
  WA_COMPANIES,
  WA_VEHICLE_TYPES,
  WA_MY_COMPANY,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import PrintPreview from "../components/wa/PrintPreview.jsx";
import ReservationPrint from "../components/wa/ReservationPrint.jsx";
import { SuggestField, SelectField, ReadonlyField } from "../components/wa/Field.jsx";
import {
  DAY_START,
  DAY_END,
  makeHours,
  toHour,
  layoutLabeled,
  overlapBands,
  pctHour,
  LABEL_COL,
  INSET,
} from "../components/wa/rsvTimeline.js";
import {
  useWaSettings,
  settingsKeyOf,
  spotDurations,
  intervalMinutes,
} from "../components/wa/WaSettingsContext.jsx";
import printIcon from "../assets/icons/print.svg";
import TablePagination from "../components/wa/TablePagination.jsx";

// タブ表示順（揚重機 → ゲート → その他）
const KINDS_ALL = ["lift", "gate", "aerial"];
const CONTENT_MAX = 25; // 作業内容の文字数上限
const REMARK_MAX = 25; // 備考の文字数上限

// 予約時刻の選択肢（「予約時間間隔設定」のステップ＝15/30/60分に従う。範囲は予約時間設定に準拠）
function makeTimeOptions(stepMin, start = DAY_START, end = DAY_END) {
  const opts = [];
  for (let t = start * 60; t <= end * 60; t += stepMin) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return opts;
}

// "HH:MM" に分を加算（1日の終了時刻でクランプ）
function addMinutes(hhmm, min, end = DAY_END) {
  const [h, m] = hhmm.split(":").map(Number);
  let total = Math.min(h * 60 + m + min, end * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
// 所要時間（分）
const durationMin = (start, end) => Math.round((toHour(end) - toHour(start)) * 60);

// 予約タブ（資源種別）のラベル
const KIND_LABEL = { lift: "揚重機", gate: "ゲート", aerial: "資機材・その他" };

function emptyRsv(kind, date, resvType = "normal", resource = "") {
  return {
    id: "",
    kind,
    resource,
    company: "",
    date,
    start: "08:00",
    end: "10:00",
    content: "",
    remark: "",
    vehicleType: kind === "gate" ? WA_VEHICLE_TYPES[0] : "",
    resvType,
  };
}

// ===== 2部制（AM/PM）予約グリッド用ヘルパー =====
const pad2 = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];
const dayLabel = (d) => `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY[d.getDay()]}）`;
// 今日から7日間
function computeWeek() {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(base);
    x.setDate(base.getDate() + i);
    return x;
  });
}
// 2部制：ログインユーザーの会社・氏名（アカウントに紐づく想定。デモ用の固定値）
const MY_COMPANY = WA_MY_COMPANY; // 大和建設
const MY_USER = "佐藤 健";

// restrictAerial: 資機材・その他タブのみ表示（アカウントなし予約ポータル用）
// guest: アカウントなし（元請の出力・確定を非表示）
export default function WorkAdjustReservation({ restrictAerial = false, guest = false } = {}) {
  // 共通の作業日／登録済みの資機材・ゲート／予約（共有）
  const {
    interval, time, date, gates, lifts, equipment, role,
    reservations: rows, setReservations: setRows,
  } = useWaSettings();
  const KINDS = restrictAerial ? ["aerial"] : KINDS_ALL;
  // 元請のみの操作（出力・確定）。アカウントなし（guest）では非表示
  const canManage = !guest && role === "prime";
  const [kindState, setKind] = useState(restrictAerial ? "aerial" : "gate");
  // aerial限定時は常に資機材・その他タブを表示
  const kind = restrictAerial ? "aerial" : kindState;
  // 資機材・その他タブの表示（時間制／2部制）。デモ用のビュー切替。
  // 予約方法は資機材ごとに「資機材・ゲート登録」で設定。ここのトグルは表示中の予約方法の切替。
  const [aerialView, setAerialView] = useState("2部制");
  const [editing, setEditing] = useState(null);
  const [seq, setSeq] = useState(rows.length);
  const [showPrint, setShowPrint] = useState(false);
  // 資機材・その他タブのカテゴリ絞り込み（プルダウンからの複数選択。空＝すべて）
  const [cats, setCats] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  // 予約テーブル（機械の行）のページネーション（50件ずつ）
  const [rsvPage, setRsvPage] = useState(0);
  const [rsvPageSize, setRsvPageSize] = useState(50);
  // 2部制（AM/PM）の予約枠。今日から7日間（日付送りの影響を受けず固定）。key = 資源|日付|am/pm → {company, user}
  const [week] = useState(computeWeek);
  const nowHour = new Date().getHours(); // 当日枠の予約可否判定に使用
  const [slotDialog, setSlotDialog] = useState(null); // 自社予約の詳細・取消ダイアログ {res,d,p}
  const [slots, setSlots] = useState(() => {
    const s = {};
    const set = (res, di, p, co, user) => {
      s[`${res}|${dayKey(week[di])}|${p}`] = { company: co, user: user || "" };
    };
    // 他社の既存予約（重複予約できないことの確認用サンプル）
    set("高所作業車 4.5m-001号", 0, "am", "青木工業", "鈴木 一郎");
    set("高所作業車 4.5m-002号", 1, "pm", "みらい電気", "高橋 誠");
    set("高所作業車 4.5m-003号", 0, "am", "青木工業", "鈴木 一郎");
    set("高所作業車 4.5m-005号", 2, "pm", "山本電気", "山本 健太");
    set("駐車場-001", 0, "pm", "東洋設備", "伊藤 大輔");
    set("駐車場-002", 3, "am", "渡辺工務店", "渡辺 浩");
    set("駐車場-004", 1, "am", "林基礎", "林 大樹");
    return s;
  });
  // 当日枠の予約可否（当日0時以降はAM不可、当日12時以降はPM不可。dayIndex 0＝今日）
  function slotDisabled(dayIndex, p) {
    if (dayIndex !== 0) return false;
    return p === "am" || (p === "pm" && nowHour >= 12);
  }
  // 空き枠を自社（ログイン会社）で予約
  function bookSlot(res, d, p) {
    const key = `${res}|${dayKey(d)}|${p}`;
    setSlots((s) => ({ ...s, [key]: { company: MY_COMPANY, user: MY_USER } }));
  }
  // 自社予約の取消（詳細ダイアログから）
  function cancelSlot() {
    const { res, d, p } = slotDialog;
    const key = `${res}|${dayKey(d)}|${p}`;
    setSlots((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
    setSlotDialog(null);
  }
  // 確定は日付単位・全タブ（揚重機/ゲート/その他）共通
  const [confirmedDays, setConfirmedDays] = useState({});
  const isConfirmed = !!confirmedDays[date];

  // トラック（タイムライン）のピクセル幅を計測（ラベル配置の計算に使用）
  const boardRef = useRef(null);
  const [trackW, setTrackW] = useState(900);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - LABEL_COL;
      if (w > 0) setTrackW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isGate = kind === "gate";
  const isAerial = kind === "aerial";
  // 予約時間設定（1日の予約可能時間）に準拠して時刻の表示範囲を決める
  const timeKey = kind === "lift" ? "lift" : kind === "gate" ? "gate" : "material";
  const dayRange = time?.[timeKey] || { start: DAY_START, end: DAY_END };
  const dayStart = dayRange.start;
  const dayEnd = dayRange.end;
  const HOURS_DYN = makeHours(dayStart, dayEnd);
  // タブに対応する登録一覧（揚重機/ゲート/資機材）→ 予約表示ONのものだけを資源として表示
  const registryForKind = kind === "lift" ? lifts : kind === "gate" ? gates : equipment;
  const shownRegistry = registryForKind.filter((x) => x.show);
  // 資機材・その他はカテゴリで絞り込み可能（複数選択。他タブは対象外）
  const catList = isAerial ? [...new Set(shownRegistry.map((x) => x.category))] : [];
  const filteredRegistry =
    isAerial && cats.length
      ? shownRegistry.filter((x) => cats.includes(x.category))
      : shownRegistry;
  // 資機材・その他は、資機材ごとの「予約方法」（資機材・ゲート登録で設定）に一致するものだけ表示。
  // 表示中の予約方法は下部のトグル（時間制／2部制）で切替える。他タブは全て時間制。
  const methodRegistry = isAerial
    ? filteredRegistry.filter(
        (x) => ((x.reserveType || "2部制") === "2部制") === (aerialView === "2部制")
      )
    : filteredRegistry;
  const resourceItems = methodRegistry.map((x) => x.name);
  const resource = { label: KIND_LABEL[kind], items: resourceItems };
  // 表示中の日付・資源種別の予約のみ
  const visible = rows.filter((r) => r.kind === kind && r.date === date);

  // スポット予約の所要時間候補・予約時刻の選択肢（時間間隔設定に依存）
  const intervalLabel = interval[settingsKeyOf(kind)];
  const spotDurs = spotDurations(intervalLabel);
  const TIME_OPTIONS = makeTimeOptions(intervalMinutes(intervalLabel), dayStart, dayEnd);
  const isSpot = editing?.resvType === "spot";
  // 予約方法（資機材ごとの設定）が「2部制」の資機材・その他は、AM/PMの週間グリッドで予約する
  const twoShift = isAerial && aerialView === "2部制";
  // 機械の行を50件ずつページ表示（縦に長い場合はページ送り）
  const rsvPageCount = Math.max(1, Math.ceil(resourceItems.length / rsvPageSize));
  const rsvSafePage = Math.min(rsvPage, rsvPageCount - 1);
  const pagedItems = resourceItems.slice(
    rsvSafePage * rsvPageSize,
    rsvSafePage * rsvPageSize + rsvPageSize
  );
  // タブ・カテゴリを切り替えたら1ページ目に戻す
  useEffect(() => {
    setRsvPage(0);
  }, [kind, cats, aerialView]);

  // 予約種別の切替（スポットにしたら所要時間を先頭候補に合わせる）
  function setResvType(t) {
    setEditing((x) => {
      if (t === "spot") {
        return { ...x, resvType: "spot", end: addMinutes(x.start, spotDurs[0], dayEnd) };
      }
      return { ...x, resvType: "normal" };
    });
  }
  // 開始変更（スポットは所要時間を維持して終了を再計算）
  function setStart(v) {
    setEditing((x) => {
      if (x.resvType === "spot") {
        const dur = durationMin(x.start, x.end);
        const use = spotDurs.includes(dur) ? dur : spotDurs[0];
        return { ...x, start: v, end: addMinutes(v, use, dayEnd) };
      }
      return { ...x, start: v };
    });
  }
  function setSpotDur(dur) {
    setEditing((x) => ({ ...x, end: addMinutes(x.start, dur, dayEnd) }));
  }
  // 予約バーのクリック（確定済みの予約は通常・スポットとも編集不可。
  // 確定後に追加したスポット予約は未確定なので編集・削除できる）
  function openBlock(b) {
    // スポット予約は「確定」の概念を持たないため、確定状態でも編集・削除できる
    if (b.confirmed && b.resvType !== "spot") return;
    setEditing({ ...b });
  }

  function save() {
    const row = editing;
    // 必須：資源・協力会社名・車種（ゲート）・作業内容
    if (!row.resource) { window.alert(`${resource.label}を選択してください。`); return; }
    if (!row.company || !row.company.trim()) { window.alert("協力会社名を入力してください。"); return; }
    if (row.kind === "gate" && !row.vehicleType) { window.alert("車種を選択してください。"); return; }
    if (!row.content || !row.content.trim()) { window.alert("作業内容を入力してください。"); return; }
    if (row.id) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? row : r)));
    } else {
      const n = seq + 1;
      setSeq(n);
      setRows((rs) => [...rs, { ...row, id: "RSV-" + String(n).padStart(3, "0") }]);
    }
    setEditing(null);
  }
  function remove() {
    setRows((rs) => rs.filter((r) => r.id !== editing.id));
    setEditing(null);
  }

  return (
    <div>
      <div className="page-title">予約</div>

      <div className="tabs">
        {KINDS.map((k) => (
          <button
            key={k}
            className={"tab" + (kind === k ? " on" : "")}
            onClick={() => setKind(k)}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <span className="subtle">
          {twoShift ? `${resourceItems.length} 台` : `${visible.length} 件`}
        </span>
        {!twoShift && canManage && (
          <button className="ghost-btn spacer" onClick={() => setShowPrint(true)}>
            <img className="ic-btn" src={printIcon} alt="" />出力
          </button>
        )}
        {!twoShift && (
          <button
            className={"primary-btn" + (canManage ? "" : " spacer")}
            onClick={() => {
              const base = emptyRsv(kind, date, isConfirmed ? "spot" : "normal", resourceItems[0] || "");
              if (base.resvType === "spot") base.end = addMinutes(base.start, spotDurs[0], dayEnd);
              setEditing(base);
            }}
            disabled={resourceItems.length === 0}
            title={isConfirmed ? "確定後はスポット予約のみ作成できます" : ""}
          >
            ＋ {isConfirmed ? "スポット予約作成" : "予約作成"}
          </button>
        )}
      </div>

      {isAerial && (
        <div className="filters">
          <span className="subtle" style={{ fontSize: 12 }}>カテゴリ：</span>
          <div className="ms-dd">
            <button
              type="button"
              className="ms-dd-btn"
              onClick={() => setCatOpen((o) => !o)}
              aria-expanded={catOpen}
            >
              <span className="ms-dd-text">
                {cats.length === 0 ? "すべて" : cats.join("、")}
              </span>
              <span className="ms-dd-caret">▾</span>
            </button>
            {catOpen && (
              <>
                <div className="ms-dd-backdrop" onClick={() => setCatOpen(false)} />
                <div className="ms-dd-panel">
                  {catList.map((c) => (
                    <label className="ms-dd-item" key={c}>
                      <input
                        type="checkbox"
                        checked={cats.includes(c)}
                        onChange={(e) =>
                          setCats((prev) =>
                            e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)
                          )
                        }
                      />
                      {c}
                    </label>
                  ))}
                  {cats.length > 0 && (
                    <button className="ms-dd-clear" onClick={() => setCats([])}>
                      クリア（すべて表示）
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 予約方法の表示切替（右端・2部制→時間制の順） */}
          <div className="filters-view">
            <span className="subtle" style={{ fontSize: 12 }}>表示：</span>
            <div className="role-switch" role="group" aria-label="予約方法の表示切替">
              <button
                className={"role-seg" + (aerialView === "2部制" ? " active" : "")}
                onClick={() => setAerialView("2部制")}
              >
                2部制
              </button>
              <button
                className={"role-seg" + (aerialView === "時間制" ? " active" : "")}
                onClick={() => setAerialView("時間制")}
              >
                時間制
              </button>
            </div>
          </div>
        </div>
      )}

      {twoShift ? (
        <div className="rsv-scroll">
          <table className="shift-grid">
            <thead>
              <tr>
                <th className="shift-res-h" rowSpan={2}>機械名・現場内呼称</th>
                {week.map((d, i) => (
                  <th
                    key={i}
                    colSpan={2}
                    className={"shift-day" + (d.getDay() === 0 || d.getDay() === 6 ? " wend" : "")}
                  >
                    {dayLabel(d)}
                  </th>
                ))}
              </tr>
              <tr>
                {week.flatMap((d, i) => [
                  <th key={i + "a"} className="shift-ap">AM</th>,
                  <th key={i + "p"} className="shift-ap">PM</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((res) => (
                <tr key={res}>
                  <td className="shift-res">{res}</td>
                  {week.flatMap((d, i) =>
                    ["am", "pm"].map((p) => {
                      const val = slots[`${res}|${dayKey(d)}|${p}`];
                      const mine = val && val.company === MY_COMPANY;
                      const disabled = slotDisabled(i, p);
                      return (
                        <td key={`${i}-${p}`} className="shift-cell">
                          {val && !mine ? (
                            <span className="shift-slot other" title={`${val.company} 予約済`}>{val.company}</span>
                          ) : mine ? (
                            <button
                              className="shift-slot self"
                              onClick={() => setSlotDialog({ res, d, p })}
                              title="自社予約（クリックで詳細・取消）"
                            />
                          ) : disabled ? (
                            <span className="shift-slot disabled" title="当日のため予約できません" />
                          ) : (
                            <button
                              className="shift-slot"
                              onClick={() => bookSlot(res, d, p)}
                              title="空き（クリックで予約）"
                            />
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="rsv-scroll">
      <div className="rsv-board" ref={boardRef}>
        <div className="rsv-corner">{resource.label}＼時刻</div>
        <div className="rsv-hours" style={{ gridTemplateColumns: `repeat(${HOURS_DYN.length}, 1fr)` }}>
          {HOURS_DYN.map((h) => (
            <div key={h} className="rsv-hour">
              {h}:00
            </div>
          ))}
        </div>
        {pagedItems.map((item) => {
          const blocks = visible.filter((r) => r.resource === item);
          const { height, rowH, barH, placed } = layoutLabeled(blocks, trackW, isGate, dayStart, dayEnd);
          // 通常予約が重複している時間帯（薄い赤の背景）
          const bands = overlapBands(blocks);
          return (
            <div className="rsv-head" key={item}>
              {/* 資源名は自然な高さ（長い名称は折り返し）。行の高さは名称と予約分の大きい方 */}
              <div className="rsv-reslabel">{item}</div>
              <div className="rsv-track" style={{ minHeight: height }}>
                {bands.map(([s, e], i) => (
                  <div
                    key={"ov" + i}
                    className="rsv-overlap"
                    style={{ left: pctHour(s, dayStart, dayEnd) + "%", width: pctHour(e, dayStart, dayEnd) - pctHour(s, dayStart, dayEnd) + "%" }}
                    title="通常予約が重複しています"
                  />
                ))}
                {placed.map((b) => {
                  const spot = b.resvType === "spot";
                  const barTop = b.row * rowH + (rowH - barH) / 2;
                  const title =
                    `${spot ? "[スポット] " : ""}${b.company}｜${b.start}〜${b.end}` +
                    (isGate && b.vehicleType ? `｜${b.vehicleType}` : "") +
                    (b.content ? `｜${b.content}` : "");
                  // ラベルはバー左端から表示（右流し）／右端では左流し
                  const labelStyle =
                    b.side === "right"
                      ? { left: b.barLeft + INSET, top: b.row * rowH, height: rowH }
                      : { right: trackW - b.barRight + INSET, top: b.row * rowH, height: rowH };
                  // 確定済みの「通常予約」のみグレーアウト（編集不可）。
                  // スポット予約は確定の概念を持たないため常に編集可＝グレーアウトしない。
                  const grayed = b.confirmed && b.resvType !== "spot" ? " confirmed" : "";
                  return (
                    <Fragment key={b.id}>
                      {/* 予約バー（色のみ・テキストは重ねて表示） */}
                      <div
                        className={"rsv-bar" + (spot ? " spot" : "") + grayed}
                        style={{ left: b.barLeft, width: b.barW, top: barTop, height: barH }}
                        onClick={() => openBlock(b)}
                        title={title}
                      />
                      {/* ラベル。ゲートは車種を2行目に改行 */}
                      <div
                        className={"rsv-tlabel " + b.side + (spot ? " spot" : "") + grayed}
                        style={labelStyle}
                        onClick={() => openBlock(b)}
                        title={title}
                      >
                        <span className="tl-line">
                          <b className="tl-co">{b.company}</b>
                          {b.content && <span className="tl-cont">{b.content}</span>}
                          <span className="tl-time">
                            {b.start}〜{b.end}
                          </span>
                        </span>
                        {isGate && b.vehicleType && (
                          <span className="rsv-veh">{b.vehicleType}</span>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      )}

      <TablePagination
        total={resourceItems.length}
        page={rsvSafePage}
        pageSize={rsvPageSize}
        onPage={setRsvPage}
        onPageSize={(n) => { setRsvPageSize(n); setRsvPage(0); }}
      />

      {/* 確定（日付単位・全タブ共通）。その日の予約（通常・スポット）をまとめて確定（元請ビューのみ）。2部制は対象外 */}
      {!twoShift && canManage && (
      <div className="confirm-bar bare">
        {isConfirmed ? (
          <>
            <span className="badge-green">確定済</span>
            <button
              className="ghost-btn"
              onClick={() => {
                setConfirmedDays((d) => ({ ...d, [date]: false }));
                setRows((rs) =>
                  rs.map((r) => (r.date === date ? { ...r, confirmed: false } : r))
                );
              }}
            >
              確定解除
            </button>
          </>
        ) : (
          <button
            className="primary-btn big"
            onClick={() => {
              setConfirmedDays((d) => ({ ...d, [date]: true }));
              setRows((rs) =>
                rs.map((r) => (r.date === date ? { ...r, confirmed: true } : r))
              );
            }}
          >
            確定
          </button>
        )}
      </div>
      )}

      {twoShift ? (
        <>
          <div className="rsv-legend">
            <span className="lg-item"><span className="shift-slot" />空き</span>
            <span className="lg-item"><span className="shift-slot self" />自社予約</span>
            <span className="lg-item"><span className="shift-slot other">他社</span>他社予約（不可）</span>
            <span className="lg-item"><span className="shift-slot disabled" />予約不可（当日）</span>
          </div>
          <p className="rsv-note">
            ※ <strong>2部制</strong>表示（予約方法＝2部制の資機材。予約方法は<strong>資機材・ゲート登録</strong>で資機材ごとに設定）。各機械について<strong>今日から7日間（固定・日付送りの影響なし）</strong>の午前（AM）／午後（PM）枠を選択して予約します。予約者の会社名はログインアカウントから自動反映されます（デモ：{MY_COMPANY}／{MY_USER}）。
            <br />
            ※ 空き枠をクリックで自社予約（青）。自社予約をクリックすると<strong>予約者・会社名の詳細と取消</strong>ができます（取消は予約者・元請のみ）。<strong>他社が予約済みの枠は選択できません（重複予約不可）</strong>。
            <br />
            ※ <strong>当日はAM予約不可</strong>、<strong>当日12時以降はPM予約不可</strong>です。
          </p>
        </>
      ) : (
        <>
          <div className="rsv-legend">
            <span className="lg-item"><span className="lg-chip normal" />通常予約</span>
            <span className="lg-item"><span className="lg-chip spot" />スポット予約（15〜60分）</span>
          </div>
          <p className="rsv-note">
            ※ デモでは枠をクリックして編集・削除できます（実運用ではドラッグで新規作成）。予約時間の間隔は<strong>「予約時間間隔設定」の設定</strong>に従います（現在：{intervalLabel}）。
            <br />
            ※ 確定は<strong>すべてのタブ（揚重機／ゲート／資機材・その他）共通（日付単位）</strong>です。確定すると<strong>通常予約がグレーアウト（編集不可）</strong>になります。確定後は<strong>通常予約は作成できず、スポット予約のみ追加</strong>できます。<strong>スポット予約は「確定」の概念を持たず、確定状態でも常に編集・削除できます</strong>（削除は表示OFF＝記録は保持）。
          </p>
        </>
      )}

      {editing && (
        <Modal
          title={editing.id ? "予約の編集" : "予約作成"}
          onClose={() => setEditing(null)}
          footer={
            <>
              {editing.id && (
                <button className="mini-btn danger" onClick={remove}>
                  削除
                </button>
              )}
              <button className="ghost-btn spacer" onClick={() => setEditing(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={save}>
                保存
              </button>
            </>
          }
        >
          <div className="form-grid">
            <SelectField
              label="予約種別"
              value={editing.resvType}
              onChange={setResvType}
              hint={isConfirmed ? "確定後はスポット予約のみ" : undefined}
              options={
                isConfirmed
                  ? [{ value: "spot", label: "スポット予約" }]
                  : [
                      { value: "normal", label: "通常予約" },
                      { value: "spot", label: "スポット予約" },
                    ]
              }
            />
            <SelectField
              label={resource.label + "選択"}
              required
              value={editing.resource}
              onChange={(v) => setEditing((x) => ({ ...x, resource: v }))}
              options={resource.items}
            />
            <SuggestField
              label="協力会社名"
              required
              value={editing.company}
              onChange={(v) => setEditing((x) => ({ ...x, company: v }))}
              options={WA_COMPANIES}
            />
            {isGate && (
              <SelectField
                label="車種"
                required
                value={editing.vehicleType}
                onChange={(v) => setEditing((x) => ({ ...x, vehicleType: v }))}
                options={WA_VEHICLE_TYPES}
              />
            )}
            <ReadonlyField label="日付" value={formatDateStr(editing.date)} />
            <SelectField
              label="開始"
              value={editing.start}
              onChange={setStart}
              options={TIME_OPTIONS}
            />
            {isSpot ? (
              <SelectField
                label="所要時間"
                value={durationMin(editing.start, editing.end)}
                onChange={(v) => setSpotDur(Number(v))}
                options={spotDurs.map((d) => ({ value: d, label: d + "分" }))}
                hint={`スポットは ${intervalLabel} 間隔で15〜60分（終了 ${editing.end}）`}
              />
            ) : (
              <SelectField
                label="終了"
                value={editing.end}
                onChange={(v) => setEditing((x) => ({ ...x, end: v }))}
                options={TIME_OPTIONS}
              />
            )}
            <SuggestField
              full
              label="作業内容"
              required
              value={editing.content}
              onChange={(v) => setEditing((x) => ({ ...x, content: v }))}
              options={["生コン搬入", "資材搬入", "鉄骨揚重", "設備機器揚重", "高所作業"]}
              maxLength={CONTENT_MAX}
              hint={`最大 ${CONTENT_MAX} 文字（必須）`}
            />
            <div className="field full">
              <label>備考</label>
              <textarea
                value={editing.remark || ""}
                onChange={(e) => setEditing((x) => ({ ...x, remark: e.target.value }))}
                placeholder="備考（任意・25文字まで）"
                maxLength={REMARK_MAX}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 2部制：自社予約の詳細・取消ダイアログ */}
      {slotDialog && (
        <Modal
          title="2部制予約の詳細"
          onClose={() => setSlotDialog(null)}
          footer={
            <>
              <button className="mini-btn danger" onClick={cancelSlot}>
                取消
              </button>
              <button className="ghost-btn spacer" onClick={() => setSlotDialog(null)}>
                キャンセル
              </button>
            </>
          }
        >
          <div className="form-grid">
            <ReadonlyField label="機械・現場内呼称" value={slotDialog.res} />
            <ReadonlyField label="日付" value={dayLabel(slotDialog.d)} />
            <ReadonlyField label="区分" value={slotDialog.p === "am" ? "午前（AM）" : "午後（PM）"} />
            <ReadonlyField label="予約者" value={MY_USER} />
            <ReadonlyField label="会社名" value={MY_COMPANY} />
          </div>
        </Modal>
      )}

      {/* 出力プレビュー（現在のタブ＝資源種別ごと） */}
      {showPrint && (
        <PrintPreview
          title={`予約表（${resource.label}） － 出力プレビュー`}
          onClose={() => setShowPrint(false)}
        >
          <ReservationPrint
            date={date}
            label={resource.label}
            isGate={isGate}
            items={resource.items}
            reservations={visible}
            dayStart={dayStart}
            dayEnd={dayEnd}
          />
        </PrintPreview>
      )}
    </div>
  );
}
