/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_All_Changes_SavedInputs */



/**
* | output |
* | --- |
* | "All changes saved" |
*
* @param {Admin_All_Changes_SavedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_all_changes_saved = /** @type {((inputs?: Admin_All_Changes_SavedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_All_Changes_SavedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wszystkie zmiany zapisane")
	return /** @type {LocalizedString} */ ("All changes saved")
});