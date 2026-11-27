/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Weather_UnavailableInputs */



/**
* | output |
* | --- |
* | "Weather unavailable" |
*
* @param {Tablet_Weather_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_weather_unavailable = /** @type {((inputs?: Tablet_Weather_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Weather_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pogoda niedostępna")
	return /** @type {LocalizedString} */ ("Weather unavailable")
});