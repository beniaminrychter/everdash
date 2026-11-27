/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Dashboard_SavedInputs */



/**
* | output |
* | --- |
* | "Dashboard saved" |
*
* @param {Admin_Dashboard_SavedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_dashboard_saved = /** @type {((inputs?: Admin_Dashboard_SavedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Dashboard_SavedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zapisano pulpit")
	return /** @type {LocalizedString} */ ("Dashboard saved")
});