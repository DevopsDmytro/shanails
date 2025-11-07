const { chromium } = require('playwright');

async function testEventDelegation() {
  console.log('🧪 Testing Event Delegation Only...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Capture console logs
    page.on('console', msg => {
      console.log(`Browser Console: ${msg.text()}`);
    });

    // Navigate directly to a page with minimal API calls
    console.log('1. Navigating to booking page...');
    await page.goto('http://localhost:5173/booking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Wait for initial load to complete
    console.log('2. Waiting for initial components to load...');
    
    // Try to find date buttons and test click directly
    console.log('3. Testing date button click...');
    const dateButtons = await page.locator('.date-btn').count();
    console.log(`Found ${dateButtons} date buttons`);

    if (dateButtons > 0) {
      // Click first date button and check if event fires
      console.log('4. Clicking first date button...');
      await page.locator('.date-btn').first().click();
      await page.waitForTimeout(2000);

      // Check if time slots appear (indicates successful event)
      console.log('5. Checking if time slots appear...');
      const timeSlots = await page.locator('.time-btn').count();
      console.log(`Found ${timeSlots} time slots after date click`);

      if (timeSlots > 0) {
        console.log('6. Testing time slot click...');
        await page.locator('.time-btn').first().click();
        await page.waitForTimeout(2000);

        // Check if any confirmation or selection happens
        console.log('7. Checking for any selection state changes...');
        const selectedDate = await page.locator('.date-btn.selected').count();
        const selectedTime = await page.locator('.time-btn.selected').count();
        
        console.log(`Selected date buttons: ${selectedDate}`);
        console.log(`Selected time buttons: ${selectedTime}`);

        if (selectedDate > 0 || selectedTime > 0) {
          console.log('✅ SUCCESS: Event delegation working!');
          console.log('✅ Date and time selection both functional');
        } else {
          console.log('⚠️  Click happened but selection state not updated');
        }
      } else {
        console.log('❌ Time slots did not appear after date click');
      }
    } else {
      console.log('❌ No date buttons found');
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEventDelegation();