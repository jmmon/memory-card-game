import { z } from "zod";

export const validate = (obj: object, schema: z.ZodSchema) => {
  try {
    schema.parse(obj);
    return { isValid: true };
  } catch (err: any) {
    console.log({ err });
    if (err instanceof z.ZodError) {
      return { isValid: false, errors: err.issues };
    }
    return { isValid: false, errors: ["Unknown error"] };
  }
};

export const createValidator = (schema: z.ZodSchema) => (obj: object) => {
  try {
    schema.parse(obj);
    return { isValid: true };
  } catch (err: any) {
    console.log({ err });
    if (err instanceof z.ZodError) {
      return { isValid: false, errors: err.issues };
    }
    return { isValid: false, errors: ["Unknown error"] };
  }
};
