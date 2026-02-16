import { DateTime } from "luxon";

export function validateCustomerRow(row) {
    const errors = [];

    const full_name = row.full_name?.trim();
    const email = row.email?.trim().toLowerCase();
    const date_of_birth = row.date_of_birth?.trim();
    const timezone = row.timezone?.trim();

    // Full name
    if (!full_name) {
        errors.push("full_name is required.");
    }

    // Email
    if (!email) {
        errors.push("email is required.");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.push("email is invalid.");
    }

    // Date of birth
    const dob = DateTime.fromISO(date_of_birth);
    if (!date_of_birth) {
        errors.push("date_of_birth is required.");
    } else if (!dob.isValid) {
        errors.push("date_of_birth is invalid format.");
    } else if (dob > DateTime.now()) {
        errors.push("date_of_birth must be in the past.");
    }

    // Timezone
    if (!timezone) {
        errors.push("timezone is required.");
    } else if (!DateTime.local().setZone(timezone).isValid) {
        errors.push("timezone is invalid.");
    }

    return {
        isValid: errors.length === 0,
        errors,
        parsedRow: {
            full_name,
            email,
            date_of_birth: dob.toJSDate(),
            timezone,
        },
    };
}

