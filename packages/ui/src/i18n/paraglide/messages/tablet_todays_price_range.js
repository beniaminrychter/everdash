/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Todays_Price_RangeInputs */



/**
* | output |
* | --- |
* | "Today's price range" |
*
* @param {Tablet_Todays_Price_RangeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_todays_price_range = /** @type {((inputs?: Tablet_Todays_Price_RangeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Todays_Price_RangeInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dzisiejszy zakres cen")
	return /** @type {LocalizedString} */ ("Today's price range")
});