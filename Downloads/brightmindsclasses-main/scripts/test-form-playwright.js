const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = { console: [], pageErrors: [], requests: [], responses: [] };

  page.on('console', msg => {
    logs.console.push(msg.text());
    console.log('[PAGE LOG]', msg.text());
  });
  page.on('pageerror', err => {
    logs.pageErrors.push(err.message);
    console.log('[PAGE ERROR]', err.message);
  });
  page.on('request', request => {
    const url = request.url();
    if (url.includes('docs.google.com/forms')) {
      const data = { url, method: request.method(), postData: request.postData() };
      logs.requests.push(data);
      console.log('[REQUEST]', data);
    }
  });
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('docs.google.com/forms')) {
      const status = response.status();
      let text = '';
      try { text = await response.text(); } catch (e) { text = `<failed to read: ${e.message}>`; }
      const data = { url, status, bodyLength: text.length };
      logs.responses.push(data);
      console.log('[RESPONSE]', data);
    }
  });

  try {
    await page.goto('https://incandescent-klepon-e8587d.netlify.app/', { waitUntil: 'networkidle' });

    // Ensure contact form is present and visible
    await page.waitForSelector('#contact', { timeout: 10000 });

    // Fill fields
    await page.fill('#studentName', 'Playwright Test User');
    await page.selectOption('#studentClass', '10');
    await page.fill('#parentContact', '7045089123');
    await page.fill('#email', 'pw-test@example.com');
    await page.fill('#message', 'This is an automated test submission from Playwright.');

    // Click submit
    await Promise.all([
      page.waitForTimeout(2500), // wait a short while for the request to be sent
      page.click('text=Submit Enquiry')
    ]);

    // Wait a bit to capture any responses
    await page.waitForTimeout(3000);

    // Save a screenshot
    await page.screenshot({ path: 'playwright_submission.png', fullPage: true });

    // Write logs
    fs.writeFileSync('playwright_logs.json', JSON.stringify(logs, null, 2));
    console.log('Saved screenshot to playwright_submission.png and logs to playwright_logs.json');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();