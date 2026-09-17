import { Chip } from "@mui/material";
import { isConfirmed, isDone } from "../../patrolData.js";

// 巡回記録のステータス。
// 予定だけで未実施＝「未」、実施済み＝「巡回済み」、元請確認まで済んだもの＝「元請確認済み」。
export function statusOf(record) {
  if (!isDone(record)) return { key: "planned", label: "未", color: "warning" };
  return isConfirmed(record)
    ? { key: "confirmed", label: "元請確認済み", color: "default" }
    : { key: "done", label: "巡回済み", color: "primary" };
}

export default function PatrolStatusChip({ record, size = "small" }) {
  const s = statusOf(record);
  return <Chip size={size} label={s.label} color={s.color} variant={s.key === "confirmed" ? "filled" : "outlined"} />;
}
