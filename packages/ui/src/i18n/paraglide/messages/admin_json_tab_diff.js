/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Tab_DiffInputs */



/**
* | output |
* | --- |
* | "Diff" |
*
* @param {Admin_Json_Tab_DiffInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_tab_diff = /** @type {((inputs?: Admin_Json_Tab_DiffInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Tab_DiffInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Różnice")
	return /** @type {LocalizedString} */ ("Diff")
});