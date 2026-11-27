/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Icon_Group_SecurityInputs */



/**
* | output |
* | --- |
* | "Security" |
*
* @param {Admin_Icon_Group_SecurityInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_group_security = /** @type {((inputs?: Admin_Icon_Group_SecurityInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_Group_SecurityInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Bezpieczeństwo")
	return /** @type {LocalizedString} */ ("Security")
});