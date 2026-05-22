const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(screenshotsDir, '1_initial.png') });
  console.log('Screenshot 1: initial');

  // Type and submit prompt
  const textarea = await page.$('textarea');
  await textarea.click();
  await textarea.fill('Create a pricing card component with a title, price, features list, and a CTA button');

  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();
  console.log('Submitted prompt');

  // Wait until "Generating..." disappears from chat (stream ends)
  console.log('Waiting for generation to complete...');
  try {
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return !text.includes('Generating...');
    }, { timeout: 60000 });
    console.log('Generation complete (no more "Generating..." text)');
  } catch (e) {
    console.log('Timeout — still generating after 60s, continuing anyway');
  }

  // Extra wait for the preview iframe to render
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotsDir, '3_generated.png') });
  console.log('Screenshot 3: after generation (Preview tab)');

  // Click Code tab
  const codeTab = await page.$('button:has-text("Code")');
  if (codeTab) {
    await codeTab.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(screenshotsDir, '4_code_tab.png') });
  console.log('Screenshot 4: code tab');

  // Try to click on App.jsx or Card.jsx to view file content
  const appJsx = await page.$('text=App.jsx');
  if (appJsx) {
    await appJsx.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '5_app_jsx.png') });
    console.log('Screenshot 5: App.jsx content');
  }

  const cardJsx = await page.$('text=Card.jsx');
  if (cardJsx) {
    await cardJsx.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '6_card_jsx.png') });
    console.log('Screenshot 6: Card.jsx content');
  }

  // Switch back to Preview to see the rendered component
  const previewTab = await page.$('button:has-text("Preview")');
  if (previewTab) {
    await previewTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '7_preview_final.png') });
    console.log('Screenshot 7: final preview');
  }

  // Dump full page text
  const pageText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(screenshotsDir, 'page_text.txt'), pageText.substring(0, 20000));

  await browser.close();
  console.log('Done.');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
