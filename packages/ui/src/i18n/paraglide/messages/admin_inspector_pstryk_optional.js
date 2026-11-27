/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Pstryk_OptionalInputs */



/**
* | output |
* | --- |
* | "Optional Pstryk sources" |
*
* @param {Admin_Inspector_Pstryk_OptionalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_pstryk_optional = /** @type {((inputs?: Admin_Inspector_Pstryk_OptionalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Pstryk_OptionalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Opcjonalne źródła Pstryk")
	return /** @type {LocalizedString} */ ("Optional Pstryk sources")
});