import {
  BasicValueMatcherOptions,
  FieldMatcherID,
  FieldType,
  RangeValueMatcherOptions,
  ValueMatcherID,
  ValueMatcherOptions,
} from '@grafana/data';
import { MatcherConfig } from '@grafana/schema';
import { StandardFieldConfigOverridesBuilder } from './StandardFieldConfigBuilders';

export class FieldConfigOverridesBuilder<TFieldConfig> extends StandardFieldConfigOverridesBuilder<
  FieldConfigOverridesBuilder<TFieldConfig>
> {
  public match(matcher: MatcherConfig): this {
    this._overrides.push({ matcher, properties: [] });
    return this;
  }

  public matchFieldsWithName(name: string): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byName,

        options: name,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsWithNameByRegex(regex: string): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byRegexpOrNames,
        options: regex,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsByType(fieldType: FieldType): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byType,
        options: fieldType,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsByQuery(refId: string): this {
    this._overrides.push({
      matcher: {
        id: FieldMatcherID.byFrameRefID,
        options: refId,
      },
      properties: [],
    });
    return this;
  }

  public matchFieldsByValue(
    id: ValueMatcherID,
    options: ValueMatcherOptions | BasicValueMatcherOptions | RangeValueMatcherOptions
  ): this {
    this._overrides.push({
      matcher: {
        id,
        options,
      },
      properties: [],
    });
    return this;
  }

  public overrideCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: T[K]): this {
    const _id = `custom.${String(id)}`;
    const last = this._overrides[this._overrides.length - 1];
    last.properties.push({ id: _id, value });
    return this;
  }

  public build() {
    return this._overrides;
  }
}
