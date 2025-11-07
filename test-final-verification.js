const { chromium } = require('playwright');

async function testFinalVerification() {
  console.log('🧪 Final Verification Test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Capture console logs
    page.on('console', msg => {
      console.log(`Browser Console: ${msg.text()}`);
    });

    // Capture network requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        console.log(`API Response: ${status} ${response.url()}`);
      }
    });

    // Navigate to booking page
    console.log('1. Navigating to booking page...');
    await page.goto('http://localhost:5173/booking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Complete full booking flow
    console.log('2. Selecting service...');
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(2000);

    console.log('3. Selecting master...');
    await page.waitForSelector('.master-card', { timeout: 10000 });
    await page.locator('.master-card').first().click();
    await page.waitForTimeout(2000);

    console.log('4. Selecting date...');
    await page.waitForSelector('.date-btn', { timeout: 10000 });
    await page.locator('.date-btn').first().click();
    await page.waitForTimeout(3000);

    console.log('5. Checking time slots...');
    await page.waitForSelector('.time-btn', { timeout: 10000 });
    const timeSlots = await page.locator('.time-btn').count();
    console.log(`Found ${timeSlots} time slots`);

    if (timeSlots > 0) {
      console.log('6. Selecting time slot...');
      await page.locator('.time-btn').first().click();
      await page.waitForTimeout(2000);

      console.log('7. Checking confirmation flow...');
      const confirmationVisible = await page.locator('.booking-confirmation').count();
      if (confirmationVisible > 0) {
        console.log('✅ SUCCESS: Full booking flow working!');
        console.log('✅ Service → Master → Date → Time → Confirmation');
      } else {
        console.log('⚠️  Time slot selected but confirmation not visible');
      }
    } else {
      console.log('❌ FAILED: No time slots found after date selection');
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFinalVerification();