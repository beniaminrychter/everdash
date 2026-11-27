/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Move_Section_UpInputs */



/**
* | output |
* | --- |
* | "Move section up" |
*
* @param {Admin_Inspector_Move_Section_UpInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_move_section_up = /** @type {((inputs?: Admin_Inspector_Move_Section_UpInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Move_Section_UpInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przesuń sekcję w górę")
	return /** @type {LocalizedString} */ ("Move section up")
});