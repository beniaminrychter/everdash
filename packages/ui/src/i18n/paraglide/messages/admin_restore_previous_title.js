/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Restore_Previous_TitleInputs */



/**
* | output |
* | --- |
* | "Restore the previous version?" |
*
* @param {Admin_Restore_Previous_TitleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_restore_previous_title = /** @type {((inputs?: Admin_Restore_Previous_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Restore_Previous_TitleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przywrócić poprzednią wersję?")
	return /** @type {LocalizedString} */ ("Restore the previous version?")
});