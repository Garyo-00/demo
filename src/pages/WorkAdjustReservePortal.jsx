import { useState } from "react";
import { Link } from "react-router-dom";
import { WaSettingsProvider } from "../components/wa/WaSettingsContext.jsx";
import WorkAdjustReservation from "./WorkAdjustReservation.jsx";
import { WA_PROJECT } from "../data.js";

// 資機材・ゲート予約用QRを読み取った先の予約ポータル（サイドバー無しの独立ページ）。
// デモではアカウントあり／なしのビューを切り替えられる。
// - アカウントなし：資機材・その他タブのみ・出力/確定なし（ゲスト予約）
// - アカウントあり：通常の予約画面（全タブ）
function ReservePortalInner() {
  const [account, setAccount] = useState(false);
  return (
    <div className="rp-page">
      <header className="rp-head">
        <div className="rp-brand">
          <strong>資機材・ゲート予約</strong>
          <small>{WA_PROJECT.name}</small>
        </div>
        <div className="rp-demo">
          <Link to="/" className="rp-back">← デモ画面一覧へ戻る</Link>
          <span className="rp-demo-label">デモ表示切替：</span>
          <div className="role-switch" role="group" aria-label="アカウント有無の切替">
            <button
              className={"role-seg" + (!account ? " active" : "")}
              onClick={() => setAccount(false)}
            >
              アカウントなし
            </button>
            <button
              className={"role-seg" + (account ? " active" : "")}
              onClick={() => setAccount(true)}
            >
              アカウントあり
            </button>
          </div>
        </div>
      </header>
      <div className="rp-body">
        <div className="content-card">
          <WorkAdjustReservation restrictAerial={!account} guest={!account} />
        </div>
      </div>
    </div>
  );
}

export default function WorkAdjustReservePortal() {
  return (
    <WaSettingsProvider>
      <ReservePortalInner />
    </WaSettingsProvider>
  );
}
