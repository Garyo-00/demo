import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { WA_PROJECT } from "../data.js";

// 作業実績入力用QRコード（元請ビューのみ）。
// QRを読み取ると実績入力ページへ遷移。ウェブ上でQRをクリックしても同じページへ遷移する。
const QR_TARGET_PATH = "/workadjust/actual-input";

export default function WorkAdjustActualQr() {
  const navigate = useNavigate();
  // 読み取り用は絶対URL（現場のスマホから開けるように）。クリックはSPA内遷移。
  const qrValue =
    (typeof window !== "undefined" ? window.location.origin : "") + QR_TARGET_PATH;

  return (
    <div className="qr-page">
      <div className="qr-toolbar">
        <button className="ghost-btn spacer" onClick={() => window.print()}>
          印刷
        </button>
      </div>

      <div className="qr-sheet">
        <h2 className="qr-title">{WA_PROJECT.name}</h2>
        <h3 className="qr-subtitle">作業実績入力用QRコード</h3>

        <button
          type="button"
          className="qr-code-btn"
          onClick={() => navigate(QR_TARGET_PATH)}
          title="クリックで実績入力ページへ移動します"
          aria-label="作業実績入力ページを開く"
        >
          <QRCodeSVG value={qrValue} size={280} level="M" marginSize={2} />
        </button>

        <p className="qr-hint">
          QRを読み取る、またはクリックすると作業実績入力ページへ移動します。
        </p>
      </div>
    </div>
  );
}
