/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Previous_Loaded_DescriptionInputs */



/**
* | output |
* | --- |
* | "Save to restore it." |
*
* @param {Admin_Previous_Loaded_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_previous_loaded_description = /** @type {((inputs?: Admin_Previous_Loaded_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Previous_Loaded_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zapisz, aby go przywrócić.")
	return /** @type {LocalizedString} */ ("Save to restore it.")
});