import { runEtl } from "./run";
import { prisma } from "../prismaClient/prisma";

export const handler = async () => {
  try {
    await runEtl();
    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("Lambda ETL failed", err);
    return { statusCode: 500, body: "error" };
  } finally {
    await prisma.$disconnect();
  }
};
