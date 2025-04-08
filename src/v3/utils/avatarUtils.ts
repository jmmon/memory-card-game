const stringToHash = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = hash < 0 ? hash * -1 : hash;

  return hash;
};

const numberToString = (number: number) => {
  let numberAsStr = String(number);
  let result = '';
  while (numberAsStr.length > 1) {
    const thisChar = String.fromCharCode(Number(numberAsStr.slice(-2)))
    numberAsStr = numberAsStr.slice(0, -2);
    result += thisChar;
  }
  return result;
}

export const stringToColor = (
  string: string,
  saturation = { min: 20, max: 80 },
  lightness = { min: 30, max: 80 }
) => {
  // max unique colors: 360 * (saturation.max - saturation.min) * (lightness.max - lightness.min)
  // 360 * 80 * 60 = 1_728_000

  const hash = stringToHash(string);
  const satHash = stringToHash(numberToString(hash));
  const lightHash = stringToHash(numberToString(satHash + hash));

  const satPercent = satHash % 100;
  const lightPercent = lightHash % 100;

  const hue = hash % 360;
  const sat = Math.round(
    saturation.min +
    (Number(satPercent) * (saturation.max - saturation.min)) / 100
  );
  const light = Math.round(
    lightness.min +
    (Number(lightPercent) * (lightness.max - lightness.min)) / 100
  );

  // console.log({ satPercent, lightPercent, hue, sat, light });

  return `hsla(${hue}, ${sat}%, ${light}%, 1)`;
};
