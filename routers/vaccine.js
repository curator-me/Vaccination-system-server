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

export { router };
