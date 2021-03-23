import {VersionMatcher} from './version-matcher';

export interface ModuleRef {
  source: string;
  version?: string;
}

export interface ModuleMatcher {
  source: string;
  version: VersionMatcher[];
}

export type ModuleType = 'git' | 'registry';
export type ModuleProvider = 'ibm' | 'k8s';
export type ModuleVariableScope = 'module' | 'global' | 'ignore';

export interface ModuleTemplate {
  id: string;
  name: string;
  type?: ModuleType;
  alias?: string;
  aliasIds?: string[];
  category: string;
  description?: string;
  platforms: string[];
  provider?: ModuleProvider;
  tags?: string[];
  ibmCatalogId?: string;
  fsReady?: string;
  documentation?: string;
}

export interface Module extends ModuleTemplate {
  versions: ModuleVersion[];
}

export function isModule(module: Module | ModuleRef): module is Module {
  return !!module && !!(module as Module).id;
}

export function isModuleRef(module: Module | ModuleRef): module is ModuleRef {
  return !!module && !!(module as ModuleRef).source;
}

export interface SingleModuleVersion extends ModuleTemplate {
  version: ModuleVersion;
}

export function isSingleModuleVersion(module: Module | SingleModuleVersion): module is SingleModuleVersion {
  return !!module && !!(module as SingleModuleVersion).version;
}

export interface ModuleDependency {
  id: string;
  refs: ModuleRef[];
}

export interface ModuleVersion {
  version: string;
  dependencies?: ModuleDependency[];
  variables: ModuleVariable[];
  outputs: ModuleOutput[];
}

export interface ModuleVariable {
  name: string;
  type: string;
  alias?: string;
  scope?: ModuleVariableScope;
  description?: string;
  optional?: boolean;
  default?: string;
  defaultValue?: string;
  moduleRef?: ModuleOutputRef;
}

export interface ModuleOutputRef {
  id: string;
  output: string;
}

export interface ModuleOutput {
  name: string;
  description?: string;
}
