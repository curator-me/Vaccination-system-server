// cron/vaccineStockCron.js
import cron from "node-cron";

export const startVaccineStockCron = ( vaccineCenterCollection, handleSupplyRequest) => {
  cron.schedule("0 23 * * *", async () => {
    console.log("Running daily vaccine stock check...");

    try {
      const centers = await vaccineCenterCollection.find({}).toArray();

      for (const center of centers) {
        const { center_name, remaining_stock } = center;

        if (remaining_stock <= 50) {
          console.log(`Low stock: ${center_name} (${remaining_stock} left)`);
          await handleSupplyRequest(center);
        }
      }

      console.log("Vaccine stock check completed.");
    } catch (err) {
      console.error("Stock check failed:", err);
    }
  });
};
