import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const executablePath =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath,
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

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('Page loaded successfully! Title:', await page.title());

  await browser.close();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
