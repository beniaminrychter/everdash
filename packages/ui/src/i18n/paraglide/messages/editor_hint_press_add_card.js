/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Hint_Press_Add_CardInputs */



/**
* | output |
* | --- |
* | "Press Add card to finish" |
*
* @param {Editor_Hint_Press_Add_CardInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_hint_press_add_card = /** @type {((inputs?: Editor_Hint_Press_Add_CardInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Hint_Press_Add_CardInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Kliknij Dodaj kartę, aby zakończyć")
	return /** @type {LocalizedString} */ ("Press Add card to finish")
});