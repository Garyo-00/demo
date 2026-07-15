import { useState, useRef, useEffect, Fragment } from "react";
import {
  WA_COMPANIES,
  WA_VEHICLE_TYPES,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import PrintPreview from "../components/wa/PrintPreview.jsx";
import ReservationPrint from "../components/wa/ReservationPrint.jsx";
import { SuggestField, SelectField, ReadonlyField } from "../components/wa/Field.jsx";
import {
  DAY_START,
  DAY_END,
  HOURS,
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
} from "../components/wa/WaSettingsContext.jsx";
import printIcon from "../assets/icons/print.svg";

// タブ表示順（揚重機 → ゲート → その他）
const KINDS = ["lift", "gate", "aerial"];
const CONTENT_MAX = 25; // 作業内容の文字数上限

// 予約時間は15分単位
const TIME_OPTIONS = [];
for (let h = DAY_START; h <= DAY_END; h++) {
  for (const m of [0, 15, 30, 45]) {
    if (h === DAY_END && m > 0) break;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// "HH:MM" に分を加算（1日の終了時刻でクランプ）
function addMinutes(hhmm, min) {
  const [h, m] = hhmm.split(":").map(Number);
  let total = Math.min(h * 60 + m + min, DAY_END * 60);
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

export default function WorkAdjustReservation() {
  // 共通の作業日／登録済みの資機材・ゲート／予約（共有）
  const {
    interval, date, gates, lifts, equipment,
    reservations: rows, setReservations: setRows,
  } = useWaSettings();
  const [kind, setKind] = useState("gate");
  const [editing, setEditing] = useState(null);
  const [seq, setSeq] = useState(rows.length);
  const [showPrint, setShowPrint] = useState(false);
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
  // タブに対応する登録一覧（揚重機/ゲート/資機材）→ 予約表示ONのものだけを資源として表示
  const registryForKind = kind === "lift" ? lifts : kind === "gate" ? gates : equipment;
  const resourceItems = registryForKind.filter((x) => x.show).map((x) => x.name);
  const resource = { label: KIND_LABEL[kind], items: resourceItems };
  // 表示中の日付・資源種別の予約のみ
  const visible = rows.filter((r) => r.kind === kind && r.date === date);

  // スポット予約の所要時間候補（時間間隔設定に依存）
  const intervalLabel = interval[settingsKeyOf(kind)];
  const spotDurs = spotDurations(intervalLabel);
  const isSpot = editing?.resvType === "spot";

  // 予約種別の切替（スポットにしたら所要時間を先頭候補に合わせる）
  function setResvType(t) {
    setEditing((x) => {
      if (t === "spot") {
        return { ...x, resvType: "spot", end: addMinutes(x.start, spotDurs[0]) };
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
        return { ...x, start: v, end: addMinutes(v, use) };
      }
      return { ...x, start: v };
    });
  }
  function setSpotDur(dur) {
    setEditing((x) => ({ ...x, end: addMinutes(x.start, dur) }));
  }
  // 予約バーのクリック（確定後は通常予約を編集不可・スポットのみ可）
  function openBlock(b) {
    if (isConfirmed && b.resvType !== "spot") return;
    setEditing({ ...b });
  }

  function save() {
    const row = editing;
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
      <div className="crumb">予約</div>
      <strong style={{ fontSize: 15 }}>予約</strong>

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
        <span className="subtle">{visible.length} 件</span>
        <button className="ghost-btn spacer" onClick={() => setShowPrint(true)}>
          <img className="ic-btn" src={printIcon} alt="" />出力
        </button>
        <button
          className="primary-btn"
          onClick={() => {
            const base = emptyRsv(kind, date, isConfirmed ? "spot" : "normal", resourceItems[0] || "");
            if (base.resvType === "spot") base.end = addMinutes(base.start, spotDurs[0]);
            setEditing(base);
          }}
          disabled={resourceItems.length === 0}
          title={isConfirmed ? "確定後はスポット予約のみ作成できます" : ""}
        >
          ＋ {isConfirmed ? "スポット予約作成" : "予約作成"}
        </button>
      </div>

      <div className="rsv-scroll">
      <div className="rsv-board" ref={boardRef}>
        <div className="rsv-corner">{resource.label}＼時刻</div>
        <div className="rsv-hours" style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)` }}>
          {HOURS.map((h) => (
            <div key={h} className="rsv-hour">
              {h}:00
            </div>
          ))}
        </div>
        {resource.items.map((item) => {
          const blocks = visible.filter((r) => r.resource === item);
          const { height, rowH, barH, placed } = layoutLabeled(blocks, trackW, isGate);
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
                    style={{ left: pctHour(s) + "%", width: pctHour(e) - pctHour(s) + "%" }}
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
                  // 確定後の通常予約はグレーアウト（スポットは対象外）
                  const grayed = isConfirmed && !spot ? " confirmed" : "";
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

      {/* 確定（日付単位・全タブ共通） */}
      <div className="confirm-bar">
        {isConfirmed ? (
          <>
            <span className="badge-green">確定済</span>
            <button
              className="ghost-btn"
              onClick={() => setConfirmedDays((d) => ({ ...d, [date]: false }))}
            >
              確定解除
            </button>
          </>
        ) : (
          <button
            className="primary-btn big"
            onClick={() => setConfirmedDays((d) => ({ ...d, [date]: true }))}
          >
            確定
          </button>
        )}
      </div>

      <div className="rsv-legend">
        <span className="lg-item"><span className="lg-chip normal" />通常予約</span>
        <span className="lg-item"><span className="lg-chip spot" />スポット予約（15〜60分）</span>
      </div>
      <p className="rsv-note">
        ※ デモでは枠をクリックして編集・削除できます（実運用ではドラッグで新規作成）。予約時間は15分単位です。
        <br />
        ※ スポット予約の所要時間は「予約時間間隔設定」に依存します（現在：{intervalLabel} → {spotDurs.map((d) => d + "分").join(" / ")}）。
        <br />
        ※ 確定は<strong>すべてのタブ（揚重機／ゲート／資機材・その他）共通（日付単位）</strong>です。確定後は<strong>通常予約はできず、スポット予約のみ</strong>作成・編集できます。
      </p>

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
              value={editing.content}
              onChange={(v) => setEditing((x) => ({ ...x, content: v }))}
              options={["生コン搬入", "資材搬入", "鉄骨揚重", "設備機器揚重", "高所作業"]}
              maxLength={CONTENT_MAX}
              hint={`最大 ${CONTENT_MAX} 文字`}
            />
            <div className="field full">
              <label>備考</label>
              <textarea
                value={editing.remark || ""}
                onChange={(e) => setEditing((x) => ({ ...x, remark: e.target.value }))}
                placeholder="備考（任意）"
              />
            </div>
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
          />
        </PrintPreview>
      )}
    </div>
  );
}
