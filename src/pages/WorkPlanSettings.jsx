import { Link } from "react-router-dom";

const ITEMS = [
  {
    to: "/workplan/settings/floor-plan",
    title: "作業平面図登録",
    desc: "作業エリアの平面図を登録・管理します。",
  },
  {
    to: "/workplan/settings/approval-flow",
    title: "承認フロー設定",
    desc: "申請の承認ステップと承認者を設定します。",
  },
];

export default function WorkPlanSettings() {
  return (
    <div>
      <div className="section-title first">設定</div>
      <div className="grid">
        {ITEMS.map((it) => (
          <Link key={it.to} className="demo" to={it.to}>
            <h2>{it.title}</h2>
            <p>{it.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
