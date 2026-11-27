/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_View_Delete_DescriptionInputs */



/**
* | output |
* | --- |
* | "The view and its cards and badges are removed from the dashboard draft. Discard restores them until you save." |
*
* @param {Admin_View_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_view_delete_description = /** @type {((inputs?: Admin_View_Delete_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_View_Delete_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Widok wraz z jego kartami i plakietkami zostanie usunięty z wersji roboczej pulpitu. Przycisk Odrzuć przywróci go do czasu zapisania.")
	return /** @type {LocalizedString} */ ("The view and its cards and badges are removed from the dashboard draft. Discard restores them until you save.")
});