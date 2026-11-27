/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Device_Registered_But_This_Browser_Did_Not_Keep_The_Session_Inputs */



/**
* | output |
* | --- |
* | "Device registered, but this browser did not keep the session. Check cookie settings and try again." |
*
* @param {Tablet_Device_Registered_But_This_Browser_Did_Not_Keep_The_Session_Inputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_device_registered_but_this_browser_did_not_keep_the_session_ = /** @type {((inputs?: Tablet_Device_Registered_But_This_Browser_Did_Not_Keep_The_Session_Inputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Device_Registered_But_This_Browser_Did_Not_Keep_The_Session_Inputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Urządzenie zostało zarejestrowane, ale przeglądarka nie zachowała sesji. Sprawdź ustawienia plików cookie i spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Device registered, but this browser did not keep the session. Check cookie settings and try again.")
});