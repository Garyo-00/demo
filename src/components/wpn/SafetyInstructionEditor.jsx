import { Box, Button, Card, CardContent, Chip, IconButton, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { newId } from "../../workPlanNeoData.js";

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 安全指示事項の入力（承認画面）。docs/workplan/02-安全指示事項.md 準拠。
 * 「作業内容＋安全指示事項」のかたまりを、承認者が任意の数だけ追加する。
 * 他の承認者が登録した内容も上書きできる（更新者・更新日時を表示して気づけるようにする）。
 */
export default function SafetyInstructionEditor({ plan, onChange }) {
  const list = plan.safetyInstructions || [];

  const update = (id, patch) =>
    onChange(
      list.map((si) =>
        si.id === id ? { ...si, ...patch, updatedAt: nowStr(), updatedBy: "元請 田中" } : si
      )
    );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <Typography variant="h2">
            安全指示事項
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
              作業内容ごとに、任意の数だけ登録できます
            </Typography>
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{ ml: "auto" }}
            onClick={() =>
              onChange([
                ...list,
                {
                  id: newId("si"),
                  workLabel: "",
                  text: "",
                  updatedAt: nowStr(),
                  updatedBy: "元請 田中",
                  version: 1,
                },
              ])
            }
          >
            追加
          </Button>
        </Box>

        {list.length === 0 && (
          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            安全指示事項は入力されていません。「＋ 追加」で作業内容ごとに登録できます。
          </Typography>
        )}

        {list.map((si, i) => (
          <Box key={si.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, mb: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Chip size="small" label={`No.${i + 1}`} variant="outlined" />
              <TextField
                sx={{ flex: 1 }}
                placeholder="作業内容を入力"
                value={si.workLabel}
                onChange={(e) => update(si.id, { workLabel: e.target.value })}
              />
              <IconButton
                size="small"
                aria-label="削除"
                onClick={() => onChange(list.filter((x) => x.id !== si.id))}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="安全指示事項を入力"
              value={si.text}
              onChange={(e) => update(si.id, { text: e.target.value })}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              最終更新：{si.updatedAt} {si.updatedBy}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
