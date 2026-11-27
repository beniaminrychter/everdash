/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Rows_HintInputs */



/**
* | output |
* | --- |
* | "How many rows of tiles the card is tall." |
*
* @param {Admin_Inspector_Rows_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_rows_hint = /** @type {((inputs?: Admin_Inspector_Rows_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Rows_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wysokość karty wyrażona w liczbie wierszy kafelków.")
	return /** @type {LocalizedString} */ ("How many rows of tiles the card is tall.")
});