/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Download_The_Latest_Version_And_Reset_The_Apps_Offline_CacheInputs */



/**
* | output |
* | --- |
* | "Download the latest version and reset the app’s offline cache. Your dashboard and appearance stay saved." |
*
* @param {Tablet_Download_The_Latest_Version_And_Reset_The_Apps_Offline_CacheInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_download_the_latest_version_and_reset_the_apps_offline_cache = /** @type {((inputs?: Tablet_Download_The_Latest_Version_And_Reset_The_Apps_Offline_CacheInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Download_The_Latest_Version_And_Reset_The_Apps_Offline_CacheInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pobierz najnowszą wersję i wyczyść pamięć podręczną aplikacji. Wybrany pulpit, wygląd i język pozostaną zapisane.")
	return /** @type {LocalizedString} */ ("Download the latest version and reset the app’s offline cache. Your dashboard and appearance stay saved.")
});