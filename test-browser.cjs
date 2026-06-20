const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG [', msg.type(), ']:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER_REQ_FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  
  console.log('Waiting for network idle...');
  await page.waitForLoadState('networkidle');

  console.log('Typing login...');
  // It might be on login page first
  const loginInput = await page.$('input[type="text"]');
  if (loginInput) {
    await loginInput.fill('JONATAN.ALMEIDA');
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) await pwdInput.fill('123456'); // any password since auth might be mocked or we just need something
    await page.click('button:has-text("Entrar no Sistema")');
    await page.waitForTimeout(3000);
  }

  console.log('Clicking Ecotowers...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Ecotowers')) {
      await btn.click();
      console.log('Clicked Ecotowers');
      break;
    }
  }

  await page.waitForTimeout(2000); // wait for any errors
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('Done');
  await browser.close();
})();
