const { chromium } = require('playwright');

async function testDirectTimeSlotSelection() {
  console.log('🧪 Testing Direct Time Slot Selection...\n');

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

    // Navigate directly to booking page
    console.log('1. Navigating to booking page...');
    await page.goto('http://localhost:5173/booking');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Wait for services to load and select first service
    console.log('2. Waiting for services to load...');
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(2000);

    // Wait for masters to load and select first master
    console.log('3. Waiting for masters to load...');
    await page.waitForSelector('.master-card', { timeout: 10000 });
    await page.locator('.master-card').first().click();
    await page.waitForTimeout(2000);

    // Wait for dates to load
    console.log('4. Waiting for dates to load...');
    await page.waitForSelector('.date-btn', { timeout: 10000 });
    
    // Get the first date button and manually trigger the click event
    console.log('5. Manually triggering date selection...');
    await page.evaluate(() => {
      const firstDateBtn = document.querySelector('.date-btn');
      if (firstDateBtn) {
        console.log('Found date button, clicking...');
        
        // Try to find the DateTimePicker instance and call selectDate directly
        const dateValue = firstDateBtn.dataset.date;
        console.log('Raw dateObj dataset:', firstDateBtn.dataset.dateObj);
        console.log('All datasets:', firstDateBtn.dataset);
        console.log('Button HTML:', firstDateBtn.outerHTML);
        
        // Try to parse the date object more carefully
        let dateObj;
        try {
          if (firstDateBtn.dataset.dateObj) {
            dateObj = new Date(JSON.parse(firstDateBtn.dataset.dateObj));
          } else {
            // Fallback: use the date string
            dateObj = new Date(dateValue);
          }
        } catch (error) {
          console.log('Error parsing date:', error);
          dateObj = new Date(dateValue);
        }
        console.log('Date data:', { dateValue, dateObj });
        
        // Try to access the component instance through global scope or DOM
        // This is a hack - in production, the click should work
        try {
          // Look for any component references
          if (window.dateTimePicker) {
            window.dateTimePicker.selectDate(dateObj, dateValue);
          } else {
            // Fallback: try to trigger the click in different ways
            firstDateBtn.click();
            
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            firstDateBtn.dispatchEvent(clickEvent);
            
            // Try to call selectDate if it's attached to the element
            if (firstDateBtn.selectDate) {
              firstDateBtn.selectDate(dateObj, dateValue);
            }
            
            // Last resort: manually trigger API call to test if it works
            console.log('Trying manual API call...');
            fetch(`http://localhost:3000/api/v1/masters/3/availability?date=${dateValue}&serviceIds=11`)
              .then(response => response.json())
              .then(data => {
                console.log('Manual API call successful:', data);
              })
              .catch(error => {
                console.log('Manual API call failed:', error);
              });
          }
        } catch (error) {
          console.log('Error in date selection:', error);
        }
      }
    });

    // Wait for time slots to load
    console.log('6. Waiting for time slots API call...');
    await page.waitForTimeout(5000);

    // Check for time slots
    console.log('7. Checking for time slots...');
    const timeSlots = await page.locator('.time-btn').count();
    console.log(`Found ${timeSlots} time slots`);

    if (timeSlots > 0) {
      console.log('✅ SUCCESS: Time slots are loading!');
      
      // Get the text of first time slot
      const firstTimeSlot = await page.locator('.time-btn').first().textContent();
      console.log(`First available time: ${firstTimeSlot}`);
    } else {
      console.log('❌ FAILED: No time slots found');
      
      // Check for error messages
      const errorElement = await page.locator('.datetime-picker__error').count();
      if (errorElement > 0) {
        const errorText = await page.locator('.datetime-picker__error').first().textContent();
        console.log(`Error message: ${errorText}`);
      }

      // Check for placeholder messages
      const placeholderElement = await page.locator('.datetime-picker__times-placeholder').count();
      if (placeholderElement > 0) {
        const placeholderText = await page.locator('.datetime-picker__times-placeholder').first().textContent();
        console.log(`Placeholder message: ${placeholderText}`);
      }
    }

    // Wait a bit more to see any additional console logs
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDirectTimeSlotSelection();