/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Timezone_HintInputs */



/**
* | output |
* | --- |
* | "An IANA timezone such as Europe/Warsaw, used for the clock and sun times." |
*
* @param {Admin_Settings_Timezone_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_timezone_hint = /** @type {((inputs?: Admin_Settings_Timezone_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Timezone_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Strefa czasowa IANA, np. Europe/Warsaw, używana przez zegar oraz wschody i zachody słońca.")
	return /** @type {LocalizedString} */ ("An IANA timezone such as Europe/Warsaw, used for the clock and sun times.")
});