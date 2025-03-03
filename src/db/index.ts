import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dbConfig from "./dbConfig";

const pool = new Pool(dbConfig);

export const db = drizzle(pool);
