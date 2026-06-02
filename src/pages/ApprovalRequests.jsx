import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  REQUESTS,
  REQUEST_TYPES,
  APPROVAL_STATUS_LABEL,
  CURRENT_USER,
} from "../data.js";

// 申請の種別サブタブ（null = すべて）
const TYPE_TABS = [null, ...REQUEST_TYPES];

export default function ApprovalRequests() {
  const [params, setParams] = useSearchParams();
  // 上位タブ: approval=承認 / request=申請（既定は承認）
  const tab = params.get("tab") === "request" ? "request" : "approval";
  const type = params.get("type");

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function selectTab(t) {
    const next = new URLSearchParams();
    if (t === "request") next.set("tab", "request");
    setParams(next); // タブ切替時は種別の絞り込みをリセット
  }

  // 承認待ち件数（承認タブのバッジ用）
  const myPending = useMemo(
    () =>
      REQUESTS.filter(
        (r) => r.approver === CURRENT_USER.name && r.status === "pending"
      ).length,
    []
  );

  const rows = useMemo(() => {
    if (tab === "approval") {
      // 自分が承認者で、かつ承認待ちの申請のみ
      return REQUESTS.filter(
        (r) => r.approver === CURRENT_USER.name && r.status === "pending"
      );
    }
    // 申請: すべて／種別で絞り込み
    return REQUESTS.filter((r) => !type || r.type === type);
  }, [tab, type]);

  return (
    <div>
      <div className="crumb">承認・申請</div>
      <strong style={{ fontSize: 15 }}>承認・申請</strong>

      <div className="tabs">
        <button
          className={"tab" + (tab === "approval" ? " on" : "")}
          onClick={() => selectTab("approval")}
        >
          承認
          {myPending > 0 && <span className="tab-badge">{myPending}</span>}
        </button>
        <button
          className={"tab" + (tab === "request" ? " on" : "")}
          onClick={() => selectTab("request")}
        >
          申請
        </button>
      </div>

      {tab === "approval" ? (
        <p className="tab-note">自身が承認者の申請のみ表示されます。</p>
      ) : (
        <div className="filters">
          {TYPE_TABS.map((t, i) => (
            <span
              key={"t" + i}
              className={
                "chip" + (type === t || (!type && t === null) ? " on" : "")
              }
              onClick={() => setParam("type", t)}
            >
              {t || "すべて"}
            </span>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="empty">該当する申請はありません。</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>申請番号</th>
              <th>種別</th>
              <th>申請内容</th>
              <th>申請者</th>
              <th>承認者</th>
              <th>申請日</th>
              {tab === "request" && <th>状態</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.type}</td>
                <td>{r.title}</td>
                <td>{r.applicant}</td>
                <td>{r.approver}</td>
                <td>{r.date}</td>
                {tab === "request" && (
                  <td>
                    <span className={"pill " + r.status}>
                      {APPROVAL_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
