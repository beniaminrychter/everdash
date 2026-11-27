/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_Data_Is_UnavailableInputs */



/**
* | output |
* | --- |
* | "Home Assistant data is unavailable." |
*
* @param {Tablet_Home_Assistant_Data_Is_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_data_is_unavailable = /** @type {((inputs?: Tablet_Home_Assistant_Data_Is_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Data_Is_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dane Home Assistant są niedostępne.")
	return /** @type {LocalizedString} */ ("Home Assistant data is unavailable.")
});