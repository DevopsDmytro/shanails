const { PrismaClient } = require('@prisma/client');
const masterService = require('./src/services/masterService');

const prisma = new PrismaClient();

async function testAvailability() {
  console.log('🔍 Testing Master Availability...\n');

  try {
    // Get test data
    const master = await prisma.masterProfile.findFirst({ include: { user: true } });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Master: ${master.user.firstName} ${master.user.lastName}`);
    console.log(`Date: ${tomorrow.toISOString().split('T')[0]}`);

    // Check availability with 150-minute requirement
    const availability = await masterService.getMasterAvailability(
      master.id.toString(), 
      tomorrow.toISOString().split('T')[0],
      150 // 150 minutes required
    );

    console.log('\n📅 Available time slots:');
    console.log(`Total slots: ${availability.timeSlots.length}`);
    if (availability.timeSlots.length > 0) {
      availability.timeSlots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`);
      });
    } else {
      console.log('No available slots');
    }

    // Check existing appointments for that day
    const dayStart = new Date(tomorrow);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(tomorrow);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        masterId: master.id,
        startTime: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true
      }
    });

    console.log('\n📋 Existing appointments:');
    existingAppointments.forEach(apt => {
      console.log(`  ${apt.startTime.toISOString()} - ${apt.endTime.toISOString()} (${apt.status})`);
    });

    // Test with a specific time
    const testTime = new Date(tomorrow);
    testTime.setHours(11, 0, 0, 0);
    
    console.log(`\n🧪 Testing time: ${testTime.toISOString()}`);
    
    // Debug: Check work hours
    const workStart = new Date(tomorrow);
    workStart.setHours(10, 0, 0, 0);
    const workEnd = new Date(tomorrow);
    workEnd.setHours(22, 0, 0, 0);
    console.log(`Work hours: ${workStart.toISOString()} - ${workEnd.toISOString()}`);
    
    // Check if this time fits in any available slot
    const matchingSlot = availability.timeSlots.find(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      return slotStart <= testTime && slotEnd >= testTime;
    });

    console.log(`Matching slot: ${matchingSlot ? '✅ Found' : '❌ Not found'}`);
    if (matchingSlot) {
      console.log(`  Slot: ${matchingSlot.startTime.toISOString()} - ${matchingSlot.endTime.toISOString()}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAvailability();