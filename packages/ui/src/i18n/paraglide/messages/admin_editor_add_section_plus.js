/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Add_Section_PlusInputs */



/**
* | output |
* | --- |
* | "+ Section" |
*
* @param {Admin_Editor_Add_Section_PlusInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_add_section_plus = /** @type {((inputs?: Admin_Editor_Add_Section_PlusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Add_Section_PlusInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("+ Sekcja")
	return /** @type {LocalizedString} */ ("+ Section")
});