/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Cancel_PairingInputs */



/**
* | output |
* | --- |
* | "Cancel pairing" |
*
* @param {Tablet_Cancel_PairingInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_cancel_pairing = /** @type {((inputs?: Tablet_Cancel_PairingInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Cancel_PairingInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Anuluj parowanie")
	return /** @type {LocalizedString} */ ("Cancel pairing")
});