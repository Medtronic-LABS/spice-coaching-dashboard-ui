/** Chatbot FAQ-only modules are not assignable to CHWs / milestones / badges. */
export function isAssignablePublishedModule(module: {
  chatbot_faqs_only?: boolean;
}): boolean {
  return !module.chatbot_faqs_only;
}
