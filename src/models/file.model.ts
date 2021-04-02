import * as superagent from 'superagent';

export enum OutputFileType {
  terraform = 'terraform',
  tileConfig = 'tile-config',
  documentation = 'documentation'
}

export interface OutputFile {
  name: string;
  type?: OutputFileType;
  readonly contents: Promise<string | Buffer>;
}

export class UrlFile implements OutputFile {
  name: string;
  url: string;
  type?: OutputFileType;

  constructor({name, url, type}: {name: string, url: string, type?: OutputFileType}) {
    this.name = name;
    this.url = url;
    this.type = type;
  }

  get contents(): Promise<string | Buffer> {
    if (!this.url) {
      return Promise.reject(new Error('Url is missing for file: ' + this.name));
    }

    return new Promise<string>(async (resolve, reject) => {
      try {
        const req: superagent.Response = await superagent.get(this.url);

        resolve(req.text);
      } catch (e) {
        reject(new Error('Error retrieving file ' + this.name + ' from url: ' + this.url));
      }
    });
  }
}
