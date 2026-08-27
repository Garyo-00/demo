// flyer.html のヒーロー要素（PC / スマホ / PC+スマホ+丸ロゴ一体）を透過PNGで書き出す
import puppeteer from "puppeteer-core";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = "/Users/test/Documents/demo";
const SRC = path.join(ROOT, "docs/workadjust/flyer.html");
const OUT = path.join(ROOT, "screenshots");

const SCALE = 3.13; // flyer.png と同じ 300dpi 相当
const PAD = 50; // ドロップシャドウ用の余白(px)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: SCALE });
await page.goto("file://" + SRC, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 600));

// 背景・テキスト類を隠して透過にする
await page.addStyleTag({
  content: `
    html, body { background: transparent !important; }
    .page { background: transparent !important; box-shadow: none !important; }
    .bg-circle, .panel, .flyer-title, .brand-row { display: none !important; }
  `,
});
await new Promise((r) => setTimeout(r, 300));

async function bounds(sel) {
  const el = await page.$(sel);
  return await el.boundingBox();
}

async function shoot(name, boxes) {
  const x0 = Math.min(...boxes.map((b) => b.x)) - PAD;
  const y0 = Math.min(...boxes.map((b) => b.y)) - PAD;
  const x1 = Math.max(...boxes.map((b) => b.x + b.width)) + PAD;
  const y1 = Math.max(...boxes.map((b) => b.y + b.height)) + PAD;
  const file = path.join(OUT, name);
  await page.screenshot({
    path: file,
    omitBackground: true,
    clip: { x: Math.max(0, x0), y: Math.max(0, y0), width: x1 - x0, height: y1 - y0 },
  });
  console.log("saved:", file);
}

const laptop = await bounds(".laptop");
const phone = await bounds(".phone");
const badge = await bounds(".ai-badge");

// PC単体（スマホ・ロゴを隠す）
await page.$eval(".phone", (e) => (e.style.visibility = "hidden"));
await page.$eval(".ai-badge", (e) => (e.style.visibility = "hidden"));
await shoot("flyer-hero-pc.png", [laptop]);

// スマホ単体
await page.$eval(".phone", (e) => (e.style.visibility = "visible"));
await page.$eval(".laptop", (e) => (e.style.visibility = "hidden"));
await shoot("flyer-hero-phone.png", [phone]);

// 一体版（PC+スマホ+丸ロゴ）
await page.$eval(".laptop", (e) => (e.style.visibility = "visible"));
await page.$eval(".ai-badge", (e) => (e.style.visibility = "visible"));
await shoot("flyer-hero-combo.png", [laptop, phone, badge]);

await browser.close();
