import { useState } from "react";
import { useWpn } from "./WpnContext.jsx";

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

function Dialog({ title, children, onClose, actions }) {
  return (
    <>
      <div className="wpn-dialog-backdrop" onClick={onClose} />
      <div className="wpn-dialog" role="dialog" aria-label={title}>
        <h3>{title}</h3>
        {children}
        <div className="wpn-dialog-actions">{actions}</div>
      </div>
    </>
  );
}

/**
 * 承認・否認・取下のボタンとダイアログ。
 * 詳細ページと、一覧から開く2ペイン（ドロワー）の双方で使う。
 */
export default function PlanDecisionActions({ plan }) {
  const { savePlan, role } = useWpn();
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");

  const canApprove = role === "prime" && plan.status === "applying";
  const canWithdraw = plan.status === "applying";
  if (!canApprove && !canWithdraw) return null;

  function decide(next, comment = "") {
    savePlan({
      ...plan,
      status: next,
      approvals: plan.approvals.map((step) => ({
        ...step,
        status: next === "applying" ? step.status : next,
        rows: step.rows.map((r) => ({
          ...r,
          status: next === "applying" ? r.status : next,
          date: next === "applying" ? r.date : today(),
          comment: comment || r.comment,
        })),
      })),
    });
    setDialog(null);
    setReason("");
  }

  return (
    <>
      {canApprove && (
        <>
          <button className="wpn-btn primary sm" onClick={() => setDialog("approve")}>承認</button>
          <button className="wpn-btn outline-danger sm" onClick={() => setDialog("reject")}>否認</button>
        </>
      )}
      {canWithdraw && (
        <button className="wpn-btn danger sm" onClick={() => setDialog("withdraw")}>取下</button>
      )}

      {dialog === "approve" && (
        <Dialog
          title="申請の承認"
          onClose={() => setDialog(null)}
          actions={
            <>
              <button className="wpn-btn plain sm" onClick={() => setDialog(null)}>キャンセル</button>
              <button className="wpn-btn primary sm" onClick={() => decide("approved")}>承認</button>
            </>
          }
        >
          <p>この作業計画書の申請を承認します。よろしいですか？</p>
        </Dialog>
      )}

      {dialog === "reject" && (
        <Dialog
          title="申請の否認"
          onClose={() => setDialog(null)}
          actions={
            <>
              <button className="wpn-btn plain sm" onClick={() => setDialog(null)}>キャンセル</button>
              <button
                className="wpn-btn plain sm"
                disabled={!reason.trim()}
                onClick={() => decide("rejected", reason.trim())}
              >
                否認
              </button>
            </>
          }
        >
          <p>この作業計画書の申請を否認します。否認理由を入力してください。</p>
          <label className="wpn-label" htmlFor="wpn-reject-reason">
            否認理由<span className="wpn-req-mark">*</span>
          </label>
          <textarea
            id="wpn-reject-reason"
            className="wpn-input wpn-textarea lg"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Dialog>
      )}

      {dialog === "withdraw" && (
        <Dialog
          title="申請の取下"
          onClose={() => setDialog(null)}
          actions={
            <>
              <button className="wpn-btn plain sm" onClick={() => setDialog(null)}>キャンセル</button>
              <button className="wpn-btn danger sm" onClick={() => decide("withdrawn")}>取下</button>
            </>
          }
        >
          <p>この作業計画書の申請を取り下げます。よろしいですか？</p>
        </Dialog>
      )}
    </>
  );
}
