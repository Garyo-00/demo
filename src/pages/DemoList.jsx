import { Link } from "react-router-dom";

const DEMOS = [
  {
    to: "/app",
    badge: "点検",
    title: "ダッシュボード",
    desc: "当日の点検進捗（機械・仮設）と月例/組立後等点検をカードで俯瞰。サイドバー式UI。",
    ready: true,
  },
];

export default function DemoList() {
  return (
    <div className="wrap">
      <h1>デモ画面一覧</h1>
      <p className="lead">
        デジタル点検システムの画面デモ集。各リンクから個別のデモ画面へ移動します。
      </p>
      <div className="grid">
        {DEMOS.map((d, i) =>
          d.ready ? (
            <Link key={i} className="demo" to={d.to}>
              <span className="badge">{d.badge}</span>
              <h2>{d.title}</h2>
              <p>{d.desc}</p>
            </Link>
          ) : (
            <div key={i} className="demo soon">
              <span className="badge">{d.badge}</span>
              <h2>{d.title}（準備中）</h2>
              <p>{d.desc}</p>
            </div>
          )
        )}
      </div>
      <div className="list-footer">※ デモ用。データはすべてブラウザ上のサンプル値です。</div>
    </div>
  );
}
