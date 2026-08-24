import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useWpn } from "./WpnContext.jsx";

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
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

  const close = () => setDialog(null);

  return (
    <>
      {canApprove && (
        <>
          <Button variant="contained" size="small" onClick={() => setDialog("approve")}>
            承認
          </Button>
          <Button variant="outlined" color="error" size="small" onClick={() => setDialog("reject")}>
            否認
          </Button>
        </>
      )}
      {canWithdraw && (
        <Button variant="contained" color="error" size="small" onClick={() => setDialog("withdraw")}>
          取下
        </Button>
      )}

      <Dialog open={dialog === "approve"} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>申請の承認</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            この作業計画書の申請を承認します。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>キャンセル</Button>
          <Button variant="contained" onClick={() => decide("approved")}>
            承認
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "reject"} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>申請の否認</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13, mb: 2 }}>
            この作業計画書の申請を否認します。否認理由を入力してください。
          </DialogContentText>
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="否認理由"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>キャンセル</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!reason.trim()}
            onClick={() => decide("rejected", reason.trim())}
          >
            否認
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "withdraw"} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>申請の取下</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            この作業計画書の申請を取り下げます。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={() => decide("withdrawn")}>
            取下
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
