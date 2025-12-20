const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const axios = require("axios").default;
const { parse, isValid, format } = require("date-fns");

const results = [];
const API_BASE = "http://localhost:4000";

fs.createReadStream(path.join(__dirname, "./wdfw_creel_data(19).csv"))
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", async () => {
    for (const row of results) {
      try {
        // Try parsing "Sample date" using known format
        const rawDate = row["Sample date"];
        const parsedDate = parse(rawDate.trim(), "MMM d, yyyy", new Date());
        if (!isValid(parsedDate)) {
          console.warn(`⚠️ Invalid date: "${rawDate}"`);
          continue;
        }

        const formattedDate = format(parsedDate, "yyyy-MM-dd");

        const rampName = row["Ramp/site"];
        const catchAreaName = row["Catch area"];

        let ramp_id = null;
        let catch_area_id = null;

        // Lookup ramp_id
        try {
          const rampRes = await axios.get(
            `${API_BASE}/ramps/${encodeURIComponent(rampName)}`
          );
          ramp_id = rampRes.data?.id;
        } catch {
          console.warn(`⚠️ Ramp not found: "${rampName}"`);
          continue;
        }

        // Lookup catch_area_id
        try {
          const areaRes = await axios.get(
            `${API_BASE}/catchareas/${encodeURIComponent(catchAreaName)}`
          );
          catch_area_id = areaRes.data?.id;
        } catch {
          console.warn(`⚠️ Catch area not found: "${catchAreaName}"`);
          continue;
        }

        // Check if report already exists
        const existsRes = await axios.get(
          `${API_BASE}/reports/exists?sampleDateParsed=${formattedDate}&rampId=${ramp_id}&catchAreaId=${catch_area_id}`
        );

        if (existsRes.data.exists) {
          console.log(
            `⏭️  Skipped duplicate: ${rampName} / ${catchAreaName} on ${formattedDate}`
          );
          continue;
        }

        // Submit report
        await axios.post(`${API_BASE}/reports`, {
          Sample_date: rawDate,
          sample_date_parsed: formattedDate,
          Ramp_site: rampName,
          Catch_area: catchAreaName,
          Interviews__Boat_or_Shore_: parseInt(
            row["# Interviews (Boat or Shore)"]
          ),
          Anglers: parseInt(row.Anglers),
          Chinook__per_angler_: parseFloat(row["Chinook (per angler)"]),
          Chinook: parseInt(row.Chinook),
          Coho: parseInt(row.Coho),
          Chum: parseInt(row.Chum),
          Pink: parseInt(row.Pink),
          Sockeye: parseInt(row.Sockeye),
          Lingcod: parseInt(row.Lingcod),
          Halibut: parseInt(row.Halibut),
          catch_area_id,
          ramp_id,
        });

        console.log(
          `✅ Imported: ${rampName} / ${catchAreaName} on ${formattedDate}`
        );
      } catch (err) {
        console.error("❌ Error importing row:", err.message);
      }
    }
  });
