import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ALL, STATUS_LABEL } from "../data.js";

const CATS = [null, "機械", "仮設・その他"];
const STATS = [null, "inspected", "uninspected", "idle"];

export default function InspectionRecords() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category");
  const status = params.get("status");

  const rows = useMemo(
    () =>
      ALL.filter(
        (r) =>
          (!category || r.category === category) &&
          (!status || r.status === status)
      ),
    [category, status]
  );

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div>
      <div className="crumb">点検 ＞ 点検記録確認</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link className="back" to="/app">← ダッシュボードへ戻る</Link>
        <strong style={{ fontSize: 15 }}>点検記録確認</strong>
      </div>

      <div className="filters">
        {CATS.map((c, i) => (
          <span
            key={"c" + i}
            className={"chip" + (category === c || (!category && c === null) ? " on" : "")}
            onClick={() => setFilter("category", c)}
          >
            {c || "全種別"}
          </span>
        ))}
        <span className="sep" />
        {STATS.map((s, i) => (
          <span
            key={"s" + i}
            className={"chip" + (status === s || (!status && s === null) ? " on" : "")}
            onClick={() => setFilter("status", s)}
          >
            {s ? STATUS_LABEL[s] : "全状態"}
          </span>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="empty">該当する記録はありません。</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>管理番号</th>
              <th>種別</th>
              <th>名称</th>
              <th>型式</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.category}</td>
                <td>{r.name}</td>
                <td>{r.model}</td>
                <td>
                  <span className={"pill " + r.status}>{STATUS_LABEL[r.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
