/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_New_Badge_EyebrowInputs */



/**
* | output |
* | --- |
* | "New temperature badge" |
*
* @param {Admin_Inspector_New_Badge_EyebrowInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_new_badge_eyebrow = /** @type {((inputs?: Admin_Inspector_New_Badge_EyebrowInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_New_Badge_EyebrowInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nowa plakietka temperatury")
	return /** @type {LocalizedString} */ ("New temperature badge")
});