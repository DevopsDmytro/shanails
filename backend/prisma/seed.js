const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data
    await prisma.review.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.service.deleteMany();
    await prisma.masterProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing data');

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@shanails.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('👤 Created admin user:', adminUser.email);

    // Create sample masters
    const master1User = await prisma.user.create({
      data: {
        email: 'anna@shanails.com',
        firstName: 'Анна',
        lastName: 'Петренко',
        role: 'MASTER',
        isActive: true
      }
    });

    const master2User = await prisma.user.create({
      data: {
        email: 'olena@shanails.com',
        firstName: 'Олена',
        lastName: 'Мельник',
        role: 'MASTER',
        isActive: true
      }
    });

    const master1Profile = await prisma.masterProfile.create({
      data: {
        userId: master1User.id,
        employeeCode: 'MP001',
        commissionRate: 30.00,
        isActive: true,
        specializations: ['Манікюр', 'Педикюр'],
        experience: 5
      }
    });

    const master2Profile = await prisma.masterProfile.create({
      data: {
        userId: master2User.id,
        employeeCode: 'MP002',
        commissionRate: 25.00,
        isActive: true,
        specializations: ['Нарощення', 'Дизайн'],
        experience: 3
      }
    });
    console.log('💅 Created masters:', master1User.firstName, master2User.firstName);

    // Create sample customers
    const customer1 = await prisma.user.create({
      data: {
        email: 'customer1@example.com',
        firstName: 'Марія',
        lastName: 'Іваненко',
        phone: '+380501234567',
        role: 'CUSTOMER',
        isActive: true
      }
    });

    const customer2 = await prisma.user.create({
      data: {
        email: 'customer2@example.com',
        firstName: 'Оксана',
        lastName: 'Сидоренко',
        phone: '+380507654321',
        role: 'CUSTOMER',
        isActive: true
      }
    });
    console.log('👥 Created customers:', customer1.firstName, customer2.firstName);

    // Create services
    const services = await prisma.service.createMany({
      data: [
        {
          name: 'Класичний манікюр',
          description: 'Обробка нігтів, видалення кутикули, покриття лаком',
          price: 250.00,
          duration: 60,
          category: 'Манікюр',
          isActive: true
        },
        {
          name: 'Манікюр + гельове покриття',
          description: 'Повний комплекс манікюру з гельовим покриттям',
          price: 400.00,
          duration: 90,
          category: 'Манікюр',
          isActive: true
        },
        {
          name: 'Нарощення нігтів',
          description: 'Нарощування нігтів гелем',
          price: 600.00,
          duration: 120,
          category: 'Нарощення',
          isActive: true
        },
        {
          name: 'Педикюр',
          description: 'Обробка нігтів на ногах',
          price: 350.00,
          duration: 75,
          category: 'Педикюр',
          isActive: true
        },
        {
          name: 'Дизайн нігтів',
          description: 'Художнє оформлення нігтів',
          price: 150.00,
          duration: 30,
          category: 'Дизайн',
          isActive: true
        },
        {
          name: 'Зняття гелю',
          description: 'Безпечне зняття гелевого покриття',
          price: 100.00,
          duration: 30,
          category: 'Манікюр',
          isActive: true
        }
      ]
    });
    console.log('💅 Created services count:', services.count);

    // Create schedules for masters
    const now = new Date();
    const weekDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday

    for (const dayOfWeek of weekDays) {
      // Skip Sunday for master 1
      if (dayOfWeek !== 0) {
        await prisma.schedule.create({
          data: {
            masterId: master1Profile.id,
            dayOfWeek,
            startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
            endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0),
            isActive: true
          }
        });
      }

      // Master 2 works Tuesday to Saturday
      if (dayOfWeek >= 2 && dayOfWeek <= 6) {
        await prisma.schedule.create({
          data: {
            masterId: master2Profile.id,
            dayOfWeek,
            startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0),
            endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0),
            isActive: true
          }
        });
      }
    }
    console.log('📅 Created work schedules');

    // Get all services for sample appointments
    const allServices = await prisma.service.findMany();
    const manicureService = allServices.find(s => s.category === 'Манікюр');
    const designService = allServices.find(s => s.category === 'Дизайн');

    // Create sample appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(14, 0, 0, 0);

    if (manicureService) {
      await prisma.appointment.create({
        data: {
          customerId: customer1.id,
          masterId: master1Profile.id,
          serviceIds: [manicureService.id],
          startTime: tomorrow,
          endTime: new Date(tomorrow.getTime() + manicureService.duration * 60 * 1000),
          status: 'SCHEDULED',
          totalPrice: manicureService.price,
          customerNotes: 'Перший візит, будь ласка, будьте обережні'
        }
      });
    }

    if (manicureService && designService) {
      await prisma.appointment.create({
        data: {
          customerId: customer2.id,
          masterId: master2Profile.id,
          serviceIds: [manicureService.id, designService.id],
          startTime: dayAfterTomorrow,
          endTime: new Date(dayAfterTomorrow.getTime() + (manicureService.duration + designService.duration) * 60 * 1000),
          status: 'CONFIRMED',
          totalPrice: Number(manicureService.price) + Number(designService.price),
          customerNotes: 'Хочу дизайн з квітами'
        }
      });
    }
    console.log('📅 Created sample appointments');

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Admin: admin@shanails.com / admin123');
    console.log('   Master 1: anna@shanails.com');
    console.log('   Master 2: olena@shanails.com');
    console.log('   Customer 1: customer1@example.com');
    console.log('   Customer 2: customer2@example.com');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });