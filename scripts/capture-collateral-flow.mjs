import puppeteer from 'puppeteer-core';
import path from 'path';

const executablePath =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir =
  '/Users/jakub/.gemini/antigravity/brain/718f5366-c977-4da4-81fc-7ac324a2daf6';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log(
    'Launching browser to test Host Collateral & Marinade Liquid Staking flow...',
  );
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

  // 1. Navigate to Client / Host View
  console.log('1. Loading Host / Client view...');
  await page.goto('http://localhost:5173#client', {
    waitUntil: 'networkidle0',
  });
  await wait(1500);

  // Clear demo storage if any to start clean
  await page.evaluate(() => {
    localStorage.removeItem('treetino_client_collateral_default');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(1000);

  const path1 = path.join(artifactDir, 'client_01_host_agreement.png');
  await page.screenshot({ path: path1, fullPage: false });
  console.log('Saved:', path1);

  // 2. Open Buyer Collateral Modal
  console.log('2. Opening Buyer Collateral Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Post 100 SOL Collateral'),
    );
    if (btn) btn.click();
  });
  await wait(1000);

  const path2 = path.join(artifactDir, 'client_02_collateral_modal.png');
  await page.screenshot({ path: path2, fullPage: false });
  console.log('Saved:', path2);

  // 3. Click Simulate Devnet Collateral
  console.log('3. Clicking Devnet Simulation...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Simulate'),
    );
    if (btn) btn.click();
  });

  // Wait for confirmation & tick
  await wait(2500);
  const path3 = path.join(artifactDir, 'client_03_collateral_confirmed.png');
  await page.screenshot({ path: path3, fullPage: false });
  console.log('Saved:', path3);

  // 4. Click View Host Dashboard or Done to see active dashboard
  console.log('4. Navigating to Active Host Dashboard...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('View Host Dashboard'),
    );
    if (btn) btn.click();
  });
  await wait(1500);

  const path4 = path.join(artifactDir, 'client_04_active_staked_dashboard.png');
  await page.screenshot({ path: path4, fullPage: false });
  console.log('Saved:', path4);

  // 5. Scroll down to show live streaming Marinade yields and metered energy consumption
  console.log('5. Scrolling to show streaming yields and metered billing...');
  await page.evaluate(() => {
    window.scrollBy({ top: 350, behavior: 'instant' });
  });
  await wait(1000);
  const path5 = path.join(
    artifactDir,
    'client_05_metered_billing_scrolled.png',
  );
  await page.screenshot({ path: path5, fullPage: false });
  console.log('Saved:', path5);

  await browser.close();
  console.log('All Host Collateral flow screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
