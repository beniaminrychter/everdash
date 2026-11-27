/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Admin_Load_Error_FallbackInputs */



/**
* | output |
* | --- |
* | "{error} The editor is using a starter dashboard. It can still create a new dashboard, or use JSON import / export to import a valid configuration." |
*
* @param {Admin_Load_Error_FallbackInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_load_error_fallback = /** @type {((inputs: Admin_Load_Error_FallbackInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Load_Error_FallbackInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.error} Edytor korzysta z pulpitu startowego. Możesz utworzyć nowy pulpit lub zaimportować poprawną konfigurację w zakładce Import / eksport JSON.`)
	return /** @type {LocalizedString} */ (`${i?.error} The editor is using a starter dashboard. It can still create a new dashboard, or use JSON import / export to import a valid configuration.`)
});