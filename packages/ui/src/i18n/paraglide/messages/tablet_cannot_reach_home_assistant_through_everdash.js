/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Cannot_Reach_Home_Assistant_Through_EverdashInputs */



/**
* | output |
* | --- |
* | "Cannot reach Home Assistant through EverDash." |
*
* @param {Tablet_Cannot_Reach_Home_Assistant_Through_EverdashInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_cannot_reach_home_assistant_through_everdash = /** @type {((inputs?: Tablet_Cannot_Reach_Home_Assistant_Through_EverdashInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Cannot_Reach_Home_Assistant_Through_EverdashInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie można połączyć się z Home Assistant przez EverDash.")
	return /** @type {LocalizedString} */ ("Cannot reach Home Assistant through EverDash.")
});