import { useEffect, useRef, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

/**
 * デバイス上で手書きサインを描く枠。指／マウスどちらでも描ける。
 * 手書きが難しい人のために、氏名入力に切り替えることもできる。
 * 保存時は { image } または { name } のどちらかを返す。
 */
export default function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  // 手書きできない場合の代替入力
  const [byName, setByName] = useState(false);
  const [name, setName] = useState("");

  // 表示サイズに合わせて解像度を設定する（拡大時のにじみを防ぐ）
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2437";
  }, []);

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function start(e) {
    e.preventDefault();
    drawing.current = true;
    setDirty(true);
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    // 枠外までドラッグしても描き続けられるようにする（未対応環境では無視）
    try {
      canvasRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function end() {
    drawing.current = false;
  }
  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
  }

  const canSave = byName ? !!name.trim() : dirty;

  function save() {
    if (byName) onSave({ name: name.trim(), image: null });
    else onSave({ name: "", image: canvasRef.current.toDataURL("image/png") });
  }

  return (
    <Box>
      {/* canvas は非表示にすると描画内容が消えるため、切替時も DOM には残す */}
      <Box hidden={byName}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          枠内にサインしてください
        </Typography>
        <Box
          component="canvas"
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          sx={{
            display: "block",
            width: "100%",
            height: 180,
            border: "1px dashed #c2c8d6",
            borderRadius: 2.5,
            bgcolor: "#fbfcfe",
            touchAction: "none",
            cursor: "crosshair",
          }}
        />
      </Box>

      {byName && (
        <TextField fullWidth label="氏名" value={name} onChange={(e) => setName(e.target.value)} />
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 1.5, flexWrap: "wrap" }}>
        {byName ? (
          <Button size="small" onClick={() => setByName(false)}>
            手書きでサインする
          </Button>
        ) : (
          <>
            <Button variant="outlined" size="small" onClick={clear} disabled={!dirty}>
              消去
            </Button>
            <Button size="small" onClick={() => setByName(true)}>
              サインができない場合は氏名を入力
            </Button>
          </>
        )}
        {onCancel && (
          <Button size="small" color="inherit" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button variant="contained" sx={{ ml: "auto" }} disabled={!canSave} onClick={save}>
          保存
        </Button>
      </Box>

      {!canSave && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {byName ? "氏名を入力してください。" : "枠内にサインしてください。"}
        </Typography>
      )}
    </Box>
  );
}
