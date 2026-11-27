/**
* | output |
* | --- |
* | "Lowest upcoming · {price} {currency}/kWh · {time}" |
*
*/
export const tablet_lowest_upcoming_price_currency_kwh_time: ((inputs: Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs = { price: NonNullable<unknown>, currency: NonNullable<unknown>, time: NonNullable<unknown> };
