import { useNavigate } from "react-router-dom";
import Card from "../components/Card.jsx";
import { MACHINES, TEMPS, summarize, MONTHLY, ASSEMBLY } from "../data.js";

const mSum = summarize(MACHINES);
const tSum = summarize(TEMPS);

export default function Dashboard() {
  const navigate = useNavigate();

  // 点検記録確認へ（種別・状態で絞り込み）
  function go(category, status) {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (status) p.set("status", status);
    const qs = p.toString();
    navigate("/app/inspection" + (qs ? "?" + qs : ""));
  }

  return (
    <div>
      <div className="section-title first">機械 ｜ 当日点検サマリ</div>
      <div className="cards">
        <Card label="点検対象機械台数" value={mSum.target} unit="台" onLink={() => go("機械", null)} />
        <Card label="点検済み機械台数" value={mSum.inspected} unit="台" tone="ok" onLink={() => go("機械", "inspected")} />
        <Card label="未点検機械台数" value={mSum.uninspected} unit="台" tone="warn" onLink={() => go("機械", "uninspected")} />
        <Card label="非稼働台数" value={mSum.idle} unit="台" tone="idle" onLink={() => go("機械", "idle")} />
      </div>

      <div className="section-title">仮設・その他 ｜ 当日点検サマリ</div>
      <div className="cards">
        <Card label="点検対象仮設・その他数" value={tSum.target} unit="件" onLink={() => go("仮設・その他", null)} />
        <Card label="点検済み仮設・その他数" value={tSum.inspected} unit="件" tone="ok" onLink={() => go("仮設・その他", "inspected")} />
        <Card label="未点検仮設・その他数" value={tSum.uninspected} unit="件" tone="warn" onLink={() => go("仮設・その他", "uninspected")} />
        <Card label="非稼働数" value={tSum.idle} unit="件" tone="idle" onLink={() => go("仮設・その他", "idle")} />
      </div>

      <div className="section-title">月例・組立後等点検</div>
      <div className="cards three">
        <Card label="月例点検対象数" value={MONTHLY.target} unit="件" />
        <Card label="月例点検実施数" value={MONTHLY.done} unit="件" tone="ok" />
        <Card label="組立後等点検実施数" value={ASSEMBLY.done} unit="件" tone="ok" />
      </div>
    </div>
  );
}
