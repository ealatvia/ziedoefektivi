function amountToCents(amount) {
  return Math.round(amount * 100);
}

function validateAmount(amount) {
  if (typeof amount !== "number") return false;

  return amountToCents(amount) >= 100;
}

/**
 * Validate a Latvian ID code according to the Law on the Register of Natural Persons at
 * https://likumi.lv/ta/id/296185#p6.
 * @param {string} idCode - A Latvian ID code, e.g. "345678-90123".
 * @return {boolean} - Whether the idCode is valid or not.
 */
function validateIdCode(idCode) {
  return /^[0-3]\d{5}-\d{5}$/.test(idCode);
}

/**
 * Validate an email string.
 * @param {string} string - The string to validate.
 * @return {boolean} - Whether the string is a valid email.
 */
function validateEmail(string) {
  const emailRegex = new RegExp(
    /^(([^<>()\[\]\\.,;:\s@"]+(.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/
  );
  return emailRegex.test(string);
}

function amountsFromProportions(proportions, totalAmount) {
  const amountsAndProportions = {};

  for (let [_, cause] of Object.entries(proportions)) {
    for (let [orgId, org] of Object.entries(cause.proportions)) {
      const proportion = (cause.proportion * org.proportion) / 10000;
      const amount = Math.round(totalAmount * proportion);
      amountsAndProportions[orgId] = { amount, proportion };
    }
  }

  const total = Object.values(amountsAndProportions)
    .map((value) => value.amount)
    .reduce((a, b) => a + b, 0);
  if (total !== totalAmount) {
    const discrepancy = Math.round(totalAmount - total);
    const timesToAdd = Math.abs(discrepancy);
    const adder = discrepancy / timesToAdd;

    const keys = Object.keys(amountsAndProportions);
    for (let i = 0; i < timesToAdd; i++) {
      const key = keys.at(-(i % keys.length) - 1);
      amountsAndProportions[key].amount = Math.round(
        amountsAndProportions[key].amount + adder
      );
    }
  }

  return amountsAndProportions;
}

module.exports = {
  amountToCents,
  validateAmount,
  validateIdCode,
  validateEmail,
  amountsFromProportions,
};
