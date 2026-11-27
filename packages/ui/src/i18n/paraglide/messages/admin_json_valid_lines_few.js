/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Json_Valid_Lines_FewInputs */



/**
* | output |
* | --- |
* | "Valid JSON · {count} lines" |
*
* @param {Admin_Json_Valid_Lines_FewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_valid_lines_few = /** @type {((inputs: Admin_Json_Valid_Lines_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Valid_Lines_FewInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Poprawny JSON · ${i?.count} linie`)
	return /** @type {LocalizedString} */ (`Valid JSON · ${i?.count} lines`)
});