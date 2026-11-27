/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Restore_Previous_VersionInputs */



/**
* | output |
* | --- |
* | "Restore previous version" |
*
* @param {Admin_Restore_Previous_VersionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_restore_previous_version = /** @type {((inputs?: Admin_Restore_Previous_VersionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Restore_Previous_VersionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przywróć poprzednią wersję")
	return /** @type {LocalizedString} */ ("Restore previous version")
});