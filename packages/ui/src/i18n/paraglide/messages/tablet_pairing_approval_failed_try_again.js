/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pairing_Approval_Failed_Try_AgainInputs */



/**
* | output |
* | --- |
* | "Pairing approval failed. Try again." |
*
* @param {Tablet_Pairing_Approval_Failed_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pairing_approval_failed_try_again = /** @type {((inputs?: Tablet_Pairing_Approval_Failed_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pairing_Approval_Failed_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się zatwierdzić parowania. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Pairing approval failed. Try again.")
});