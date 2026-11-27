/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_Polling_Metadata_LabelInputs */



/**
* | output |
* | --- |
* | "Entity metadata polling (ms)" |
*
* @param {Admin_Settings_Polling_Metadata_LabelInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_polling_metadata_label = /** @type {((inputs?: Admin_Settings_Polling_Metadata_LabelInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_Polling_Metadata_LabelInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Odpytywanie metadanych encji (ms)")
	return /** @type {LocalizedString} */ ("Entity metadata polling (ms)")
});