/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Zoom_Fit_To_ScreenInputs */



/**
* | output |
* | --- |
* | "Fit to screen" |
*
* @param {Admin_Editor_Zoom_Fit_To_ScreenInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_zoom_fit_to_screen = /** @type {((inputs?: Admin_Editor_Zoom_Fit_To_ScreenInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Zoom_Fit_To_ScreenInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dopasuj do ekranu")
	return /** @type {LocalizedString} */ ("Fit to screen")
});