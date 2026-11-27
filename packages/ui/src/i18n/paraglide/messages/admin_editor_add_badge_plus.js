/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Add_Badge_PlusInputs */



/**
* | output |
* | --- |
* | "+ Badge" |
*
* @param {Admin_Editor_Add_Badge_PlusInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_add_badge_plus = /** @type {((inputs?: Admin_Editor_Add_Badge_PlusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Add_Badge_PlusInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("+ Plakietka")
	return /** @type {LocalizedString} */ ("+ Badge")
});