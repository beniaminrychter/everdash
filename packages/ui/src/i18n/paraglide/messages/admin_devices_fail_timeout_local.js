/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Timeout_LocalInputs */



/**
* | output |
* | --- |
* | "Timed out waiting for a response. Check that this IP address is reachable on your local network and that no firewall is blocking the tablet port." |
*
* @param {Admin_Devices_Fail_Timeout_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_timeout_local = /** @type {((inputs?: Admin_Devices_Fail_Timeout_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Timeout_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przekroczono czas oczekiwania na odpowiedź. Sprawdź, czy ten adres IP jest osiągalny w sieci lokalnej oraz czy zapora nie blokuje portu tabletu.")
	return /** @type {LocalizedString} */ ("Timed out waiting for a response. Check that this IP address is reachable on your local network and that no firewall is blocking the tablet port.")
});