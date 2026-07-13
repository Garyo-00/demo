import { Link } from "react-router-dom";

// サンプル登録済み平面図
const PLANS = [
  ["FP-001", "1階 躯体工事エリア", "A工区", "2026-05-20", "公開"],
  ["FP-002", "2階 配筋エリア", "B工区", "2026-05-24", "公開"],
  ["FP-003", "地下 山留エリア", "C工区", "2026-05-28", "下書き"],
];

export default function WorkPlanFloorPlanSetting() {
  return (
    <div>
      <div className="crumb">設定 ＞ 作業平面図登録</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link className="back" to="/workplan/settings">← 設定へ戻る</Link>
        <strong style={{ fontSize: 15 }}>作業平面図登録</strong>
      </div>

      <p className="tab-note">
        作業エリアの平面図を登録します。登録した平面図は作業計画書の作成時に選択できます。
      </p>

      <div style={{ margin: "12px 0" }}>
        <button className="primary-btn">＋ 平面図を登録</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>図面番号</th>
            <th>平面図名</th>
            <th>対象工区</th>
            <th>登録日</th>
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {PLANS.map(([id, name, area, date, status]) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{name}</td>
              <td>{area}</td>
              <td>{date}</td>
              <td>
                <span className={"pill " + (status === "公開" ? "approved" : "pending")}>
                  {status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
