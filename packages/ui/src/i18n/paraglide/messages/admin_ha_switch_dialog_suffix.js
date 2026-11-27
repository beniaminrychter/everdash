/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Switch_Dialog_SuffixInputs */



/**
* | output |
* | --- |
* | ". Your dashboard layout is kept." |
*
* @param {Admin_Ha_Switch_Dialog_SuffixInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_switch_dialog_suffix = /** @type {((inputs?: Admin_Ha_Switch_Dialog_SuffixInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Switch_Dialog_SuffixInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (". Układ pulpitu zostanie zachowany.")
	return /** @type {LocalizedString} */ (". Your dashboard layout is kept.")
});