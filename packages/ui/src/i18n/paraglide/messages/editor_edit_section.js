/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Edit_SectionInputs */



/**
* | output |
* | --- |
* | "Edit section" |
*
* @param {Editor_Edit_SectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_edit_section = /** @type {((inputs?: Editor_Edit_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Edit_SectionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Edytuj sekcję")
	return /** @type {LocalizedString} */ ("Edit section")
});