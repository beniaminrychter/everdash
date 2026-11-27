/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Connection_Refused_ExternalInputs */



/**
* | output |
* | --- |
* | "Connection refused. External tunnels and reverse proxies usually forward only Home Assistant, not the EverDash tablet port. Use the local network address abo..." |
*
* @param {Admin_Devices_Fail_Connection_Refused_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_connection_refused_external = /** @type {((inputs?: Admin_Devices_Fail_Connection_Refused_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Connection_Refused_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połączenie zostało odrzucone. Zewnętrzne tunele i serwery proxy zwykle przekierowują tylko Home Assistant, a nie port tabletu EverDash. Dla tabletów w sieci domowej użyj adresu lokalnego powyżej.")
	return /** @type {LocalizedString} */ ("Connection refused. External tunnels and reverse proxies usually forward only Home Assistant, not the EverDash tablet port. Use the local network address above for tablets on your home network.")
});