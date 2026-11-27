/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Connection_Refused_LocalInputs */



/**
* | output |
* | --- |
* | "Connection refused on this port. Make sure EverDash is running and listening on the configured tablet port, and that no firewall is blocking it." |
*
* @param {Admin_Devices_Fail_Connection_Refused_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_connection_refused_local = /** @type {((inputs?: Admin_Devices_Fail_Connection_Refused_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Connection_Refused_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połączenie na tym porcie zostało odrzucone. Upewnij się, że EverDash działa na skonfigurowanym porcie tabletu i nie blokuje go zapora sieciowa.")
	return /** @type {LocalizedString} */ ("Connection refused on this port. Make sure EverDash is running and listening on the configured tablet port, and that no firewall is blocking it.")
});