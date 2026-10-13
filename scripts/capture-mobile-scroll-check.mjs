import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR =
  '/Users/jakub/.gemini/antigravity/brain/718f5366-c977-4da4-81fc-7ac324a2daf6';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'mobile-scroll-check');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser to capture mobile scroll check...');
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  console.log('Loading Solar EV Fast-Charging Hub asset page on mobile...');
  await page.goto('http://localhost:5173/#asset/374891', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Mobile Hero Top
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_mobile_asset_hero.png'),
  });

  // 2. Mobile Scrolled to Tabs & SCADA
  await page.evaluate(() => window.scrollTo({ top: 780, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_mobile_asset_scada.png'),
  });

  // 3. Mobile Scrolled to SCADA Circuit Diagram
  await page.evaluate(() =>
    window.scrollTo({ top: 1200, behavior: 'instant' }),
  );
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_mobile_asset_scada_diagram.png'),
  });

  // 4. Mobile Scrolled to Compounding Calculator
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, h2, div'));
    const calcHeading = headings.find(
      (h) =>
        h.textContent &&
        h.textContent.includes('Yield Projections & Compounding'),
    );
    if (calcHeading) {
      calcHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo({ top: 2200, behavior: 'instant' });
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04_mobile_asset_compounding.png'),
  });

  // 5. Mobile Scrolled to 24h Energy Chart
  await page.evaluate(() =>
    window.scrollTo({ top: 3200, behavior: 'instant' }),
  );
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_mobile_asset_chart.png'),
  });

  await browser.close();
  console.log('Mobile screenshots saved to:', SCREENSHOT_DIR);
}

capture().catch(console.error);
