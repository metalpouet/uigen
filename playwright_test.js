const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // Step 1: Navigate and screenshot
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(screenshotsDir, '1_initial.png'), fullPage: false });
  console.log('Screenshot 1 saved: initial load');

  // Step 2: Find chat input and type prompt
  console.log('Looking for chat input...');

  // Try common selectors for a chat input
  const inputSelectors = [
    'textarea',
    'input[type="text"]',
    '[placeholder*="message"]',
    '[placeholder*="prompt"]',
    '[placeholder*="type"]',
    '[placeholder*="ask"]',
    '[placeholder*="describe"]',
    '[placeholder*="component"]',
    '[contenteditable="true"]',
  ];

  let inputEl = null;
  for (const sel of inputSelectors) {
    inputEl = await page.$(sel);
    if (inputEl) {
      console.log(`Found input with selector: ${sel}`);
      break;
    }
  }

  if (!inputEl) {
    console.log('Could not find input — taking snapshot of page HTML');
    const content = await page.content();
    fs.writeFileSync(path.join(screenshotsDir, 'page_content.html'), content);
    await browser.close();
    return;
  }

  const prompt = 'Create a pricing card component with a title, price, features list, and a CTA button';
  await inputEl.click();
  await inputEl.fill(prompt);
  await page.screenshot({ path: path.join(screenshotsDir, '2_typed_prompt.png') });
  console.log('Screenshot 2 saved: typed prompt');

  // Submit — try Enter key or submit button
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Send")',
    'button:has-text("Generate")',
    'button:has-text("Submit")',
  ];

  let submitted = false;
  for (const sel of submitSelectors) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click();
      submitted = true;
      console.log(`Clicked submit with: ${sel}`);
      break;
    }
  }

  if (!submitted) {
    await inputEl.press('Enter');
    console.log('Pressed Enter to submit');
  }

  // Step 3: Wait for generation
  console.log('Waiting for component generation...');
  await page.waitForTimeout(3000);

  // Wait for loading indicator to disappear or for preview content
  try {
    await page.waitForFunction(() => {
      const loaders = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="generating"]');
      return loaders.length === 0;
    }, { timeout: 30000 });
  } catch (e) {
    console.log('Timeout waiting for loading indicator to disappear');
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '3_generated.png') });
  console.log('Screenshot 3 saved: after generation');

  // Step 4: Switch to Code tab
  const codeTabSelectors = [
    'button:has-text("Code")',
    '[role="tab"]:has-text("Code")',
    'a:has-text("Code")',
    '[data-tab="code"]',
  ];

  let codeTabClicked = false;
  for (const sel of codeTabSelectors) {
    const tab = await page.$(sel);
    if (tab) {
      await tab.click();
      codeTabClicked = true;
      console.log(`Clicked Code tab with: ${sel}`);
      break;
    }
  }

  if (!codeTabClicked) {
    console.log('Could not find Code tab');
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '4_code_tab.png') });
  console.log('Screenshot 4 saved: code tab');

  // Dump page HTML for analysis
  const html = await page.content();
  fs.writeFileSync(path.join(screenshotsDir, 'final_page.html'), html.substring(0, 50000));

  await browser.close();
  console.log('Done. Screenshots saved to:', screenshotsDir);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
