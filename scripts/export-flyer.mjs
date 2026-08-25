// 作業間調整pro チラシ（docs/workadjust/flyer.html）を PDF・PNG に書き出す。
//   node scripts/export-flyer.mjs           … PDF + PNG
//   node scripts/export-flyer.mjs --pptx    … 上記に加えて PowerPoint（A4縦1スライドに画像を貼付）
import puppeteer from "puppeteer-core";
import { fileURLToPath } from "url";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "docs/workadjust/flyer.html");
const PDF = path.join(ROOT, "docs/workadjust/flyer.pdf");
const PNG = path.join(ROOT, "docs/workadjust/flyer.png");
const PPTX = path.join(ROOT, "docs/workadjust/flyer.pptx");
const WITH_PPTX = process.argv.includes("--pptx");

// A4（インチ）。PowerPointのスライドサイズに使う
const A4_W_IN = 8.27;
const A4_H_IN = 11.69;
const DPI = 300; // 印刷用の解像度

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.goto("file://" + SRC, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));

// --- PDF（A4・余白なし・背景あり）---
await page.pdf({
  path: PDF,
  format: "A4",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

// --- PNG（PowerPoint貼り付け用。A4を300dpi相当で書き出す）---
const el = await page.$(".page");
const box = await el.boundingBox();
// .page の CSS幅から、300dpi相当になる倍率を求める
const scale = Math.min(6, (A4_W_IN * DPI) / box.width);
await page.setViewport({
  width: Math.ceil(box.width),
  height: Math.ceil(box.height),
  deviceScaleFactor: scale,
});
await new Promise((r) => setTimeout(r, 400));
await (await page.$(".page")).screenshot({ path: PNG });
await browser.close();

console.log("PDF :", path.relative(ROOT, PDF));
console.log("PNG :", path.relative(ROOT, PNG), `(x${scale.toFixed(2)})`);

// --- PowerPoint（A4縦・1スライド）。--pptx 指定時のみ ---
if (WITH_PPTX) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4P", width: A4_W_IN, height: A4_H_IN });
  pptx.layout = "A4P";
  pptx.author = "Arch";
  pptx.title = "作業間調整pro チラシ";
  const slide = pptx.addSlide();
  slide.addImage({ path: PNG, x: 0, y: 0, w: A4_W_IN, h: A4_H_IN });
  await pptx.writeFile({ fileName: PPTX });
  console.log("PPTX:", path.relative(ROOT, PPTX));
}
