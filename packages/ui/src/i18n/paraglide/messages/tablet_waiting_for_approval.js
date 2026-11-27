/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Waiting_For_ApprovalInputs */



/**
* | output |
* | --- |
* | "Waiting for approval…" |
*
* @param {Tablet_Waiting_For_ApprovalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_waiting_for_approval = /** @type {((inputs?: Tablet_Waiting_For_ApprovalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Waiting_For_ApprovalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Oczekiwanie na zatwierdzenie…")
	return /** @type {LocalizedString} */ ("Waiting for approval…")
});