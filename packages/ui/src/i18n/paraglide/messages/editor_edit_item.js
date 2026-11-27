/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_Edit_ItemInputs */



/**
* | output |
* | --- |
* | "Edit {name}" |
*
* @param {Editor_Edit_ItemInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_edit_item = /** @type {((inputs: Editor_Edit_ItemInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Edit_ItemInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Edytuj ${i?.name}`)
	return /** @type {LocalizedString} */ (`Edit ${i?.name}`)
});