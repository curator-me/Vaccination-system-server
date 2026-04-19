// routers/appointment.js
import express from "express";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

let appointmentCollection;
let vaccineCenterCollection;
let usersCollection;

// Setter to inject collections from main server
export const setAppointmentCollection = ({
  appointmentCollection: ac,
  vaccineCenterCollection: vc,
  usersCollection: uc,
}) => {
  appointmentCollection = ac;
  vaccineCenterCollection = vc;
  usersCollection = uc;
};

// GET: All Appointments
router.get("/appointments", verifyToken, async (req, res) => {
  try {
    const appointments = await appointmentCollection.find({}).toArray();
    res.json(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// GET: Appointments by User ID
router.get("/appointments/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const appointments = await appointmentCollection.find({ userId }).toArray();
    if (!appointments.length)
      return res
        .status(404)
        .json({ message: "No appointments found for this user" });

    res.status(200).json(appointments);
  } catch (err) {
    console.error("Error fetching user appointments:", err);
    res.status(500).json({ message: "Failed to fetch user appointments" });
  }
});

// POST: Create New Appointment
router.post("/appointments/add", verifyToken, async (req, res) => {
  try {
    const { userId, vaccine_id, center_id, phone_no } = req.body;

    if (!userId || !vaccine_id || !center_id)
      return res.status(400).json({
        message: "userId, vaccine_id, and center_id are required",
      });

    // 1 Validate user
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2 Validate vaccine center
    const center = await vaccineCenterCollection.findOne({ _id: center_id });
    if (!center)
      return res.status(404).json({ message: "Vaccine center not found" });

    // 3 Validate vaccine availability
    const vaccine = center.vaccine_stock.find(
      (v) => v.vaccine_id === vaccine_id
    );
    if (!vaccine)
      return res
        .status(404)
        .json({ message: "Vaccine not available in this center" });

    // 4 Check slot availability
    if (vaccine.slot_booked >= vaccine.slot)
      return res
        .status(400)
        .json({ message: "No available slots for this vaccine" });

    // 5 Determine appointment date
    const appointmentDate = new Date();
    appointmentDate.setDate(
      appointmentDate.getDate() + (vaccine.slot_booked % 5)
    );

    // 6 Generate registration number
    const registration_no = `REG-${Date.now()}`;

    // 7 Create new appointment object
    const newAppointment = {
      _id: registration_no,
      userId,
      vaccine_name: vaccine.vaccine_id,
      center_name: center.center_name,
      center_id,
      registration_no,
      date_of_registration: new Date(),
      appointment_date: appointmentDate,
      phone_no,
      status: "applied",
    };

    // 8 Save to DB
    await appointmentCollection.insertOne(newAppointment);

    // 9 Update booked slot count
    await vaccineCenterCollection.updateOne(
      { _id: center_id, "vaccine_stock.vaccine_id": vaccine_id },
      { $inc: { "vaccine_stock.$.slot_booked": 1 } }
    );

    res.status(201).json({
      message: "Appointment successfully created",
      appointment: newAppointment,
    });
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
