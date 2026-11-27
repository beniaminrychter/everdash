/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Badge_IconInputs */



/**
* | output |
* | --- |
* | "Badge icon" |
*
* @param {Admin_Inspector_Badge_IconInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_badge_icon = /** @type {((inputs?: Admin_Inspector_Badge_IconInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Badge_IconInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ikona plakietki")
	return /** @type {LocalizedString} */ ("Badge icon")
});