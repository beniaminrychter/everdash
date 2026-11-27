/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Delete_Badge_DescriptionInputs */



/**
* | output |
* | --- |
* | "The badge is removed from the dashboard draft. Discard restores it until you save." |
*
* @param {Admin_Delete_Badge_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_delete_badge_description = /** @type {((inputs?: Admin_Delete_Badge_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Delete_Badge_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Plakietka zostanie usunięta z wersji roboczej pulpitu. Przycisk Odrzuć przywróci ją do czasu zapisania.")
	return /** @type {LocalizedString} */ ("The badge is removed from the dashboard draft. Discard restores it until you save.")
});