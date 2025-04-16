import { AnyColumn, asc, desc } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { SortColumnWithDirection } from "~/v3/types/types";

const deUnderscore = <T extends SQLiteTable>(columnWithUnderscores: string) => {
  const parts = columnWithUnderscores.split("_");
  let total = parts[0];
  if (parts.length === 1) return total as keyof T;

  for (let i = 1; i < parts.length; i++) {
    total += parts[i][0].toUpperCase() + parts[i].slice(1);
  }
  return total as keyof T;
};

export const buildOrderBy = <T extends SQLiteTable>(
  sortByColumnHistory: Array<SortColumnWithDirection>,
  table: T,
) => {
  const list = [];
  for (const { column, direction } of sortByColumnHistory) {
    const tableColumn = table[deUnderscore<T>(column)] as AnyColumn;
    if (direction === "asc") {
      list.push(asc(tableColumn));
    } else {
      list.push(desc(tableColumn));
    }
  }
  return list;
};
