/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Count_Badges_FewInputs */



/**
* | output |
* | --- |
* | "{count} badges" |
*
* @param {Admin_Count_Badges_FewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_count_badges_few = /** @type {((inputs: Admin_Count_Badges_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Count_Badges_FewInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.count} plakietki`)
	return /** @type {LocalizedString} */ (`${i?.count} badges`)
});