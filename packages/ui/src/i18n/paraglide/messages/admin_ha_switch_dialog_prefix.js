/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Switch_Dialog_PrefixInputs */



/**
* | output |
* | --- |
* | "EverDash will disconnect from" |
*
* @param {Admin_Ha_Switch_Dialog_PrefixInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_switch_dialog_prefix = /** @type {((inputs?: Admin_Ha_Switch_Dialog_PrefixInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Switch_Dialog_PrefixInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash rozłączy się z")
	return /** @type {LocalizedString} */ ("EverDash will disconnect from")
});