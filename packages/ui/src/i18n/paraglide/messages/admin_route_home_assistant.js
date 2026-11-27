/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Route_Home_AssistantInputs */



/**
* | output |
* | --- |
* | "Home Assistant" |
*
* @param {Admin_Route_Home_AssistantInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_route_home_assistant = /** @type {((inputs?: Admin_Route_Home_AssistantInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Route_Home_AssistantInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Home Assistant")
	return /** @type {LocalizedString} */ ("Home Assistant")
});