import { useState } from "react";
import { Box, Button, Chip, IconButton, TextField, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { completeAnnual, fmt, newAnnualId, nextYm, removeAnnual, setAnnualFile } from "../broughtMachineData.js";

/**
 * 年1回の点検（年次点検・特定自主検査）の登録欄。
 * 実施を登録すると、その年月の1年後を次回予定とするレコードが自動で作られる。
 * 次回予定のレコードを実施済みにすると、さらに次の予定が作られて1年ごとに続く。
 * 実施済みのレコードは、後からファイルを登録・差し替えでき、削除もできる。
 * ファイル添付は任意。
 */
export default function AnnualCheckEditor({ label, list, onChange }) {
  const rows = list || [];
  const done = rows.filter((r) => r.done).sort((a, b) => a.ym.localeCompare(b.ym));
  const pending = rows.find((r) => !r.done);

  // 未実施レコードの入力中の値（年月は予定年月を初期値にする）
  const [ym, setYm] = useState(pending?.ym || "");
  const [file, setFile] = useState("");

  const target = pending || { id: null };
  const canRegister = !!ym;

  // 削除すると次回予定の年月が引き直されるため、入力欄の初期値も合わせる
  function remove(id) {
    const next = removeAnnual(rows, id);
    onChange(next);
    setYm(next.find((r) => !r.done)?.ym || "");
    setFile("");
  }

  function register() {
    if (!canRegister) return;
    const next = completeAnnual(rows, { id: target.id || newAnnualId(), ym, file });
    onChange(next);
    // 次の予定年月を入力欄の初期値にする
    setYm(next.find((r) => !r.done)?.ym || "");
    setFile("");
  }

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>{label}</Typography>

      {/* 実施済みの記録 */}
      {done.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          {done.map((r) => (
            <Box
              key={r.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Chip size="small" label="実施済" color="success" />
              <Typography sx={{ fontSize: 12.5, minWidth: 90 }}>{fmt(r.ym)}</Typography>
              {r.file ? (
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<AttachFileIcon />}
                  label={r.file}
                  deleteIcon={<CloseIcon />}
                  onDelete={() => onChange(setAnnualFile(rows, r.id, ""))}
                />
              ) : (
                <Button
                  size="small"
                  startIcon={<AttachFileIcon />}
                  onClick={() => onChange(setAnnualFile(rows, r.id, `${label}記録_${r.ym.slice(0, 4)}.pdf`))}
                >
                  ファイルを登録
                </Button>
              )}
              <IconButton
                size="small"
                sx={{ ml: "auto" }}
                aria-label={`${fmt(r.ym)}の${label}の記録を削除`}
                onClick={() => remove(r.id)}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* 未実施（次回予定）または最初の1件の登録 */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          p: 1.5,
          bgcolor: "#f7f8fb",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
          {pending ? (
            <>
              <Chip size="small" label="次回予定" color="warning" variant="outlined" />
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                予定 {fmt(pending.ym)}　実施したら年月とファイルを登録してください（ファイルは任意）
              </Typography>
            </>
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
              実施した年月を登録すると、その1年後が次回予定として作られます（ファイルは任意）
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <TextField
            type="month"
            label="実施年月"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 180 }}
          />
          {file ? (
            <Chip
              size="small"
              variant="outlined"
              icon={<AttachFileIcon />}
              label={file}
              deleteIcon={<CloseIcon />}
              onDelete={() => setFile("")}
            />
          ) : (
            <Button size="small" variant="outlined" startIcon={<AttachFileIcon />} onClick={() => setFile(`${label}記録.pdf`)}>
              ファイルを選択
            </Button>
          )}
          <Button size="small" variant="contained" disabled={!canRegister} onClick={register}>
            {pending ? "実施済にする" : "登録"}
          </Button>
        </Box>

        {canRegister && (
          <Typography color="text.secondary" sx={{ fontSize: 11.5, mt: 1 }}>
            登録すると次回予定は {fmt(nextYm(ym))} になります。
          </Typography>
        )}
      </Box>
    </Box>
  );
}
