import { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { usePatrol } from "./PatrolContext.jsx";
import { fmtDateTime, fmtSize } from "../../patrolData.js";

// 画像ファイルかどうか。画像はサムネイル表示、それ以外はファイル名のチップで出す。
const isImage = (f) =>
  (f.type || "").startsWith("image/") ||
  (f.url || "").startsWith("data:image/") ||
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name || "");

const THUMB = 96;

// 画像のサムネイル。クリックで拡大ダイアログを開く。
function Thumb({ file, onPreview, onRemove }) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        component="button"
        type="button"
        onClick={() => onPreview(file)}
        title={`${file.name} を拡大表示`}
        sx={{
          width: THUMB,
          height: THUMB,
          p: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: "#fff",
          cursor: "zoom-in",
          display: "block",
          "&:hover": { borderColor: "primary.main" },
        }}
      >
        <Box component="img" src={file.url} alt={file.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
      {onRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={`${file.name} を削除`}
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </Box>
  );
}

/**
 * 添付ファイルの一覧表示。
 * 画像はサムネイル（クリックで拡大）、それ以外はダウンロードできるチップ。
 * onRemove を渡すと編集中の削除ボタンが付く。
 */
function Attachments({ files, onPreview, onRemove }) {
  if (!files?.length) return null;
  const images = files.filter(isImage);
  const others = files.filter((f) => !isImage(f));
  return (
    <>
      {images.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {images.map((f) => (
            <Thumb key={f.id} file={f} onPreview={onPreview} onRemove={onRemove && (() => onRemove(f))} />
          ))}
        </Box>
      )}
      {others.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
          {others.map((f) =>
            onRemove ? (
              <Chip
                key={f.id}
                size="small"
                variant="outlined"
                icon={<AttachFileIcon />}
                label={`${f.name}${f.size ? `（${fmtSize(f.size)}）` : ""}`}
                deleteIcon={<CloseIcon />}
                onDelete={() => onRemove(f)}
              />
            ) : (
              <Chip
                key={f.id}
                size="small"
                variant="outlined"
                clickable
                component="a"
                href={f.url}
                download={f.name}
                icon={<AttachFileIcon />}
                label={`${f.name}${f.size ? `（${fmtSize(f.size)}）` : ""}`}
              />
            )
          )}
        </Box>
      )}
    </>
  );
}

// 添付ファイルの選択UI。編集中の追記フォームで使う。
function FilePicker({ files, onChange, onPreview }) {
  const inputRef = useRef(null);
  return (
    <Box sx={{ mt: 1 }}>
      <Button size="small" variant="outlined" startIcon={<AttachFileIcon />} onClick={() => inputRef.current?.click()}>
        ファイルを添付
      </Button>
      <Box
        component="input"
        type="file"
        multiple
        ref={inputRef}
        onChange={(e) => {
          const picked = [...(e.target.files || [])].map((f) => ({
            id: `f${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
            name: f.name,
            size: f.size,
            type: f.type,
            url: URL.createObjectURL(f),
          }));
          if (picked.length) onChange([...files, ...picked]);
          // 同じファイルを選び直せるように値をクリアする
          e.target.value = "";
        }}
        sx={{ display: "none" }}
      />
      <Attachments files={files} onPreview={onPreview} onRemove={(f) => onChange(files.filter((x) => x.id !== f.id))} />
    </Box>
  );
}

// 画像の拡大ダイアログ
function ImagePreview({ file, onClose }) {
  return (
    <Dialog open={!!file} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 14, pr: 6 }}>
        {file?.name}
        <IconButton size="small" onClick={onClose} aria-label="閉じる" sx={{ position: "absolute", top: 12, right: 12 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", justifyContent: "center", bgcolor: "#f7f8fb" }}>
        {file && (
          <Box
            component="img"
            src={file.url}
            alt={file.name}
            sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button size="small" component="a" href={file?.url} download={file?.name}>
          ダウンロード
        </Button>
        <Button size="small" variant="contained" onClick={onClose}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * 追記。実施済み（巡回済み／元請確認済み）の書類に対して、
 * 元請・協力会社のどちらのユーザーも自由に追加できる。
 * 編集・削除は登録した本人のみ。登録日時と登録者を記録する。
 */
export default function PatrolNotes({ record, onSaved }) {
  const { currentUser, canEditNote, addNote, updateNote, removeNote } = usePatrol();
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preview, setPreview] = useState(null);

  const notes = record.notes || [];
  const canSubmit = (t, f) => !!t.trim() || f.length > 0;

  function submit() {
    if (!canSubmit(text, files)) return;
    addNote(record.id, { text: text.trim(), files });
    setText("");
    setFiles([]);
    onSaved?.("追記を登録しました。");
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditText(note.text);
    setEditFiles(note.files || []);
  }

  function saveEdit() {
    if (!canSubmit(editText, editFiles)) return;
    updateNote(record.id, editingId, { text: editText.trim(), files: editFiles });
    setEditingId(null);
    onSaved?.("追記を更新しました。");
  }

  function confirmDelete() {
    removeNote(record.id, deleteTarget.id);
    setDeleteTarget(null);
    if (editingId === deleteTarget.id) setEditingId(null);
    onSaved?.("追記を削除しました。");
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {notes.length === 0 && (
          <Typography color="text.secondary" sx={{ fontSize: 12.5, px: 0.5 }}>
            追記はまだありません。
          </Typography>
        )}

        {notes.map((n) => {
          const mine = canEditNote(n);
          const editing = editingId === n.id;
          return (
            <Box key={n.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{n.authorName}</Typography>
                <Chip size="small" variant="outlined" label={n.authorLabel} />
                {mine && <Chip size="small" color="primary" label="自分の追記" />}
                <Typography color="text.secondary" sx={{ fontSize: 11.5, ml: { sm: "auto" } }}>
                  登録 {fmtDateTime(n.createdAt)}
                  {n.updatedAt && `　更新 ${fmtDateTime(n.updatedAt)}`}
                </Typography>
                {mine && !editing && (
                  <Box sx={{ display: "flex", gap: 0.25 }}>
                    <IconButton size="small" onClick={() => startEdit(n)} aria-label="追記を編集">
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteTarget(n)} aria-label="追記を削除">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {editing ? (
                <>
                  <TextField
                    multiline
                    minRows={3}
                    fullWidth
                    placeholder="追記の内容を入力"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <FilePicker files={editFiles} onChange={setEditFiles} onPreview={setPreview} />
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    <Button size="small" variant="contained" onClick={saveEdit} disabled={!canSubmit(editText, editFiles)}>
                      更新
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => setEditingId(null)}>
                      キャンセル
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  {n.text && (
                    <Typography sx={{ fontSize: 12.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {n.text}
                    </Typography>
                  )}
                  <Attachments files={n.files} onPreview={setPreview} />
                </>
              )}
            </Box>
          );
        })}

        {/* 新規の追記。ログイン中のユーザー名で登録される。 */}
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 1.5, p: 1.5, bgcolor: "#f7f8fb" }}>
          <Typography color="text.secondary" sx={{ fontSize: 11.5, mb: 1 }}>
            {currentUser.name}（{currentUser.label}）として追記します。登録後に編集・削除できるのは本人だけです。
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="追記の内容を入力"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <FilePicker files={files} onChange={setFiles} onPreview={setPreview} />
          <Button size="small" variant="contained" sx={{ mt: 1.5 }} onClick={submit} disabled={!canSubmit(text, files)}>
            追記を登録
          </Button>
        </Box>
      </Box>

      <ImagePreview file={preview} onClose={() => setPreview(null)} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontSize: 15 }}>追記を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 12.5 }}>
            削除すると元に戻せません。添付ファイルも一緒に削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setDeleteTarget(null)}>
            キャンセル
          </Button>
          <Button size="small" color="error" variant="contained" onClick={confirmDelete}>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
