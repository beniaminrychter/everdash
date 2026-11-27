/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ kind: NonNullable<unknown> }} Admin_Inspector_Card_EyebrowInputs */



/**
* | output |
* | --- |
* | "{kind} card" |
*
* @param {Admin_Inspector_Card_EyebrowInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_card_eyebrow = /** @type {((inputs: Admin_Inspector_Card_EyebrowInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Card_EyebrowInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Karta: ${i?.kind}`)
	return /** @type {LocalizedString} */ (`${i?.kind} card`)
});