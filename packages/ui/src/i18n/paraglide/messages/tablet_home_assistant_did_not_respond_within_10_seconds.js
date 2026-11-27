/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_Did_Not_Respond_Within_10_SecondsInputs */



/**
* | output |
* | --- |
* | "Home Assistant did not respond within 10 seconds." |
*
* @param {Tablet_Home_Assistant_Did_Not_Respond_Within_10_SecondsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_did_not_respond_within_10_seconds = /** @type {((inputs?: Tablet_Home_Assistant_Did_Not_Respond_Within_10_SecondsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Did_Not_Respond_Within_10_SecondsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Home Assistant nie odpowiedział w ciągu 10 sekund.")
	return /** @type {LocalizedString} */ ("Home Assistant did not respond within 10 seconds.")
});