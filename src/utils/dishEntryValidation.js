// Shared validation rules for dish entries.
// Used by the CreateDishEntry form (create + edit modes) and re-checked in
// services/diary.js so invalid values can never reach the database.

export const PRICE_MIN = 0;
export const PRICE_MAX = 100000;
export const PRICE_MAX_DECIMALS = 2;

// Strips characters a type="number" input still allows through
// (scientific notation, signs) and collapses duplicate decimal points.
export function sanitizePriceInput(rawValue) {
    if (rawValue === null || rawValue === undefined) return "";

    let cleaned = String(rawValue).replace(/[^0-9.]/g, "");

    const firstDot = cleaned.indexOf(".");

    if (firstDot !== -1) {
        const whole = cleaned.slice(0, firstDot);
        const decimals = cleaned.slice(firstDot + 1).replace(/\./g, "");
        cleaned = `${whole}.${decimals.slice(0, PRICE_MAX_DECIMALS)}`;
    }

    return cleaned;
}

// Returns an error message, or "" when the value is acceptable.
// Price is optional, so an empty value is valid.
export function validatePrice(value) {
    if (value === "" || value === null || value === undefined) {
        return "";
    }

    const trimmed = String(value).trim();

    if (trimmed === "") return "";

    // allow a leading sign here so that negatives fall through to the range
    // check below and get the clearer "cannot be negative" message
    if (!/^[+-]?\d*\.?\d*$/.test(trimmed) || !/\d/.test(trimmed)) {
        return "Price must be a number.";
    }

    const numericPrice = Number(trimmed);

    if (!Number.isFinite(numericPrice)) {
        return "Price must be a number.";
    }

    if (numericPrice < PRICE_MIN) {
        return "Price cannot be negative.";
    }

    if (numericPrice > PRICE_MAX) {
        return `Price cannot be more than ${PRICE_MAX.toLocaleString()}.`;
    }

    const decimals = trimmed.split(".")[1];

    if (decimals && decimals.length > PRICE_MAX_DECIMALS) {
        return `Price can have at most ${PRICE_MAX_DECIMALS} decimal places.`;
    }

    return "";
}

// Local end-of-today, so a date picked "today" in the user's timezone passes.
export function getEndOfToday() {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return endOfToday;
}

// Date visited is optional, so an empty value is valid.
export function validateDateTried(value) {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Please pick a valid date.";
    }

    if (date.getTime() > getEndOfToday().getTime()) {
        return "Date visited cannot be in the future.";
    }

    return "";
}

// Validates the whole form. Returns per-field messages plus the first error
// so the caller can show inline messages and a summary banner together.
export function validateDishEntry({
    selectedRestaurant,
    dishName,
    rating,
    price,
    dateTried,
}) {
    const fieldErrors = {};

    if (!selectedRestaurant) {
        fieldErrors.restaurant = "Please select a restaurant.";
    }

    if (!String(dishName || "").trim()) {
        fieldErrors.dishName = "Please enter a dish name.";
    }

    if (!rating || Number(rating) === 0) {
        fieldErrors.rating = "Please select a rating.";
    }

    const dateError = validateDateTried(dateTried);
    if (dateError) {
        fieldErrors.dateTried = dateError;
    }

    const priceError = validatePrice(price);
    if (priceError) {
        fieldErrors.price = priceError;
    }

    // Ordered to match the visual order of the form.
    const orderedKeys = ["restaurant", "dateTried", "dishName", "rating", "price"];
    const firstErrorKey = orderedKeys.find((key) => fieldErrors[key]);

    return {
        fieldErrors,
        firstError: firstErrorKey ? fieldErrors[firstErrorKey] : "",
        isValid: firstErrorKey === undefined,
    };
}
