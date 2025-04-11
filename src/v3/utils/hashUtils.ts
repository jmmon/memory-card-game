import { isServer } from "@builder.io/qwik";
import CryptoJS from "crypto-js";

const DEFAULT_HASH_LENGTH_BYTES = 32;
export const getRandomBytesBrowser = (bytes = DEFAULT_HASH_LENGTH_BYTES) => {
  const array = new Uint8Array(bytes);
  window.crypto.getRandomValues(array);
  return bufferToHexString(array);
};

export const getRandomBytes = (bytes = DEFAULT_HASH_LENGTH_BYTES) => {
  return CryptoJS.lib.WordArray.random(bytes).toString(
    CryptoJS.enc.Hex,
  ) as string;
};

export const stringToHash = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = hash < 0 ? hash * -1 : hash;

  return hash;
};

export const numberToString = (number: number) => {
  let numberAsStr = String(number);
  let result = "";
  while (numberAsStr.length > 1) {
    const thisChar = String.fromCharCode(Number(numberAsStr.slice(-2)));
    numberAsStr = numberAsStr.slice(0, -2);
    result += thisChar;
  }
  return result;
};

export function bufferToHexString(buffer: ArrayBuffer) {
  const byteArray = new Uint8Array(buffer);

  const hexCodes = [...byteArray].map((value) =>
    value.toString(16).padStart(2, "0"),
  );

  return hexCodes.join("");
}

export function hashText(message: string): Promise<ArrayBuffer> {
  if (isServer) {
    return CryptoJS.sha256(message);
    // return createHash("sha256").update(message).digest();
  }

  return window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(message),
  );
}

export async function getHexHashString(userInput: string) {
  const hash = bufferToHexString(await hashText(userInput));
  return hash;
}

export function hexCharToBase(hex: string, base: number) {
  const OLD_BASE = 16;
  return parseInt(hex, OLD_BASE)
    .toString(base)
    .padStart(OLD_BASE / base, "0");
}
