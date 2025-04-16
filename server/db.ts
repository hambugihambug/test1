import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

export const connection = mysql.createPool({
    host: "203.231.146.220",
    port: 3306,
    user: "202506_cu",
    password: "202506_cu",
    database: "202506_cu",
});

export const db = drizzle(connection, { schema, mode: "default" });
