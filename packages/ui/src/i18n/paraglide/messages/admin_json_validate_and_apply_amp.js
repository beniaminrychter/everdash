/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Validate_And_Apply_AmpInputs */



/**
* | output |
* | --- |
* | "Validate & apply" |
*
* @param {Admin_Json_Validate_And_Apply_AmpInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_validate_and_apply_amp = /** @type {((inputs?: Admin_Json_Validate_And_Apply_AmpInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Validate_And_Apply_AmpInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Sprawdź i zastosuj")
	return /** @type {LocalizedString} */ ("Validate & apply")
});