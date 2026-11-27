/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Preview_ViewportInputs */



/**
* | output |
* | --- |
* | "Preview viewport" |
*
* @param {Admin_Editor_Preview_ViewportInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_preview_viewport = /** @type {((inputs?: Admin_Editor_Preview_ViewportInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Preview_ViewportInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Rozmiar podglądu")
	return /** @type {LocalizedString} */ ("Preview viewport")
});