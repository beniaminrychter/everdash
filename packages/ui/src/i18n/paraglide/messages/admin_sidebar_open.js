/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Sidebar_OpenInputs */



/**
* | output |
* | --- |
* | "Open sidebar" |
*
* @param {Admin_Sidebar_OpenInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_sidebar_open = /** @type {((inputs?: Admin_Sidebar_OpenInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Sidebar_OpenInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Otwórz pasek boczny")
	return /** @type {LocalizedString} */ ("Open sidebar")
});