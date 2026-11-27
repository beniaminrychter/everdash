/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Partly_CloudyInputs */



/**
* | output |
* | --- |
* | "Partly cloudy" |
*
* @param {Tablet_Partly_CloudyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_partly_cloudy = /** @type {((inputs?: Tablet_Partly_CloudyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Partly_CloudyInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Częściowe zachmurzenie")
	return /** @type {LocalizedString} */ ("Partly cloudy")
});