import { Outlet } from "react-router-dom";
import { PatrolProvider } from "./PatrolContext.jsx";

// 巡回/パトロールの画面群で状態を共有するためのルート。
// QR読み取り後の実施入力（サイドバー無し）と、一覧・詳細（サイドバーあり）で
// 同じ記録・マスタを参照できるよう、レイアウトより外側で Provider を張る。
export default function PatrolProviderRoute() {
  return (
    <PatrolProvider>
      <Outlet />
    </PatrolProvider>
  );
}
