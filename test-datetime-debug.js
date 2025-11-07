// Test script to simulate DateTimePicker functionality and check console logs
import { chromium } from 'playwright';

async function testDateTimePicker() {
  console.log('🧪 Starting DateTimePicker debugging test...\n');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    console.log(`🔍 Console: ${msg.text()}`);
  });
  
  try {
    // Navigate to frontend
    await page.goto('http://localhost:80');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded, waiting for app to initialize...');
    await page.waitForTimeout(2000);
    
    // Step 1: Select a service
    console.log('\n1️⃣ Selecting a service...');
    const serviceButtons = await page.$$('.service-card');
    if (serviceButtons.length > 0) {
      await serviceButtons[0].click();
      await page.waitForTimeout(1000);
      console.log('✅ Service selected');
    }
    
    // Step 2: Select a master
    console.log('\n2️⃣ Selecting a master...');
    const masterButtons = await page.$$('.master-card');
    if (masterButtons.length > 0) {
      await masterButtons[0].click();
      await page.waitForTimeout(1000);
      console.log('✅ Master selected');
    }
    
    // Step 3: Wait for calendar to load
    console.log('\n3️⃣ Waiting for calendar to load...');
    await page.waitForTimeout(2000);
    
    // Step 4: Click a date
    console.log('\n4️⃣ Clicking a date...');
    const dateButtons = await page.$$('.date-btn');
    if (dateButtons.length > 0) {
      // Click the first available date (not today)
      const targetDate = dateButtons.find(async btn => {
        const text = await btn.textContent();
        return !text.includes('Сьогодні');
      });
      
      if (targetDate) {
        console.log('🗓️ Clicking date:', await targetDate.textContent());
        await targetDate.click();
        await page.waitForTimeout(3000); // Wait for API call and rendering
        
        console.log('\n📊 Console messages captured:');
        consoleMessages.forEach(msg => console.log(`  ${msg}`));
        
        // Check if time slots appeared
        const timeButtons = await page.$$('.time-btn');
        console.log(`\n⏰ Time buttons found: ${timeButtons.length}`);
        
        if (timeButtons.length > 0) {
          console.log('✅ SUCCESS: Time slots are displayed!');
          for (let i = 0; i < Math.min(3, timeButtons.length); i++) {
            const timeText = await timeButtons[i].textContent();
            console.log(`  ⏱️  Time slot ${i + 1}: ${timeText}`);
          }
        } else {
          console.log('❌ FAILURE: No time slots displayed');
          
          // Check what's in the times container
          const timesContainer = await page.$('#times-container');
          if (timesContainer) {
            const containerText = await timesContainer.textContent();
            console.log(`📝 Times container content: ${containerText}`);
          }
        }
      } else {
        console.log('❌ No suitable date found to click');
      }
    } else {
      console.log('❌ No date buttons found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDateTimePicker();