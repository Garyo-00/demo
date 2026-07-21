import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:5199";
const ROOT = "/Users/test/Documents/demo/screenshots/workadjust/foreman";

const VP = {
  pc: { width: 1440, height: 1000, deviceScaleFactor: 2 },
  mb: { width: 390, height: 844, deviceScaleFactor: 2 },
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=2", "--hide-scrollbars"],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 可視の button / a / .tab をテキストで探してクリック（React onClick対応）
async function clickText(page, text) {
  const ok = await page.evaluate((t) => {
    const norm = (s) => s.replace(/\s+/g, "");
    const target = norm(t);
    const els = [...document.querySelectorAll("button, a, .tab")].filter((e) => e.offsetParent !== null);
    // 完全一致を優先（「実績入力」が「作業実績入力用QR発行」に部分一致する事故を防ぐ）
    const exact = els.find((e) => norm(e.textContent) === target);
    const el = exact || els.find((e) => norm(e.textContent).includes(target));
    if (el) { el.click(); return true; }
    return false;
  }, text);
  return ok;
}
async function clickSel(page, sel) {
  const ok = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) { el.click(); return true; }
    return false;
  }, sel);
  return ok;
}

const fails = [];

async function cap(spec) {
  const { file, role = "foreman", vp = "pc", url, steps = [] } = spec;
  const page = await browser.newPage();
  await page.setViewport(VP[vp]);
  await page.evaluateOnNewDocument((r) => { try { localStorage.setItem("wa-role", r); } catch {} }, role);
  await page.goto(BASE + url, { waitUntil: "networkidle0" });
  await sleep(450);
  for (const st of steps) {
    let ok = true;
    if (st.date === "next") ok = await clickText(page, "翌日");
    else if (st.click) ok = await clickText(page, st.click);
    else if (st.sel) ok = await clickSel(page, st.sel);
    if (!ok) fails.push(`${file}: step ${JSON.stringify(st)} NOT FOUND`);
    await sleep(400);
  }
  await sleep(250);
  await page.screenshot({ path: `${ROOT}/${file}` });
  await page.close();
  console.log("✓", file);
}

// ============ PC ============
const PC = [
  { file: "01-1-作業予定一覧_確定後.png", url: "/workadjust" },
  { file: "01-2-作業予定一覧_確定前.png", url: "/workadjust", steps: [{ date: "next" }] },
  { file: "01-3-作業予定一覧_出力.png", role: "prime", url: "/workadjust", steps: [{ click: "出力" }] },
  { file: "02-1-作業予定一覧_新規作成.png", url: "/workadjust", steps: [{ click: "新規作成" }] },
  { file: "02-2-作業予定一覧_コピー作成元請.png", role: "prime", url: "/workadjust", steps: [{ click: "コピー作成" }] },
  { file: "02-3-作業予定一覧_コピー作成職長.png", url: "/workadjust", steps: [{ click: "コピー作成" }] },
  { file: "03-作業予定一覧_実績入力.png", role: "prime", url: "/workadjust", steps: [{ click: "実績入力" }] },
  { file: "04-1-予約_ゲート_確定前.png", url: "/workadjust/reservation" },
  { file: "04-2-予約_ゲート_確定後.png", role: "prime", url: "/workadjust/reservation", steps: [{ click: "確定" }] },
  { file: "05-1-予約_揚重機_確定前.png", url: "/workadjust/reservation", steps: [{ click: "揚重機" }] },
  { file: "05-2-予約_揚重機_確定後.png", role: "prime", url: "/workadjust/reservation", steps: [{ click: "揚重機" }, { click: "確定" }] },
  { file: "06-1-予約_その他_確定前.png", url: "/workadjust/reservation", steps: [{ click: "資機材・その他" }] },
  { file: "06-2-予約_その他_確定後.png", role: "prime", url: "/workadjust/reservation", steps: [{ click: "資機材・その他" }, { click: "確定" }] },
  { file: "07-1-予約_予約作成ゲート.png", url: "/workadjust/reservation", steps: [{ click: "予約作成" }] },
  { file: "07-2-予約_予約作成揚重機.png", url: "/workadjust/reservation", steps: [{ click: "揚重機" }, { click: "予約作成" }] },
  { file: "07-3-予約_出力.png", role: "prime", url: "/workadjust/reservation", steps: [{ click: "出力" }] },
  { file: "08-配置図作成.png", url: "/workadjust/floor-plan" },
  { file: "09-配置図作成_新規作成台紙選択.png", url: "/workadjust/floor-plan", steps: [{ click: "配置図を新規作成" }] },
  { file: "10-配置図作成_配置を追加.png", url: "/workadjust/floor-plan", steps: [{ click: "配置図を新規作成" }, { click: "この台紙で作成" }] },
  { file: "11-作業配置図設定_一覧.png", url: "/workadjust/floor-plan-setting" },
  { file: "12-作業配置図設定_登録.png", url: "/workadjust/floor-plan-setting", steps: [{ click: "追加" }] },
  { file: "13-作業配置図設定_詳細.png", url: "/workadjust/floor-plan-setting", steps: [{ sel: ".kebab-btn" }, { click: "詳細" }] },
  { file: "14-資機材ゲート登録_揚重機.png", url: "/workadjust/registry" },
  { file: "15-資機材ゲート登録_ゲート.png", url: "/workadjust/registry", steps: [{ click: "ゲート" }] },
  { file: "16-資機材ゲート登録_資機材.png", url: "/workadjust/registry", steps: [{ click: "資機材・その他" }] },
  { file: "17-資機材ゲート登録_新規登録.png", url: "/workadjust/registry", steps: [{ click: "新規登録" }] },
  { file: "18-資機材ゲート登録_一括登録.png", url: "/workadjust/registry", steps: [{ click: "一括登録" }] },
  { file: "19-資機材ゲート登録_持込機械から同期.png", url: "/workadjust/registry", steps: [{ click: "持込機械から同期" }] },
  { file: "20-協力会社設定_一覧.png", url: "/workadjust/companies" },
  { file: "21-協力会社設定_新規作成.png", url: "/workadjust/companies", steps: [{ click: "新規作成" }] },
  { file: "22-設定_予約時間設定.png", url: "/workadjust/settings" },
  { file: "23-設定_予約権限設定.png", url: "/workadjust/settings", steps: [{ click: "予約権限設定" }] },
  { file: "24-設定_予約種類設定.png", url: "/workadjust/settings", steps: [{ click: "予約種類設定" }] },
  { file: "25-設定_予約時間間隔設定.png", url: "/workadjust/settings", steps: [{ click: "予約時間間隔設定" }] },
];

// ============ Mobile ============
const MB = [
  { file: "mobile/26-1-drawer.png", vp: "mb", url: "/workadjust", steps: [{ sel: ".nav-toggle" }] },
  { file: "mobile/26-2-bell.png", role: "prime", vp: "mb", url: "/workadjust", steps: [{ sel: ".bell-btn" }] },
  { file: "mobile/27-1-schedule-pending.png", vp: "mb", url: "/workadjust", steps: [{ date: "next" }] },
  { file: "mobile/27-2-schedule-confirmed.png", vp: "mb", url: "/workadjust" },
  { file: "mobile/28-1-schedule-create.png", vp: "mb", url: "/workadjust", steps: [{ click: "新規作成" }] },
  { file: "mobile/28-2-copy-prime.png", role: "prime", vp: "mb", url: "/workadjust", steps: [{ click: "コピー作成" }] },
  { file: "mobile/29-1-copy-foreman.png", vp: "mb", url: "/workadjust", steps: [{ click: "コピー作成" }] },
  { file: "mobile/30-1-reservation-before.png", vp: "mb", url: "/workadjust/reservation" },
  { file: "mobile/30-2-reservation-after.png", role: "prime", vp: "mb", url: "/workadjust/reservation", steps: [{ click: "確定" }] },
  { file: "mobile/31-1-reservation-create.png", vp: "mb", url: "/workadjust/reservation", steps: [{ click: "予約作成" }] },
  { file: "mobile/31-2-reservation-edit.png", vp: "mb", url: "/workadjust/reservation", steps: [{ sel: ".rsv-bar" }] },
  { file: "mobile/32-1-floorplan.png", vp: "mb", url: "/workadjust/floor-plan" },
  { file: "mobile/33-1-floorplan-setting.png", vp: "mb", url: "/workadjust/floor-plan-setting" },
  { file: "mobile/33-2-companies.png", vp: "mb", url: "/workadjust/companies" },
  { file: "mobile/34-1-settings-time.png", vp: "mb", url: "/workadjust/settings" },
  { file: "mobile/34-2-settings-auth.png", vp: "mb", url: "/workadjust/settings", steps: [{ click: "予約権限設定" }] },
  { file: "mobile/35-1-settings-type.png", vp: "mb", url: "/workadjust/settings", steps: [{ click: "予約種類設定" }] },
  { file: "mobile/35-2-settings-interval.png", vp: "mb", url: "/workadjust/settings", steps: [{ click: "予約時間間隔設定" }] },
  { file: "mobile/36-1-registry-lift.png", vp: "mb", url: "/workadjust/registry" },
  { file: "mobile/36-2-registry-equip.png", vp: "mb", url: "/workadjust/registry", steps: [{ click: "資機材・その他" }] },
  { file: "mobile/37-1-registry-gate.png", vp: "mb", url: "/workadjust/registry", steps: [{ click: "ゲート" }] },
  { file: "mobile/37-2-registry-new.png", vp: "mb", url: "/workadjust/registry", steps: [{ click: "新規登録" }] },
  { file: "mobile/38-1-registry-bulk.png", vp: "mb", url: "/workadjust/registry", steps: [{ click: "一括登録" }] },
  { file: "mobile/38-2-registry-import.png", vp: "mb", url: "/workadjust/registry", steps: [{ click: "持込機械から同期" }] },
];

for (const s of [...PC, ...MB]) await cap(s);

await browser.close();
console.log("\n===== 未検出ステップ =====");
if (fails.length === 0) console.log("なし（全ステップ成功）");
else fails.forEach((f) => console.log(" -", f));
console.log("done");
