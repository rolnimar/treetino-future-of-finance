import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR =
  '/Users/jakub/.gemini/antigravity/brain/718f5366-c977-4da4-81fc-7ac324a2daf6';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'desktop-scroll-check');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser to capture desktop scroll check...');
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,960',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  console.log('Loading Solar EV Fast-Charging Hub asset page...');
  await page.goto('http://localhost:5173/#asset/374891', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Capture Viewport 1 (Hero & Funding Box)
  console.log('Capturing Viewport 1 (Hero & Funding Box)...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_desktop_hero_top.png'),
  });

  // 2. Capture Viewport 2 (SCADA Flow Diagram)
  console.log('Capturing Viewport 2 (SCADA Flow Diagram)...');
  await page.evaluate(() => {
    window.scrollTo({ top: 620, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_desktop_scada_flow.png'),
  });

  // 3. Capture Viewport 3 (Cash Flow Waterfall + Compounding Calculator)
  console.log(
    'Capturing Viewport 3 (Cash Flow Waterfall & Compounding Calculator)...',
  );
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, h4'));
    const dossierHeading = headings.find(
      (h) => h.textContent && h.textContent.includes('Commercial Counterparty'),
    );
    if (dossierHeading) {
      dossierHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo({ top: 1550, behavior: 'instant' });
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_desktop_waterfall_and_calculator.png'),
  });

  // 4. Capture Viewport 4 (Compounding Calculator in Full View)
  console.log('Capturing Viewport 4 (Compounding Calculator Full)...');
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const calcHeading = headings.find(
      (h) =>
        h.textContent &&
        h.textContent.includes('Yield Projections & Compounding'),
    );
    if (calcHeading) {
      calcHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo({ top: 1950, behavior: 'instant' });
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(
      SCREENSHOT_DIR,
      '04_desktop_compounding_calculator_full.png',
    ),
  });

  await browser.close();
  console.log('All screenshots saved successfully to:', SCREENSHOT_DIR);
}

capture().catch(console.error);
