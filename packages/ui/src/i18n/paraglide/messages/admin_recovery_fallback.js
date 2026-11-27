/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Recovery_FallbackInputs */



/**
* | output |
* | --- |
* | "Saved settings need recovery. Import a valid document or build a replacement, then save it." |
*
* @param {Admin_Recovery_FallbackInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_recovery_fallback = /** @type {((inputs?: Admin_Recovery_FallbackInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Recovery_FallbackInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zapisane ustawienia wymagają odzyskania. Zaimportuj poprawny dokument lub utwórz nowy pulpit, a następnie zapisz zmiany.")
	return /** @type {LocalizedString} */ ("Saved settings need recovery. Import a valid document or build a replacement, then save it.")
});