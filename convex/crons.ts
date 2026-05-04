import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval("ingest markets every 5 minutes", { minutes: 5 }, api.ingest.run, {});

export default crons;
