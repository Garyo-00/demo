import { Fragment } from "react";
import { WA_PROJECT, formatDateStr } from "../../data.js";
import { HOURS, layoutLabeled, INSET } from "./rsvTimeline.js";

const RES_PER_PAGE = 8; // 1ページに載せる資源（台数）。増えたらページ追加
const PRINT_TRACK_W = 900; // 用紙（横）でのトラック幅の目安px

export default function ReservationPrint({ date, label, isGate, items, reservations }) {
  // 資源（台数）をページ単位に分割
  const pages = [];
  for (let i = 0; i < Math.max(items.length, 1); i += RES_PER_PAGE) {
    pages.push(items.slice(i, i + RES_PER_PAGE));
  }
  return (
    <>
      {pages.map((pageItems, pi) => (
        <div className="paper landscape" key={pi}>
          <div className="pf-topline">
            <span>工事番号 {WA_PROJECT.number}</span>
            <span>工事名称 {WA_PROJECT.name}</span>
          </div>
          <div className="pf-headrow">
            <div className="pf-titleblock">
              <h2>予約表 － {label}</h2>
              <div className="pf-meta">対象日：{formatDateStr(date)}</div>
            </div>
            <div className="pf-signblock">
              <div className="pf-sign">
                <div className="pf-sign-label">登録台数</div>
                <div className="pf-sign-body">{items.length} 台</div>
              </div>
            </div>
          </div>

          <div className="rsv-board">
            <div className="rsv-corner">{label}＼時刻</div>
            <div className="rsv-hours" style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)` }}>
              {HOURS.map((h) => (
                <div key={h} className="rsv-hour">
                  {h}:00
                </div>
              ))}
            </div>
            {pageItems.map((item) => {
              const blocks = reservations.filter((r) => r.resource === item);
              const { height, rowH, barH, placed } = layoutLabeled(blocks, PRINT_TRACK_W, isGate);
              return (
                <div className="rsv-head" key={item}>
                  <div className="rsv-reslabel">{item}</div>
                  <div className="rsv-track" style={{ minHeight: height }}>
                    {placed.map((b) => {
                      const spot = b.resvType === "spot";
                      const barTop = b.row * rowH + (rowH - barH) / 2;
                      const labelStyle =
                        b.side === "right"
                          ? { left: b.barLeft + INSET, top: b.row * rowH, height: rowH }
                          : { right: PRINT_TRACK_W - b.barRight + INSET, top: b.row * rowH, height: rowH };
                      return (
                        <Fragment key={b.id}>
                          <div
                            className={"rsv-bar" + (spot ? " spot" : "")}
                            style={{ left: b.barLeft, width: b.barW, top: barTop, height: barH }}
                          />
                          <div
                            className={"rsv-tlabel " + b.side + (spot ? " spot" : "")}
                            style={labelStyle}
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

          <div className="pf-foot">
            {pi + 1} / {pages.length}
          </div>
        </div>
      ))}
    </>
  );
}
