import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { WA_PROJECT } from "../data.js";
import printIcon from "../assets/icons/print.svg";

// QRコード発行（元請ビューのみ）。作業予定一覧／作業実績入力／資機材・ゲート予約の
// 3種類をチェックボックスで選び、選んだぶんを1枚にまとめて掲示・印刷する。
const QR_KINDS = [
  {
    key: "schedule",
    label: "作業予定一覧",
    path: "/workadjust",
    login: true, // 読み取り後にログインが必要
  },
  {
    key: "actual",
    label: "作業実績入力",
    path: "/workadjust/actual-input",
    login: false,
  },
  {
    key: "reserve",
    label: "資機材・ゲート予約",
    path: "/workadjust/reserve",
    login: false,
  },
];

export default function WorkAdjustQr() {
  const navigate = useNavigate();
  // 既定は全種類にチェック
  const [checked, setChecked] = useState(() => QR_KINDS.map((k) => k.key));
  const shown = QR_KINDS.filter((k) => checked.includes(k.key));

  function toggle(key) {
    setChecked((c) => (c.includes(key) ? c.filter((x) => x !== key) : [...c, key]));
  }
  // 読み取り用は絶対URL（現場のスマホから開けるように）。クリックはSPA内遷移。
  const urlOf = (path) =>
    (typeof window !== "undefined" ? window.location.origin : "") + path;

  return (
    <div className="qr-page">
      <div className="qr-toolbar">
        <div className="qr-picks">
          {QR_KINDS.map((k) => (
            <label className="qr-pick" key={k.key}>
              <input
                type="checkbox"
                checked={checked.includes(k.key)}
                onChange={() => toggle(k.key)}
              />
              {k.label}
            </label>
          ))}
        </div>
        <button
          className="primary-btn spacer"
          onClick={() => window.print()}
          disabled={shown.length === 0}
        >
          <img className="ic-btn" src={printIcon} alt="" />
          印刷
        </button>
      </div>

      <div className="qr-sheet">
        <h2 className="qr-title">{WA_PROJECT.name}</h2>
        <h3 className="qr-subtitle">作業間調整pro</h3>

        {shown.length === 0 ? (
          <div className="empty">発行するQRコードを選択してください。</div>
        ) : (
          <div className="qr-grid">
            {shown.map((k) => (
              <div className="qr-item" key={k.key}>
                <div className="qr-item-title">{k.label}</div>
                <div className="qr-item-login">
                  （ログイン{k.login ? "必要" : "不要"}）
                </div>
                <button
                  type="button"
                  className="qr-code-btn"
                  onClick={() => navigate(k.path)}
                  title={`クリックで「${k.label}」の画面へ移動します`}
                  aria-label={`${k.label}の画面を開く`}
                >
                  <QRCodeSVG value={urlOf(k.path)} size={240} level="M" marginSize={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="qr-hint">
        QRを読み取る、またはクリックすると各画面へ移動します。チェックを外した種類は印刷されません。
      </p>
    </div>
  );
}
