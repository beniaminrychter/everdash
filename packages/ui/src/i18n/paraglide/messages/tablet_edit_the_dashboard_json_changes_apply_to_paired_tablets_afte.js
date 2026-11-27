/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Edit_The_Dashboard_Json_Changes_Apply_To_Paired_Tablets_AfteInputs */



/**
* | output |
* | --- |
* | "Edit the dashboard JSON. Changes apply to paired tablets after you save." |
*
* @param {Tablet_Edit_The_Dashboard_Json_Changes_Apply_To_Paired_Tablets_AfteInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_edit_the_dashboard_json_changes_apply_to_paired_tablets_afte = /** @type {((inputs?: Tablet_Edit_The_Dashboard_Json_Changes_Apply_To_Paired_Tablets_AfteInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Edit_The_Dashboard_Json_Changes_Apply_To_Paired_Tablets_AfteInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Edytuj JSON pulpitu. Zmiany zostaną zastosowane na sparowanych tabletach po zapisaniu.")
	return /** @type {LocalizedString} */ ("Edit the dashboard JSON. Changes apply to paired tablets after you save.")
});