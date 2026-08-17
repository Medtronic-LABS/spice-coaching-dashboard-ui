import { describe, expect, it } from 'vitest';
import {
  applyGeographyFilterChange,
  buildGeographyFilterSection,
  EMPTY_GEOGRAPHY_FILTERS,
  geographyTruncationHint,
  hasActiveGeographyFilters,
  normalizeGeographyFilters,
  parseGeographyId,
  parseGeographyIdParam,
  prependGeographyAllOption,
  toGeographyQueryParams,
} from './geographyFilters';

const selected = {
  divisionId: '1',
  districtId: '10',
  upazilaId: '2',
};

describe('geographyFilters', () => {
  it('parses positive integer geography ids and rejects invalid values', () => {
    expect(parseGeographyIdParam('12')).toBe('12');
    expect(parseGeographyIdParam(' 12 ')).toBe('12');
    expect(parseGeographyIdParam('abc')).toBe('');
    expect(parseGeographyIdParam('0')).toBe('');
    expect(parseGeographyIdParam('01')).toBe('');
    expect(parseGeographyIdParam('-1')).toBe('');
    expect(parseGeographyIdParam('1.5')).toBe('');
    expect(parseGeographyIdParam('12abc')).toBe('');
    expect(parseGeographyIdParam('')).toBe('');
    expect(parseGeographyId('10')).toBe(10);
    expect(parseGeographyId('')).toBeUndefined();
  });

  it('normalizes geography filter strings to valid ids', () => {
    expect(
      normalizeGeographyFilters({
        divisionId: ' 1 ',
        districtId: '10abc',
        upazilaId: '0',
      }),
    ).toEqual({
      divisionId: '1',
      districtId: '',
      upazilaId: '',
    });
  });

  it('clears child geography when a parent changes', () => {
    expect(applyGeographyFilterChange(selected, { divisionId: '2' })).toEqual({
      divisionId: '2',
      districtId: '',
      upazilaId: '',
    });
    expect(applyGeographyFilterChange(selected, { districtId: '11' })).toEqual({
      divisionId: '1',
      districtId: '11',
      upazilaId: '',
    });
    expect(applyGeographyFilterChange(selected, { upazilaId: '1' })).toEqual({
      divisionId: '1',
      districtId: '10',
      upazilaId: '1',
    });
    expect(applyGeographyFilterChange(selected, { divisionId: '1' })).toEqual(
      selected,
    );
  });

  it('maps selected ids to API query params', () => {
    expect(toGeographyQueryParams(EMPTY_GEOGRAPHY_FILTERS)).toEqual({});
    expect(toGeographyQueryParams(selected)).toEqual({
      division_id: 1,
      district_id: 10,
      upazila_id: 2,
    });
    expect(
      toGeographyQueryParams({
        ...EMPTY_GEOGRAPHY_FILTERS,
        divisionId: '12abc',
      }),
    ).toEqual({});
  });

  it('detects active geography filters', () => {
    expect(hasActiveGeographyFilters(EMPTY_GEOGRAPHY_FILTERS)).toBe(false);
    expect(
      hasActiveGeographyFilters({
        ...EMPTY_GEOGRAPHY_FILTERS,
        upazilaId: '1',
      }),
    ).toBe(true);
  });

  it('returns a truncation hint only when more values exist', () => {
    expect(geographyTruncationHint(50, 50)).toBeUndefined();
    expect(geographyTruncationHint(50, 120)).toBe(
      'Showing 50 of 120. Type to search.',
    );
  });

  it('prepends an All option and keeps a missing selected value visible', () => {
    expect(
      prependGeographyAllOption(
        'All districts',
        [
          { id: 10, name: 'Lalmonirhat' },
          { id: 10, name: 'Lalmonirhat duplicate' },
        ],
        '',
        'All districts',
      ),
    ).toEqual([
      { label: 'All districts', value: '' },
      { label: 'Lalmonirhat', value: '10' },
    ]);
    expect(
      prependGeographyAllOption(
        'All districts',
        [{ id: 10, name: 'Lalmonirhat' }],
        '20',
        'Naogaon',
      ),
    ).toEqual([
      { label: 'All districts', value: '' },
      { label: 'Lalmonirhat', value: '10' },
      { label: 'Naogaon', value: '20' },
    ]);
  });

  it('builds a geography settings filter section from combobox bindings', () => {
    const onChange = () => undefined;
    const onSearchTermChange = () => undefined;
    const section = buildGeographyFilterSection({
      idPrefix: 'module',
      division: {
        value: '1',
        selectedLabel: 'Rangpur',
        options: [{ label: 'Rangpur', value: '1' }],
        searchTerm: '',
        onSearchTermChange,
        onChange,
      },
      district: {
        value: '',
        selectedLabel: 'All districts',
        options: [{ label: 'All districts', value: '' }],
        searchTerm: '',
        onSearchTermChange,
        onChange,
      },
      upazila: {
        value: '',
        selectedLabel: 'All upazilas',
        options: [{ label: 'All upazilas', value: '' }],
        searchTerm: '',
        onSearchTermChange,
        onChange,
      },
    });

    expect(section.id).toBe('module-geography');
    expect(section.label).toBe('Geography');
    expect(section.fields.map((field) => field.id)).toEqual([
      'module-filter-division',
      'module-filter-district',
      'module-filter-upazila',
    ]);
  });
});
