const { chromium } = require('playwright');

async function testTimeSlotSelection() {
  console.log('🧪 Testing Time Slot Selection...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Capture console logs and network requests
    page.on('console', msg => {
      console.log(`Browser Console: ${msg.text()}`);
    });

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        console.log(`API Response: ${status} ${response.url()}`);
        if (status >= 400) {
          try {
            const errorText = await response.text();
            console.log(`Error body: ${errorText}`);
          } catch (e) {
            // Ignore errors reading error body
          }
        }
      }
    });

    // Navigate to the booking page
    console.log('1. Navigating to booking page...');
    await page.goto('http://localhost:5173/booking');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await page.waitForTimeout(5000);

    // Check if we can see service selection
    console.log('2. Looking for service selection...');
    const serviceCards = await page.locator('.service-card').count();
    console.log(`Found ${serviceCards} service cards`);

    if (serviceCards > 0) {
      // Click the first service
      console.log('3. Selecting first service...');
      await page.locator('.service-card').first().click();
      await page.waitForTimeout(1000);

      // Check for master selection
      console.log('4. Looking for master selection...');
      const masterCards = await page.locator('.master-card').count();
      console.log(`Found ${masterCards} master cards`);

      if (masterCards > 0) {
        // Click the first master
        console.log('5. Selecting first master...');
        await page.locator('.master-card').first().click();
        await page.waitForTimeout(1000);

        // Check for date selection
        console.log('6. Looking for date selection...');
        const dateButtons = await page.locator('.date-btn').count();
        console.log(`Found ${dateButtons} date buttons`);

        if (dateButtons > 0) {
          // Try to manually trigger date selection
          console.log('7. Manually triggering date selection...');
          await page.evaluate(() => {
            const firstDateBtn = document.querySelector('.date-btn');
            if (firstDateBtn) {
              const dateValue = firstDateBtn.dataset.date;
              const dateObj = new Date(JSON.parse(firstDateBtn.dataset.dateObj));
              console.log('Manual date selection:', { dateValue, dateObj });
              
              // Try to find the DateTimePicker instance and call selectDate
              // Check if there's a global reference or try to trigger the click event
              firstDateBtn.click();
              
              // Also try to dispatch a custom event
              const event = new Event('click', { bubbles: true });
              firstDateBtn.dispatchEvent(event);
            }
          });
          
          console.log('8. Waiting for time slots API call...');
          await page.waitForTimeout(5000); // Wait for API call

          // Check for time slots
          console.log('8. Looking for time slots...');
          const timeSlots = await page.locator('.datetime-picker__time-slot').count();
          console.log(`Found ${timeSlots} time slots`);

          if (timeSlots > 0) {
            console.log('✅ Time slots loaded successfully!');
            
            // Get the text of first time slot
            const firstTimeSlot = await page.locator('.datetime-picker__time-slot').first().textContent();
            console.log(`First available time: ${firstTimeSlot}`);
          } else {
            console.log('❌ No time slots found');
            
            // Check for error messages
            const errorElement = await page.locator('.datetime-picker__error').count();
            if (errorElement > 0) {
              const errorText = await page.locator('.datetime-picker__error').first().textContent();
              console.log(`Error message: ${errorText}`);
            }
          }
        } else {
          console.log('❌ No date buttons found');
        }
      } else {
        console.log('❌ No master buttons found');
      }
    } else {
      console.log('❌ No service buttons found');
    }

    // Wait a bit more to see any console logs
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testTimeSlotSelection();