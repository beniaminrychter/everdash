/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_More_Actions_For_SectionInputs */



/**
* | output |
* | --- |
* | "More actions for section {name}" |
*
* @param {Editor_More_Actions_For_SectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_more_actions_for_section = /** @type {((inputs: Editor_More_Actions_For_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_More_Actions_For_SectionInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Więcej działań dla sekcji ${i?.name}`)
	return /** @type {LocalizedString} */ (`More actions for section ${i?.name}`)
});