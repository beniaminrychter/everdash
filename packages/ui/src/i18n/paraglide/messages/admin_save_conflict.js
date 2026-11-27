/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Save_ConflictInputs */



/**
* | output |
* | --- |
* | "Another Home Assistant editor saved a newer dashboard. Your draft is unchanged; reload before saving again." |
*
* @param {Admin_Save_ConflictInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_save_conflict = /** @type {((inputs?: Admin_Save_ConflictInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Save_ConflictInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Inny edytor Home Assistant zapisał nowszy pulpit. Twoja wersja robocza pozostała bez zmian; odśwież przed ponownym zapisem.")
	return /** @type {LocalizedString} */ ("Another Home Assistant editor saved a newer dashboard. Your draft is unchanged; reload before saving again.")
});