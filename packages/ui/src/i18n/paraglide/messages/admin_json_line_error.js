/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ line: NonNullable<unknown>, message: NonNullable<unknown> }} Admin_Json_Line_ErrorInputs */



/**
* | output |
* | --- |
* | "Line {line}: {message}" |
*
* @param {Admin_Json_Line_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_line_error = /** @type {((inputs: Admin_Json_Line_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Line_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Linia ${i?.line}: ${i?.message}`)
	return /** @type {LocalizedString} */ (`Line ${i?.line}: ${i?.message}`)
});