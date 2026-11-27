/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Data_Load_ErrorInputs */



/**
* | output |
* | --- |
* | "Dashboard data could not be loaded." |
*
* @param {Admin_Editor_Data_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_data_load_error = /** @type {((inputs?: Admin_Editor_Data_Load_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Data_Load_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wczytać danych pulpitu.")
	return /** @type {LocalizedString} */ ("Dashboard data could not be loaded.")
});