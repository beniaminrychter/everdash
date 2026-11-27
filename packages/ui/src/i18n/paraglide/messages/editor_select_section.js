/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_Select_SectionInputs */



/**
* | output |
* | --- |
* | "Select section {name}" |
*
* @param {Editor_Select_SectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_select_section = /** @type {((inputs: Editor_Select_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Select_SectionInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Wybierz sekcję ${i?.name}`)
	return /** @type {LocalizedString} */ (`Select section ${i?.name}`)
});