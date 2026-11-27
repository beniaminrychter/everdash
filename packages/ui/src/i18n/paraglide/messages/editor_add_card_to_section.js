/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ section: NonNullable<unknown> }} Editor_Add_Card_To_SectionInputs */



/**
* | output |
* | --- |
* | "Add card to {section}" |
*
* @param {Editor_Add_Card_To_SectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_add_card_to_section = /** @type {((inputs: Editor_Add_Card_To_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Add_Card_To_SectionInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Dodaj kartę do sekcji ${i?.section}`)
	return /** @type {LocalizedString} */ (`Add card to ${i?.section}`)
});