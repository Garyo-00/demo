import { Link } from "react-router-dom";

// サンプル承認フロー（申請種別ごとの承認ステップ）
const FLOWS = [
  {
    type: "作業計画書",
    steps: [
      ["1次承認", "現場代理人", "山田 太郎"],
      ["2次承認", "監理技術者", "田中 部長"],
    ],
  },
  {
    type: "承認（作業間調整）",
    steps: [
      ["1次承認", "職長", "佐藤 健"],
      ["2次承認", "現場代理人", "山田 太郎"],
    ],
  },
];

export default function WorkPlanApprovalFlowSetting() {
  return (
    <div>
      <div className="crumb">設定 ＞ 承認フロー設定</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link className="back" to="/workplan/settings">← 設定へ戻る</Link>
        <strong style={{ fontSize: 15 }}>承認フロー設定</strong>
      </div>

      <p className="tab-note">
        申請種別ごとに承認ステップと承認者を設定します。承認は設定した順に行われます。
      </p>

      {FLOWS.map((flow) => (
        <div key={flow.type} style={{ marginBottom: 22 }}>
          <div className="section-title" style={{ marginTop: 0 }}>{flow.type}</div>
          <table>
            <thead>
              <tr>
                <th>承認ステップ</th>
                <th>役割</th>
                <th>承認者</th>
              </tr>
            </thead>
            <tbody>
              {flow.steps.map(([step, role, approver]) => (
                <tr key={step}>
                  <td>{step}</td>
                  <td>{role}</td>
                  <td>{approver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div>
        <button className="primary-btn">承認フローを編集</button>
      </div>
    </div>
  );
}
