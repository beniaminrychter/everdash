/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Applied_ToastInputs */



/**
* | output |
* | --- |
* | "Validated JSON applied" |
*
* @param {Admin_Json_Applied_ToastInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_applied_toast = /** @type {((inputs?: Admin_Json_Applied_ToastInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Applied_ToastInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zastosowano zweryfikowany JSON")
	return /** @type {LocalizedString} */ ("Validated JSON applied")
});