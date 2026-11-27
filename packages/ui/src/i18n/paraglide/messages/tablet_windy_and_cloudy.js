/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Windy_And_CloudyInputs */



/**
* | output |
* | --- |
* | "Windy and cloudy" |
*
* @param {Tablet_Windy_And_CloudyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_windy_and_cloudy = /** @type {((inputs?: Tablet_Windy_And_CloudyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Windy_And_CloudyInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wietrznie i pochmurnie")
	return /** @type {LocalizedString} */ ("Windy and cloudy")
});