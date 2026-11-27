/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Thunderstorms_And_RainInputs */



/**
* | output |
* | --- |
* | "Thunderstorms and rain" |
*
* @param {Tablet_Thunderstorms_And_RainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_thunderstorms_and_rain = /** @type {((inputs?: Tablet_Thunderstorms_And_RainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Thunderstorms_And_RainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Burze z deszczem")
	return /** @type {LocalizedString} */ ("Thunderstorms and rain")
});