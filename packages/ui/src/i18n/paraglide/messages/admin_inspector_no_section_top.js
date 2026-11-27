/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_No_Section_TopInputs */



/**
* | output |
* | --- |
* | "No section (top of the view)" |
*
* @param {Admin_Inspector_No_Section_TopInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_no_section_top = /** @type {((inputs?: Admin_Inspector_No_Section_TopInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_No_Section_TopInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Bez sekcji (góra widoku)")
	return /** @type {LocalizedString} */ ("No section (top of the view)")
});