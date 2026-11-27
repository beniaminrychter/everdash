/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Open_This_Address_In_SafariInputs */



/**
* | output |
* | --- |
* | "Open this address in Safari." |
*
* @param {Tablet_Open_This_Address_In_SafariInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_open_this_address_in_safari = /** @type {((inputs?: Tablet_Open_This_Address_In_SafariInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Open_This_Address_In_SafariInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Otwórz ten adres w Safari.")
	return /** @type {LocalizedString} */ ("Open this address in Safari.")
});