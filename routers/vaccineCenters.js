// routers/vaccineCenters.js
import express from "express";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middleware.js";

const router = express.Router();

let vaccineCenterCollection;

export const setVaccineCenterCollection = ({
  vaccineCenterCollection: lc,
}) => {
  vaccineCenterCollection = lc;
};

// GET all vaccine centers
router.get("/vaccine-centers",verifyToken, async (req, res) => {
  try {
    const centers = await vaccineCenterCollection.find({}).toArray();
    res.json(centers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch vaccine centers" });
  }
});

// GET a vaccine center by _id
router.get("/vaccine-center:_id",verifyToken, async (req, res) => {
  try {
    const { _id } = req.params;
    const center = await vaccineCenterCollection.findOne({ _id: new ObjectId(_id) });

    if (!ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    if (!center) {
      return res.status(404).json({ message: "Vaccine center not found" });
    }

    res.json(center);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch the vaccine center" });
  }
});



export default router;
