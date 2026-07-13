import { WA_PROJECT, formatDateStr, primeUserName } from "../../data.js";

const ROWS_PER_PAGE = 12; // 1ページの行数（増えたら自動でページ追加）

function loc(r) {
  return [r.building, r.floor, r.area, r.zone].filter(Boolean).join(" / ");
}
function planned(r) {
  return (Number(r.normalWorkers) || 0) + (Number(r.overtimeWorkers) || 0);
}
function actual(r) {
  if (r.actualNormalWorkers == null && r.actualOvertimeWorkers == null) return null;
  return (Number(r.actualNormalWorkers) || 0) + (Number(r.actualOvertimeWorkers) || 0);
}

// ページ単位に分割
function paginate(rows) {
  const pages = [];
  for (let i = 0; i < Math.max(rows.length, 1); i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  return pages;
}

export default function SchedulePrint({ date, rows, manager, seals = [] }) {
  const pages = paginate(rows);
  return (
    <>
      {pages.map((pageRows, pi) => (
        <div className="paper" key={pi}>
          {/* 上部ラベル */}
          <div className="pf-topline">
            <span>工事番号 {WA_PROJECT.number}</span>
            <span>工事名称 {WA_PROJECT.name}</span>
          </div>
          <div className="pf-headrow">
            <div className="pf-titleblock">
              <h2>作業予定一覧</h2>
              <div className="pf-meta">作業日：{formatDateStr(date)}</div>
            </div>
            <div className="pf-signblock">
              <div className="pf-sign">
                <div className="pf-sign-label">元請担当者</div>
                <div className="pf-sign-body">{manager || "—"}</div>
              </div>
              <div className="pf-sign">
                <div className="pf-sign-label">押印</div>
                <div className="pf-sign-body pf-seals">
                  {seals.length > 0 ? (
                    seals.map((u) => (
                      <span className="pf-seal" key={u}>
                        {primeUserName(u)}
                      </span>
                    ))
                  ) : (
                    <span className="pf-seal empty" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <table className="pf-table">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>協力会社名</th>
                <th>作業場所</th>
                <th>作業内容</th>
                <th>作業員数<br />（予定）</th>
                <th>作業員数<br />（実績）</th>
                <th>元請安全指示事項</th>
                <th>職長名</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.company}</td>
                  <td>{loc(r)}</td>
                  <td>{r.content}</td>
                  <td className="c">{planned(r)} 名</td>
                  <td className="c">{actual(r) != null ? actual(r) + " 名" : ""}</td>
                  <td>{r.safetyNote}</td>
                  <td>{r.foreman}</td>
                </tr>
              ))}
              {/* 最終ページの余白行（枠を揃える） */}
              {pageRows.length < ROWS_PER_PAGE &&
                Array.from({ length: ROWS_PER_PAGE - pageRows.length }).map((_, i) => (
                  <tr key={"blank" + i} className="pf-blank">
                    <td /><td /><td /><td /><td /><td /><td />
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="pf-foot">
            {pi + 1} / {pages.length}
          </div>
        </div>
      ))}
    </>
  );
}
