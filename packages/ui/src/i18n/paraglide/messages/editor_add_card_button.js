/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Add_Card_ButtonInputs */



/**
* | output |
* | --- |
* | "+ Card" |
*
* @param {Editor_Add_Card_ButtonInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_add_card_button = /** @type {((inputs?: Editor_Add_Card_ButtonInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Add_Card_ButtonInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("+ Karta")
	return /** @type {LocalizedString} */ ("+ Card")
});