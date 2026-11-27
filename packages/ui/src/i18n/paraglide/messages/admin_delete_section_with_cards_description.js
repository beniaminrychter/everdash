/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown>, cards: NonNullable<unknown> }} Admin_Delete_Section_With_Cards_DescriptionInputs */



/**
* | output |
* | --- |
* | "“{title}” has {cards}. Delete them with the section, or keep them in the view outside any section. Discard restores everything until you save." |
*
* @param {Admin_Delete_Section_With_Cards_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_delete_section_with_cards_description = /** @type {((inputs: Admin_Delete_Section_With_Cards_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Delete_Section_With_Cards_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Sekcja „${i?.title}” zawiera: ${i?.cards}. Usuń je razem z sekcją lub zachowaj w widoku poza sekcjami. Przycisk Odrzuć przywróci wszystko do czasu zapisania.`)
	return /** @type {LocalizedString} */ (`“${i?.title}” has ${i?.cards}. Delete them with the section, or keep them in the view outside any section. Discard restores everything until you save.`)
});