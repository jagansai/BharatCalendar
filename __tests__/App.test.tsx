/**
 * @format
 */

import language from '../src/languages/selected';

test('has the localized labels required by the main calendar', () => {
  expect(language.appTitle).toBe('పండుగల సూచిక');
  expect(language.calendar).toBe('పండుగల క్యాలెండర్');
  expect(language.searchPlaceholder).toContain('దీపావళి');
  expect(language.upcomingFestivals).toBe('రాబోయే పండుగలు');
});
