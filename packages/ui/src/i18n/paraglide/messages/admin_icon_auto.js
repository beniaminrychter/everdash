/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Icon_AutoInputs */



/**
* | output |
* | --- |
* | "Auto (from the entity type)" |
*
* @param {Admin_Icon_AutoInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_auto = /** @type {((inputs?: Admin_Icon_AutoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_AutoInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Automatycznie (z typu encji)")
	return /** @type {LocalizedString} */ ("Auto (from the entity type)")
});