// routers/vaccine.js
import express from "express";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middleware.js";

const router = express.Router();

let vaccineCollection;

// Function to set the collection from server.js or main file
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
    console.log("Searching for vaccine with ID:", _id);

    const vaccines = await vaccineCollection.find({}).toArray();
    console.log("Total vaccines in database:", vaccines.length);

    // Find the vaccine that matches the _id
    const vaccine = vaccines.find(
      (v) =>
        v._id.toString() === _id ||
        v.id === _id ||
        v._id.toString() === _id.toString()
    );
    console.log("Found vaccine:", vaccine);

    if (!vaccine) {
      return res.status(404).json({
        message: "Vaccine not found",
        searchedId: _id,
        availableIds: vaccines.map((v) => ({ id: v.id, _id: v._id })),
      });
    }

    res.json(vaccine);
  } catch (err) {
    console.error("Error fetching vaccine:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
export default router;
