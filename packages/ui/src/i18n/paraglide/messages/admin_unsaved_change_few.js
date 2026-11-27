/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Unsaved_Change_FewInputs */



/**
* | output |
* | --- |
* | "{count} unsaved changes" |
*
* @param {Admin_Unsaved_Change_FewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_unsaved_change_few = /** @type {((inputs: Admin_Unsaved_Change_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Unsaved_Change_FewInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.count} niezapisane zmiany`)
	return /** @type {LocalizedString} */ (`${i?.count} unsaved changes`)
});