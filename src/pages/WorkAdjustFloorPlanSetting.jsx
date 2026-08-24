import { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

const STATUS = {
  converted: { label: "変換済", color: "success" },
  unconverted: { label: "未変換", color: "default" },
};

function emptyForm() {
  return { id: "", floorName: "", note: "", image: null };
}

export default function WorkAdjustFloorPlanSetting() {
  const { templates: items, setTemplates: setItems } = useWaSettings();
  const [view, setView] = useState("list"); // list | register | detail
  const [form, setForm] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null); // ⋮メニュー {el, item}
  const [seq, setSeq] = useState(items.length);
  const fileRef = useRef(null);

  const detail = items.find((x) => x.id === detailId);

  function openRegister() {
    setForm(emptyForm());
    setView("register");
  }
  function openDetail(item) {
    setDetailId(item.id);
    setMenuAnchor(null);
    setView("detail");
  }
  function removeItem(item) {
    setMenuAnchor(null);
    if (window.confirm(`「${item.floorName}」を削除しますか？`)) {
      setItems((xs) => xs.filter((x) => x.id !== item.id));
    }
  }
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm((x) => ({ ...x, image: reader.result }));
    reader.readAsDataURL(f);
    e.target.value = "";
  }
  function saveForm() {
    if (!form.floorName.trim()) {
      window.alert("フロア名を入力してください。");
      return;
    }
    const status = form.image ? "converted" : "unconverted";
    const n = seq + 1;
    setSeq(n);
    setItems((xs) => [...xs, { ...form, id: "FP-" + String(n).padStart(3, "0"), status }]);
    setView("list");
    setForm(null);
  }

  // ===== 登録 =====
  if (view === "register") {
    return (
      <Box>
        <Typography variant="h1" sx={{ mb: 1.75 }}>
          作業配置図設定登録
        </Typography>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h2" sx={{ fontSize: 15, mb: 2 }}>
              基本情報
            </Typography>
            <TextField
              fullWidth
              size="small"
              required
              label="フロア名"
              value={form.floorName}
              onChange={(e) => setForm((f) => ({ ...f, floorName: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              size="small"
              label="備考"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h2" sx={{ fontSize: 15, mb: 2 }}>
              図面
            </Typography>
            <Button variant="contained" onClick={() => fileRef.current?.click()}>
              ファイルを選択
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            {form.image && (
              <Box
                component="img"
                src={form.image}
                alt="図面プレビュー"
                sx={{
                  display: "block",
                  mt: 1.75,
                  maxWidth: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                }}
              />
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={() => {
              setView("list");
              setForm(null);
            }}
          >
            キャンセル
          </Button>
          <Button variant="contained" onClick={saveForm}>
            登録
          </Button>
        </Box>
      </Box>
    );
  }

  // ===== 詳細 =====
  if (view === "detail" && detail) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setView("list")} sx={{ mb: 1.75 }}>
          一覧に戻る
        </Button>
        <Card>
          <CardContent>
            <Typography variant="h2" sx={{ fontSize: 15, mb: 2 }}>
              作業配置図設定: {detail.floorName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              備考
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {detail.note ? detail.note : "—"}
            </Typography>
            {detail.image ? (
              <Box
                component="img"
                src={detail.image}
                alt={detail.floorName}
                sx={{
                  display: "block",
                  maxWidth: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                }}
              />
            ) : (
              // 方眼の背景は既存CSSのまま（図面未登録のプレースホルダ）
              <div className="fps-planbox">図面（アップロードした画像を表示します）</div>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ===== 一覧 =====
  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1.75 }}>
        作業配置図設定
      </Typography>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>作業配置図設定一覧</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openRegister}>
              追加
            </Button>
          </Box>
          {items.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", fontSize: 13 }} color="text.secondary">
              作業配置図がありません。
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>フロア名</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>備考</TableCell>
                    <TableCell sx={{ width: 48 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id} hover>
                      <TableCell>{it.floorName}</TableCell>
                      <TableCell>
                        <Chip size="small" color={STATUS[it.status].color} label={STATUS[it.status].label} />
                      </TableCell>
                      <TableCell>
                        {it.note || (
                          <Typography component="span" variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label="操作メニュー"
                          onClick={(e) => setMenuAnchor({ el: e.currentTarget, item: it })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Menu
        open={!!menuAnchor}
        anchorEl={menuAnchor?.el}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => openDetail(menuAnchor.item)} sx={{ fontSize: 13 }}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          詳細
        </MenuItem>
        <MenuItem
          onClick={() => removeItem(menuAnchor.item)}
          sx={{ fontSize: 13, color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          削除
        </MenuItem>
      </Menu>
    </Box>
  );
}
