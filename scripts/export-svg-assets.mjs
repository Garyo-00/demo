// flyer.html の各パーツを SVG で書き出す
//   - flyer-pro-label.svg        … 「pro」バッジ
//   - flyer-hero-combo.svg       … PC+スマホ+Arch Intelligence丸ロゴ一体版
//   - flyer-label-work.svg       … 作業内容・人員予定 ピル
//   - flyer-label-gate.svg       … ゲート・資機材予約 ピル
//   - flyer-label-layout.svg     … 配置図作成 ピル
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "docs/workadjust/flyer.html");
const OUT = path.join(ROOT, "screenshots");
const MM = 96 / 25.4; // px per mm

const FONT = `"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic UI","Noto Sans JP","Meiryo",sans-serif`;

// ---- flyer.html 上で実寸を測る（フォント依存の文字幅を正確に取るため）----
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.goto("file://" + SRC, { waitUntil: "networkidle0" });
const m = await page.evaluate(() => {
  const r = (el) => el.getBoundingClientRect();
  const pro = r(document.querySelector(".app-name .pro"));
  // ピル3種の文字幅を同一スタイルで測る
  const widths = {};
  for (const [key, text] of [
    ["work", "作業内容・人員予定"],
    ["gate", "ゲート・資機材予約"],
    ["layout", "配置図作成"],
  ]) {
    const s = document.createElement("span");
    s.className = "feature-pill-text";
    s.style.position = "absolute";
    s.textContent = text;
    document.body.appendChild(s);
    widths[key] = r(s).width;
    s.remove();
  }
  return { pro: { w: pro.width, h: pro.height }, widths };
});
await browser.close();

const mm = (px) => px / MM;
const fmt = (v) => +v.toFixed(2);

// ---- 1) pro バッジ ----
{
  const w = fmt(mm(m.pro.w));
  const h = fmt(mm(m.pro.h));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8354C4"/>
      <stop offset="1" stop-color="#3D1F73"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="2.2" fill="url(#g)"/>
  <text x="${fmt(w / 2)}" y="${fmt(h / 2)}" text-anchor="middle" dominant-baseline="central"
    font-family='${FONT}' font-size="9" font-weight="800" letter-spacing="0.16" fill="#fff">pro</text>
</svg>
`;
  fs.writeFileSync(path.join(OUT, "flyer-pro-label.svg"), svg);
}

// ---- 2) 機能ラベル ピル3種 ----
for (const [key, text] of [
  ["work", "作業内容・人員予定"],
  ["gate", "ゲート・資機材予約"],
  ["layout", "配置図作成"],
]) {
  const textW = mm(m.widths[key]);
  const w = fmt(textW + 9); // padding 4.5mm x2
  const h = 8.4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0" stop-color="#A57CD8"/>
      <stop offset="1" stop-color="#4E2B95"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="${h / 2}" fill="url(#g)"/>
  <text x="${fmt(w / 2)}" y="${fmt(h / 2)}" text-anchor="middle" dominant-baseline="central"
    font-family='${FONT}' font-size="3.15" font-weight="800" letter-spacing="0.13" fill="#fff">${text}</text>
</svg>
`;
  fs.writeFileSync(path.join(OUT, `flyer-label-${key}.svg`), svg);
}

// ---- 3) PC+スマホ+丸ロゴ 一体版 ----
const b64 = (f) => fs.readFileSync(path.join(ROOT, "screenshots", f)).toString("base64");
const pcImg = b64("flyer-pc-screenshot.png");
const spImg = b64("flyer-phone-screen.png");
const aiImg = b64("flyer-ai-badge.png");

// flyer.html の配置(mm): laptop(45,47.7) w120 / phone(48,73.7) w22 / badge(168.6,40.3) 28.2
// キャンバス原点を (42,37.3) に取り、余白3mm
const LAP = { x: 3, y: 10.4, w: 120 };
const PC_AR = 2878 / 1420;
const lapImgH = fmt((LAP.w - 4) / PC_AR); // 57.22
const lapH = fmt(2 + Number(lapImgH) + 2.4 + 2.4);
const PH = { x: 6, y: 36.4, w: 22 };
const phScrW = PH.w - 2.4;
const phScrH = fmt(phScrW * 2); // 760/1520
const phH = fmt(Number(phScrH) + 2.4);
const BD = { x: 126.6, y: 3, s: 28.2 };
const W = fmt(BD.x + BD.s + 3);
const H = fmt(PH.y + Number(phH) + 3);

const combo = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EFEDF2"/>
      <stop offset="1" stop-color="#CFC9D9"/>
    </linearGradient>
    <clipPath id="lapScreen"><rect x="2" y="2" width="${LAP.w - 4}" height="${lapImgH}" rx="0.8"/></clipPath>
    <clipPath id="phScreen"><rect x="1.2" y="1.2" width="${phScrW}" height="${phScrH}" rx="3.2"/></clipPath>
  </defs>

  <!-- ノートPC -->
  <g transform="translate(${LAP.x},${LAP.y})">
    <rect width="${LAP.w}" height="${fmt(2 + Number(lapImgH) + 2.4)}" rx="2.4" fill="#211932"/>
    <circle cx="${LAP.w / 2}" cy="1.8" r="1" fill="#3f3452"/>
    <g clip-path="url(#lapScreen)">
      <image x="2" y="2" width="${LAP.w - 4}" height="${lapImgH}" preserveAspectRatio="xMidYMid slice"
        xlink:href="data:image/png;base64,${pcImg}"/>
    </g>
    <path d="M0 ${fmt(2 + Number(lapImgH) + 2.4)} H${LAP.w} V${fmt(2 + Number(lapImgH) + 3)} Q${LAP.w} ${lapH} ${LAP.w - 1.8} ${lapH} H1.8 Q0 ${lapH} 0 ${fmt(2 + Number(lapImgH) + 3)} Z" fill="url(#baseGrad)"/>
    <rect x="${fmt(LAP.w / 2 - 7)}" y="${fmt(2 + Number(lapImgH) + 2.4)}" width="14" height="1" rx="0.5" fill="#BBB4C4"/>
  </g>

  <!-- スマホ -->
  <g transform="translate(${PH.x},${PH.y})">
    <rect x="-0.5" y="8" width="0.5" height="16" rx="0.25" fill="#3a2f4a"/>
    <rect x="-0.5" y="28" width="0.5" height="9" rx="0.25" fill="#3a2f4a"/>
    <rect width="${PH.w}" height="${phH}" rx="4.4" fill="#1a1522" stroke="#3a2f4a" stroke-width="0.35"/>
    <g clip-path="url(#phScreen)">
      <rect x="1.2" y="1.2" width="${phScrW}" height="${phScrH}" fill="#F3F0F8"/>
      <image x="1.2" y="1.2" width="${phScrW}" height="${phScrH}" preserveAspectRatio="xMidYMin slice"
        xlink:href="data:image/png;base64,${spImg}"/>
    </g>
    <rect x="${fmt(PH.w / 2 - 5)}" y="1.8" width="10" height="2.6" rx="1.3" fill="#1a1522"/>
  </g>

  <!-- Arch Intelligence 丸ロゴ -->
  <image x="${BD.x}" y="${BD.y}" width="${BD.s}" height="${BD.s}"
    xlink:href="data:image/png;base64,${aiImg}"/>
</svg>
`;
fs.writeFileSync(path.join(OUT, "flyer-hero-combo.svg"), combo);

for (const f of [
  "flyer-pro-label.svg",
  "flyer-label-work.svg",
  "flyer-label-gate.svg",
  "flyer-label-layout.svg",
  "flyer-hero-combo.svg",
]) {
  const st = fs.statSync(path.join(OUT, f));
  console.log("saved:", path.join("screenshots", f), `(${(st.size / 1024).toFixed(0)}KB)`);
}
