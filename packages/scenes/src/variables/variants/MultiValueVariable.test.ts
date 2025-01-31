import { lastValueFrom, Observable, of } from 'rxjs';

import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { VariableFormatID } from '@grafana/schema';

import { SceneVariableValueChangedEvent, VariableValueOption } from '../types';
import {
  CustomAllValue,
  MultiValueVariable,
  MultiValueVariableState,
  VariableGetOptionsArgs,
} from '../variants/MultiValueVariable';

export interface ExampleVariableState extends MultiValueVariableState {
  optionsToReturn: VariableValueOption[];
}

class ExampleVariable extends MultiValueVariable<ExampleVariableState> {
  public constructor(initialState: Partial<ExampleVariableState>) {
    super({
      type: 'custom',
      optionsToReturn: [],
      value: '',
      text: '',
      name: '',
      options: [],
      ...initialState,
    });
  }
  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    return of(this.state.optionsToReturn);
  }
}

describe('MultiValueVariable', () => {
  describe('When validateAndUpdate is called', () => {
    it('Should pick first value if current value is not valid', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        value: 'A',
        text: 'A',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('B');
      expect(variable.state.text).toBe('B');
    });

    it('Should pick All value when defaultToAll is true', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
        ],
        defaultToAll: true,
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
    });

    it('Should keep current value if current value is valid', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [{ label: 'A', value: 'A' }],
        value: 'A',
        text: 'A',
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe('A');
      expect(variable.state.text).toBe('A');
    });

    it('Should maintain the valid values when multiple selected', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        isMulti: true,
        optionsToReturn: [
          { label: 'A', value: 'A' },
          { label: 'C', value: 'C' },
        ],
        value: ['A', 'B', 'C'],
        text: ['A', 'B', 'C'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['A', 'C']);
      expect(variable.state.text).toEqual(['A', 'C']);
    });

    it('Should pick first option if none of the current values are valid', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        isMulti: true,
        optionsToReturn: [
          { label: 'A', value: 'A' },
          { label: 'C', value: 'C' },
        ],
        value: ['D', 'E'],
        text: ['E', 'E'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual(['A']);
      expect(variable.state.text).toEqual(['A']);
    });

    it('Should select All option if none of the current values are valid', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [
          { label: 'A', value: 'A' },
          { label: 'C', value: 'C' },
        ],
        value: ['D', 'E'],
        text: ['E', 'E'],
      });

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toEqual([ALL_VARIABLE_VALUE]);
      expect(variable.state.text).toEqual([ALL_VARIABLE_TEXT]);
    });

    it('Should handle $__all value and send change event even when value is still $__all', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
      });

      let changeEvent: SceneVariableValueChangedEvent | undefined;
      variable.subscribeToEvent(SceneVariableValueChangedEvent, (evt) => (changeEvent = evt));

      await lastValueFrom(variable.validateAndUpdate());

      expect(variable.state.value).toBe(ALL_VARIABLE_VALUE);
      expect(variable.state.text).toBe(ALL_VARIABLE_TEXT);
      expect(variable.state.options).toEqual(variable.state.optionsToReturn);
      expect(changeEvent).toBeDefined();
    });
  });

  describe('changeValueTo', () => {
    it('Should set default empty state to all value if defaultToAll multi', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
        value: ['1'],
        text: ['A'],
      });

      variable.changeValueTo([]);

      expect(variable.state.value).toEqual([ALL_VARIABLE_VALUE]);
    });

    it('When changing to all value', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
        value: ['1'],
        text: ['A'],
      });

      variable.changeValueTo(['1', ALL_VARIABLE_VALUE]);
      // Should clear the value so only all value is set
      expect(variable.state.value).toEqual([ALL_VARIABLE_VALUE]);
    });

    it('When changing from all value', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        isMulti: true,
        defaultToAll: true,
        optionsToReturn: [],
      });

      variable.changeValueTo([ALL_VARIABLE_VALUE, '1']);
      // Should remove the all value so only the new value is present
      expect(variable.state.value).toEqual(['1']);
    });
  });

  describe('getValue and getValueText', () => {
    it('GetValueText should return text', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: '1',
        text: 'A',
      });

      expect(variable.getValue()).toBe('1');
      expect(variable.getValueText()).toBe('A');
    });

    it('GetValueText should return All text when value is $__all', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ALL_VARIABLE_VALUE,
        text: 'A',
      });

      expect(variable.getValueText()).toBe(ALL_VARIABLE_TEXT);
    });

    it('GetValue should return all options as an array when value is $__all', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        optionsToReturn: [],
        value: ALL_VARIABLE_VALUE,
        text: 'A',
      });

      expect(variable.getValue()).toEqual(['1', '2']);
    });

    it('GetValue should return allValue when value is $__all', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ALL_VARIABLE_VALUE,
        allValue: '.*',
        text: 'A',
      });

      const value = variable.getValue() as CustomAllValue;
      expect(value.formatter()).toBe('.*');
      // Should have special handling for text format
      expect(value.formatter(VariableFormatID.Text)).toBe(ALL_VARIABLE_TEXT);
      // Should ignore most formats
      expect(value.formatter(VariableFormatID.Regex)).toBe('.*');
      // Should not ignore url encoding
      expect(value.formatter(VariableFormatID.PercentEncode)).toBe('.%2A');
    });
  });

  describe('getOptionsForSelect', () => {
    it('Should return options', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [{ label: 'A', value: '1' }],
        optionsToReturn: [],
        value: '1',
        text: 'A',
      });

      expect(variable.getOptionsForSelect()).toEqual([{ label: 'A', value: '1' }]);
    });

    it('Should return include All option when includeAll is true', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [{ label: 'A', value: '1' }],
        optionsToReturn: [],
        includeAll: true,
        value: '1',
        text: 'A',
      });

      expect(variable.getOptionsForSelect()).toEqual([
        { label: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE },
        { label: 'A', value: '1' },
      ]);
    });

    it('Should add current value if not found', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: '1',
        text: 'A',
      });

      expect(variable.getOptionsForSelect()).toEqual([{ label: 'A', value: '1' }]);
    });
  });

  describe('Url syncing', () => {
    it('getUrlState should return single value state if value is single value', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: '1',
        text: 'A',
      });

      expect(variable.urlSync?.getUrlState()).toEqual({ ['var-test']: '1' });
    });

    it('getUrlState should return string array if value is string array', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [],
        optionsToReturn: [],
        value: ['1', '2'],
        text: ['A', 'B'],
      });

      expect(variable.urlSync?.getUrlState()).toEqual({ ['var-test']: ['1', '2'] });
    });

    it('fromUrlState should update value for single value', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        optionsToReturn: [],
        value: '1',
        text: 'A',
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: '2' });
      expect(variable.state.value).toEqual('2');
      expect(variable.state.text).toEqual('B');
    });

    it('fromUrlState should update value for array value', async () => {
      const variable = new ExampleVariable({
        name: 'test',
        options: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
        optionsToReturn: [],
        value: '1',
        text: 'A',
      });

      variable.urlSync?.updateFromUrl({ ['var-test']: ['2', '1'] });
      expect(variable.state.value).toEqual(['2', '1']);
      expect(variable.state.text).toEqual(['B', 'A']);
    });
  });
});
