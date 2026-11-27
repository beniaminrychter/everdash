/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Auth_Ha_UnreachableInputs */



/**
* | output |
* | --- |
* | "The EverDash server cannot reach Home Assistant at that address. If EverDash runs in a container, localhost points at the container itself. Use your Home Ass..." |
*
* @param {Admin_Auth_Ha_UnreachableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_auth_ha_unreachable = /** @type {((inputs?: Admin_Auth_Ha_UnreachableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Auth_Ha_UnreachableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Serwer EverDash nie może połączyć się z Home Assistant pod tym adresem. Jeśli EverDash działa w kontenerze, localhost wskazuje sam kontener. Zamiast tego użyj adresu LAN Home Assistant, na przykład http://192.168.1.10:8123.")
	return /** @type {LocalizedString} */ ("The EverDash server cannot reach Home Assistant at that address. If EverDash runs in a container, localhost points at the container itself. Use your Home Assistant LAN address instead, for example http://192.168.1.10:8123.")
});