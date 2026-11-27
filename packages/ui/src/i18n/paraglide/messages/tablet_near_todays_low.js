/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Near_Todays_LowInputs */



/**
* | output |
* | --- |
* | "Near today’s low" |
*
* @param {Tablet_Near_Todays_LowInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_near_todays_low = /** @type {((inputs?: Tablet_Near_Todays_LowInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Near_Todays_LowInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Blisko dzisiejszego minimum")
	return /** @type {LocalizedString} */ ("Near today’s low")
});