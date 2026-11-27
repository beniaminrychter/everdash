/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Size_HintInputs */



/**
* | output |
* | --- |
* | "Share of the row the card takes." |
*
* @param {Admin_Inspector_Size_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_size_hint = /** @type {((inputs?: Admin_Inspector_Size_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Size_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Część wiersza zajmowana przez kartę.")
	return /** @type {LocalizedString} */ ("Share of the row the card takes.")
});