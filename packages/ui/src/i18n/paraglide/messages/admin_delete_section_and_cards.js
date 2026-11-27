/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Delete_Section_And_CardsInputs */



/**
* | output |
* | --- |
* | "Delete section and cards" |
*
* @param {Admin_Delete_Section_And_CardsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_delete_section_and_cards = /** @type {((inputs?: Admin_Delete_Section_And_CardsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Delete_Section_And_CardsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Usuń sekcję i karty")
	return /** @type {LocalizedString} */ ("Delete section and cards")
});