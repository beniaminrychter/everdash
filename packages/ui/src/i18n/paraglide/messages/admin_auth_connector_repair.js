/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Auth_Connector_RepairInputs */



/**
* | output |
* | --- |
* | "The Home Assistant connection needs repair. Sign in again to reconnect." |
*
* @param {Admin_Auth_Connector_RepairInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_auth_connector_repair = /** @type {((inputs?: Admin_Auth_Connector_RepairInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Auth_Connector_RepairInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połączenie z Home Assistant wymaga naprawy. Zaloguj się ponownie, aby połączyć się na nowo.")
	return /** @type {LocalizedString} */ ("The Home Assistant connection needs repair. Sign in again to reconnect.")
});