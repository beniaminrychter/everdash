/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_PreviewInputs */



/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Admin_Editor_PreviewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_preview = /** @type {((inputs?: Admin_Editor_PreviewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_PreviewInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Podgląd")
	return /** @type {LocalizedString} */ ("Preview")
});