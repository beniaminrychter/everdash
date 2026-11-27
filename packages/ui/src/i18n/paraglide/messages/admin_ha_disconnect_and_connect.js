/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Disconnect_And_ConnectInputs */



/**
* | output |
* | --- |
* | "Disconnect & connect" |
*
* @param {Admin_Ha_Disconnect_And_ConnectInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_disconnect_and_connect = /** @type {((inputs?: Admin_Ha_Disconnect_And_ConnectInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Disconnect_And_ConnectInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Rozłącz i połącz")
	return /** @type {LocalizedString} */ ("Disconnect & connect")
});