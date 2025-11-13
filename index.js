import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
dotenv.config();

// Routers
import vaccineCentersRouter, {
  setVaccineCenterCollection,
} from "./routers/vaccineCenters.js";
import appointmentRouter, {
  setAppointmentCollection,
} from "./routers/appointment.js";
import vaccineRouter, { setVaccineCollection } from "./routers/vaccine.js";
import chatbotRouter, { setChatbotCollections } from "./routers/chatbot.js";
import userRouter, { setUsersCollection } from "./routers/user.js";
import { startReminderCron } from "./cron/emailReminderCron.js";
import { startVaccineStockCron } from "./cron/vaccineStockCron.js";


const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

async function init() {
  // Connect to DB
  const {
    vaccineCenterCollection,
    appointmentCollection,
    usersCollection,
    vaccineCollection,
  } = await connectDB();

  // Attach collections
  setVaccineCollection({ vaccineCollection });
  setVaccineCenterCollection({ vaccineCenterCollection });
  setAppointmentCollection({
    appointmentCollection,
    vaccineCenterCollection,
    usersCollection,
  });
  setUsersCollection({ usersCollection });

  setChatbotCollections({
    usersCollection,
    appointmentCollection,
    vaccineCenterCollection,
    vaccineCollection,
  });

  // Register routes
  app.use("/api", vaccineCentersRouter);
  app.use("/api", appointmentRouter);
  app.use("/api", chatbotRouter);
  app.use("/api", userRouter);
  app.use("/api", vaccineRouter);

  console.log("Routes and collections initialized");

  // Start cron jobs
  startReminderCron(appointmentCollection, usersCollection);
  startVaccineStockCron(vaccineCenterCollection, handleSupplyRequest);

  // Start server
  app.listen(port, () =>
    console.log(`Server running on port ${port}\nhttp://localhost:${port}`)
  );
}

// Create a supply request for the specefic vaccine centers which are out of stock
async function handleSupplyRequest(center) {
  console.log(`Refill request triggered for ${center.center_name}`);
}

// Root endpoints
app.get("/", (_, res) => res.send("Backend is running!"));

app.get("/health", (_, res) =>
  res.json({
    status: "running",
    message: "Vaccine System Backend is operational",
    timestamp: new Date().toISOString(),
  })
);

// Init everything
init();
