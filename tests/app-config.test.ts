import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL,
  DEFAULT_STRUCTURED_MODEL,
  MODELS,
  NAV_ITEMS,
  SPECIALIZATIONS,
} from '../config/appConfig';
import {
  DEFAULT_MODEL as FACADE_DEFAULT_MODEL,
  DEFAULT_STRUCTURED_MODEL as FACADE_DEFAULT_STRUCTURED_MODEL,
  MODELS as FACADE_MODELS,
  NAV_ITEMS as FACADE_NAV_ITEMS,
  SPECIALIZATIONS as FACADE_SPECIALIZATIONS,
} from '../constants';

describe('app configuration', () => {
  it('preserves the constants compatibility facade', () => {
    expect(FACADE_DEFAULT_MODEL).toBe(DEFAULT_MODEL);
    expect(FACADE_DEFAULT_STRUCTURED_MODEL).toBe(DEFAULT_STRUCTURED_MODEL);
    expect(FACADE_MODELS).toEqual(MODELS);
    expect(FACADE_NAV_ITEMS).toEqual(NAV_ITEMS);
    expect(FACADE_SPECIALIZATIONS).toEqual(SPECIALIZATIONS);
  });
});
