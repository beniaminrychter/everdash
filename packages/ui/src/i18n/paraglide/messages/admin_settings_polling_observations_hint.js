/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Polling_Observations_HintInputs */



/**
* | output |
* | --- |
* | "How often tablets refresh sensor badges, weather and energy readings." |
*
* @param {Admin_Settings_Polling_Observations_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_polling_observations_hint = /** @type {((inputs?: Admin_Settings_Polling_Observations_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Polling_Observations_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Jak często tablety odświeżają plakietki czujników, pogodę i odczyty energii.")
	return /** @type {LocalizedString} */ ("How often tablets refresh sensor badges, weather and energy readings.")
});