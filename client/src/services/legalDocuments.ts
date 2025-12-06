import * as WebBrowser from 'expo-web-browser';

const LEGAL_BASE_URL = 'https://apexosapp.com';

export type LegalDocumentType = 'privacy' | 'terms';

/**
 * Opens a legal document (Privacy Policy or Terms of Service) in an in-app browser.
 *
 * @param documentType - The type of document to open ('privacy' or 'terms')
 * @returns A promise that resolves when the browser is dismissed
 */
export async function openLegalDocument(documentType: LegalDocumentType): Promise<void> {
  const url =
    documentType === 'privacy'
      ? `${LEGAL_BASE_URL}/privacy`
      : `${LEGAL_BASE_URL}/terms`;

  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: '#63E6BE', // Apex OS accent teal
      toolbarColor: '#0F1218', // Apex OS primary background
    });
  } catch (error) {
    console.error(`Failed to open ${documentType} document:`, error);
    throw error;
  }
}

/**
 * Opens the Privacy Policy in an in-app browser.
 */
export function openPrivacyPolicy(): Promise<void> {
  return openLegalDocument('privacy');
}

/**
 * Opens the Terms of Service in an in-app browser.
 */
export function openTermsOfService(): Promise<void> {
  return openLegalDocument('terms');
}
