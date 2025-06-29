function amountToCents(amount) {
  return Math.round(amount * 100);
}

function validateAmount(amount) {
  if (typeof amount !== "number") return false;

  return amount >= 100;
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

function resizeOrganizationDonations(
  organizationDonations,
  multiplier,
  expectedTotal
) {
  const resizedOrganizationDonations = organizationDonations.map(
    (organizationDonation) => {
      const amount = Math.round(organizationDonation.amount * multiplier);
      return { ...organizationDonation, amount };
    }
  );

  const resizedTotal = resizedOrganizationDonations.reduce(
    (prev, cur) => prev + cur.amount,
    0
  );

  if (resizedTotal !== expectedTotal) {
    const discrepancy = expectedTotal - resizedTotal;
    const timesToAdd = Math.abs(discrepancy);
    const adder = discrepancy / timesToAdd;

    for (let i = 0; i < timesToAdd; i++) {
      const index = resizedOrganizationDonations.length - 1 - i;
      resizedOrganizationDonations[index].amount += adder;
    }
  }

  return resizedOrganizationDonations;
}

module.exports = {
  amountToCents,
  validateAmount,
  validateIdCode,
  validateEmail,
  resizeOrganizationDonations,
};
