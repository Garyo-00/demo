import { Outlet } from "react-router-dom";
import { KynextProvider } from "./KynextContext.jsx";

// KY-NEXT の画面群で状態を共有するためのルート。
// サイドバー付きの画面（一覧・詳細・設定）と、サイドバー無しの画面（ログイン・現場選択・
// シート単体のQR）で同じシート・テンプレートを参照できるよう、レイアウトより外側で Provider を張る。
export default function KynextProviderRoute() {
  return (
    <KynextProvider>
      <Outlet />
    </KynextProvider>
  );
}
