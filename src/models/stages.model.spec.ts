import {IStage, ModuleType, ModuleVersion, SingleModuleVersion, StageImpl} from './stages.model';

describe('stages.model', () => {
  it('canary verifies test infrastructure', () => {
    expect(true).toBe(true);
  });

  describe('given StagesImpl.asString()', () => {
    const id = 'moduleId';
    const version = 'v1.0.0';
    let input: IStage;

    describe('when run with module type undefined', () => {
      const type = undefined;

      beforeEach(() => {
        input = buildIStage(id, version, type);
      })

      test('then return single source entry', async () => {
        const actualValue = new StageImpl(input).asString({});
        expect(actualValue).toContain(`source = "${id}?ref=${version}"`);
        expect(actualValue).not.toContain('version = ');
      });
    });

    describe('when run with module type git', () => {
      const type = 'git';

      beforeEach(() => {
        input = buildIStage(id, version, type);
      })

      test('then return single source entry', async () => {
        const actualValue = new StageImpl(input).asString({});
        expect(actualValue).toContain(`source = "${id}?ref=${version}"`);
        expect(actualValue).not.toContain('version = ');
      });
    });

    describe('when run with module type registry', () => {
      const type = 'registry';

      beforeEach(() => {
        input = buildIStage(id, version, type);
      })

      test('then return source and version entries', async () => {
        const actualValue = new StageImpl(input).asString({});
        expect(actualValue).toContain(`source = "${id}"`);
        expect(actualValue).toContain(`version = "${version}"`);
      });
    });
  });
});

function buildIStage(id: string, version: string, type?: ModuleType): IStage {
  const moduleVersion: ModuleVersion = {
    outputs: [],
    variables: [],
    version
  };
  const module: SingleModuleVersion = {
    category: 'test',
    id,
    name: 'moduleName',
    type,
    platforms: [],
    version: moduleVersion,
  };
  return {
    module,
    name: '',
    source: '',
    variables: []
  };
}
