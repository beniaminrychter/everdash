/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_No_Cards_In_SectionInputs */



/**
* | output |
* | --- |
* | "No cards in this section yet. Add one or drag one here." |
*
* @param {Editor_No_Cards_In_SectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_no_cards_in_section = /** @type {((inputs?: Editor_No_Cards_In_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_No_Cards_In_SectionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("W tej sekcji nie ma jeszcze kart. Dodaj nową lub przeciągnij ją tutaj.")
	return /** @type {LocalizedString} */ ("No cards in this section yet. Add one or drag one here.")
});