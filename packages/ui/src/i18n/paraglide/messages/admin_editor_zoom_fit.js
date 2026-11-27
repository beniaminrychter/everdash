/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Zoom_FitInputs */



/**
* | output |
* | --- |
* | "Fit" |
*
* @param {Admin_Editor_Zoom_FitInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_zoom_fit = /** @type {((inputs?: Admin_Editor_Zoom_FitInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Zoom_FitInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dopasuj")
	return /** @type {LocalizedString} */ ("Fit")
});