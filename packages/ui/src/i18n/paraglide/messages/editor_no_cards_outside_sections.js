/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_No_Cards_Outside_SectionsInputs */



/**
* | output |
* | --- |
* | "No cards outside sections. Drag one here." |
*
* @param {Editor_No_Cards_Outside_SectionsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_no_cards_outside_sections = /** @type {((inputs?: Editor_No_Cards_Outside_SectionsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_No_Cards_Outside_SectionsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak kart poza sekcjami. Przeciągnij kartę tutaj.")
	return /** @type {LocalizedString} */ ("No cards outside sections. Drag one here.")
});