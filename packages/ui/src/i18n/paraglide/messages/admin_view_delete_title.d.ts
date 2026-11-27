/**
* | output |
* | --- |
* | "Delete “{title}”?" |
*
*/
export const admin_view_delete_title: ((inputs: Admin_View_Delete_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_View_Delete_TitleInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_View_Delete_TitleInputs = { title: NonNullable<unknown> };
