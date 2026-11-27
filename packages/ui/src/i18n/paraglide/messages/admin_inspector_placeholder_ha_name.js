/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Placeholder_Ha_NameInputs */



/**
* | output |
* | --- |
* | "Use Home Assistant name" |
*
* @param {Admin_Inspector_Placeholder_Ha_NameInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_placeholder_ha_name = /** @type {((inputs?: Admin_Inspector_Placeholder_Ha_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Placeholder_Ha_NameInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Użyj nazwy z Home Assistant")
	return /** @type {LocalizedString} */ ("Use Home Assistant name")
});