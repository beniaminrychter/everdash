/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Fix_Fields_PreviewInputs */



/**
* | output |
* | --- |
* | "Fix the highlighted fields to see a preview." |
*
* @param {Admin_Editor_Fix_Fields_PreviewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_fix_fields_preview = /** @type {((inputs?: Admin_Editor_Fix_Fields_PreviewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Fix_Fields_PreviewInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Popraw zaznaczone pola, aby zobaczyć podgląd.")
	return /** @type {LocalizedString} */ ("Fix the highlighted fields to see a preview.")
});