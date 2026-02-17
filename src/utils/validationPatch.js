import { DateTime } from "luxon";

export function validateCustomerPatch(row) {
  const errors = [];
  const parsed = {};
 
  if (row.full_name !== undefined) {
    const full_name = row.full_name?.trim();

    if (!full_name) {
      errors.push("full_name is required.");
    } else {
      parsed.full_name = full_name;
    }
  }

  if (row.email !== undefined) {
    const email = row.email?.trim().toLowerCase();

    if (!email) {
      errors.push("email is required.");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push("email is invalid.");
    } else {
      parsed.email = email;
    }
  }
 
  if (row.date_of_birth !== undefined) {
    const date_of_birth = row.date_of_birth?.trim();

    if (!date_of_birth) {
      errors.push("date_of_birth is required.");
    } else {
      const dob = DateTime.fromISO(date_of_birth);

      if (!dob.isValid) {
        errors.push("date_of_birth is invalid format.");
      } else if (dob > DateTime.now()) {
        errors.push("date_of_birth must be in the past.");
      } else {
        parsed.date_of_birth = dob.toJSDate();
      }
    }
  }
 
  if (row.timezone !== undefined) {
    const timezone = row.timezone?.trim();

    if (!timezone) {
      errors.push("timezone is required.");
    } else if (!DateTime.local().setZone(timezone).isValid) {
      errors.push("timezone is invalid.");
    } else {
      parsed.timezone = timezone;
    }
  }

  if (Object.keys(parsed).length === 0) {
    errors.push("No valid fields provided for update.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsedData: parsed,
  };
}
