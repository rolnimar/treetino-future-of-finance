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
  console.log(
    'Starting Complete Multi-Wallet & Multi-Account End-to-End Demo (Desktop + Mobile)...',
  );
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

  // =========================================================================
  // PART 1: DESKTOP WORKSPACE FOR ORIGINATOR & COMMERCIAL HOST (1440x900)
  // =========================================================================
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
  });

  // STEP 1: PROTOCOL ORIGINATOR (ADMIN) CREATES FUNDING OPPORTUNITY
  console.log(
    '--- STEP 1: Protocol Originator (Admin) Creates Clean Energy Opportunity (Desktop) ---',
  );
  await page.goto('http://127.0.0.1:5173/#admin', {
    waitUntil: 'networkidle0',
  });
  await wait(800);

  // Set active persona to Admin
  await page.evaluate(() => {
    localStorage.setItem('treetino_active_demo_persona', 'admin');
    window.dispatchEvent(
      new CustomEvent('treetino-persona-changed', { detail: 'admin' }),
    );
  });
  await wait(800);

  // Click "Sign in as admin"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Sign in as admin'),
    );
    if (btn) btn.click();
  });
  await wait(1800);

  // Switch to "Launch Campaign" tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Launch Campaign'),
    );
    if (btn) btn.click();
  });
  await wait(1200);

  // Click on "Treetino V1 · Smart Tree" preset
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Treetino V1'),
    );
    if (btn) btn.click();
  });
  await wait(800);

  const step1Path = path.join(
    artifactDir,
    'demo_step1_create_funding_opportunity.png',
  );
  await page.screenshot({ path: step1Path, fullPage: false });
  console.log('Saved Step 1 (Create Opportunity):', step1Path);

  // STEP 2: COMMERCIAL HOST POSTS & STAKES COLLATERAL VIA MARINADE (DESKTOP)
  console.log(
    '--- STEP 2: Commercial Host Posts Collateral via Marinade (Desktop) ---',
  );
  await page.evaluate(() => {
    localStorage.setItem('treetino_active_demo_persona', 'host');
    localStorage.removeItem(
      'treetino_client_collateral_HSfu83FdjREjj61z3DK6gBepM1Y2QWqHkRYLozTEbmzc',
    );
    window.dispatchEvent(
      new CustomEvent('treetino-persona-changed', { detail: 'host' }),
    );
  });
  await page.goto('http://127.0.0.1:5173/#client', {
    waitUntil: 'networkidle0',
  });
  await wait(1000);

  // Open Redesigned Collateral Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Post 100 SOL Collateral'),
    );
    if (btn) btn.click();
  });
  await wait(800);

  const step2aModalPath = path.join(
    artifactDir,
    'demo_step2a_host_collateral_modal.png',
  );
  await page.screenshot({ path: step2aModalPath, fullPage: false });
  console.log('Saved Step 2a (Redesigned Host Modal):', step2aModalPath);

  // Click Simulate 100 SOL Demo
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('Simulate'),
    );
    if (btn) btn.click();
  });
  await wait(2200);

  const step2bConfirmedPath = path.join(
    artifactDir,
    'demo_step2b_host_collateral_confirmed.png',
  );
  await page.screenshot({ path: step2bConfirmedPath, fullPage: false });
  console.log('Saved Step 2b (Host Staked Confirmed):', step2bConfirmedPath);

  // Click "View Host Dashboard"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent && b.textContent.includes('View Host Dashboard'),
    );
    if (btn) btn.click();
  });
  await wait(1200);

  const step2cDashboardPath = path.join(
    artifactDir,
    'demo_step2c_host_dashboard_active.png',
  );
  await page.screenshot({ path: step2cDashboardPath, fullPage: false });
  console.log('Saved Step 2c (Host Dashboard Active):', step2cDashboardPath);

  // =========================================================================
  // PART 2: MOBILE INVESTOR (ALICE) EXPERIENCES ON MOBILE VIEWPORT (390x844)
  // =========================================================================
  console.log(
    '--- SWITCHING TO MOBILE VIEWPORT (iPhone 14 / 390x844) FOR INVESTOR ALICE ---',
  );
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // STEP 3: MOBILE MARKETPLACE (Kickstarter + Phantom style)
  console.log(
    '--- STEP 3: Clean Energy Crowdfunding Marketplace on Mobile ---',
  );
  await page.goto('http://127.0.0.1:5173/#campaigns', {
    waitUntil: 'networkidle0',
  });
  await wait(800);

  // Switch to Investor Alice Persona on the mobile page
  await page.evaluate(() => {
    localStorage.setItem('treetino_active_demo_persona', 'investor-alice');
    window.dispatchEvent(
      new CustomEvent('treetino-persona-changed', { detail: 'investor-alice' }),
    );
  });
  await wait(1000);

  // Ensure scroll is at top for dedicated mobile wallet view
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
  await wait(1000);

  const step3MarketplacePath = path.join(
    artifactDir,
    'demo_step3_marketplace_mobile.png',
  );
  await page.screenshot({ path: step3MarketplacePath, fullPage: false });
  console.log('Saved Step 3 (Mobile Marketplace):', step3MarketplacePath);

  // STEP 4A: THE VISUAL HEART OF THE INSTALLATION (Victron Cerbo GX & Energy Flow)
  console.log('--- STEP 4A: Mobile Visual Heart - Victron Energy Flow ---');
  await page.goto('http://127.0.0.1:5173/#asset/219742', {
    waitUntil: 'networkidle0',
  });
  await wait(1200);

  // Scroll to the Visual Heart of the installation
  // STEP 4A: REAL HARDWARE TOPOLOGY SCHEMATIC (The Real Visual Heart of the Installation)
  console.log(
    '--- STEP 4A: Real Hardware Topology Schematic (WATTINO hBESS & ČEZ / ČEPS) ---',
  );
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, h2'));
    const archH3 = headings.find(
      (h) =>
        h.textContent &&
        h.textContent.includes('Hardware Circuit Architecture'),
    );
    if (archH3) {
      const top = archH3.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 600, behavior: 'instant' });
    }
  });
  await wait(1000);

  const step4HeartPath = path.join(
    artifactDir,
    'demo_step4a_visual_heart_mobile.png',
  );
  await page.screenshot({ path: step4HeartPath, fullPage: false });
  console.log('Saved Step 4a (Mobile Real Hardware Topology):', step4HeartPath);

  // STEP 4B: MODEL OČEKÁVANÉHO VÝVOJE (Portu-Inspired Compounding Fan Chart)
  console.log(
    '--- STEP 4B: Portu-Inspired Model Očekávaného Vývoje Fan Chart ---',
  );
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, h2'));
    const calcH3 = headings.find(
      (h) =>
        h.textContent &&
        (h.textContent.includes('Yield Projections') ||
          h.textContent.includes('Compounding')),
    );
    if (calcH3) {
      const card = calcH3.closest('.rounded-3xl');
      const top =
        (card
          ? card.getBoundingClientRect().top
          : calcH3.getBoundingClientRect().top) +
        window.scrollY -
        65;
      window.scrollTo({ top, behavior: 'instant' });
    }
  });
  await wait(1000);

  const step4CalcPath = path.join(
    artifactDir,
    'demo_step4b_compounding_calculator_mobile.png',
  );
  await page.screenshot({ path: step4CalcPath, fullPage: false });
  console.log('Saved Step 4b (Portu Model Fan Chart):', step4CalcPath);

  // STEP 5: INVESTOR ALICE BACKS HARDWARE ON MOBILE
  console.log(
    '--- STEP 5: Investor Alice Backs Asset with €500 EURTree on Mobile ---',
  );
  // Open Backing Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) =>
        b.textContent &&
        (b.textContent.includes('Back this project') ||
          b.textContent.includes('Back Project') ||
          b.textContent.includes('Back Pool') ||
          b.textContent.includes('Back This Hardware Pool')),
    );
    if (btn) btn.click();
  });
  await wait(1000);

  const step5aModalPath = path.join(
    artifactDir,
    'demo_step5a_investor_backing_mobile.png',
  );
  await page.screenshot({ path: step5aModalPath, fullPage: false });
  console.log('Saved Step 5a (Mobile Backing Modal):', step5aModalPath);

  // Confirm investment via simulation inside open dialog
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const simBtn = buttons.find(
        (b) => b.textContent && b.textContent.includes('Test Demo Simulation'),
      );
      if (simBtn) {
        simBtn.click();
      } else {
        const investBtn = buttons.find(
          (b) => b.textContent && b.textContent.includes('Invest'),
        );
        if (investBtn) investBtn.click();
      }
    }
  });
  await wait(2200);

  const step5bConfirmedPath = path.join(
    artifactDir,
    'demo_step5b_investor_confirmed_mobile.png',
  );
  await page.screenshot({ path: step5bConfirmedPath, fullPage: false });
  console.log(
    'Saved Step 5b (Mobile Investment Confirmed):',
    step5bConfirmedPath,
  );

  // Click "Go to My Portfolio" button inside dialog
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const btn = buttons.find(
        (b) => b.textContent && b.textContent.includes('Go to My Portfolio'),
      );
      if (btn) {
        btn.click();
      } else {
        const closeBtn = dialog.querySelector(
          'button[aria-label="Close modal"]',
        );
        if (closeBtn) closeBtn.click();
      }
    }
  });
  await wait(1200);

  // STEP 6: INVESTOR NATIVE MOBILE PORTFOLIO (Phantom Wallet style)
  console.log(
    '--- STEP 6: Investor Native Mobile Portfolio & Real-Time Streaming ---',
  );
  await page.goto('http://127.0.0.1:5173/#portfolio', {
    waitUntil: 'networkidle0',
  });
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const closeBtn = dialog.querySelector('button[aria-label="Close modal"]');
      if (closeBtn) closeBtn.click();
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
  // Wait 3.5 seconds to watch live yield stream increment on mobile
  await wait(3500);

  const step6PortfolioPath = path.join(
    artifactDir,
    'demo_step6_investor_portfolio_mobile.png',
  );
  await page.screenshot({ path: step6PortfolioPath, fullPage: false });
  console.log(
    'Saved Step 6 (Mobile Investor Portfolio & Yield Streaming):',
    step6PortfolioPath,
  );

  // Copy the 5 most important and visually stunning mobile screens to ~/Downloads and repo
  const fs = await import('fs');
  const os = await import('os');
  const downloadsDir = path.join(
    os.homedir(),
    'Downloads',
    'treetino-mobile-screens',
  );
  const repoMobileScreensDir = path.resolve(
    '/Users/jakub/Projects/treetino-hack/mobile-screens',
  );

  if (!fs.existsSync(downloadsDir))
    fs.mkdirSync(downloadsDir, { recursive: true });
  if (!fs.existsSync(repoMobileScreensDir))
    fs.mkdirSync(repoMobileScreensDir, { recursive: true });

  const screensToCopy = [
    { src: step3MarketplacePath, name: '01_Treetino_Mobile_Marketplace.png' },
    {
      src: step4HeartPath,
      name: '02_Treetino_Mobile_Visual_Heart_Energy_Flow.png',
    },
    {
      src: step4CalcPath,
      name: '03_Treetino_Mobile_Compounding_Yield_Calculator.png',
    },
    {
      src: step5aModalPath,
      name: '04_Treetino_Mobile_Investor_Backing_Modal.png',
    },
    {
      src: step6PortfolioPath,
      name: '05_Treetino_Mobile_Investor_Portfolio_Wallet.png',
    },
  ];

  for (const s of screensToCopy) {
    if (fs.existsSync(s.src)) {
      fs.copyFileSync(s.src, path.join(downloadsDir, s.name));
      fs.copyFileSync(s.src, path.join(repoMobileScreensDir, s.name));
    }
  }
  console.log(
    'Copied 5 core mobile screens to ~/Downloads/treetino-mobile-screens and ./mobile-screens',
  );

  await browser.close();
  console.log(
    'ALL DESKTOP + MOBILE DEMO STEPS EXECUTED AND CAPTURED SUCCESSFULLY!',
  );
}

runDemo().catch((err) => {
  console.error('Demo execution failed:', err);
  process.exit(1);
});
