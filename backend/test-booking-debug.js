const { PrismaClient } = require('@prisma/client');
const bookingService = require('./src/services/bookingService');

const prisma = new PrismaClient();

async function testBookingIssues() {
  console.log('🔍 Testing Booking Service Issues...\n');

  try {
    // Test 1: Check existing appointments
    console.log('📅 Checking existing appointments:');
    const existingAppointments = await prisma.appointment.findMany({
      include: {
        services: true,
        customer: true,
        master: { include: { user: true } }
      }
    });

    for (const appointment of existingAppointments) {
      const duration = (new Date(appointment.endTime) - new Date(appointment.startTime)) / (1000 * 60);
      console.log(`Appointment ${appointment.id}:`);
      console.log(`  Services: ${appointment.services.map(s => s.name).join(', ')}`);
      console.log(`  Start: ${appointment.startTime.toISOString()}`);
      console.log(`  End: ${appointment.endTime.toISOString()}`);
      console.log(`  Duration: ${duration} minutes`);
      console.log(`  Status: ${appointment.status}`);
      console.log('');
    }

    // Test 2: Create a new multi-service booking
    console.log('🧪 Testing multi-service booking creation:');
    
    // Get test data
    const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    const master = await prisma.masterProfile.findFirst({ include: { user: true } });
    const services = await prisma.service.findMany({ where: { isActive: true }, take: 2 });

    if (!customer || !master || services.length < 2) {
      throw new Error('Insufficient test data');
    }

    console.log(`Customer: ${customer.firstName} ${customer.lastName}`);
    console.log(`Master: ${master.user.firstName} ${master.user.lastName}`);
    console.log(`Services: ${services.map(s => `${s.name} (${s.duration}min)`).join(', ')}`);

    // Calculate expected duration
    const expectedDuration = services.reduce((sum, service) => sum + service.duration, 0);
    console.log(`Expected total duration: ${expectedDuration} minutes`);

    // Create booking data
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1); // 1 day from now
    startTime.setUTCHours(12, 30, 0, 0);

    const bookingData = {
      customerId: customer.id.toString(),
      masterId: master.id.toString(),
      serviceIds: services.map(s => s.id.toString()),
      startTime: startTime.toISOString(),
      customerNotes: 'Test multi-service booking'
    };

    console.log(`Booking start time: ${bookingData.startTime}`);

    // Test the booking creation
    try {
      const newAppointment = await bookingService.createAppointment(bookingData);
      
      const actualDuration = (new Date(newAppointment.endTime) - new Date(newAppointment.startTime)) / (1000 * 60);
      
      console.log('\n✅ Booking created successfully:');
      console.log(`  Appointment ID: ${newAppointment.id}`);
      console.log(`  Start: ${newAppointment.startTime}`);
      console.log(`  End: ${newAppointment.endTime}`);
      console.log(`  Actual duration: ${actualDuration} minutes`);
      console.log(`  Expected duration: ${expectedDuration} minutes`);
      console.log(`  Duration match: ${actualDuration === expectedDuration ? '✅' : '❌'}`);
      console.log(`  Total price: ${newAppointment.totalPrice}`);

      // Test 3: Check timezone handling
      console.log('\n🌍 Testing timezone handling:');
      console.log(`Original startTime (ISO): ${bookingData.startTime}`);
      console.log(`Stored startTime: ${newAppointment.startTime}`);
      console.log(`Stored endTime: ${newAppointment.endTime}`);
      
      // Check if times are properly serialized
      const serializedStart = new Date(newAppointment.startTime).toISOString();
      const serializedEnd = new Date(newAppointment.endTime).toISOString();
      console.log(`Serialized start: ${serializedStart}`);
      console.log(`Serialized end: ${serializedEnd}`);

    } catch (bookingError) {
      console.error('❌ Booking creation failed:', bookingError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingIssues();