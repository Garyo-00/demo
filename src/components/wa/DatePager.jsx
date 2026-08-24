import { Box, Button, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { formatDateStr, shiftDate } from "../../data.js";

// ページ全体を日付単位で切り替えるための日付送りUI
// disabled=true（予約・作業予定以外のページ）では操作不可・グレーアウト表示。
const arrowSx = {
  borderRadius: 0,
  px: { xs: 1, sm: 1.5 },
  minWidth: 0,
  color: "text.primary",
  fontWeight: 500,
  whiteSpace: "nowrap",
};

export default function DatePager({ value, onChange, disabled = false }) {
  return (
    <Box
      aria-disabled={disabled}
      sx={{
        display: "inline-flex",
        alignItems: "stretch",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: disabled ? "action.hover" : "background.paper",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Button
        size="small"
        disabled={disabled}
        onClick={() => onChange(shiftDate(value, -1))}
        aria-label="前日"
        startIcon={<ChevronLeftIcon fontSize="small" />}
        sx={arrowSx}
      >
        前日
      </Button>
      <Box
        component="label"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 1, sm: 1.75 },
          borderLeft: "1px solid",
          borderRight: "1px solid",
          borderColor: "divider",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 12.5, sm: 14 },
            fontWeight: 600,
            minWidth: { xs: 96, sm: 150 },
            textAlign: "center",
          }}
        >
          {formatDateStr(value)}
        </Typography>
        {/* 幅を絞ってカレンダーアイコンだけを見せる（値の表示は左のラベルが担う） */}
        <Box
          component="input"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          sx={{
            border: 0,
            background: "none",
            font: "inherit",
            fontSize: 12,
            color: "text.secondary",
            width: 16,
            p: 0,
            cursor: "pointer",
            "&::-webkit-calendar-picker-indicator": { cursor: "pointer", opacity: 0.6 },
          }}
        />
      </Box>
      <Button
        size="small"
        disabled={disabled}
        onClick={() => onChange(shiftDate(value, 1))}
        aria-label="翌日"
        endIcon={<ChevronRightIcon fontSize="small" />}
        sx={arrowSx}
      >
        翌日
      </Button>
    </Box>
  );
}
