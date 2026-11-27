/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Chance_Of_PrecipitationInputs */



/**
* | output |
* | --- |
* | "Chance of precipitation" |
*
* @param {Tablet_Chance_Of_PrecipitationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_chance_of_precipitation = /** @type {((inputs?: Tablet_Chance_Of_PrecipitationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Chance_Of_PrecipitationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Szansa opadów")
	return /** @type {LocalizedString} */ ("Chance of precipitation")
});