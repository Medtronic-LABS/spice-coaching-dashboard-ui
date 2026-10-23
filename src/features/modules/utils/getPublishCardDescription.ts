export function getPublishCardDescription(options: {
  readonly: boolean;
  isAlreadyPublished: boolean;
  assignDisabled: boolean;
}): string {
  const { readonly, isAlreadyPublished, assignDisabled } = options;

  if (readonly) {
    return assignDisabled
      ? 'Review this chatbot FAQ-only module. It cannot be assigned to CHWs.'
      : 'Review module content before assigning it to CHWs.';
  }

  if (isAlreadyPublished) {
    return assignDisabled
      ? 'This chatbot FAQ-only module is already published. Return to the module library when finished.'
      : 'This module is already published. Assign it to CHWs or return to the module library.';
  }

  if (assignDisabled) {
    return 'This chatbot FAQ-only module will be added to the library for chatbot Q&A. It cannot be assigned to CHWs.';
  }

  return 'This module will be added to the library. You can assign it to CHWs after publishing.';
}
