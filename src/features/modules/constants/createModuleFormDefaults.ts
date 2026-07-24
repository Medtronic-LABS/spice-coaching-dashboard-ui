/** UI defaults for admin module creation. */
export const CREATE_MODULE_FORM_DEFAULTS = {
  estimated_minutes: 10,
  difficulty_level: 'moderate',
  chatbot_faqs_only: false,
} as const;

/** Placeholder hint for the domain field (not applied on submit). */
export const CREATE_MODULE_FORM_PLACEHOLDERS = {
  domain: 'rmnch',
} as const;
