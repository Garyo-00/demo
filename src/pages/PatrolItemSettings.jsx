import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, IconButton, Snackbar, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { usePatrol } from "../components/patrol/PatrolContext.jsx";
import PrimeOnly from "../components/patrol/PrimeOnly.jsx";
import { PATROL_ITEM_GROUP } from "../patrolData.js";

/**
 * 巡回/パトロール項目編集。
 * 巡回時にチェックする項目を登録・並び替え・削除する（元請のみ）。
 * 並び替えはハンドルのドラッグで行う。
 */
export default function PatrolItemSettings() {
  const { patrolItems, savePatrolItems } = usePatrol();
  const [items, setItems] = useState(patrolItems);
  const [toast, setToast] = useState("");
  // ドラッグ中の項目と、ハンドルを押している項目（ハンドル以外からは動かさない）
  const [dragId, setDragId] = useState(null);
  const [handleId, setHandleId] = useState(null);

  useEffect(() => setItems(patrolItems), [patrolItems]);

  // 未登録の変更があるまま離脱しようとしたらブラウザに警告させる
  const dirty = JSON.stringify(items) !== JSON.stringify(patrolItems);
  useEffect(() => {
    if (!dirty) return undefined;
    const onLeave = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const setText = (id, text) => setItems((list) => list.map((it) => (it.id === id ? { ...it, text } : it)));
  const remove = (id) => setItems((list) => list.filter((it) => it.id !== id));
  const add = () => setItems((list) => [...list, { id: `i${Date.now()}`, text: "" }]);

  // ドラッグ中の項目を、重なった項目の位置へ差し替える
  function moveOver(overId) {
    setItems((list) => {
      const from = list.findIndex((it) => it.id === dragId);
      const to = list.findIndex((it) => it.id === overId);
      if (from === -1 || to === -1 || from === to) return list;
      const next = [...list];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }

  function submit() {
    // 空の項目は登録しない
    savePatrolItems(items.filter((it) => it.text.trim()).map((it) => ({ ...it, text: it.text.trim() })));
    setToast("登録しました。");
  }

  return (
    <PrimeOnly title="巡回/パトロール項目編集">
      <Card>
        <CardContent>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              textAlign: "center",
              bgcolor: "#f7f8fb",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              py: 0.75,
              mb: 2,
            }}
          >
            {PATROL_ITEM_GROUP}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {items.map((it, i) => (
              <Box
                key={it.id}
                draggable={handleId === it.id}
                onDragStart={() => setDragId(it.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setHandleId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragId && dragId !== it.id) moveOver(it.id);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  opacity: dragId === it.id ? 0.4 : 1,
                }}
              >
                <Box
                  onMouseDown={() => setHandleId(it.id)}
                  onMouseUp={() => setHandleId(null)}
                  title="ドラッグして並び替え"
                  sx={{ display: "flex", color: "text.secondary", cursor: "grab", "&:active": { cursor: "grabbing" } }}
                >
                  <DragIndicatorIcon fontSize="small" />
                </Box>
                <Typography sx={{ width: 20, textAlign: "right", fontSize: 12.5, color: "text.secondary" }}>
                  {i + 1}
                </Typography>
                <TextField
                  fullWidth
                  placeholder="項目を入力"
                  value={it.text}
                  onChange={(e) => setText(it.id, e.target.value)}
                />
                <IconButton size="small" onClick={() => remove(it.id)} aria-label={`${i + 1}番目の項目を削除`}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={add}>
              項目追加
            </Button>
          </Box>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button variant="contained" onClick={submit}>
              登録
            </Button>
            {dirty && (
              <Typography color="text.secondary" sx={{ fontSize: 11.5, mt: 1 }}>
                未登録の変更があります。「登録」を押すまで保存されません。
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </PrimeOnly>
  );
}
