/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Device_Could_Not_Be_Revoked_Try_AgainInputs */



/**
* | output |
* | --- |
* | "Device could not be revoked. Try again." |
*
* @param {Tablet_Device_Could_Not_Be_Revoked_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_device_could_not_be_revoked_try_again = /** @type {((inputs?: Tablet_Device_Could_Not_Be_Revoked_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Device_Could_Not_Be_Revoked_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się cofnąć dostępu. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Device could not be revoked. Try again.")
});