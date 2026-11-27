/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Admin_Unfinished_Card_In_ViewInputs */



/**
* | output |
* | --- |
* | "Finish or remove the new card in “{title}” before saving." |
*
* @param {Admin_Unfinished_Card_In_ViewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_unfinished_card_in_view = /** @type {((inputs: Admin_Unfinished_Card_In_ViewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Unfinished_Card_In_ViewInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Dokończ lub usuń nową kartę w widoku „${i?.title}” przed zapisaniem.`)
	return /** @type {LocalizedString} */ (`Finish or remove the new card in “${i?.title}” before saving.`)
});