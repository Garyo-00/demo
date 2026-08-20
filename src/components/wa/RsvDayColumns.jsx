import { useEffect, useRef, useState } from "react";
import { layoutColumns, makeHours, overlapBands } from "./rsvTimeline.js";

// スマホの予約表示（時間制）。時刻を縦軸に取り、選んだ資源を列として横に並べて比較する。
// 資源は最大3つまで同時に表示できる（Googleカレンダーの日表示に近い見え方）。
export const MAX_COMPARE = 3;
const HOUR_PX = 52; // 1時間ぶんの高さ
const MIN_BLOCK_PX = 24; // 短い予約でも会社名が読める最低高さ
const GUTTER_PX = 46; // 左の時刻目盛りの幅（CSSの .rsvd-gutter と合わせる）
const READABLE_PX = 88; // これより狭い予約は会社名だけに絞る
const DRAG_THRESHOLD = 5; // これ以下の移動はタップ（編集を開く）として扱う

// 小数時 → "HH:MM"
function toHHMM(h) {
  const total = Math.round(h * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function RsvDayColumns({
  items,
  selected,
  onToggle,
  blocksOf,
  dayStart,
  dayEnd,
  isGate,
  onOpen,
  onClear,
  onCreate,
  onMove,
  canMove,
  stepMin,
  label,
}) {
  const [pickOpen, setPickOpen] = useState(false);
  const hours = makeHours(dayStart, dayEnd);
  const bodyHeight = (dayEnd - dayStart) * HOUR_PX;
  const y = (hour) => (hour - dayStart) * HOUR_PX;

  // 1列あたりの実幅を測る。列数と重なりの数で1件あたりの幅が変わるため、
  // 「詳細まで出すか会社名だけに絞るか」を実際の幅で判断する。
  const bodyRef = useRef(null);
  const [colWidth, setColWidth] = useState(0);
  const columnCount = Math.max(selected.length, 1);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      const w = (el.clientWidth - GUTTER_PX) / columnCount;
      if (w > 0) setColWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // selected.length も依存に入れる：0件（本体が未描画）から1件になったとき、
    // columnCount は 1 のままで変わらず、測り直しが走らないため
  }, [columnCount, selected.length]);

  // ===== 予約のドラッグ移動 =====
  // 時刻の刻みは「予約時間間隔設定」に従う（既定30分）。縦に動かせば時刻、
  // 横に動かせば別の資源へ移せる。しきい値以下の動きはタップ＝編集として扱う。
  const stepH = Math.max(stepMin, 1) / 60;
  const colRefs = useRef([]);
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null); // 描画用のプレビュー {id, startH, colIndex, dur}

  // ドロップ先の列（指の位置が乗っている列）。列の外なら元の列のまま
  function columnAt(clientX, fallback) {
    const hit = colRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return clientX >= r.left && clientX < r.right;
    });
    return hit === -1 ? fallback : hit;
  }
  function snapStart(hour, duration) {
    const snapped = Math.round(hour / stepH) * stepH;
    // 表示範囲からはみ出さないようにする
    return Math.min(Math.max(snapped, dayStart), dayEnd - duration);
  }

  function onBlockPointerDown(e, b, colIndex) {
    // 動かせない予約（確定済みの通常予約・他人の予約）はタップでの編集のみ
    if (!canMove?.(b)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      block: b,
      colIndex,
      x0: e.clientX,
      y0: e.clientY,
      dur: b.endH - b.startH,
      moved: false,
      preview: null,
    };
  }
  function onBlockPointerMove(e) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    const startH = snapStart(d.block.startH + dy / HOUR_PX, d.dur);
    const colIndex = columnAt(e.clientX, d.colIndex);
    d.preview = { id: d.block.id, startH, colIndex, dur: d.dur };
    setDrag(d.preview);
  }
  function onBlockPointerUp(e, b) {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) {
      // 動かせない予約：通常のタップとして編集を開く
      onOpen(b);
      return;
    }
    if (!d.moved || !d.preview) {
      onOpen(d.block); // 動いていない＝タップ
      return;
    }
    const { startH, colIndex } = d.preview;
    const resource = selected[colIndex];
    // 位置が変わっていなければ何もしない
    if (startH === d.block.startH && resource === d.block.resource) return;
    onMove?.(d.block, {
      resource,
      start: toHHMM(startH),
      end: toHHMM(startH + d.dur),
    });
  }
  function onBlockPointerCancel() {
    dragRef.current = null;
    setDrag(null);
  }

  // 空き部分のタップ → その時刻で作成（刻みに合わせて切り下げ）
  function onColumnClick(e, resourceName, colEl) {
    if (e.target.closest(".rsvd-ev")) return; // 予約の上は対象外
    if (!onCreate) return;
    const rect = colEl.getBoundingClientRect();
    const hour = dayStart + (e.clientY - rect.top) / HOUR_PX;
    const start = Math.min(Math.max(Math.floor(hour / stepH) * stepH, dayStart), dayEnd - stepH);
    onCreate(resourceName, toHHMM(start));
  }

  return (
    <div className="rsvd">
      {/* 資源が何台あってもUIの高さが変わらないよう、選択はプルダウン＋チェックボックスで行う
          （カテゴリ絞り込みと同じ .ms-dd のパターン） */}
      <div className="rsvd-pick">
        <span className="subtle" style={{ fontSize: 12 }}>
          比較する{label}：
        </span>
        <div className="ms-dd">
          <button
            type="button"
            className="ms-dd-btn"
            onClick={() => setPickOpen((o) => !o)}
            aria-expanded={pickOpen}
            disabled={items.length === 0}
          >
            <span className="ms-dd-text">
              {items.length === 0
                ? `予約表示ONの${label}がありません`
                : selected.length === 0
                ? "未選択"
                : selected.join("、")}
            </span>
            <span className="ms-dd-caret">▾</span>
          </button>
          {pickOpen && (
            <>
              <div className="ms-dd-backdrop" onClick={() => setPickOpen(false)} />
              <div className="ms-dd-panel">
                <div className="ms-dd-note">
                  最大{MAX_COMPARE}つまで選べます（{selected.length} / {MAX_COMPARE}）
                </div>
                {items.map((name) => {
                  const on = selected.includes(name);
                  return (
                    <label className="ms-dd-item" key={name}>
                      <input
                        type="checkbox"
                        checked={on}
                        // 3つ選択済みのときは、選択中のもの以外をチェックできなくする
                        disabled={!on && selected.length >= MAX_COMPARE}
                        onChange={() => onToggle(name)}
                      />
                      {name}
                    </label>
                  );
                })}
                {selected.length > 0 && (
                  <button className="ms-dd-clear" onClick={onClear}>
                    選択をクリア
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="empty">比較する{label}を選んでください（最大{MAX_COMPARE}つ）。</div>
      ) : (
        <div className="rsvd-grid">
          <div className="rsvd-colhead">
            <div className="rsvd-gutter-h" />
            {selected.map((name) => (
              <div className="rsvd-colname" key={name} title={name}>
                {name}
              </div>
            ))}
          </div>

          <div className="rsvd-body" ref={bodyRef} style={{ height: bodyHeight }}>
            <div className="rsvd-gutter">
              {hours.map((h) => (
                <div key={h} className="rsvd-hour" style={{ top: y(h) }}>
                  {h >= 24 ? `翌${h - 24}:00` : `${h}:00`}
                </div>
              ))}
            </div>

            {selected.map((name, colIndex) => {
              const blocks = blocksOf(name);
              const placed = layoutColumns(blocks);
              const bands = overlapBands(blocks);
              return (
                <div
                  className="rsvd-col"
                  key={name}
                  ref={(el) => (colRefs.current[colIndex] = el)}
                  onClick={(e) => onColumnClick(e, name, e.currentTarget)}
                >
                  {hours.map((h) => (
                    <div key={h} className="rsvd-line" style={{ top: y(h) }} />
                  ))}
                  {/* 通常予約が重なっている時間帯（PC表示と同じ薄い赤帯） */}
                  {bands.map(([s, e], i) => (
                    <div
                      key={"ov" + i}
                      className="rsvd-overlap"
                      style={{ top: y(s), height: Math.max((e - s) * HOUR_PX, 2) }}
                      title="通常予約が重複しています"
                    />
                  ))}
                  {placed.map((b) => {
                    const spot = b.resvType === "spot";
                    // 確定済みの通常予約のみグレーアウト（スポットは確定の概念を持たない）
                    const grayed = b.confirmed && !spot;
                    const width = 100 / b.lanes;
                    // 幅が足りないときは会社名だけに絞る（潰れた文字を並べない）。
                    // 作業内容・時間・車種はタップで開く詳細と title 属性で確認できる。
                    const tight = colWidth > 0 && colWidth / b.lanes < READABLE_PX;
                    const movable = !!canMove?.(b);
                    const beingDragged = drag?.id === b.id;
                    // 高さが足りないときも1行に収める
                    const short = (b.endH - b.startH) * HOUR_PX < 40;
                    const title =
                      `${spot ? "[スポット] " : ""}${b.company}｜${b.start}〜${b.end}` +
                      (isGate && b.vehicleType ? `｜${b.vehicleType}` : "") +
                      (b.content ? `｜${b.content}` : "");
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={
                          "rsvd-ev" +
                          (spot ? " spot" : "") +
                          (grayed ? " confirmed" : "") +
                          (tight ? " tight" : "") +
                          (movable ? " movable" : "") +
                          (beingDragged ? " dragging" : "")
                        }
                        style={{
                          top: y(b.startH),
                          height: Math.max((b.endH - b.startH) * HOUR_PX, MIN_BLOCK_PX),
                          left: `${b.lane * width}%`,
                          width: `calc(${width}% - 3px)`,
                        }}
                        onPointerDown={(e) => onBlockPointerDown(e, b, colIndex)}
                        onPointerMove={onBlockPointerMove}
                        onPointerUp={(e) => onBlockPointerUp(e, b)}
                        onPointerCancel={onBlockPointerCancel}
                        title={
                          title + (movable ? "（ドラッグで移動／タップで編集）" : "")
                        }
                      >
                        <span className="rsvd-ev-main">
                          <b className="rsvd-ev-co">{b.company}</b>
                          {!tight && b.content && <span className="rsvd-ev-ct">{b.content}</span>}
                        </span>
                        {!tight && !short && (
                          <span className="rsvd-ev-tm">
                            {b.start}〜{b.end}
                          </span>
                        )}
                        {!tight && !short && isGate && b.vehicleType && (
                          <span className="rsvd-ev-veh">{b.vehicleType}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* ドラッグ中の移動先プレビュー（列をまたいで動かせるので本体に重ねて描く） */}
            {drag && colWidth > 0 && (
              <div
                className="rsvd-ghost"
                style={{
                  left: GUTTER_PX + drag.colIndex * colWidth,
                  width: colWidth,
                  top: y(drag.startH),
                  height: Math.max(drag.dur * HOUR_PX, MIN_BLOCK_PX),
                }}
              >
                <span className="rsvd-ghost-tm">
                  {toHHMM(drag.startH)}〜{toHHMM(drag.startH + drag.dur)}
                </span>
                {selected[drag.colIndex] && (
                  <span className="rsvd-ghost-res">{selected[drag.colIndex]}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
