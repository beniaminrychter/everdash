/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Reconnect_ErrorInputs */



/**
* | output |
* | --- |
* | "Unable to reconnect. Sign in again." |
*
* @param {Admin_Ha_Reconnect_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_reconnect_error = /** @type {((inputs?: Admin_Ha_Reconnect_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Reconnect_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się połączyć ponownie. Zaloguj się jeszcze raz.")
	return /** @type {LocalizedString} */ ("Unable to reconnect. Sign in again.")
});