import puppeteer from 'puppeteer-core';
import path from 'path';

const executablePath =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir =
  '/Users/jakub/.gemini/antigravity/brain/889293b7-5818-4245-90e5-66d6d83886ad';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Scroll to campaigns
  await page.evaluate(() => {
    const el = document.getElementById('campaigns');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await wait(600);

  // 2. Open modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const backBtn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Back This Hardware Pool'),
    );
    if (backBtn) backBtn.click();
  });
  await wait(800);

  // 3. Confirm backing ($500)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const demoBtn = buttons.find(
      (b) => b.textContent && b.textContent.includes('instant yield stream'),
    );
    if (demoBtn) demoBtn.click();
  });
  await wait(1800);

  // 4. Click Go to My Portfolio
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const portBtn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Go to My Portfolio'),
    );
    if (portBtn) portBtn.click();
  });
  await wait(1500);

  // 5. Capture top of portfolio
  const path5 = path.join(artifactDir, 'mobile_05_portfolio_top.png');
  await page.screenshot({ path: path5, fullPage: false });
  console.log('Saved:', path5);

  // 6. Scroll down to show the holding card with its metrics & live telemetry
  await page.evaluate(() => {
    window.scrollTo({ top: 380, left: 0, behavior: 'instant' });
  });
  await wait(600);
  const path6 = path.join(artifactDir, 'mobile_06_portfolio_holding.png');
  await page.screenshot({ path: path6, fullPage: false });
  console.log('Saved:', path6);

  // 7. Scroll down a bit more to show the Claim Yield button & SCADA Telemetry button
  await page.evaluate(() => {
    window.scrollTo({ top: 580, left: 0, behavior: 'instant' });
  });
  await wait(600);
  const path7 = path.join(artifactDir, 'mobile_07_portfolio_claim.png');
  await page.screenshot({ path: path7, fullPage: false });
  console.log('Saved:', path7);

  await browser.close();
  console.log('All portfolio screenshots refreshed successfully!');
}

capture().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
