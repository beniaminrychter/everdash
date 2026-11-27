/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ price: NonNullable<unknown>, currency: NonNullable<unknown>, time: NonNullable<unknown> }} Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs */



/**
* | output |
* | --- |
* | "Lowest upcoming · {price} {currency}/kWh · {time}" |
*
* @param {Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_lowest_upcoming_price_currency_kwh_time = /** @type {((inputs: Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Lowest_Upcoming_Price_Currency_Kwh_TimeInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Najniższa nadchodząca · ${i?.price} ${i?.currency}/kWh · ${i?.time}`)
	return /** @type {LocalizedString} */ (`Lowest upcoming · ${i?.price} ${i?.currency}/kWh · ${i?.time}`)
});