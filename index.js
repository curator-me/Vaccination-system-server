const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const dayjs = require("dayjs");
require("dotenv").config();

const {
  router: vaccineCentersRouter,
  setVaccineCenterCollection,
} = require("./routers/vaccineCenters");

const {
  router: appointmentRouter,
  setAppointmentCollection,
} = require("./routers/appointment");

const {
  router: vaccineRouter, setVaccineCollection
} = require("./routers/vaccine")

const {
  router: chatbotRouter,
  setChatbotCollections,
} = require("./routers/chatbot");

const {
  router: userRouter,
  setUsersCollection,
} = require("./routers/user");

let vaccineCenterCollection;
let appointmentCollection;
let usersCollection;
let vaccineInventoryCollection;

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
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
    vaccineCollection = db.collection("vaccine")
    vaccineInventoryCollection = db.collection("vaccine_inventory");

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
      vaccineInventoryCollection: vaccineInventoryCollection
    });

    // Register routes - FIXED: Use specific paths for each router
    app.use("/api", vaccineCentersRouter);
    app.use("/api/", appointmentRouter);
    app.use("/api/chatbot", chatbotRouter);  // 🔹 FIXED: Specific path for chatbot
    app.use("/api/", userRouter);

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
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});