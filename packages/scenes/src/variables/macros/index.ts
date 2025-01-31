import { DataLinkBuiltInVars } from '@grafana/data';
import { MacroVariableConstructor } from './types';
import { TimeFromAndToMacro, TimezoneMacro, UrlTimeRangeMacro } from './timeMacros';
import { AllVariablesMacro } from './AllVariablesMacro';
import { DataMacro, FieldMacro, SeriesMacro, ValueMacro } from './dataMacros';
import { UrlMacro } from './urlMacros';

export const macrosIndex: Record<string, MacroVariableConstructor> = {
  [DataLinkBuiltInVars.includeVars]: AllVariablesMacro,
  [DataLinkBuiltInVars.keepTime]: UrlTimeRangeMacro,
  ['__value']: ValueMacro,
  ['__data']: DataMacro,
  ['__series']: SeriesMacro,
  ['__field']: FieldMacro,
  ['__url']: UrlMacro,
  ['__from']: TimeFromAndToMacro,
  ['__to']: TimeFromAndToMacro,
  ['__timezone']: TimezoneMacro,
};
