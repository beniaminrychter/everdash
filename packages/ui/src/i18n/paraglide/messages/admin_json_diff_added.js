/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Json_Diff_AddedInputs */



/**
* | output |
* | --- |
* | "+{count} added" |
*
* @param {Admin_Json_Diff_AddedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_diff_added = /** @type {((inputs: Admin_Json_Diff_AddedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Diff_AddedInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`+${i?.count} dodano`)
	return /** @type {LocalizedString} */ (`+${i?.count} added`)
});