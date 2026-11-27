/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Sidebar_ExpandInputs */



/**
* | output |
* | --- |
* | "Expand sidebar" |
*
* @param {Admin_Sidebar_ExpandInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_sidebar_expand = /** @type {((inputs?: Admin_Sidebar_ExpandInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Sidebar_ExpandInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Rozwiń pasek boczny")
	return /** @type {LocalizedString} */ ("Expand sidebar")
});