/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Switch_Dialog_TitleInputs */



/**
* | output |
* | --- |
* | "Switch Home Assistant instance?" |
*
* @param {Admin_Ha_Switch_Dialog_TitleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_switch_dialog_title = /** @type {((inputs?: Admin_Ha_Switch_Dialog_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Switch_Dialog_TitleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przełączyć instancję Home Assistant?")
	return /** @type {LocalizedString} */ ("Switch Home Assistant instance?")
});