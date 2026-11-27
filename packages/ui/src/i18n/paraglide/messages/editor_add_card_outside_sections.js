/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Add_Card_Outside_SectionsInputs */



/**
* | output |
* | --- |
* | "Add card outside sections" |
*
* @param {Editor_Add_Card_Outside_SectionsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_add_card_outside_sections = /** @type {((inputs?: Editor_Add_Card_Outside_SectionsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Add_Card_Outside_SectionsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dodaj kartę poza sekcjami")
	return /** @type {LocalizedString} */ ("Add card outside sections")
});