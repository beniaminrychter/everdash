/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Json_Valid_Lines_OneInputs */



/**
* | output |
* | --- |
* | "Valid JSON · {count} line" |
*
* @param {Admin_Json_Valid_Lines_OneInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_valid_lines_one = /** @type {((inputs: Admin_Json_Valid_Lines_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Valid_Lines_OneInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Poprawny JSON · ${i?.count} linia`)
	return /** @type {LocalizedString} */ (`Valid JSON · ${i?.count} line`)
});