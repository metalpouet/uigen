const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('Navigating...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const textarea = await page.$('textarea');
  await textarea.click();
  await textarea.fill('Create a pricing card component with a title, price, features list, and a CTA button');
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();
  console.log('Submitted');

  // Wait for all Generating... to stop (poll every second)
  console.log('Waiting for completion...');
  let attempts = 0;
  while (attempts < 90) {
    await page.waitForTimeout(1000);
    const text = await page.evaluate(() => document.body.innerText);
    const stillGenerating = text.includes('Generating...');
    if (!stillGenerating) {
      console.log(`Complete after ~${attempts}s`);
      break;
    }
    attempts++;
    if (attempts % 10 === 0) console.log(`Still generating... ${attempts}s`);
  }

  await page.waitForTimeout(2000);

  // Final preview screenshot
  const previewTab = await page.$('button:has-text("Preview")');
  if (previewTab) await previewTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'final_preview.png') });
  console.log('Final preview screenshot saved');

  // Switch to Code tab, click Card.jsx
  const codeTab = await page.$('button:has-text("Code")');
  if (codeTab) await codeTab.click();
  await page.waitForTimeout(500);

  const cardJsx = await page.$('text=Card.jsx');
  if (cardJsx) {
    await cardJsx.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'final_card_jsx.png') });
    console.log('Card.jsx screenshot saved');
  }

  const appJsx = await page.$('text=App.jsx');
  if (appJsx) {
    await appJsx.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'final_app_jsx.png') });
    console.log('App.jsx screenshot saved');
  }

  const pageText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(screenshotsDir, 'final_page_text.txt'), pageText.substring(0, 30000));

  await browser.close();
  console.log('Done');
})().catch(err => { console.error(err.message); process.exit(1); });
