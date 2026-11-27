/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Unfinished_CardInputs */



/**
* | output |
* | --- |
* | "Finish or remove the new card before saving." |
*
* @param {Admin_Unfinished_CardInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_unfinished_card = /** @type {((inputs?: Admin_Unfinished_CardInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Unfinished_CardInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dokończ lub usuń nową kartę przed zapisaniem.")
	return /** @type {LocalizedString} */ ("Finish or remove the new card before saving.")
});