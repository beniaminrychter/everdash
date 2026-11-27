/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Sun_HintInputs */



/**
* | output |
* | --- |
* | "Optional. Lets the dashboard follow sunrise and sunset." |
*
* @param {Admin_Settings_Sun_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_sun_hint = /** @type {((inputs?: Admin_Settings_Sun_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Sun_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Opcjonalnie. Pozwala pulpitowi dostosowywać się do wschodu i zachodu słońca.")
	return /** @type {LocalizedString} */ ("Optional. Lets the dashboard follow sunrise and sunset.")
});