/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Restore_Previous_DescriptionInputs */



/**
* | output |
* | --- |
* | "This loads the previously saved dashboard into the editor and replaces your current draft. Save to make it live." |
*
* @param {Admin_Restore_Previous_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_restore_previous_description = /** @type {((inputs?: Admin_Restore_Previous_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Restore_Previous_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Spowoduje to wczytanie poprzednio zapisanego pulpitu do edytora i zastąpienie bieżącej wersji roboczej. Zapisz, aby zastosować zmianę.")
	return /** @type {LocalizedString} */ ("This loads the previously saved dashboard into the editor and replaces your current draft. Save to make it live.")
});