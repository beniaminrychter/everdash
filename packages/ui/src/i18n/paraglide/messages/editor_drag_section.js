/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_Drag_SectionInputs */



/**
* | output |
* | --- |
* | "Drag section {name}" |
*
* @param {Editor_Drag_SectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_drag_section = /** @type {((inputs: Editor_Drag_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Drag_SectionInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Przeciągnij sekcję ${i?.name}`)
	return /** @type {LocalizedString} */ (`Drag section ${i?.name}`)
});