import {Container} from 'typescript-ioc';
import {Arguments, Argv} from 'yargs';
import {promises} from 'fs';
import {default as jsYaml} from 'js-yaml';
import {join, dirname} from 'path';

import {IascableInput} from './inputs/iascable.input';
import {CommandLineInput} from './inputs/command-line.input';
import {
  BillOfMaterial,
  BillOfMaterialModel,
  isBillOfMaterialModel,
  isTileConfig,
  OutputFile, OutputFileType,
  TerraformComponent,
  Tile
} from '../models';
import {IascableApi, IascableOptions, IascableResult} from '../services';
import {LoggerApi} from '../util/logger';

export const command = 'build';
export const desc = 'Configure (and optionally deploy) the iteration zero assets';
export const builder = (yargs: Argv<any>) => {
  return yargs
    .option('catalogUrl', {
      alias: 'u',
      description: 'The url of the module catalog. Can be https:// or file:/ protocol.',
      default: 'https://cloud-native-toolkit.github.io/garage-terraform-modules/index.yaml'
    })
    .option('input', {
      alias: 'i',
      description: 'The path to the bill of materials to use as input',
      demandOption: false,
    })
    .option('platform', {
      description: 'Filter for the platform (kubernetes or ocp4)',
      demandOption: false,
    })
    .option('provider', {
      description: 'Filter for the provider (ibm or k8s)',
      demandOption: false,
    })
    .option('tileLabel', {
      description: 'The label for the tile. Required if you want to generate the tile metadata.',
      demandOption: false,
    })
    .option('name', {
      description: 'The name for the tile. Required if you want to generate the tile metadata.',
      demandOption: false,
    })
    .option('tileDescription', {
      description: 'The description of the tile.',
      demandOption: false,
    })
    .option('ci', {
      type: 'boolean',
      default: false,
      demandOption: false,
    })
    .option('debug', {
      type: 'boolean',
      describe: 'Flag to turn on more detailed output message',
    });
};

export const handler = async (argv: Arguments<IascableInput & CommandLineInput>) => {
  process.env.LOG_LEVEL = argv.debug ? 'debug' : 'info';

  const cmd: IascableApi = Container.get(IascableApi);
  const logger: LoggerApi = Container.get(LoggerApi).child('build');

  const bom: BillOfMaterialModel | undefined = await loadBillOfMaterial(argv.input, argv.name);

  const name = bom?.metadata?.name || 'component';
  console.log('Name:', name);

  const options: IascableOptions = buildCatalogBuilderOptions(argv);

  try {
    const result = await cmd.build(argv.catalogUrl, bom, options);

    await outputResult(join('output', name), result);
  } catch (err) {
    logger.error('Error building config', {err})
  }
};

async function loadBillOfMaterial(input?: string, name?: string): Promise<BillOfMaterialModel | undefined> {

  async function loadInput(input: string, name?: string): Promise<BillOfMaterialModel> {
    const buffer: Buffer = await promises.readFile(input);

    const content: any = jsYaml.load(buffer.toString());
    if (!isBillOfMaterialModel(content)) {
      throw new Error('Input file is not a valid Bill of Material');
    }

    return new BillOfMaterial(content, name);
  }

  return input ? loadInput(input, name) : new BillOfMaterial(name);
}

function buildCatalogBuilderOptions(input: IascableInput): IascableOptions {
  const tileConfig = {
    label: input.tileLabel,
    name: input.name,
    shortDescription: input.tileDescription,
  };

  return {
    interactive: !input.ci,
    filter: {
      platform: input.platform,
      provider: input.provider,
    },
    tileConfig: isTileConfig(tileConfig) ? tileConfig : undefined,
  };
}

async function outputBillOfMaterial(rootPath: string, billOfMaterial: BillOfMaterialModel) {
  await promises.mkdir(rootPath, {recursive: true})

  return promises.writeFile(join(rootPath, 'bom.yaml'), jsYaml.dump(billOfMaterial));
}

async function outputTerraform(rootPath: string, terraformComponent: TerraformComponent) {
  return Promise.all(terraformComponent.files.map(async (file: OutputFile) => {
    const path = join(rootPath, file.name);
    await promises.mkdir(dirname(path), {recursive: true})

    const fileContents = await file.contents;

    return promises.writeFile(path, fileContents);
  }));
}

async function outputTile(rootPath: string, tile: Tile | undefined) {
  if (!tile) {
    return;
  }

  await promises.mkdir(rootPath, {recursive: true})

  return promises.writeFile(join(rootPath, tile.file.name), await tile.file.contents);
}

async function outputResult(rootPath: string, result: IascableResult): Promise<void> {
  await outputBillOfMaterial(rootPath, result.billOfMaterial);
  await outputTerraform(join(rootPath, 'terraform'), result.terraformComponent);
  await outputTile(rootPath, result.tile);
}
