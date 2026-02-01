const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

async function run() {
  // Start mock server
  const server = spawn('node', ['scripts/mock-apps-server.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', d => process.stdout.write('[MOCK] ' + d.toString()));
  server.stderr.on('data', d => process.stderr.write('[MOCK ERR] ' + d.toString()));

  // Wait a moment for server to start
  await new Promise(r => setTimeout(r, 700));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://incandescent-klepon-e8587d.netlify.app/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#contact');

    // Fill form
    await page.fill('#studentName', 'Mock Test User');
    await page.selectOption('#studentClass', '10');
    await page.fill('#parentContact', '7045089123');
    await page.fill('#email', 'mock@example.com');
    await page.fill('#message', 'Mock test submission');

    // Intercept any POST to the Google formResponse endpoint and capture postData
    let captured = [];
    await page.route('https://docs.google.com/forms/d/e/*/formResponse', async route => {
      const req = route.request();
      captured.push({ url: req.url(), postData: req.postData() });
      // Fulfill with a fake 200 so site does not see an error
      await route.fulfill({ status: 200, contentType: 'text/html', body: 'OK' });
    });

    // Click submit (site will create a dynamic hidden form and POST it)
    await page.click('text=Submit Enquiry');

    // Wait for the intercepted request to be captured
    await page.waitForTimeout(1500);

    fs.writeFileSync('mock_playwright_log.txt', JSON.stringify(captured, null, 2));
    console.log('Saved mock_playwright_log.txt');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    server.kill();
  }
}

run();
