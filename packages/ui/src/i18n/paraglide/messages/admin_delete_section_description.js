/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Delete_Section_DescriptionInputs */



/**
* | output |
* | --- |
* | "The section is removed from the dashboard draft. Discard restores it until you save." |
*
* @param {Admin_Delete_Section_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_delete_section_description = /** @type {((inputs?: Admin_Delete_Section_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Delete_Section_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Sekcja zostanie usunięta z wersji roboczej pulpitu. Przycisk Odrzuć przywróci ją do czasu zapisania.")
	return /** @type {LocalizedString} */ ("The section is removed from the dashboard draft. Discard restores it until you save.")
});