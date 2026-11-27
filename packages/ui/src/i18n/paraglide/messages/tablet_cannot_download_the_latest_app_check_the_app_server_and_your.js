/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Cannot_Download_The_Latest_App_Check_The_App_Server_And_YourInputs */



/**
* | output |
* | --- |
* | "Cannot download the latest app. Check the app server and your connection, then retry." |
*
* @param {Tablet_Cannot_Download_The_Latest_App_Check_The_App_Server_And_YourInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_cannot_download_the_latest_app_check_the_app_server_and_your = /** @type {((inputs?: Tablet_Cannot_Download_The_Latest_App_Check_The_App_Server_And_YourInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Cannot_Download_The_Latest_App_Check_The_App_Server_And_YourInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie można pobrać najnowszej aplikacji. Sprawdź serwer aplikacji i połączenie, a następnie spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Cannot download the latest app. Check the app server and your connection, then retry.")
});