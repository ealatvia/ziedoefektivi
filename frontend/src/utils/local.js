/**
 * Validate a Latvian ID code according to the Law on the Register of Natural Persons at
 * https://likumi.lv/ta/id/296185#p6.
 * @param {string} idCode - A Latvian ID code, e.g. "345678-90123".
 * @return {boolean} - Whether the idCode is valid or not.
 */
export function validateIdCode(idCode) {
  return /^[0-3]\d{5}-\d{5}$/.test(idCode);
}

/**
 * Format a number to a valid Latvian number string.
 * @param {number} number - The number to format.
 * @return {string} - A formatted number string.
 * @example
 * formatAmount(1234.56); // "1 234,56"
 * formatAmount(1234); // "1 234"
 * formatAmount(1234.5); // "1 234,5"
 */
export function formatAmount(number) {
  const withCents = formatAmountWithCents(number);
  return withCents.replace(/,00$/, "");
}

export function formatAmountWithCents(number) {
  const asString = String(number);
  const [integerPart, decimalPart] = asString.split(".");
  const integerWithSpaces = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimal = decimalPart ? "," + decimalPart.padEnd(2, "0") : ",00";

  const amount = integerWithSpaces + decimal;
  return amount;
}
