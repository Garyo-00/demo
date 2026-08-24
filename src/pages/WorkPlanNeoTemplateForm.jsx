import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import ItemTable from "../components/wpn/ItemTable.jsx";
import BlockCard from "../components/wpn/BlockCard.jsx";
import BasicInfoBlock from "../components/wpn/BasicInfoBlock.jsx";
import CraneAutoBlock from "../components/wpn/CraneAutoBlock.jsx";
import ChecklistEditor from "../components/wpn/ChecklistEditor.jsx";
import {
  ANSWER_TYPES,
  FIXED_ITEMS,
  TEMPLATE_BLOCKS,
  defaultBlocks,
  defaultCraneAuto,
  makeChecklist,
  newId,
} from "../workPlanNeoData.js";

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}

export default function WorkPlanNeoTemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getTemplate, saveTemplate } = useWpn();
  const editing = getTemplate(id);

  const [name, setName] = useState(editing?.name || "");
  const [blocks, setBlocks] = useState(
    editing?.blocks || defaultBlocks(["basic", "other"])
  );
  const [craneAuto, setCraneAuto] = useState(editing?.craneAuto || defaultCraneAuto());
  const [other, setOther] = useState(editing?.other || []);
  const [checklists, setChecklists] = useState(editing?.checklists || [makeChecklist()]);
  const [files, setFiles] = useState(editing?.files || []);
  const fileRef = useRef(null);

  function pickFiles(e) {
    const picked = Array.from(e.target.files || []).map((f) => ({
      id: newId("f"),
      name: f.name,
    }));
    setFiles((list) => [...list, ...picked]);
    e.target.value = "";
  }

  // 中身の仕様が決まっているブロックだけ、カード内に設定UIを出す（未定のものは使用可否のみ）
  function blockBody(key) {
    if (key === "basic") return <BasicInfoBlock />;
    if (key === "crane") return <CraneAutoBlock value={craneAuto} onChange={setCraneAuto} />;
    if (key === "other") return <ItemTable rows={other} onChange={setOther} types={ANSWER_TYPES} />;
    return null;
  }

  function submit() {
    if (!name.trim()) {
      alert("テンプレート名を入力してください。");
      return;
    }
    saveTemplate({
      id: editing?.id || newId("tpl"),
      name: name.trim(),
      kind: editing?.kind || "custom",
      updatedAt: todayStr(),
      updatedBy: "元請 田中",
      blocks,
      craneAuto,
      other,
      checklists,
      files,
    });
    navigate("/workplan-neo/templates");
  }

  return (
    <div>
      <h1 className="wpn-page-title">
        作業計画書テンプレート設定{editing ? "編集" : "作成"}
      </h1>
      <p className="wpn-page-note">
        作業計画書の書式はゼネコン各社で異なるため、元請ユーザーが項目を自由に設定します。
        ここで作成したテンプレートを、職長ユーザーが作業計画書を新規作成する際に選択します。
      </p>

      {/* テンプレート名 */}
      <div className="wpn-card">
        <label className="wpn-label" htmlFor="wpn-tpl-name">
          テンプレート名
        </label>
        <input
          id="wpn-tpl-name"
          className="wpn-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：移動式クレーン作業"
        />
      </div>

      {/* 必須項目（全テンプレート共通・編集不可） */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">
          必須項目
          <span className="wpn-hint">全テンプレート共通で作業計画書に入る項目です（編集不可）</span>
        </h2>
        <table className="wpn-table">
          <thead>
            <tr>
              <th>項目</th>
              <th style={{ width: "34%" }}>回答形式</th>
              <th className="wpn-col-req">必須</th>
            </tr>
          </thead>
          <tbody>
            {FIXED_ITEMS.map((it) => (
              <tr key={it.label}>
                <td>{it.label}</td>
                <td>{it.type}</td>
                <td>
                  <input type="checkbox" className="wpn-check" checked disabled aria-label="必須（固定）" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ブロック（作業計画書はブロック単位で構成する） */}
      {TEMPLATE_BLOCKS.map((b) => (
        <BlockCard
          key={b.key}
          block={b}
          enabled={!!blocks[b.key]}
          onToggle={(v) => setBlocks((s) => ({ ...s, [b.key]: v }))}
        >
          {blockBody(b.key)}
        </BlockCard>
      ))}

      {/* 書類添付 */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">
          書類添付
          <span className="wpn-hint">作業手順書など、この計画書に常に添付する書類</span>
        </h2>
        {files.length > 0 && (
          <ul className="wpn-files">
            {files.map((f) => (
              <li key={f.id}>
                <span>{f.name}</span>
                <button
                  type="button"
                  className="wpn-icon-btn"
                  onClick={() => setFiles((list) => list.filter((x) => x.id !== f.id))}
                  aria-label="添付を削除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="wpn-file-row">
          <input ref={fileRef} type="file" multiple hidden onChange={pickFiles} />
          <button type="button" className="wpn-btn primary sm" onClick={() => fileRef.current?.click()}>
            ファイルを選択
          </button>
        </div>
      </div>

      {/* チェックリスト */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">
          チェックリスト
          <span className="wpn-hint">
            承認後、点検QR（機械個体）から作業計画書を閲覧する際に、運転者が確認する項目
          </span>
        </h2>
        <ChecklistEditor lists={checklists} onChange={setChecklists} />
      </div>

      <div className="wpn-actions">
        <button type="button" className="wpn-btn ghost" onClick={() => navigate("/workplan-neo/templates")}>
          ✕ キャンセル
        </button>
        <button type="button" className="wpn-btn primary" onClick={submit}>
          登録
        </button>
      </div>
    </div>
  );
}
