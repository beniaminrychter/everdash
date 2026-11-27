/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Polling_Controls_LabelInputs */



/**
* | output |
* | --- |
* | "Control polling (ms)" |
*
* @param {Admin_Settings_Polling_Controls_LabelInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_polling_controls_label = /** @type {((inputs?: Admin_Settings_Polling_Controls_LabelInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Polling_Controls_LabelInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Odpytywanie sterowania (ms)")
	return /** @type {LocalizedString} */ ("Control polling (ms)")
});