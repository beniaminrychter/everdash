/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Lowest_TodayInputs */



/**
* | output |
* | --- |
* | "Lowest today" |
*
* @param {Tablet_Lowest_TodayInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_lowest_today = /** @type {((inputs?: Tablet_Lowest_TodayInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Lowest_TodayInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Najniższa dzisiaj")
	return /** @type {LocalizedString} */ ("Lowest today")
});