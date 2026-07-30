import { useState } from "react";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

// 予約時間設定の対象
const TIME_RESOURCES = [
  { key: "lift", label: "揚重機" },
  { key: "gate", label: "ゲート" },
  { key: "material", label: "資機材登録" },
];

// 開始時間 0〜6時 / 終了時間 24〜30時（1時間単位）
const START_OPTS = [0, 1, 2, 3, 4, 5, 6];
const END_OPTS = [24, 25, 26, 27, 28, 29, 30];
const MAX_SPAN = 24; // 1日の予約可能時間は24時間まで
const fmtStart = (h) => `${h}時`;
const fmtEnd = (h) => `${h}時（翌${h - 24}時）`;

// 選択式設定（権限・種類・時間間隔）の対象と選択肢
const INTERVAL_OPTS = ["15分", "30分", "60分"];
const PERM_ROWS = [
  { key: "lift", label: "揚重機", options: ["アカウント必須"] },
  { key: "gate", label: "ゲート", options: ["アカウント必須"] },
  { key: "other", label: "資機材・その他", options: ["アカウント必須", "アカウント不要"] },
];
const INTERVAL_ROWS = [
  { key: "lift", label: "揚重機", options: INTERVAL_OPTS },
  { key: "gate", label: "ゲート", options: INTERVAL_OPTS },
  { key: "other", label: "資機材・その他", options: INTERVAL_OPTS },
];

// 選択式設定の共通表示（揚重機・ゲートは選択肢1つ＝固定、その他は選択式）
function ChoiceSettings({ rows, values, onChange }) {
  return (
    <div className="set-block">
      {rows.map((r) => {
        const fixed = r.options.length === 1;
        return (
          <div className="set-row" key={r.key}>
            <span className="set-label">{r.label}</span>
            <div className="set-time">
              {fixed ? (
                <>
                  <span className="set-fixed">{r.options[0]}</span>
                  <span className="set-span">固定</span>
                </>
              ) : (
                <select value={values[r.key]} onChange={(e) => onChange(r.key, e.target.value)}>
                  {r.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WorkAdjustSettings() {
  const { time, setTime, perm, setPerm, interval, setInterval } = useWaSettings();
  const [tab, setTab] = useState("time");
  const [saved, setSaved] = useState(false);

  function switchTab(t) {
    setSaved(false);
    setTab(t);
  }
  function setTimeStart(key, start) {
    setSaved(false);
    setTime((s) => ({ ...s, [key]: { start, end: Math.min(s[key].end, start + MAX_SPAN) } }));
  }
  function setTimeEnd(key, end) {
    setSaved(false);
    setTime((s) => ({ ...s, [key]: { ...s[key], end } }));
  }
  function setChoice(setter) {
    return (key, val) => {
      setSaved(false);
      setter((s) => ({ ...s, [key]: val }));
    };
  }
  const save = () => setSaved(true);

  const TABS = [
    ["time", "予約時間設定"],
    ["auth", "予約権限設定"],
    ["interval", "予約時間間隔設定"],
  ];

  return (
    <div>
      <div className="page-title">予約設定</div>

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => switchTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "time" && (
        <>
          <p className="wa-note">
            ※ 各対象の1日の予約可能時間を1時間単位で設定します。開始は0〜6時、終了は24〜30時（翌0〜6時）。
            <br />
            ※ 予約可能時間が<strong>24時間を超える設定はできません</strong>（終了時間の選択肢が自動で制限されます）。
          </p>
          <div className="set-block">
            {TIME_RESOURCES.map((r) => {
              const { start, end } = time[r.key];
              const endOpts = END_OPTS.filter((e) => e - start <= MAX_SPAN);
              return (
                <div className="set-row" key={r.key}>
                  <span className="set-label">{r.label}</span>
                  <div className="set-time">
                    <label className="set-field">
                      <span>開始</span>
                      <select value={start} onChange={(e) => setTimeStart(r.key, Number(e.target.value))}>
                        {START_OPTS.map((h) => (
                          <option key={h} value={h}>
                            {fmtStart(h)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="set-tilde">〜</span>
                    <label className="set-field">
                      <span>終了</span>
                      <select value={end} onChange={(e) => setTimeEnd(r.key, Number(e.target.value))}>
                        {endOpts.map((h) => (
                          <option key={h} value={h}>
                            {fmtEnd(h)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="set-span">予約可能 {end - start} 時間</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "auth" && (
        <>
          <p className="wa-note">
            ※ 予約時のアカウント要否を設定します。揚重機・ゲートは「アカウント必須」で固定です。
          </p>
          <ChoiceSettings rows={PERM_ROWS} values={perm} onChange={setChoice(setPerm)} />
        </>
      )}

      {tab === "interval" && (
        <>
          <p className="wa-note">
            ※ 予約枠の時間間隔を設定します（15分／30分／60分）。
          </p>
          <ChoiceSettings rows={INTERVAL_ROWS} values={interval} onChange={setChoice(setInterval)} />
        </>
      )}

      <div className="toolbar">
        {saved && <span className="subtle">設定を保存しました。</span>}
        <button className="primary-btn spacer" onClick={save}>
          保存
        </button>
      </div>
    </div>
  );
}
