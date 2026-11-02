import type {
  NodePgDatabase,
  NodePgTransaction,
} from "drizzle-orm/node-postgres";
import type { relations } from "@/db/relations";

export type Database = NodePgDatabase<typeof relations>;
export type DatabaseTransaction = NodePgTransaction<typeof relations>;
