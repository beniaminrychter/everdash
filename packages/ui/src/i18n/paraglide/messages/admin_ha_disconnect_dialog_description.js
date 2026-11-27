/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Disconnect_Dialog_DescriptionInputs */



/**
* | output |
* | --- |
* | "EverDash forgets this Home Assistant connection and signs you out. Your dashboard layout is kept. Then you can sign in to any Home Assistant instance. Tablet..." |
*
* @param {Admin_Ha_Disconnect_Dialog_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_disconnect_dialog_description = /** @type {((inputs?: Admin_Ha_Disconnect_Dialog_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Disconnect_Dialog_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash zapomni to połączenie z Home Assistant i Cię wyloguje. Układ pulpitu zostanie zachowany. Następnie możesz zalogować się do dowolnej instancji Home Assistant. Tablety nie będą wyświetlać danych do czasu ponownego połączenia.")
	return /** @type {LocalizedString} */ ("EverDash forgets this Home Assistant connection and signs you out. Your dashboard layout is kept. Then you can sign in to any Home Assistant instance. Tablets show no data until you connect again.")
});