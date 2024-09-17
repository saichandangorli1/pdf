// src/utils/encryption.js
import CryptoJS from "crypto-js";

// Generate a random key (128-bit, 256-bit, etc.)
const key = CryptoJS.lib.WordArray.random(256 / 8); // 256-bit key
console.log(key.toString(CryptoJS.enc.Hex)); // Output the key in hex format
const secretKey = `${key}`; // Use a strong key and store it securely

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
