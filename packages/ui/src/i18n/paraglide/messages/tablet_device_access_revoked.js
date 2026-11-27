/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Device_Access_RevokedInputs */



/**
* | output |
* | --- |
* | "Device access revoked." |
*
* @param {Tablet_Device_Access_RevokedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_device_access_revoked = /** @type {((inputs?: Tablet_Device_Access_RevokedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Device_Access_RevokedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dostęp urządzenia został cofnięty.")
	return /** @type {LocalizedString} */ ("Device access revoked.")
});