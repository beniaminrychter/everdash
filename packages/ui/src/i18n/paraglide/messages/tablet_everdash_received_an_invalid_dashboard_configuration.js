/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Everdash_Received_An_Invalid_Dashboard_ConfigurationInputs */



/**
* | output |
* | --- |
* | "EverDash received an invalid dashboard configuration." |
*
* @param {Tablet_Everdash_Received_An_Invalid_Dashboard_ConfigurationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_everdash_received_an_invalid_dashboard_configuration = /** @type {((inputs?: Tablet_Everdash_Received_An_Invalid_Dashboard_ConfigurationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Everdash_Received_An_Invalid_Dashboard_ConfigurationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash otrzymał nieprawidłową konfigurację pulpitu.")
	return /** @type {LocalizedString} */ ("EverDash received an invalid dashboard configuration.")
});