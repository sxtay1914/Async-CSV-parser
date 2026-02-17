import { validateCustomerRow } from "../utils/validation.js";
import { validateCustomerPatch } from "../utils/validationPatch.js";

describe("validateCustomerRow", () => {
    // test on all valid cases
    it("should validate a correct customer row", () => {
        const row = {
        full_name: "John Doe",
        email: "johndoe@example.com",
        date_of_birth: "1990-01-01",
        timezone: "America/New_York",
        };
        const result = validateCustomerRow(row);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    // test on missing required fields
    it("should return errors for missing required fields", () => {
        const row = {
        full_name: "",
        email: "",
        date_of_birth: "",
        timezone: "",
        };
        const result = validateCustomerRow(row);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("full_name is required.");
        expect(result.errors).toContain("email is required.");
        expect(result.errors).toContain("date_of_birth is required.");
        expect(result.errors).toContain("timezone is required.");
    });

    // test on invalid email format, invalid date format, and invalid timezone
    it("should return errors for invalid email, date, and timezone", () => {
        const row = {
        full_name: "Jane Doe",
        email: "invalid-email",
        date_of_birth: "invalid-date",
        timezone: "invalid-timezone",
        };
        const result = validateCustomerRow(row);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("email is invalid.");
        expect(result.errors).toContain("date_of_birth is invalid format.");
        expect(result.errors).toContain("timezone is invalid.");
    });

    // test on date of birth in the future
    it("should return error for date of birth in the future", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const row = {
        full_name: "Future Person",
        email: "futureperson@example.com",
        date_of_birth: futureDate.toISOString().split("T")[0],
        timezone: "America/New_York",
        };
        const result = validateCustomerRow(row);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("date_of_birth must be in the past.");
    });
});


describe("validateCustomerPatch", () => {
    // test on all valid cases
    it("should validate a correct customer patch", () => {
        const row = {
        full_name: "John Doe",
        email: "johndoe@example.com",
        date_of_birth: "1990-01-01",
        timezone: "America/New_York",
        };
        const result = validateCustomerPatch(row);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    //test on invalid email format, invalid date format, and invalid timezone
    it("should return errors for invalid email, date, and timezone", () => {
        const row = {
        full_name: "Jane Doe",
        email: "invalid-email",
        date_of_birth: "invalid-date",
        timezone: "invalid-timezone",
        };
        const result = validateCustomerPatch(row);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("email is invalid.");
        expect(result.errors).toContain("date_of_birth is invalid format.");
        expect(result.errors).toContain("timezone is invalid.");
    });

    // should pass on missing fields since it's a patch
    it("should validate when some fields are missing", () => {
        const row = {
        email: "john@example.com",
        };
        const result = validateCustomerPatch(row);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    // test on empty string for fields
    it("should return errors for empty string fields", () => {
        const row = {
        full_name: "",
        email: "",
        date_of_birth: "",
        timezone: "",
        };
        const result = validateCustomerPatch(row);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("full_name is required.");
        expect(result.errors).toContain("email is required.");
        expect(result.errors).toContain("date_of_birth is required.");
        expect(result.errors).toContain("timezone is required.");
    });

    // test on date of birth in the future
    it("should return error for date of birth in the future", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const row = {
        date_of_birth: futureDate.toISOString().split("T")[0],
        };
        const result = validateCustomerPatch(row);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("date_of_birth must be in the past.");
    });
});