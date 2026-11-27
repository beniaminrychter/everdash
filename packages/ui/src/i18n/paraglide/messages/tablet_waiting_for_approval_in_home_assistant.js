/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Waiting_For_Approval_In_Home_AssistantInputs */



/**
* | output |
* | --- |
* | "Waiting for approval in Home Assistant…" |
*
* @param {Tablet_Waiting_For_Approval_In_Home_AssistantInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_waiting_for_approval_in_home_assistant = /** @type {((inputs?: Tablet_Waiting_For_Approval_In_Home_AssistantInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Waiting_For_Approval_In_Home_AssistantInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Oczekiwanie na zatwierdzenie w Home Assistant…")
	return /** @type {LocalizedString} */ ("Waiting for approval in Home Assistant…")
});