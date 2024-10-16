# Puget Sound Creel Data API

This API provides endpoints to manage and query creel report data for Puget Sound anglers. It is built with **Node.js**, **Express**, **TypeScript**, and **Prisma** ORM to interface with a **PostgreSQL** database.

## Table of Contents

- [Puget Sound Creel Data API](#puget-sound-creel-data-api)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Setup](#setup)
  - [Environment Variables](#environment-variables)
  - [Available Routes](#available-routes)
  - [Error Handling](#error-handling)
  - [License](#license)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/ps-creel-api.git

   2. Navigate to the project directory:
   ```

`cd ps-creel-api`

    3. Install the dependencies:

`npm install`

## Setup

    1. Ensure you have PostgreSQL installed and running on your machine or a cloud instance.
    2. Set up the .env file with the necessary environment variables (see Environment Variables).
    3. Run Prisma migrations to set up the database schema:

`npx prisma migrate dev --name init
` 4. Start the development server:

`npm run dev
`

## Environment Variables

Create a .env file in the root directory with the following variables:

DATABASE_URL="postgresql://\<USER>:\<PASSWORD>@\<HOST>:\<PORT>/\<DATABASE>"
PORT=4000
CLIENT_URL="<http://localhost:3000>" # Adjust this based on your frontend app

Replace \<USER>, \<PASSWORD>, \<HOST>, \<PORT>, and \<DATABASE> with your PostgreSQL credentials.

## Available Routes

Get All Reports

    • URL: /reports
    • Method: GET
    • Description: Fetch all reports from the database.
    • Response: Returns an array of reports.

Example:

GET /reports

Add a Report

    • URL: /reports
    • Method: POST
    • Description: Add a new report to the database.
    • Body: JSON object containing report data.

Example:

POST /reports
{
"Sample_date": "Dec 31, 2023",
"Ramp_site": "Gig Harbor Ramp",
"catch_area_id": 1,
"Anglers": 4,
"Chinook": 0
}

Get Reports by Date Range

    • URL: /reports/date
    • Method: GET
    • Query Parameters:
    • startDate: The start of the date range (e.g., Dec 01, 2023).
    • endDate: The end of the date range (e.g., Dec 31, 2023).

Example:

GET /reports/date?startDate=Dec%201,%202023&endDate=Dec%2031,%202023

Get Reports by Catch Area

    • URL: /reports/catcharea/:catchAreaName
    • Method: GET
    • Description: Fetch all reports for a specific catch area.
    • URL Parameters:
    • catchAreaName: The name of the catch area (e.g., Area 13).

Example:

GET /reports/catcharea/Area%2013

Get Reports by Species

    • URL: /reports/species
    • Method: GET
    • Query Parameters:
    • species: The name of the species (e.g., Chinook).
    • minCount: Minimum number of fish caught (optional).

Example:

GET /reports/species?species=Chinook&minCount=1

Get Reports by Ramp/Site

    • URL: /reports/ramp/:rampName
    • Method: GET
    • Description: Fetch all reports for a specific ramp or site.
    • URL Parameters:
    • rampName: The name of the ramp or site (e.g., Gig Harbor Ramp).

Example:

GET /reports/ramp/Gig%20Harbor%20Ramp

Get Reports with High Angler Counts

    • URL: /reports/anglers
    • Method: GET
    • Query Parameters:
    • minAnglers: Minimum number of anglers (e.g., 3).

Example:

GET /reports/anglers?minAnglers=3

Get Aggregate Fish Data

    • URL: /reports/aggregate
    • Method: GET
    • Description: Fetch aggregate data for fish counts and averages.

Example:

GET /reports/aggregate

## Error Handling

Errors are returned in the following format:

{
"error": "Error message",
"message": "Detailed error description"
}

## License

This project is licensed under the MIT License.
