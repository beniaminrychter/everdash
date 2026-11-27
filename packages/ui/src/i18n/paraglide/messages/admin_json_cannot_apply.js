/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Cannot_ApplyInputs */



/**
* | output |
* | --- |
* | "The JSON can not be applied" |
*
* @param {Admin_Json_Cannot_ApplyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_cannot_apply = /** @type {((inputs?: Admin_Json_Cannot_ApplyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Cannot_ApplyInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie można zastosować pliku JSON")
	return /** @type {LocalizedString} */ ("The JSON can not be applied")
});