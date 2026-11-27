/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Show_Price_ChartInputs */



/**
* | output |
* | --- |
* | "Show price chart" |
*
* @param {Tablet_Show_Price_ChartInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_show_price_chart = /** @type {((inputs?: Tablet_Show_Price_ChartInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Show_Price_ChartInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pokaż wykres cen")
	return /** @type {LocalizedString} */ ("Show price chart")
});