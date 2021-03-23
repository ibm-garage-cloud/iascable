import {ModuleVariable, ModuleVariableScope} from './module.model';

export interface StagePrinter {
  asString(stages: {[name: string]: {name: string}}): string;
}

export interface IBaseVariable {
  name: string;
  description?: string;
  type?: string;
  alias?: string;
  defaultValue?: string;
  scope?: ModuleVariableScope;
  options?: Array<{label: string, value: string}>;
}

export interface BaseVariable extends IBaseVariable, StagePrinter {
}

export interface IModuleVariable extends IBaseVariable {
  moduleRef: {source: string};
  moduleOutputName: string;
}

export class ModuleRefVariable implements IModuleVariable, BaseVariable {
  name: string;
  description?: string;
  type?: string;
  scope?: ModuleVariableScope = 'module';

  moduleRef: {source: string};
  moduleOutputName: string;

  constructor(values: IModuleVariable) {
    this.name = values.name;
    this.description = values.description;
    this.type = values.type;
    this.scope = values.scope;
    this.moduleRef = values.moduleRef;
    this.moduleOutputName = values.moduleOutputName;
  }

  asString(stages: {[name: string]: {name: string}}): string {
    const module: {name: string} = stages[this.moduleRef.source];

    return `${this.name} = module.${module.name}.${this.moduleOutputName}\n`;
  }
}

export function isModuleRefVariable(value: IBaseVariable): value is ModuleRefVariable {
  return (!!value) && !!(value as ModuleRefVariable).moduleRef;
}

export interface IGlobalRefVariable extends IBaseVariable {
  variableName: string;
}

export class GlobalRefVariable implements IGlobalRefVariable, BaseVariable {
  name: string;
  description?: string;
  type?: string;

  variableName: string;

  constructor(values: IGlobalRefVariable) {
    this.name = values.name;
    this.description = values.description;
    this.type = values.type;
    this.variableName = values.variableName;
  }

  asString(): string {
    return `${this.name} = var.${this.variableName}\n`;
  }
}

export function isGlobalRefVariable(value: IBaseVariable): value is GlobalRefVariable {
  return (!!value) && !!(value as GlobalRefVariable).variableName;
}

export interface IPlaceholderVariable extends IBaseVariable {
  variable: ModuleVariable;
}

export class PlaceholderVariable implements IPlaceholderVariable, BaseVariable {
  name: string;
  description?: string;
  type?: string;
  scope?: ModuleVariableScope;
  alias?: string;
  defaultValue?: string;

  variable: ModuleVariable;

  constructor(props: IPlaceholderVariable) {
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;
    this.scope = props.scope;
    this.alias = props.alias;
    this.defaultValue = props.defaultValue;
    this.variable = props.variable;
  }

  asString(): string {
    return '';
  }
}

export function isPlaceholderVariable(value: IBaseVariable): value is PlaceholderVariable {
  return (!!value) && !!(value as PlaceholderVariable).variable;
}

export function fromBaseVariable(variable: IBaseVariable): BaseVariable {
  if (isGlobalRefVariable(variable)) {
    return new GlobalRefVariable(variable);
  } else if (isModuleRefVariable(variable)) {
    return new ModuleRefVariable(variable);
  } else if (isPlaceholderVariable(variable)) {
    return new PlaceholderVariable(variable);
  } else {
    throw new Error('Unknown variable type: ' + JSON.stringify(variable));
  }
}

export interface TerraformVariable extends IBaseVariable {
  asString(): string;
}

export class TerraformVariableImpl implements TerraformVariable {
  name: string = '';
  private _type: string = '';
  private _description: string = '';
  private _value: string = '';

  constructor(values: {name: string, value?: string, type?: string, description?: string}) {
    Object.assign(this, values);
  }

  get type() {
    return this._type || 'string';
  }
  set type(type: string) {
    this._type = type;
  }

  get value() {
    return this._value || '';
  }
  set value(value: string) {
    this._value = value;
  }

  get description() {
    return this._description || `the value of ${this.name}`;
  }
  set description(description: string) {
    this._description = description;
  }

  asString(): string {
    return `variable "${this.name}" {
  type = ${this.type}
  description = "${this.description}"${this.defaultValueProp()}
}
`;
  }

  defaultValueProp(): string {
    if (this._value === undefined || this._value === null) {
      return '';
    }

    const value = (this.type === 'bool' || this.type === 'number') ? this.value : `"${this.value}"`;

    return `
  default = ${value}`;
  }
}
