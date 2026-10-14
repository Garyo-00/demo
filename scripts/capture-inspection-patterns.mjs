// 点検実施画面（/inspection-run）の表示パターンを docs/safety/images へ書き出す。
// 事前に開発サーバーを起動しておくこと（npm run dev → http://localhost:5199）。
//   node scripts/capture-inspection-patterns.mjs
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/Users/test/Documents/demo/docs/safety/images";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
await page.setViewport({ width: 1280, height: 1150, deviceScaleFactor: 2 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const setTab = async (label) => {
  await page.evaluate((l) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === l)?.click(), label);
  await sleep(500);
};
// デモパネルの行（ラベルで特定）内のトグルを押す
const setToggle = async (rowLabel, value) => {
  await page.evaluate((l, v) => {
    const panel = [...document.querySelectorAll(".MuiPaper-root")].find((x) => x.textContent.includes("表示切替"));
    const row = [...panel.querySelectorAll("p")].find((p) => p.textContent.trim() === l)?.parentElement;
    [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === v)?.click();
  }, rowLabel, value);
  await sleep(300);
};
// ステッパーを目標値まで増減
const setStepper = async (rowLabel, target) => {
  for (let i = 0; i < 12; i++) {
    const cur = await page.evaluate((l) => {
      const panel = [...document.querySelectorAll(".MuiPaper-root")].find((x) => x.textContent.includes("表示切替"));
      const row = [...panel.querySelectorAll("p")].find((p) => p.textContent.trim() === l)?.parentElement;
      return Number([...row.querySelectorAll("p")].at(-1).textContent.trim());
    }, rowLabel);
    if (cur === target) return;
    await page.evaluate((l, up) => {
      const panel = [...document.querySelectorAll(".MuiPaper-root")].find((x) => x.textContent.includes("表示切替"));
      const row = [...panel.querySelectorAll("p")].find((p) => p.textContent.trim() === l)?.parentElement;
      const btns = [...row.querySelectorAll("button")];
      (up ? btns[1] : btns[0]).click();
    }, rowLabel, cur < target);
    await sleep(160);
  }
};
// 実施事由のチェックを指定の集合に合わせる
const setReasons = async (list) => {
  await page.evaluate((want) => {
    const panel = [...document.querySelectorAll(".MuiPaper-root")].find((x) => x.textContent.includes("表示切替"));
    const row = [...panel.querySelectorAll("p")].find((p) => p.textContent.includes("実施した事由"))?.parentElement;
    [...row.querySelectorAll("label")].forEach((lb) => {
      const name = lb.textContent.trim();
      const cb = lb.querySelector('input[type="checkbox"]');
      if (cb.checked !== want.includes(name)) cb.click();
    });
  }, list);
  await sleep(300);
};
const shot = async (name) => {
  const frame = await page.evaluateHandle(() => [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).borderRadius.startsWith("48px")));
  await frame.asElement().screenshot({ path: `${OUT}/${name}.png` });
  console.log("  captured:", name);
};

await page.goto("http://localhost:5199/inspection-run", { waitUntil: "networkidle0" });
await sleep(900);

console.log("機械（点検表あり：始業前点検 × 月例点検 の4通り）");
await setTab("機械");
await setToggle("始業前点検の点検表", "あり");
await setToggle("月例点検の点検表", "あり");
for (const [s, m, name] of [
  ["未", "未", "m1-start-undone-monthly-undone"],
  ["未", "済", "m2-start-undone-monthly-done"],
  ["済", "未", "m3-start-done-monthly-undone"],
  ["済", "済", "m4-start-done-monthly-done"],
]) {
  await setToggle("始業前点検", s);
  await setToggle("月例点検", m);
  await shot(name);
}

console.log("機械（点検表の紐づけパターン）");
for (const [ss, ms, name] of [
  ["あり", "なし", "m5-sheet-start-only"],
  ["なし", "あり", "m6-sheet-monthly-only"],
  ["なし", "なし", "m7-sheet-none"],
]) {
  await setToggle("始業前点検の点検表", ss);
  await setToggle("月例点検の点検表", ms);
  await shot(name);
}
await setToggle("始業前点検の点検表", "あり");
await setToggle("月例点検の点検表", "あり");

console.log("仮設・その他");
await setTab("仮設・その他");
await setToggle("始業前点検の点検表", "あり");
await setToggle("組立後等点検の点検表", "あり");
// 本番は「1回の点検＝実施者1名＋事由1つ」。選んだ事由の数がそのまま実施回数になる。
const temp = [
  [0, [], "t1-none"],
  [1, [], "t2-start1"],
  [0, ["組立後等"], "t3-assembly1"],
  [3, ["組立後等", "悪天候後"], "t4-start3-assembly2"],
  [5, ["組立後等", "悪天候後", "地震後", "定期", "一部解体後"], "t5-max"],
];
for (const [sc, reasons, name] of temp) {
  await setStepper("始業前点検 実施回数", sc);
  await setReasons(reasons);
  await shot(name);
}

console.log("仮設・その他（点検表の紐づけパターン）");
await setStepper("始業前点検 実施回数", 0);
await setReasons([]);
for (const [ss, as_, name] of [
  ["あり", "なし", "t6-sheet-start-only"],
  ["なし", "あり", "t7-sheet-assembly-only"],
  ["なし", "なし", "t8-sheet-none"],
]) {
  await setToggle("始業前点検の点検表", ss);
  await setToggle("組立後等点検の点検表", as_);
  await shot(name);
}
console.log("errors:", errs.length ? errs : "none");
await browser.close();
