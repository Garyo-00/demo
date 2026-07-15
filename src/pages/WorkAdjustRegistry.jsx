import { useState } from "react";
import {
  WA_EQUIP_CATEGORIES,
  WA_COMPANIES,
  WA_SAFETY_MACHINES,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import { SuggestField } from "../components/wa/Field.jsx";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

// 表示名（現場内呼称）サジェスト候補
const EQUIP_NAMES = [
  "タワークレーン1号", "ラフター25t", "高所作業車 12m", "油圧ショベル ZX120",
  "ダンプトラック 10t", "高速カッター", "発電機 25kVA",
];

function emptyEquip() {
  return { id: "", category: "", name: "", bringIn: "", primary: "", show: true };
}
// 既存リストのID末尾番号から連番でIDを採番
function nextIds(list, prefix, count) {
  let max = 0;
  list.forEach((x) => {
    const m = /(\d+)$/.exec(x.id);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return Array.from({ length: count }, (_, i) => prefix + "-" + String(max + i + 1).padStart(3, "0"));
}
const cellInput = {
  width: "100%",
  border: "1px solid var(--line)",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 13,
  fontFamily: "inherit",
};

// 揚重機登録・資機材登録の共通セクション（テーブル構成は同一）。list/setListは共有状態
function EquipmentSection({ label, list, setList, idPrefix }) {
  const [edit, setEdit] = useState(null);
  const [bulk, setBulk] = useState(null); // 一括登録の行配列
  const [importSel, setImportSel] = useState(null); // 持込機械インポート（選択id集合）

  const valid = (e) => e.category && e.name && e.bringIn && e.primary;

  function save() {
    const e = edit;
    if (!valid(e)) {
      window.alert("カテゴリ・表示名（現場内呼称）・持込会社名・一次会社は必須です。");
      return;
    }
    if (e.id) setList((es) => es.map((x) => (x.id === e.id ? e : x)));
    else {
      setList((es) => [...es, { ...e, id: nextIds(es, idPrefix, 1)[0], show: true }]);
    }
    setEdit(null);
  }
  function remove(e) {
    if (window.confirm(`「${e.name}」を削除しますか？`))
      setList((es) => es.filter((x) => x.id !== e.id));
  }
  // 予約ページへの表示／非表示の切替
  function toggleShow(e) {
    setList((es) => es.map((x) => (x.id === e.id ? { ...x, show: !x.show } : x)));
  }

  // 一括登録
  function openBulk() {
    setBulk([emptyEquip(), emptyEquip(), emptyEquip()]);
  }
  function setBulkRow(i, key, val) {
    setBulk((b) => b.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function commitBulk() {
    const rows = bulk.filter(valid);
    if (rows.length === 0) {
      window.alert("必須項目（4項目）を入力した行がありません。");
      return;
    }
    setList((es) => {
      const ids = nextIds(es, idPrefix, rows.length);
      return [...es, ...rows.map((r, i) => ({ ...r, id: ids[i], show: true }))];
    });
    setBulk(null);
  }

  // 持込機械から登録（安全セーフティの持込機械一覧からインポート）
  function openImport() {
    setImportSel(new Set());
  }
  function toggleImport(id) {
    setImportSel((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function commitImport() {
    const picks = WA_SAFETY_MACHINES.filter((m) => importSel.has(m.id));
    if (picks.length === 0) {
      window.alert("取り込む持込機械を選択してください。");
      return;
    }
    setList((es) => {
      const ids = nextIds(es, idPrefix, picks.length);
      return [
        ...es,
        ...picks.map((m, i) => ({
          id: ids[i], category: m.category, name: m.name, bringIn: m.bringIn, primary: m.primary, show: true,
        })),
      ];
    });
    setImportSel(null);
  }

  return (
    <>
      <div className="toolbar">
        <span className="subtle">全 {list.length} 件</span>
        <div className="stack-actions spacer">
          <button className="ghost-btn accent-outline" onClick={openImport}>
            ⭳ 持込機械から同期
          </button>
          <div className="stack-row">
            <button className="ghost-btn" onClick={openBulk}>
              一括登録
            </button>
            <button className="primary-btn" onClick={() => setEdit(emptyEquip())}>
              ＋ 新規登録
            </button>
          </div>
        </div>
      </div>
      {/* デスクトップ：テーブル表示 */}
      <table className="reg-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>カテゴリ</th>
            <th>表示名（現場内呼称）</th>
            <th>持込会社名</th>
            <th>一次会社</th>
            <th>予約表示</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td>{e.category}</td>
              <td>{e.name}</td>
              <td>{e.bringIn}</td>
              <td>{e.primary}</td>
              <td>
                <label className="cmp-check" title="予約ページへの表示／非表示">
                  <input type="checkbox" checked={e.show} onChange={() => toggleShow(e)} />
                  表示する
                </label>
              </td>
              <td>
                <div className="row-actions">
                  <button className="mini-btn" onClick={() => setEdit({ ...e })}>
                    編集
                  </button>
                  <button className="mini-btn danger" onClick={() => remove(e)}>
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* モバイル：カード表示（横スクロール不要） */}
      <div className="wa-card-list">
        {list.map((e) => (
          <div className="wa-card" key={e.id}>
            <div className="wa-card-top">
              <span className="wa-card-id">{e.id}</span>
              <strong className="wa-card-co">{e.name}</strong>
            </div>
            <div className="wa-card-grid">
              <div className="wa-card-field">
                <span className="wa-card-label">カテゴリ</span>
                <span>{e.category}</span>
              </div>
              <div className="wa-card-field">
                <span className="wa-card-label">持込会社名</span>
                <span>{e.bringIn}</span>
              </div>
              <div className="wa-card-field">
                <span className="wa-card-label">一次会社</span>
                <span>{e.primary}</span>
              </div>
              <div className="wa-card-field">
                <span className="wa-card-label">予約表示</span>
                <label className="cmp-check">
                  <input type="checkbox" checked={e.show} onChange={() => toggleShow(e)} />
                  表示する
                </label>
              </div>
            </div>
            <div className="wa-card-actions">
              <button className="mini-btn" onClick={() => setEdit({ ...e })}>
                編集
              </button>
              <button className="mini-btn danger" onClick={() => remove(e)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 新規／編集 */}
      {edit && (
        <Modal
          title={edit.id ? label + "の編集" : label + "の新規登録"}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setEdit(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={save}>
                保存
              </button>
            </>
          }
        >
          <div className="form-grid">
            <SuggestField
              label="カテゴリ"
              required
              value={edit.category}
              onChange={(v) => setEdit((x) => ({ ...x, category: v }))}
              options={WA_EQUIP_CATEGORIES}
              hint="サジェスト＋自由記述"
            />
            <SuggestField
              label="表示名（現場内呼称）"
              required
              value={edit.name}
              onChange={(v) => setEdit((x) => ({ ...x, name: v }))}
              options={EQUIP_NAMES}
              hint="サジェスト＋自由記述"
            />
            <SuggestField
              label="持込会社名"
              required
              value={edit.bringIn}
              onChange={(v) => setEdit((x) => ({ ...x, bringIn: v }))}
              options={WA_COMPANIES}
              hint="サジェスト＋自由記述"
            />
            <SuggestField
              label="一次会社"
              required
              value={edit.primary}
              onChange={(v) => setEdit((x) => ({ ...x, primary: v }))}
              options={WA_COMPANIES}
              hint="サジェスト＋自由記述"
            />
          </div>
        </Modal>
      )}

      {/* 一括登録 */}
      {bulk && (
        <Modal
          wide
          title={label + "の一括登録"}
          onClose={() => setBulk(null)}
          footer={
            <>
              <button
                className="ghost-btn"
                onClick={() => setBulk((b) => [...b, emptyEquip()])}
              >
                ＋ 行を追加
              </button>
              <button className="ghost-btn spacer" onClick={() => setBulk(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitBulk}>
                まとめて登録
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            4項目すべて入力された行のみ登録されます（カテゴリ／表示名（現場内呼称）／持込会社名／一次会社）。
          </p>
          <table className="bulk-table">
            <thead>
              <tr>
                <th>カテゴリ*</th>
                <th>表示名（現場内呼称）*</th>
                <th>持込会社名*</th>
                <th>一次会社*</th>
              </tr>
            </thead>
            <tbody>
              {bulk.map((r, i) => (
                <tr key={i}>
                  <td data-label="カテゴリ">
                    <input list="cat-list" value={r.category} style={cellInput}
                      onChange={(e) => setBulkRow(i, "category", e.target.value)} />
                  </td>
                  <td data-label="表示名（現場内呼称）">
                    <input list="name-list" value={r.name} style={cellInput}
                      onChange={(e) => setBulkRow(i, "name", e.target.value)} />
                  </td>
                  <td data-label="持込会社名">
                    <input list="co-list" value={r.bringIn} style={cellInput}
                      onChange={(e) => setBulkRow(i, "bringIn", e.target.value)} />
                  </td>
                  <td data-label="一次会社">
                    <input list="co-list" value={r.primary} style={cellInput}
                      onChange={(e) => setBulkRow(i, "primary", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {/* 持込機械から登録（安全セーフティ連携） */}
      {importSel && (
        <Modal
          wide
          title="持込機械から同期"
          onClose={() => setImportSel(null)}
          footer={
            <>
              <button className="ghost-btn spacer" onClick={() => setImportSel(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitImport}>
                取り込む（{importSel.size}件）
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            別サービス「<strong>安全セーフティ</strong>」の持込機械一覧から選択して取り込みます。
          </p>
          <table className="import-table">
            <thead>
              <tr>
                <th className="col-check"></th>
                <th>カテゴリ</th>
                <th>表示名（現場内呼称）</th>
                <th>持込会社名</th>
                <th>一次会社</th>
              </tr>
            </thead>
            <tbody>
              {WA_SAFETY_MACHINES.map((m) => (
                <tr key={m.id}>
                  <td className="col-check" data-label="選択">
                    <input
                      type="checkbox"
                      checked={importSel.has(m.id)}
                      onChange={() => toggleImport(m.id)}
                    />
                  </td>
                  <td data-label="カテゴリ">{m.category}</td>
                  <td data-label="表示名（現場内呼称）">{m.name}</td>
                  <td data-label="持込会社名">{m.bringIn}</td>
                  <td data-label="一次会社">{m.primary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}

function emptyGate() {
  return { id: "", name: "", location: "", note: "", show: true };
}

export default function WorkAdjustRegistry() {
  const { gates, setGates, lifts, setLifts, equipment, setEquipment } = useWaSettings();
  const [tab, setTab] = useState("lift");
  const [gateEdit, setGateEdit] = useState(null);

  function saveGate() {
    const g = gateEdit;
    if (g.id) setGates((gs) => gs.map((x) => (x.id === g.id ? g : x)));
    else {
      setGates((gs) => [...gs, { ...g, id: nextIds(gs, "G", 1)[0], show: true }]);
    }
    setGateEdit(null);
  }
  function removeGate(g) {
    if (window.confirm(`ゲート「${g.name}」を削除しますか？`))
      setGates((gs) => gs.filter((x) => x.id !== g.id));
  }
  function toggleGateShow(g) {
    setGates((gs) => gs.map((x) => (x.id === g.id ? { ...x, show: !x.show } : x)));
  }

  return (
    <div>
      <div className="crumb">資機材・ゲート登録</div>
      <strong style={{ fontSize: 15 }}>資機材・ゲート登録</strong>

      <div className="tabs">
        <button className={"tab" + (tab === "lift" ? " on" : "")} onClick={() => setTab("lift")}>
          揚重機
        </button>
        <button className={"tab" + (tab === "gate" ? " on" : "")} onClick={() => setTab("gate")}>
          ゲート
        </button>
        <button className={"tab" + (tab === "equip" ? " on" : "")} onClick={() => setTab("equip")}>
          資機材・その他
        </button>
      </div>

      {tab === "gate" && (
        <>
          <div className="toolbar">
            <span className="subtle">全 {gates.length} 件</span>
            <button className="primary-btn spacer" onClick={() => setGateEdit(emptyGate())}>
              ＋ ゲート登録
            </button>
          </div>
          {/* デスクトップ：テーブル表示 */}
          <table className="reg-table">
            <thead>
              <tr>
                <th>ゲートID</th>
                <th>ゲート名</th>
                <th>設置場所</th>
                <th>備考</th>
                <th>予約表示</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>{g.name}</td>
                  <td>{g.location}</td>
                  <td>{g.note || <span className="subtle">—</span>}</td>
                  <td>
                    <label className="cmp-check" title="予約ページへの表示／非表示">
                      <input type="checkbox" checked={g.show} onChange={() => toggleGateShow(g)} />
                      表示する
                    </label>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="mini-btn" onClick={() => setGateEdit({ ...g })}>
                        編集
                      </button>
                      <button className="mini-btn danger" onClick={() => removeGate(g)}>
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* モバイル：カード表示（横スクロール不要） */}
          <div className="wa-card-list">
            {gates.map((g) => (
              <div className="wa-card" key={g.id}>
                <div className="wa-card-top">
                  <span className="wa-card-id">{g.id}</span>
                  <strong className="wa-card-co">{g.name}</strong>
                </div>
                <div className="wa-card-grid">
                  <div className="wa-card-field">
                    <span className="wa-card-label">設置場所</span>
                    <span>{g.location || "—"}</span>
                  </div>
                  <div className="wa-card-field">
                    <span className="wa-card-label">備考</span>
                    <span>{g.note || "—"}</span>
                  </div>
                  <div className="wa-card-field">
                    <span className="wa-card-label">予約表示</span>
                    <label className="cmp-check">
                      <input type="checkbox" checked={g.show} onChange={() => toggleGateShow(g)} />
                      表示する
                    </label>
                  </div>
                </div>
                <div className="wa-card-actions">
                  <button className="mini-btn" onClick={() => setGateEdit({ ...g })}>
                    編集
                  </button>
                  <button className="mini-btn danger" onClick={() => removeGate(g)}>
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "lift" && (
        <EquipmentSection label="揚重機" list={lifts} setList={setLifts} idPrefix="L" />
      )}
      {tab === "equip" && (
        <EquipmentSection label="資機材・その他" list={equipment} setList={setEquipment} idPrefix="E" />
      )}

      {/* 共通 datalist */}
      <datalist id="cat-list">
        {WA_EQUIP_CATEGORIES.map((o) => <option key={o} value={o} />)}
      </datalist>
      <datalist id="name-list">
        {EQUIP_NAMES.map((o) => <option key={o} value={o} />)}
      </datalist>
      <datalist id="co-list">
        {WA_COMPANIES.map((o) => <option key={o} value={o} />)}
      </datalist>

      {/* ゲート登録／編集 */}
      {gateEdit && (
        <Modal
          title={gateEdit.id ? "ゲートの編集" : "ゲート登録"}
          onClose={() => setGateEdit(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setGateEdit(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={saveGate}>
                保存
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field">
              <label>
                ゲート名<span className="req">*</span>
              </label>
              <input
                value={gateEdit.name}
                onChange={(e) => setGateEdit((x) => ({ ...x, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>設置場所</label>
              <input
                value={gateEdit.location}
                onChange={(e) => setGateEdit((x) => ({ ...x, location: e.target.value }))}
              />
            </div>
            <div className="field full">
              <label>備考</label>
              <input
                value={gateEdit.note}
                onChange={(e) => setGateEdit((x) => ({ ...x, note: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
