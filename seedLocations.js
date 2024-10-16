const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY; // Make sure to set your API key in .env

// Fetch the coordinates for a given ramp name
const getCoordinates = async (rampName) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        rampName
      )}&key=${googleMapsApiKey}`
    );

    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      console.log(`No results found for ${rampName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching coordinates for ${rampName}:`, error);
    return null;
  }
};

// Update the ramp in the database with the fetched latitude and longitude
const updateRampLocation = async (rampId, coordinates) => {
  await prisma.ramps.update({
    where: { id: rampId },
    data: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
  });
  console.log(
    `Updated ramp ${rampId} with coordinates: ${coordinates.latitude}, ${coordinates.longitude}`
  );
};

// Main function to loop through all ramps without coordinates and update them
const updateAllRampsWithCoordinates = async () => {
  const ramps = await prisma.ramps.findMany({
    where: {
      latitude: null,
      longitude: null,
    },
  });

  for (const ramp of ramps) {
    const coordinates = await getCoordinates(ramp.name);
    if (coordinates) {
      await updateRampLocation(ramp.id, coordinates);
    }
  }

  console.log("All ramps have been updated with coordinates.");
};

updateAllRampsWithCoordinates()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
