/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ kind: NonNullable<unknown> }} Admin_Inspector_New_Card_EyebrowInputs */



/**
* | output |
* | --- |
* | "New {kind} card" |
*
* @param {Admin_Inspector_New_Card_EyebrowInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_new_card_eyebrow = /** @type {((inputs: Admin_Inspector_New_Card_EyebrowInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_New_Card_EyebrowInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Nowa karta: ${i?.kind}`)
	return /** @type {LocalizedString} */ (`New ${i?.kind} card`)
});