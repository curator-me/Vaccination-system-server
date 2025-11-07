import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import cron from "node-cron";
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config();

import vaccineCentersRouter, {
  setVaccineCenterCollection,
} from "./routers/vaccineCenters.js";
import appointmentRouter, {
  setAppointmentCollection,
} from "./routers/appointment.js";
import vaccineRouter, { setVaccineCollection } from "./routers/vaccine.js";
import chatbotRouter, { setChatbotCollections } from "./routers/chatbot.js";
import userRouter, { setUsersCollection } from "./routers/user.js";

let vaccineCenterCollection;
let appointmentCollection;
let usersCollection;
let vaccineCollection;

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173", // your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// 🔹 MongoDB Setup
const uri = `mongodb+srv://ridoybaidya2_db_user:neub2025@cluster0.kn4noct.mongodb.net/`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("vaccineSystem");
    vaccineCenterCollection = db.collection("vaccine_centers");
    appointmentCollection = db.collection("appointments");
    usersCollection = db.collection("users");
    vaccineCollection = db.collection("vaccine");

    // Attach collection setters
    setVaccineCollection({ vaccineCollection });
    setVaccineCenterCollection({ vaccineCenterCollection });
    setAppointmentCollection({
      appointmentCollection,
      vaccineCenterCollection,
      usersCollection,
    });
    setUsersCollection({ usersCollection });

    // 🔹 FIXED: Pass all required collections to chatbot
    setChatbotCollections({
      usersCollection,
      appointmentCollection,
      vaccineCentersCollection: vaccineCenterCollection,
      vaccineCollection: vaccineCollection,
    });

    // Register routes - FIXED: Use specific paths for each router
    app.use("/api", vaccineCentersRouter);
    app.use("/api", appointmentRouter);
    app.use("/api/chatbot", chatbotRouter);
    app.use("/api", userRouter);
    app.use("/api", vaccineRouter);

    console.log("✅ Routes and collections set successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

connectDB();

// 🔹 Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔹 Cron job: daily 10 PM appointment reminders
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

// 🔹 Root Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// 🔹 ADDED: Health check endpoint for testing
app.get("/health", (req, res) => {
  res.json({
    status: "running",
    message: "Vaccine System Backend is operational",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
