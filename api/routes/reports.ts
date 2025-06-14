import { prisma } from "../../lib/prisma"; // adjust path as needed
import { Request, Response, NextFunction } from "express";

// Get all reports with optional limit and sorted by sample_date_parsed
export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req?.query?.limit as string) || 10; // Default limit to 10 if not provided
    const reports = await prisma.report.findMany({
      take: limit,
      orderBy: {
        sample_date_parsed: "desc", // Sort by the new parsed date column
      },
      include: {
        catcharea: true,
        ramps: true,
      },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};
// Add a report
export const addReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    Sample_date,
    Ramp_site,
    catch_area_id,
    Interviews__Boat_or_Shore_,
    Anglers,
    Chinook__per_angler_,
    Chinook,
    Coho,
    Chum,
    Pink,
    Sockeye,
    Lingcod,
    Halibut,
    Catch_area,
    ramp_id,
  } = req.body;

  try {
    const newReport = await prisma.report.create({
      data: {
        Sample_date,
        Ramp_site,
        catch_area_id,
        Interviews__Boat_or_Shore_,
        Anglers,
        Chinook__per_angler_,
        Chinook,
        Coho,
        Chum,
        Pink,
        Sockeye,
        Lingcod,
        Halibut,
        Catch_area,
        ramp_id,
      },
    });
    res.json(newReport);
  } catch (error) {
    next(error);
  }
};

// Get reports by date range
export const getReportsByDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { startDate, endDate } = req.query;

  try {
    const reports = await prisma.$queryRaw`
      SELECT * FROM reports
      WHERE TO_DATE("Sample date", 'Mon DD, YYYY') 
      BETWEEN TO_DATE(${startDate}, 'YYYY-MM-DD') 
      AND TO_DATE(${endDate}, 'YYYY-MM-DD')
    `;

    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get reports by catch area
export const getReportsByCatchArea = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { catchAreaName } = req.params;

  try {
    const reports = await prisma.report.findMany({
      where: {
        catcharea: {
          name: catchAreaName, // Match the catch area name from the related table
        },
      },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get reports by species with a minimum count
export const getReportsBySpecies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | Response<any>> => {
  const { species, minCount } = req.query;

  try {
    const speciesColumn = species?.toString() || "";
    if (!speciesColumn) {
      return res.status(400).json({ error: "Species is required" });
    }

    const reports = await prisma.report.findMany({
      where: {
        [speciesColumn]: {
          gte: parseInt(minCount as string) || 1, // Ensure the minimum count is applied
        },
      },
    });

    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get reports by ramp or site
export const getReportsByRamp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { rampName } = req.params;

  try {
    const reports = await prisma.report.findMany({
      where: {
        ramps: {
          name: rampName, // Match the ramp name from the related table
        },
      },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get reports with high angler counts
export const getReportsByAnglers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { minAnglers } = req.query;

  try {
    const reports = await prisma.report.findMany({
      where: {
        Anglers: {
          gte: parseInt(minAnglers as string) || 1, // Ensure we handle undefined properly
        },
      },
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get aggregate fish data
export const getAggregateFishData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const aggregateData = await prisma.report.aggregate({
      _sum: {
        Chinook: true,
        Coho: true,
        Chum: true,
        Pink: true,
        Sockeye: true,
        Lingcod: true,
        Halibut: true,
      },
      _avg: {
        Chinook__per_angler_: true, // Correct column name for per angler
      },
    });
    res.json(aggregateData);
  } catch (error) {
    next(error);
  }
};
