import { GlobalStyles } from "@mui/material";
import { fmtDate, fmtDateTime, fmtSize } from "../../patrolData.js";
import { PATROL_PROJECT } from "../../patrolData.js";

// 画像かどうか（追記の添付ファイル用）
const isImage = (f) =>
  (f.type || "").startsWith("image/") ||
  (f.url || "").startsWith("data:image/") ||
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name || "");

/**
 * 巡回記録の印刷帳票。
 * 画面では画面外へ退避し、@media print のときだけ表示する（index.css の帳票印刷と同じ方式）。
 * 体裁は本番の印刷フォーマットに合わせ、末尾に追記の欄を設ける。
 */
const styles = {
  // 巡回記録はA4縦。名前付きページにして他の帳票（横向き）に影響させない。
  "@page patrolPortrait": { size: "A4 portrait", margin: "12mm" },
  ".patrol-print": {
    position: "fixed",
    left: -99999,
    top: 0,
    width: 760,
    background: "#fff",
    color: "#000",
    fontSize: 11,
    lineHeight: 1.6,
  },
  ".patrol-print table": { width: "100%", borderCollapse: "collapse" },
  ".patrol-print .pt-head": { border: "1px solid #333", borderRadius: 4 },
  ".patrol-print .pt-head th": {
    width: 92,
    padding: "6px 8px",
    textAlign: "left",
    fontWeight: 700,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #ccc",
  },
  ".patrol-print .pt-head td": { padding: "6px 8px", borderBottom: "1px solid #ccc" },
  ".patrol-print .pt-head tr:last-child th, .patrol-print .pt-head tr:last-child td": { borderBottom: 0 },
  ".patrol-print .pt-item": {
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: "7px 10px",
    marginBottom: 5,
    breakInside: "avoid",
  },
  ".patrol-print .pt-item-main": { display: "flex", alignItems: "flex-start", gap: 10 },
  ".patrol-print .pt-no": { width: 18, flex: "none", textAlign: "right" },
  ".patrol-print .pt-text": { flex: 1, minWidth: 0 },
  ".patrol-print .pt-rate": {
    flex: "none",
    minWidth: 88,
    textAlign: "center",
    border: "1px solid #999",
    borderRadius: 4,
    padding: "3px 10px",
  },
  ".patrol-print .pt-sub": { display: "flex", gap: 10, marginTop: 4, paddingLeft: 28 },
  ".patrol-print .pt-sub-label": { width: 56, flex: "none", color: "#444" },
  ".patrol-print .pt-band": {
    background: "#f2f2f2",
    border: "1px solid #ddd",
    borderRadius: 4,
    textAlign: "center",
    fontWeight: 700,
    padding: "6px 0",
    margin: "14px 0 8px",
  },
  ".patrol-print .pt-body": { padding: "0 2px", whiteSpace: "pre-wrap", minHeight: 18 },
  ".patrol-print .pt-photos": { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, breakInside: "avoid" },
  ".patrol-print .pt-photo": {
    border: "1px solid #ccc",
    borderRadius: 4,
    height: 230,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ".patrol-print .pt-photo img": { maxWidth: "100%", maxHeight: "100%" },
  ".patrol-print .pt-cap": { marginTop: 4, minHeight: 16 },
  ".patrol-print .pt-note": {
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: "7px 10px",
    marginBottom: 5,
    breakInside: "avoid",
  },
  ".patrol-print .pt-note-head": { display: "flex", gap: 10, color: "#444", marginBottom: 3 },
  ".patrol-print .pt-note-at": { marginLeft: "auto", whiteSpace: "nowrap" },
  ".patrol-print .pt-files": { display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 6, marginTop: 5 },
  ".patrol-print .pt-file-img": { width: 92, height: 92, border: "1px solid #ccc", borderRadius: 4, objectFit: "cover" },
  ".patrol-print .pt-file-name": { alignSelf: "flex-start", border: "1px solid #ccc", borderRadius: 4, padding: "2px 8px" },
  "@media print": {
    // 画面の要素はすべて隠し、この帳票だけを用紙に出す
    "body *": { visibility: "hidden" },
    ".patrol-print, .patrol-print *": { visibility: "visible" },
    ".patrol-print": {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      page: "patrolPortrait",
      printColorAdjust: "exact",
      WebkitPrintColorAdjust: "exact",
    },
  },
};

export default function PatrolPrintSheet({ record }) {
  const notes = record.notes || [];
  return (
    <>
      <GlobalStyles styles={styles} />
      <div className="patrol-print">
        <table className="pt-head">
          <tbody>
            <tr>
              <th>巡回記録No.</th>
              <td>{record.no}</td>
              <th>実施日</th>
              <td>{fmtDate(record.date)}</td>
              <th>現場名</th>
              <td>{PATROL_PROJECT}</td>
            </tr>
            <tr>
              <th>実施会社</th>
              <td>{record.company}</td>
              <th>一次会社</th>
              <td>{record.primaryCompany}</td>
              <th>実施者</th>
              <td>{record.inspector}</td>
            </tr>
            <tr>
              <th>同行会社・名前</th>
              <td>{record.accompany}</td>
              <th>元請確認日</th>
              <td>{fmtDate(record.confirmedDate)}</td>
              <th>元請確認者</th>
              <td>{record.confirmedBy}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 12 }}>
          {record.items.map((it) => (
            <div key={it.no} className="pt-item">
              <div className="pt-item-main">
                <div className="pt-no">{it.no}</div>
                <div className="pt-text">{it.text}</div>
                <div className="pt-rate">{it.rating}</div>
              </div>
              {it.comment && (
                <div className="pt-sub">
                  <div className="pt-sub-label">コメント</div>
                  <div>{it.comment}</div>
                </div>
              )}
              {it.fix && (
                <div className="pt-sub">
                  <div className="pt-sub-label">是正内容</div>
                  <div>{it.fix}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-band">ヒアリング・所見</div>
        <div className="pt-body">{record.hearing}</div>

        {record.photos.length > 0 && (
          <>
            <div className="pt-band">写真</div>
            {record.photos.map((p) => (
              <div key={p.id} className="pt-photos" style={{ marginBottom: 10 }}>
                <div>
                  <div className="pt-photo">
                    <img src={p.src} alt="" />
                  </div>
                  <div className="pt-cap">{p.caption}</div>
                </div>
                <div>
                  <div className="pt-photo">{p.fixSrc && <img src={p.fixSrc} alt="" />}</div>
                  <div className="pt-cap">是正{p.fixComment ? `　${p.fixComment}` : ""}</div>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="pt-band">作業所コメント</div>
        <div className="pt-body">{record.siteComment}</div>

        {/* 追記。実施後に追加された情報も帳票に含める。 */}
        <div className="pt-band">追記</div>
        {notes.length === 0 ? (
          <div className="pt-body">　</div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="pt-note">
              <div className="pt-note-head">
                <div>
                  {n.authorName}（{n.authorLabel}）
                </div>
                <div className="pt-note-at">
                  登録 {fmtDateTime(n.createdAt)}
                  {n.updatedAt && `　更新 ${fmtDateTime(n.updatedAt)}`}
                </div>
              </div>
              {n.text && <div style={{ whiteSpace: "pre-wrap" }}>{n.text}</div>}
              {n.files?.length > 0 && (
                <div className="pt-files">
                  {n.files.map((f) =>
                    isImage(f) ? (
                      <img key={f.id} className="pt-file-img" src={f.url} alt={f.name} />
                    ) : (
                      <span key={f.id} className="pt-file-name">
                        {f.name}
                        {f.size ? `（${fmtSize(f.size)}）` : ""}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
