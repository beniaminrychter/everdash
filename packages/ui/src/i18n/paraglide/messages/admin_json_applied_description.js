/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Applied_DescriptionInputs */



/**
* | output |
* | --- |
* | "Save to publish these changes." |
*
* @param {Admin_Json_Applied_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_applied_description = /** @type {((inputs?: Admin_Json_Applied_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Applied_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zapisz, aby opublikować te zmiany.")
	return /** @type {LocalizedString} */ ("Save to publish these changes.")
});