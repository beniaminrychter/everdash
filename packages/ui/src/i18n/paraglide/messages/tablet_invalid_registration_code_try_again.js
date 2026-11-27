/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Invalid_Registration_Code_Try_AgainInputs */



/**
* | output |
* | --- |
* | "Invalid registration code. Try again." |
*
* @param {Tablet_Invalid_Registration_Code_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_invalid_registration_code_try_again = /** @type {((inputs?: Tablet_Invalid_Registration_Code_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Invalid_Registration_Code_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nieprawidłowy kod rejestracji. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Invalid registration code. Try again.")
});