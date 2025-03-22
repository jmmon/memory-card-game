import { schema_userSettings as userSettings } from "./userSettings.schema";
import type { iSchema_userSettings } from "./userSettings.schema";

const schemas = {
  userSettings,
};

export default schemas;

export interface iSchemas {
  userSettings: iSchema_userSettings & { [key: string]: any };
}
