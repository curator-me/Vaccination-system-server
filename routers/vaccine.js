// routers/vaccine.js
import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

let vaccineCollection;

export const setVaccineCollection = ({ vaccineCollection: lc }) => {
  vaccineCollection = lc;
};

router.get("/vaccine", async (req, res) => {
  try {
    const vaccines = await vaccineCollection.find({}).toArray();
    res.json(vaccines);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching vaccines");
  } finally {
  }
});

router.get("/vaccine/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const vaccine = await vaccineCollection.findOne({ _id: _id });

    if (!vaccine) return res.status(404).json({ message: "Vaccine not found" });
    res.json(vaccine);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export { router };
