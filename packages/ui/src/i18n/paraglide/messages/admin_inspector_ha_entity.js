/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Ha_EntityInputs */



/**
* | output |
* | --- |
* | "Home Assistant entity" |
*
* @param {Admin_Inspector_Ha_EntityInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_ha_entity = /** @type {((inputs?: Admin_Inspector_Ha_EntityInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Ha_EntityInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Encja Home Assistant")
	return /** @type {LocalizedString} */ ("Home Assistant entity")
});