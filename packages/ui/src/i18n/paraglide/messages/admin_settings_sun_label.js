/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Sun_LabelInputs */



/**
* | output |
* | --- |
* | "Sun entity" |
*
* @param {Admin_Settings_Sun_LabelInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_sun_label = /** @type {((inputs?: Admin_Settings_Sun_LabelInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Sun_LabelInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Encja słońca")
	return /** @type {LocalizedString} */ ("Sun entity")
});