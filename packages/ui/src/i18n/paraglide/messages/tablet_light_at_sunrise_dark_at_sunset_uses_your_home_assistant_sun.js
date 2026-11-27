/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Light_At_Sunrise_Dark_At_Sunset_Uses_Your_Home_Assistant_SunInputs */



/**
* | output |
* | --- |
* | "Light at sunrise. Dark at sunset. Uses your Home Assistant sun state." |
*
* @param {Tablet_Light_At_Sunrise_Dark_At_Sunset_Uses_Your_Home_Assistant_SunInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_light_at_sunrise_dark_at_sunset_uses_your_home_assistant_sun = /** @type {((inputs?: Tablet_Light_At_Sunrise_Dark_At_Sunset_Uses_Your_Home_Assistant_SunInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Light_At_Sunrise_Dark_At_Sunset_Uses_Your_Home_Assistant_SunInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Jasny od wschodu, ciemny od zachodu słońca. Według danych Home Assistant.")
	return /** @type {LocalizedString} */ ("Light at sunrise. Dark at sunset. Uses your Home Assistant sun state.")
});