/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Preview_ZoomInputs */



/**
* | output |
* | --- |
* | "Preview zoom" |
*
* @param {Admin_Editor_Preview_ZoomInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_preview_zoom = /** @type {((inputs?: Admin_Editor_Preview_ZoomInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Preview_ZoomInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Powiększenie podglądu")
	return /** @type {LocalizedString} */ ("Preview zoom")
});