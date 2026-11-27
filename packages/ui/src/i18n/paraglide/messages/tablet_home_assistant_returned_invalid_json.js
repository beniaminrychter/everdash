/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_Returned_Invalid_JsonInputs */



/**
* | output |
* | --- |
* | "Home Assistant returned invalid JSON." |
*
* @param {Tablet_Home_Assistant_Returned_Invalid_JsonInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_returned_invalid_json = /** @type {((inputs?: Tablet_Home_Assistant_Returned_Invalid_JsonInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Returned_Invalid_JsonInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Home Assistant zwrócił nieprawidłowe dane JSON.")
	return /** @type {LocalizedString} */ ("Home Assistant returned invalid JSON.")
});