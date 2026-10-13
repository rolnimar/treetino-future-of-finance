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
  console.log('Launching browser for investor mobile flow...');
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

  // 1. Mobile Landing & Hero
  console.log('1. Loading landing page...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await wait(1500);
  const path1 = path.join(artifactDir, 'mobile_01_hero.png');
  await page.screenshot({ path: path1, fullPage: false });
  console.log('Saved:', path1);

  // 2. Discover Hardware Pools (Scroll to Kickstarter campaign cards)
  console.log('2. Scrolling to campaigns...');
  await page.evaluate(() => {
    const el = document.getElementById('campaigns');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await wait(1000);
  const path2 = path.join(artifactDir, 'mobile_02_discovery.png');
  await page.screenshot({ path: path2, fullPage: false });
  console.log('Saved:', path2);

  // 3. Open Back Project Modal for BESS (Native Bottom Sheet)
  console.log('3. Opening Back Project Bottom Sheet...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const backBtn = buttons.find(
      (b) =>
        b.textContent &&
        (b.textContent.includes('Back This Hardware Pool') ||
          b.textContent.includes('Back This Project')),
    );
    if (backBtn) backBtn.click();
  });
  await wait(1200);

  const path3 = path.join(artifactDir, 'mobile_03_bottom_sheet.png');
  await page.screenshot({ path: path3, fullPage: false });
  console.log('Saved:', path3);

  // 4. Confirm Investment (via simulation or invest button)
  console.log('4. Confirming investment...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const demoBtn = buttons.find(
      (b) =>
        b.textContent &&
        (b.textContent.includes('Test Demo Simulation') ||
          b.textContent.includes('instant yield stream')),
    );
    if (demoBtn) {
      demoBtn.click();
    } else {
      const investBtn = buttons.find(
        (b) => b.textContent && b.textContent.includes('Invest'),
      );
      if (investBtn) investBtn.click();
    }
  });

  // Wait for the confirmation & live yield streaming tick
  await wait(2500);
  const path4 = path.join(artifactDir, 'mobile_04_confirmed.png');
  await page.screenshot({ path: path4, fullPage: false });
  console.log('Saved:', path4);

  // 5. Navigate to My Portfolio (via confirmation button or bottom dock)
  console.log('5. Navigating to Portfolio...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const portBtn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Go to My Portfolio'),
    );
    if (portBtn) {
      portBtn.click();
    } else {
      window.location.hash = '#portfolio';
    }
  });

  await wait(2000);
  const path5 = path.join(artifactDir, 'mobile_05_wallet_portfolio.png');
  await page.screenshot({ path: path5, fullPage: false });
  console.log('Saved:', path5);

  // 6. Scroll portfolio to see active holdings card and live claim button
  console.log('6. Scrolling portfolio to see active holdings...');
  await page.evaluate(() => {
    window.scrollTo({ top: 380, left: 0, behavior: 'instant' });
  });
  await wait(1000);
  const path6 = path.join(artifactDir, 'mobile_06_holding_card.png');
  await page.screenshot({ path: path6, fullPage: false });
  console.log('Saved:', path6);

  // 7. Open Deposit Modal from portfolio and capture mobile_03_deposit_sheet.png
  console.log('7. Opening Deposit Modal...');
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
  await wait(500);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const depBtn = buttons.find(
      (b) => b.textContent && b.textContent.trim() === 'Deposit',
    );
    if (depBtn) depBtn.click();
  });
  await wait(1200);
  const path7 = path.join(artifactDir, 'mobile_03_deposit_sheet.png');
  await page.screenshot({ path: path7, fullPage: false });
  console.log('Saved:', path7);

  await browser.close();
  console.log('All investor flow screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
