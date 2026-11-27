/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_Select_ItemInputs */



/**
* | output |
* | --- |
* | "Select {name}" |
*
* @param {Editor_Select_ItemInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_select_item = /** @type {((inputs: Editor_Select_ItemInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Select_ItemInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Wybierz ${i?.name}`)
	return /** @type {LocalizedString} */ (`Select ${i?.name}`)
});