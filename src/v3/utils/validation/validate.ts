export const validate = (obj: object, schema: any) => {
  try {
    schema.parse(obj);
    return true;
  } catch(err) {
    console.log({err});
    return false;
  }
}
