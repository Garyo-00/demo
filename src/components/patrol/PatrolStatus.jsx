import { Chip } from "@mui/material";
import { isConfirmed } from "../../patrolData.js";

// 巡回記録のステータス。元請確認が済むと「元請確認済み」に変わる。
export function statusOf(record) {
  return isConfirmed(record)
    ? { key: "confirmed", label: "元請確認済み", color: "default" }
    : { key: "done", label: "巡回済み", color: "primary" };
}

export default function PatrolStatusChip({ record, size = "small" }) {
  const s = statusOf(record);
  return <Chip size={size} label={s.label} color={s.color} variant={s.key === "confirmed" ? "filled" : "outlined"} />;
}
