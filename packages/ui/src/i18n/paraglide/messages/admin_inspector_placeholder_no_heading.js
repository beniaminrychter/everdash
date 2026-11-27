/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Placeholder_No_HeadingInputs */



/**
* | output |
* | --- |
* | "No heading" |
*
* @param {Admin_Inspector_Placeholder_No_HeadingInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_placeholder_no_heading = /** @type {((inputs?: Admin_Inspector_Placeholder_No_HeadingInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Placeholder_No_HeadingInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Bez nagłówka")
	return /** @type {LocalizedString} */ ("No heading")
});