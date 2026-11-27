/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Enter_ValidInputs */



/**
* | output |
* | --- |
* | "Enter valid JSON." |
*
* @param {Admin_Json_Enter_ValidInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_enter_valid = /** @type {((inputs?: Admin_Json_Enter_ValidInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Enter_ValidInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wpisz poprawny JSON.")
	return /** @type {LocalizedString} */ ("Enter valid JSON.")
});