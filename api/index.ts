// Import Dotenv
require("dotenv").config();

// Import Express
import express, { Request, Response, NextFunction } from "express";

// Import CORS
const cors = require("cors");

// Import our routes
import {
  getAllReports,
  addReport,
  getReportsByDate,
  getReportsByCatchArea,
  getReportsBySpecies,
  getReportsByRamp,
  getReportsByAnglers,
  getAggregateFishData,
  checkReportExists,
  getRampByName,
  getCatchAreaByName
} from "./routes/reports";

// @ts-ignore
BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

// create an express application
const app = express();

// define a port
const PORT = process.env.PORT;

// Define our Middleware
// Use CORS Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Use JSON middleware to parse request bodies
app.use(express.json());

// Define our Routes
// Home Route
app.get("/", (request: Request, response: Response, next: NextFunction) => {
  response.json({ message: "welcome to our server" });
});

// Route to get all reports
app.get("/reports", getAllReports);

// Route to add a report
app.post("/reports", addReport);

// Route to get reports by date range
app.get("/reports/date", getReportsByDate);

// Route to get reports by catch area
app.get("/reports/catcharea/:catchAreaName", getReportsByCatchArea);

// Route to get reports by species with a minimum count
app.get("/reports/species", getReportsBySpecies);

// Route to get reports by ramp/site
app.get("/reports/ramp/:rampName", getReportsByRamp);

// Route to get reports by minimum number of anglers
app.get("/reports/anglers", getReportsByAnglers);

// Route to get aggregate fish data
app.get("/reports/aggregate", getAggregateFishData);

app.post("/reports", addReport);

app.get("/reports/exists", checkReportExists);

app.get("/ramps/:rampName", getRampByName);

app.get("/catchareas/:catchAreaName", getCatchAreaByName);
// Error Handling
// Generic Error Handling
app.use(
  (error: Error, request: Request, response: Response, next: NextFunction) => {
    console.error(error.stack);
    response.status(500).json({
      error: "Something broke!",
      errorStack: error.stack,
      errorMessage: error.message,
    });
  }
);

// 404 Resource not found Error Handling
app.use((request: Request, response: Response, next: NextFunction) => {
  response.status(404).json({
    error:
      "Resource not found. Are you sure you're looking in the right place?",
  });
});

// make the server listen on our port
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});

// export our app for testing
module.exports = app;
