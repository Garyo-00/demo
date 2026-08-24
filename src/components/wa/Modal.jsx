// 作業間調整pro 用の汎用モーダル（MUI Dialog）
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function Modal({ title, onClose, children, footer, wide }) {
  return (
    <Dialog open fullWidth maxWidth={wide ? "md" : "sm"} onClose={onClose} scroll="paper">
      <DialogTitle
        component="div"
        sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.75, px: 2.75 }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="閉じる">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 2.75, py: 2.5 }}>
        {children}
      </DialogContent>
      {footer && <DialogActions sx={{ px: 2.75, py: 2 }}>{footer}</DialogActions>}
    </Dialog>
  );
}
