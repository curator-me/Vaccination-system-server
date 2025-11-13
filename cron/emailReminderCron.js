// cron/emaiRreminderCron.js
import cron from "node-cron";
import dayjs from "dayjs";
import nodemailer from "nodemailer";

export const startReminderCron = ({ appointmentCollection, usersCollection }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  cron.schedule("0 22 * * *", async () => {
    console.log("Running reminder job at 10 PM...");

    const tomorrow = dayjs().add(1, "day").startOf("day").toDate();
    const nextDayEnd = dayjs().add(1, "day").endOf("day").toDate();

    try {
      const upcomingAppointments = await appointmentCollection
        .find({ appointment_date: { $gte: tomorrow, $lte: nextDayEnd } })
        .toArray();

      if (!upcomingAppointments.length) {
        console.log("No appointments for tomorrow.");
        return;
      }

      for (const appt of upcomingAppointments) {
        const user = await usersCollection.findOne({ _id: appt.userId });
        if (!user || !user.email) continue;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Vaccine Appointment Reminder",
          text: `
Dear ${user.name},

This is a friendly reminder for your vaccination appointment tomorrow.

Vaccine: ${appt.vaccine_name}
Center: ${appt.center_name}
Date: ${dayjs(appt.appointment_date).format("YYYY-MM-DD")}
Please arrive on time and bring your registration ID: ${appt.registration_no}

Thank you,
National Vaccination System
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to ${user.email}`);
      }
    } catch (err) {
      console.error("Reminder job failed:", err);
    }
  });
};
