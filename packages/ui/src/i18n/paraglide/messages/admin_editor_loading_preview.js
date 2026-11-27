/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Loading_PreviewInputs */



/**
* | output |
* | --- |
* | "Loading preview" |
*
* @param {Admin_Editor_Loading_PreviewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_loading_preview = /** @type {((inputs?: Admin_Editor_Loading_PreviewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Loading_PreviewInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wczytywanie podglądu")
	return /** @type {LocalizedString} */ ("Loading preview")
});