/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ time: NonNullable<unknown>, price: NonNullable<unknown>, currency: NonNullable<unknown> }} Tablet_Time_Price_Currency_KwhInputs */



/**
* | output |
* | --- |
* | "{time}: {price} {currency}/kWh" |
*
* @param {Tablet_Time_Price_Currency_KwhInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_time_price_currency_kwh = /** @type {((inputs: Tablet_Time_Price_Currency_KwhInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Time_Price_Currency_KwhInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.time}: ${i?.price} ${i?.currency}/kWh`)
	return /** @type {LocalizedString} */ (`${i?.time}: ${i?.price} ${i?.currency}/kWh`)
});