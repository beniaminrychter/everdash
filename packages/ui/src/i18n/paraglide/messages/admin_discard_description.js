/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Discard_DescriptionInputs */



/**
* | output |
* | --- |
* | "This restores the last saved dashboard and removes every unsaved edit." |
*
* @param {Admin_Discard_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_discard_description = /** @type {((inputs?: Admin_Discard_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Discard_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Spowoduje to przywrócenie ostatnio zapisanego pulpitu i usunięcie wszystkich niezapisanych zmian.")
	return /** @type {LocalizedString} */ ("This restores the last saved dashboard and removes every unsaved edit.")
});