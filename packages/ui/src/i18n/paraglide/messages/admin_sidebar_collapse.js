/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Sidebar_CollapseInputs */



/**
* | output |
* | --- |
* | "Collapse sidebar" |
*
* @param {Admin_Sidebar_CollapseInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_sidebar_collapse = /** @type {((inputs?: Admin_Sidebar_CollapseInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Sidebar_CollapseInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zwiń pasek boczny")
	return /** @type {LocalizedString} */ ("Collapse sidebar")
});