/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Delete_Section_TitleInputs */



/**
* | output |
* | --- |
* | "Delete this section?" |
*
* @param {Admin_Delete_Section_TitleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_delete_section_title = /** @type {((inputs?: Admin_Delete_Section_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Delete_Section_TitleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Usunąć tę sekcję?")
	return /** @type {LocalizedString} */ ("Delete this section?")
});