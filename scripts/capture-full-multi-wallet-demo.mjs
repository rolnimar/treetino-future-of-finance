import puppeteer from 'puppeteer-core';
import path from 'path';

const executablePath =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir =
  '/Users/jakub/.gemini/antigravity/brain/718f5366-c977-4da4-81fc-7ac324a2daf6';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('Starting Full Multi-Wallet End-to-End Demo...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--hide-scrollbars',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
  });

  // STEP 1: HOST WALLET - ZERO-CAPEX COLLATERAL & MARINADE LIQUID STAKING
  console.log(
    '--- STEP 1: Commercial Host Posts 100 SOL Collateral via Marinade ---',
  );
  await page.goto('http://localhost:5173#client', {
    waitUntil: 'networkidle0',
  });
  await wait(1000);

  // Clear previous demo collateral to start clean
  await page.evaluate(() => {
    localStorage.removeItem('treetino_client_collateral_default');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(1000);

  // Open Collateral Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Post 100 SOL Collateral'),
    );
    if (btn) btn.click();
  });
  await wait(800);

  const step1ModalPath = path.join(
    artifactDir,
    'demo_step1_host_collateral_modal.png',
  );
  await page.screenshot({ path: step1ModalPath, fullPage: false });
  console.log('Saved Step 1 Modal:', step1ModalPath);

  // Click Simulate 100 SOL Demo
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Simulate'),
    );
    if (btn) btn.click();
  });
  await wait(2200);

  const step1ConfirmedPath = path.join(
    artifactDir,
    'demo_step1_collateral_staked_success.png',
  );
  await page.screenshot({ path: step1ConfirmedPath, fullPage: false });
  console.log('Saved Step 1 Staked Success:', step1ConfirmedPath);

  // View Host Dashboard
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('View Host Dashboard'),
    );
    if (btn) btn.click();
  });
  await wait(1200);

  const step1DashboardPath = path.join(
    artifactDir,
    'demo_step1_host_active_dashboard.png',
  );
  await page.screenshot({ path: step1DashboardPath, fullPage: false });
  console.log('Saved Step 1 Host Dashboard:', step1DashboardPath);

  // STEP 2: EXPLORE TOKENIZED FUNDING OPPORTUNITY MARKETPLACE
  console.log('--- STEP 2: Marketplace Funding Opportunities ---');
  await page.goto('http://localhost:5173/#campaigns', {
    waitUntil: 'networkidle0',
  });
  await wait(1200);

  // Scroll slightly down to showcase the public tree funding cards & Kickstarter campaigns
  await page.evaluate(() => {
    const campaignsSection = document.getElementById('campaigns');
    if (campaignsSection) {
      campaignsSection.scrollIntoView({ behavior: 'instant' });
    }
  });
  await wait(1000);

  const step2MarketplacePath = path.join(
    artifactDir,
    'demo_step2_funding_opportunities.png',
  );
  await page.screenshot({ path: step2MarketplacePath, fullPage: false });
  console.log('Saved Step 2 Marketplace:', step2MarketplacePath);

  // STEP 3: INVESTOR WALLET INVESTS IN THE OPPORTUNITY
  console.log('--- STEP 3: Investor Backs the Clean Energy Installation ---');
  // Open the Back Project modal on the flagship project
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const backBtn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Back this Project'),
    );
    if (backBtn) backBtn.click();
  });
  await wait(800);

  const step3InvestModalPath = path.join(
    artifactDir,
    'demo_step3_investor_modal.png',
  );
  await page.screenshot({ path: step3InvestModalPath, fullPage: false });
  console.log('Saved Step 3 Invest Modal:', step3InvestModalPath);

  // Execute investment
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const confirmBtn = buttons.find(
      (b) =>
        b.textContent && b.textContent.includes('Back this Energy Project'),
    );
    if (confirmBtn) confirmBtn.click();
  });
  await wait(2200);

  const step3SuccessPath = path.join(
    artifactDir,
    'demo_step3_investment_confirmed.png',
  );
  await page.screenshot({ path: step3SuccessPath, fullPage: false });
  console.log('Saved Step 3 Investment Confirmed:', step3SuccessPath);

  // Dismiss modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const doneBtn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Done'),
    );
    if (doneBtn) doneBtn.click();
  });
  await wait(800);

  // STEP 4: HARDWARE CONSTRUCTED & LIVE GRID TOPOLOGY (DEPIN ASSET DOSSIER)
  console.log(
    '--- STEP 4: Live Hardware Construction, SCADA Telemetry & Electrical Schematics ---',
  );
  await page.goto('http://localhost:5173/#asset/219742', {
    waitUntil: 'networkidle0',
  });
  await wait(1500);

  const step4DossierPath = path.join(
    artifactDir,
    'demo_step4_constructed_live_telemetry.png',
  );
  await page.screenshot({ path: step4DossierPath, fullPage: false });
  console.log('Saved Step 4 Asset Dossier:', step4DossierPath);

  // STEP 5: INVESTOR PORTFOLIO & REAL-TIME CASH FLOW STREAMING
  console.log(
    '--- STEP 5: Investor Live Yield & Streaming Micro-Dividends ---',
  );
  await page.goto('http://localhost:5173/#portfolio', {
    waitUntil: 'networkidle0',
  });
  await wait(1200);

  const step5PortfolioPath = path.join(
    artifactDir,
    'demo_step5_investor_yield_portfolio.png',
  );
  await page.screenshot({ path: step5PortfolioPath, fullPage: false });
  console.log('Saved Step 5 Investor Portfolio:', step5PortfolioPath);

  await browser.close();
  console.log(
    'ALL DEMO STEPS COMPLETED AND SCREENSHOTS CAPTURED SUCCESSFULLY!',
  );
}

runDemo().catch((err) => {
  console.error('Demo execution failed:', err);
  process.exit(1);
});
