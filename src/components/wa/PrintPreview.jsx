// 出力（PDF）プレビューの共通シェル。本番はPDF出力、ここでは擬似プレビュー。
export default function PrintPreview({ title, onClose, children }) {
  return (
    <div className="pp-overlay">
      <div className="pp-bar">
        <h3>{title}</h3>
        <span className="pp-hint">プレビュー（本番環境ではPDF出力）</span>
        <div className="pp-spacer" />
        <button className="pp-btn" onClick={() => window.print()}>
          印刷 / PDF
        </button>
        <button className="pp-btn ghost" onClick={onClose}>
          閉じる
        </button>
      </div>
      <div className="pp-scroll">{children}</div>
    </div>
  );
}
