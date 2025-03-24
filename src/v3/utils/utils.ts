import type {
  iEntriesStrings,
  iNestedObj,
  iObj,
  iUserSettings,
} from "~/v3/types/types";
import { USER_SETTINGS } from "../services/gameContext.service/initialState";

const toType = (value: string) => {
  switch (true) {
    case value === "true":
      return true;
    case value === "false":
      return false;
    case !isNaN(Number(value)):
      return Number(value);
    default:
      return value;
  }
};

export function toString(value: number | boolean | string) {
  switch (true) {
    case value === true:
      return "true";
    case value === false:
      return "false";
    case typeof value === "number":
      return String(value);
    case typeof value === "string":
      return value;
    default:
      return value;
  }
}

export const typeEntryValues = (entries: iEntriesStrings) =>
  Object.fromEntries(entries.map(([key, val]) => [key, toType(val)]));

export const flattenObjectToEntries = (
  obj: iUserSettings,
  prefix: string = "",
) => {
  const initialEntries = Object.entries(obj);
  let result: [string, string][] = [];
  if (prefix !== "") {
    prefix += "_";
  }

  for (const [key, value] of initialEntries as [string, any][]) {
    const prefixedKey = prefix + key;

    if (typeof value === "object") {
      // recurse if value is object
      const nested = result.concat(flattenObjectToEntries(value, prefixedKey));
      result = nested;
    } else {
      const stringValue = toString(value);
      result.push([prefixedKey, stringValue]);
    }
  }
  return result.sort(([k1], [k2]) => k1.localeCompare(k2));
};

// console.log("flattened:", flattenObjectToEntries(USER_SETTINGS));

export const unflattenObject = (obj: iObj) => {
  const unflattened: iNestedObj = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.includes("_")) {
      // value is an object, recurse
      const split = key.split("_");
      const parentKey = split[0];
      const remainingUnderscoreKeys = split.slice(1).join("_");

      // if (unflattened[parentKey] === undefined) {
      if (typeof unflattened[parentKey] === "undefined") {
        // do not have a value for firstKey, need to set up an object for it
        unflattened[parentKey] = { [remainingUnderscoreKeys]: value };
      } else {
        // already have a value for firstKey
        const unflattenedValue = unflattenObject({
          [remainingUnderscoreKeys]: value,
        });
        unflattened[parentKey] = {
          ...(unflattened[parentKey] as object),
          ...unflattenedValue,
        };
      }
    } else {
      // non-object values
      unflattened[key] = value;
    }
  }
  return unflattened;
};

// console.log(
//   "unflattened:",
//   unflattenObject(typeEntryValues(flattenObjectToEntries(USER_SETTINGS))),
// );

const DEFAULT_FLAT_SETTINGS = flattenObjectToEntries(USER_SETTINGS);

export const pruneDefaultsFromSettings = (newSettings: iUserSettings) => {
  const newFlatSettings = flattenObjectToEntries(newSettings);

  const result: string[] = [];

  for (let i = 0; i < newFlatSettings.length; i++) {
    const [newEntryKey, newEntryValue] = newFlatSettings[i];
    const [initialEntryKey, initialEntryValue] = DEFAULT_FLAT_SETTINGS[i];

    if (
      newEntryKey === initialEntryKey &&
      newEntryValue !== initialEntryValue
    ) {
      result.push(`${newEntryKey}=${newEntryValue}`);
    }
  }

  if (result.length === 0) return "";
  return "?" + result.join("&");
};
