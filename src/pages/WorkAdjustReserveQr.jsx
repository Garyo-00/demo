import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { WA_PROJECT } from "../data.js";

// 資機材・ゲート予約用QRコード。
// QRを読み取ると（アカウントなしで）予約ポータルへ遷移する。
const QR_TARGET_PATH = "/workadjust/reserve";

export default function WorkAdjustReserveQr() {
  const navigate = useNavigate();
  const qrValue =
    (typeof window !== "undefined" ? window.location.origin : "") + QR_TARGET_PATH;

  return (
    <div className="qr-page">
      <div className="page-title">資機材・ゲート予約用QR発行</div>
      <div className="qr-toolbar">
        <button className="ghost-btn spacer" onClick={() => window.print()}>
          印刷
        </button>
      </div>

      <div className="qr-sheet">
        <h2 className="qr-title">{WA_PROJECT.name}</h2>
        <h3 className="qr-subtitle">資機材・ゲート予約用QRコード</h3>

        <button
          type="button"
          className="qr-code-btn"
          onClick={() => navigate(QR_TARGET_PATH)}
          title="クリックで予約画面へ移動します"
          aria-label="資機材・ゲート予約画面を開く"
        >
          <QRCodeSVG value={qrValue} size={280} level="M" marginSize={2} />
        </button>

        <p className="qr-hint">
          QRを読み取る、またはクリックすると<strong>アカウントなしで予約できる画面</strong>へ移動します。
        </p>
      </div>
    </div>
  );
}
