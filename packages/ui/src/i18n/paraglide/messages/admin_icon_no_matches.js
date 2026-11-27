/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ query: NonNullable<unknown> }} Admin_Icon_No_MatchesInputs */



/**
* | output |
* | --- |
* | "No icons match “{query}”." |
*
* @param {Admin_Icon_No_MatchesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_no_matches = /** @type {((inputs: Admin_Icon_No_MatchesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_No_MatchesInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Brak ikon pasujących do „${i?.query}”.`)
	return /** @type {LocalizedString} */ (`No icons match “${i?.query}”.`)
});