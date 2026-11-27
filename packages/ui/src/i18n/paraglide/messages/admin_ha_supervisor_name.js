/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Supervisor_NameInputs */



/**
* | output |
* | --- |
* | "Home Assistant Supervisor" |
*
* @param {Admin_Ha_Supervisor_NameInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_supervisor_name = /** @type {((inputs?: Admin_Ha_Supervisor_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Supervisor_NameInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Home Assistant Supervisor")
	return /** @type {LocalizedString} */ ("Home Assistant Supervisor")
});