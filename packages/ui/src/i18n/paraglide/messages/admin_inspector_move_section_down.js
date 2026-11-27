/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Move_Section_DownInputs */



/**
* | output |
* | --- |
* | "Move section down" |
*
* @param {Admin_Inspector_Move_Section_DownInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_move_section_down = /** @type {((inputs?: Admin_Inspector_Move_Section_DownInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Move_Section_DownInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przesuń sekcję w dół")
	return /** @type {LocalizedString} */ ("Move section down")
});