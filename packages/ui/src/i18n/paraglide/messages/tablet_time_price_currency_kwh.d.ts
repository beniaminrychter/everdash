/**
* | output |
* | --- |
* | "{time}: {price} {currency}/kWh" |
*
*/
export const tablet_time_price_currency_kwh: ((inputs: Tablet_Time_Price_Currency_KwhInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Time_Price_Currency_KwhInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Time_Price_Currency_KwhInputs = { time: NonNullable<unknown>, price: NonNullable<unknown>, currency: NonNullable<unknown> };
