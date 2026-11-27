/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Polling_Controls_HintInputs */



/**
* | output |
* | --- |
* | "How often tablets refresh lights, outlets and climate controls." |
*
* @param {Admin_Settings_Polling_Controls_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_polling_controls_hint = /** @type {((inputs?: Admin_Settings_Polling_Controls_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Polling_Controls_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Jak często tablety odświeżają stan świateł, gniazdek i klimatyzacji.")
	return /** @type {LocalizedString} */ ("How often tablets refresh lights, outlets and climate controls.")
});