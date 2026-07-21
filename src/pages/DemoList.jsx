import { Link } from "react-router-dom";

const DEMOS = [
  {
    to: "/app",
    badge: "点検",
    title: "ダッシュボード",
    ready: true,
  },
  {
    to: "/workplan",
    badge: "作業計画書",
    title: "ダッシュボード",
    ready: true,
  },
  {
    to: "/workadjust",
    badge: "作業間調整pro",
    title: "作業予定一覧",
    ready: true,
  },
  {
    to: "/inspection-run",
    badge: "点検",
    title: "点検実施画面",
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
            </Link>
          ) : (
            <div key={i} className="demo soon">
              <span className="badge">{d.badge}</span>
              <h2>{d.title}（準備中）</h2>
            </div>
          )
        )}
      </div>
      <div className="list-footer">※ デモ用。データはすべてブラウザ上のサンプル値です。</div>
    </div>
  );
}
