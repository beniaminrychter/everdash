/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_Edit_Section_NameInputs */



/**
* | output |
* | --- |
* | "Edit section {name}" |
*
* @param {Editor_Edit_Section_NameInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_edit_section_name = /** @type {((inputs: Editor_Edit_Section_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Edit_Section_NameInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Edytuj sekcję ${i?.name}`)
	return /** @type {LocalizedString} */ (`Edit section ${i?.name}`)
});