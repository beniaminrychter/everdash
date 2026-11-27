/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Previous_LoadedInputs */



/**
* | output |
* | --- |
* | "Previous dashboard loaded" |
*
* @param {Admin_Previous_LoadedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_previous_loaded = /** @type {((inputs?: Admin_Previous_LoadedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Previous_LoadedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wczytano poprzedni pulpit")
	return /** @type {LocalizedString} */ ("Previous dashboard loaded")
});