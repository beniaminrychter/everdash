/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_No_Cards_In_This_View_YetInputs */



/**
* | output |
* | --- |
* | "No cards in this view yet" |
*
* @param {Tablet_No_Cards_In_This_View_YetInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_no_cards_in_this_view_yet = /** @type {((inputs?: Tablet_No_Cards_In_This_View_YetInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_No_Cards_In_This_View_YetInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ten widok nie ma jeszcze kart")
	return /** @type {LocalizedString} */ ("No cards in this view yet")
});