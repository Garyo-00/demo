import { useState } from "react";
import {
  RSV_KIND_LABEL,
  resKey,
  linkState,
  rsvTimeLabel,
  defaultTimes,
  scheduleLabel,
} from "./scheduleLinks.js";

// 作業予定フォームの「使用する資機材・ゲート」。
// 選んだ資源ごとに、その日・その協力会社の予約があるかを表示し、
// 無ければその場で予約を作成できる。
export default function ResourcePicker({
  options, // [{kind, name}] 予約表示ONの資源
  value, // [{kind, name, rsvId}]
  onChange,
  reservations,
  date,
  company,
  onCreateReservation, // (res, {start, end, vehicleType}) => 予約ID
  timeOptions,
  vehicleTypes,
  claims, // 予約ID → その予約を掴んでいる作業予定（1予約＝1予定の判定用）
  selfId, // 編集中の作業予定ID
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(null); // 予約作成中の資源キー
  const [draft, setDraft] = useState(null);

  const picked = (kind, name) => value.some((v) => v.kind === kind && v.name === name);
  function toggle(kind, name) {
    onChange(
      picked(kind, name)
        ? value.filter((v) => !(v.kind === kind && v.name === name))
        : [...value, { kind, name, rsvId: null }]
    );
    setCreating(null);
  }

  function startCreate(res) {
    setCreating(resKey(res.kind, res.name));
    setDraft({
      ...defaultTimes(timeOptions),
      vehicleType: res.kind === "gate" ? vehicleTypes[0] : "",
    });
  }
  function commitCreate(res) {
    if (draft.start >= draft.end) {
      window.alert("終了時刻は開始時刻より後にしてください。");
      return;
    }
    const rsvId = onCreateReservation(res, draft);
    onChange(
      value.map((v) => (v.kind === res.kind && v.name === res.name ? { ...v, rsvId } : v))
    );
    setCreating(null);
  }

  return (
    <div className="field full">
      <label>使用する資機材・ゲート</label>
      <div className="ms-dd">
        <button
          type="button"
          className="ms-dd-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          disabled={options.length === 0}
        >
          <span className="ms-dd-text">
            {options.length === 0
              ? "予約表示ONの資機材・ゲートがありません"
              : value.length === 0
              ? "使用しない"
              : value.map((v) => v.name).join("、")}
          </span>
          <span className="ms-dd-caret">▾</span>
        </button>
        {open && (
          <>
            <div className="ms-dd-backdrop" onClick={() => setOpen(false)} />
            <div className="ms-dd-panel">
              <div className="ms-dd-note">
                使用する資機材・ゲートを選ぶと、その日の予約と紐づきます
              </div>
              {options.map((o) => (
                <label className="ms-dd-item" key={resKey(o.kind, o.name)}>
                  <input
                    type="checkbox"
                    checked={picked(o.kind, o.name)}
                    onChange={() => toggle(o.kind, o.name)}
                  />
                  {o.name}
                  <span className="res-kind">{RSV_KIND_LABEL[o.kind]}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {value.length > 0 && (
        <ul className="res-links">
          {value.map((res) => {
            const { reservation, state, dateMismatch, owner } = linkState(
              reservations,
              { date, company, claims, selfId },
              res
            );
            const key = resKey(res.kind, res.name);
            return (
              <li className="res-link" key={key}>
                <div className="res-link-head">
                  <span className="res-link-name">{res.name}</span>
                  <span className="res-kind">{RSV_KIND_LABEL[res.kind]}</span>
                  {state === "linked" ? (
                    <span className={"res-badge " + (dateMismatch ? "warn" : "ok")}>
                      予約 {rsvTimeLabel(reservation)} に紐づけ
                      {dateMismatch && `（予約日 ${reservation.date}）`}
                    </span>
                  ) : state === "claimed" ? (
                    // 1つの予約に紐づけられる作業予定は1件まで
                    <>
                      <span className="res-badge warn">
                        {rsvTimeLabel(reservation)} の予約は
                        {owner ? `「${scheduleLabel(owner)}」` : "他の作業予定"}に紐づけ済み
                      </span>
                      {creating !== key && (
                        <button className="mini-btn" onClick={() => startCreate(res)}>
                          ＋ 別の予約を作成
                        </button>
                      )}
                    </>
                  ) : state === "nocompany" ? (
                    // 予約は会社単位で持つため、協力会社名が決まるまで照合できない
                    <span className="res-badge">協力会社名を入力すると予約を照合します</span>
                  ) : (
                    <>
                      <span className="res-badge warn">
                        {state === "others" ? "自社の予約なし（他社の予約あり）" : "予約なし"}
                      </span>
                      {creating !== key && (
                        <button className="mini-btn" onClick={() => startCreate(res)}>
                          ＋ 予約を作成
                        </button>
                      )}
                    </>
                  )}
                </div>

                {creating === key && (
                  <div className="res-create">
                    <select
                      value={draft.start}
                      onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                    >
                      {timeOptions.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <span>〜</span>
                    <select
                      value={draft.end}
                      onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                    >
                      {timeOptions.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    {res.kind === "gate" && (
                      <select
                        value={draft.vehicleType}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, vehicleType: e.target.value }))
                        }
                      >
                        {vehicleTypes.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    )}
                    <button className="mini-btn primary" onClick={() => commitCreate(res)}>
                      作成
                    </button>
                    <button className="mini-btn" onClick={() => setCreating(null)}>
                      やめる
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
