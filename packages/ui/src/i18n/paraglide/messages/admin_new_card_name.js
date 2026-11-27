/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ kind: NonNullable<unknown> }} Admin_New_Card_NameInputs */



/**
* | output |
* | --- |
* | "New {kind}" |
*
* @param {Admin_New_Card_NameInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_new_card_name = /** @type {((inputs: Admin_New_Card_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_New_Card_NameInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Nowa karta: ${i?.kind}`)
	return /** @type {LocalizedString} */ (`New ${i?.kind}`)
});