import { useEffect, useRef, useState } from "react";

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
    <div className="wpn-sign-pad">
      {/* canvas は非表示にすると描画内容が消えるため、切替時も DOM には残す */}
      <div hidden={byName}>
        <div className="wpn-sign-label">枠内にサインしてください</div>
        <canvas
          ref={canvasRef}
          className="wpn-sign-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
      </div>

      {byName && (
        <>
          <label className="wpn-label" htmlFor="wpn-sign-name">
            氏名
          </label>
          <input
            id="wpn-sign-name"
            className="wpn-input"
            placeholder="氏名を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </>
      )}

      <div className="wpn-sign-actions">
        {byName ? (
          <button type="button" className="wpn-linkbtn" onClick={() => setByName(false)}>
            手書きでサインする
          </button>
        ) : (
          <>
            <button type="button" className="wpn-btn ghost sm" onClick={clear} disabled={!dirty}>
              消去
            </button>
            <button type="button" className="wpn-linkbtn" onClick={() => setByName(true)}>
              サインができない場合は氏名を入力
            </button>
          </>
        )}
        {onCancel && (
          <button type="button" className="wpn-btn plain sm" onClick={onCancel}>
            キャンセル
          </button>
        )}
        <button
          type="button"
          className="wpn-btn primary wpn-sign-save"
          disabled={!canSave}
          onClick={save}
        >
          保存
        </button>
      </div>
      {!canSave && (
        <div className="wpn-sign-note">
          {byName ? "氏名を入力してください。" : "枠内にサインしてください。"}
        </div>
      )}
    </div>
  );
}
