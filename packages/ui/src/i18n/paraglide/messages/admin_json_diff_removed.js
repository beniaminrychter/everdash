/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Json_Diff_RemovedInputs */



/**
* | output |
* | --- |
* | "-{count} removed" |
*
* @param {Admin_Json_Diff_RemovedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_diff_removed = /** @type {((inputs: Admin_Json_Diff_RemovedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Diff_RemovedInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`-${i?.count} usunięto`)
	return /** @type {LocalizedString} */ (`-${i?.count} removed`)
});