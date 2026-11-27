/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Drag_To_ReorderInputs */



/**
* | output |
* | --- |
* | "Drag to reorder" |
*
* @param {Editor_Drag_To_ReorderInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_drag_to_reorder = /** @type {((inputs?: Editor_Drag_To_ReorderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Drag_To_ReorderInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przeciągnij, aby zmienić kolejność")
	return /** @type {LocalizedString} */ ("Drag to reorder")
});