/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Unsaved_Change_OneInputs */



/**
* | output |
* | --- |
* | "{count} unsaved change" |
*
* @param {Admin_Unsaved_Change_OneInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_unsaved_change_one = /** @type {((inputs: Admin_Unsaved_Change_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Unsaved_Change_OneInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.count} niezapisana zmiana`)
	return /** @type {LocalizedString} */ (`${i?.count} unsaved change`)
});