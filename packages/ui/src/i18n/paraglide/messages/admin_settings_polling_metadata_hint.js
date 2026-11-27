/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Polling_Metadata_HintInputs */



/**
* | output |
* | --- |
* | "How often tablets refresh entity names and icons." |
*
* @param {Admin_Settings_Polling_Metadata_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_polling_metadata_hint = /** @type {((inputs?: Admin_Settings_Polling_Metadata_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Polling_Metadata_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Jak często tablety odświeżają nazwy i ikony encji.")
	return /** @type {LocalizedString} */ ("How often tablets refresh entity names and icons.")
});