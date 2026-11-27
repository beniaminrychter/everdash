/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Revoke_AccessInputs */



/**
* | output |
* | --- |
* | "Revoke access" |
*
* @param {Tablet_Revoke_AccessInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_revoke_access = /** @type {((inputs?: Tablet_Revoke_AccessInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Revoke_AccessInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Cofnij dostęp")
	return /** @type {LocalizedString} */ ("Revoke access")
});