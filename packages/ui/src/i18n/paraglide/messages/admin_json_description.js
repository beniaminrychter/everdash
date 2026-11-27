/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_DescriptionInputs */



/**
* | output |
* | --- |
* | "Apply JSON to update the draft." |
*
* @param {Admin_Json_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_description = /** @type {((inputs?: Admin_Json_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zastosuj JSON, aby zaktualizować wersję roboczą.")
	return /** @type {LocalizedString} */ ("Apply JSON to update the draft.")
});