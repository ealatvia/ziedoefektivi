/**
 * Format a number to a valid Latvian number string.
 * @param {number} number - The number to format.
 * @return {string} - A formatted number string.
 * @example
 * formatAmount(1234.56); // "1 234,56"
 * formatAmount(1234); // "1 234"
 * formatAmount(1234.5); // "1 234,5"
 */
function formatAmount(number) {
  const withCents = formatAmountWithCents(number);
  return withCents.replace(/,00$/, "");
}

function formatAmountWithCents(number) {
  const asString = String(number);
  const [integerPart, decimalPart] = asString.split(".");
  const integerWithSpaces = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimal = decimalPart ? "," + decimalPart.padEnd(2, "0") : ",00";

  const estonianAmount = integerWithSpaces + decimal;
  return estonianAmount;
}

module.exports = {
  formatAmount: formatAmount,
  formatAmountWithCents: formatAmountWithCents,
};
