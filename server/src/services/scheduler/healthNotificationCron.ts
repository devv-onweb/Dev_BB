import cron from 'node-cron';
import prisma from '../../config/db.js';

const HEALTH_TIPS = [
  {
    title: 'Daily Blood Health: Iron Absorption',
    message: 'Pair iron-rich foods (spinach, lentils) with Vitamin C (citrus, bell peppers) to boost absorption by up to 3x.',
  },
  {
    title: 'Hydration & Plasma Health',
    message: 'Optimal daily water intake (2.5L-3L) preserves healthy plasma viscosity and supports natural renal filtration.',
  },
  {
    title: 'Post-Donation Recovery Reminder',
    message: 'If you recently donated blood, avoid strenuous exercise for 24 hours and drink plenty of fluids with electrolytes.',
  },
  {
    title: 'Vital Sign Checkup Recommendation',
    message: 'Periodic blood pressure monitoring and annual hemogram testing ensure early detection of microcytic anemia.',
  },
  {
    title: 'Platelet Protection & Nutrition',
    message: 'Green leafy vegetables high in Vitamin K are vital for natural clotting factor synthesis and endothelial repair.',
  },
];

/**
 * Initialize health notification background cron schedules
 */
export const initHealthNotificationCron = (): void => {
  console.log('⏰ Initializing Phase 9 Health Notification Scheduler (node-cron)...');

  // Schedule daily health tip generation at 08:00 AM every day
  // For testing and demonstration, also trigger once shortly after boot
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('🚀 Running daily health tip scheduler...');
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['USER', 'PATIENT'] },
        },
        select: { id: true, name: true },
      });

      for (const user of users) {
        const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
        // Check if user already got a health tip today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existing = await prisma.notification.findFirst({
          where: {
            user_id: user.id,
            type: 'health_tip',
            created_at: { gte: startOfDay },
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              user_id: user.id,
              type: 'health_tip',
              title: tip.title,
              message: tip.message,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error in health tip cron job:', err);
    }
  });

  // Schedule check for flagged reports requiring follow-up every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const flaggedReports = await prisma.report.findMany({
        where: {
          is_flagged: true,
          created_at: {
            gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // last 3 days
          },
        },
        include: { user: true },
      });

      for (const report of flaggedReports) {
        const existingFollowup = await prisma.notification.findFirst({
          where: {
            user_id: report.user_id,
            type: 'followup',
            title: { contains: 'Follow-Up Advisory' },
          },
        });

        if (!existingFollowup) {
          await prisma.notification.create({
            data: {
              user_id: report.user_id,
              type: 'followup',
              title: `Follow-Up Advisory: ${report.file_name}`,
              message: `Reminder: Your lab test "${report.file_name}" indicated abnormal values. Have you scheduled a consultation with your preferred doctor?`,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error in follow-up cron job:', err);
    }
  });

  console.log('✅ Health Notification Cron Job initialized successfully.');
};
