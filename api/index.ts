// Import Dotenv
require("dotenv").config();

// Import Express
import express, { Request, Response, NextFunction } from "express";

// Import CORS
const cors = require("cors");

// Import our routes


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
