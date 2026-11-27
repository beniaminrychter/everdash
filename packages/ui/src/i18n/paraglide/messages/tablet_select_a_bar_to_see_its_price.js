/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Select_A_Bar_To_See_Its_PriceInputs */



/**
* | output |
* | --- |
* | "Select a bar to see its price." |
*
* @param {Tablet_Select_A_Bar_To_See_Its_PriceInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_select_a_bar_to_see_its_price = /** @type {((inputs?: Tablet_Select_A_Bar_To_See_Its_PriceInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Select_A_Bar_To_See_Its_PriceInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dotknij słupka, aby zobaczyć cenę.")
	return /** @type {LocalizedString} */ ("Select a bar to see its price.")
});