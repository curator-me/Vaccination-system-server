// routers/vaccine.js
import express from "express";
import { verifyToken } from "../middleware.js";

const router = express.Router();

let vaccineCollection;

// Function to set the collection from server.js or main file
export const setVaccineCollection = ({ vaccineCollection: lc }) => {
  vaccineCollection = lc;
};
router.get("/vaccine",verifyToken, async (req, res) => {
  try {
    const vaccines = await vaccineCollection.find({}).toArray();
    res.json(vaccines);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching vaccines");
  } finally {
  }
});

router.get("/vaccine/:_id",verifyToken, async (req, res) => {
  try {
    const _id = req.params._id;
    const vaccine = await vaccineCollection.findOne({ _id: _id });
    if (!vaccine) return res.status(404).json({ message: "Vaccine not found" });
    res.json(vaccine);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router ;
