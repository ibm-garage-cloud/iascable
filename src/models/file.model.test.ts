import {UrlFile} from './file.model';

describe('file.model', () => {
  test('canary verifies test infrastructure', () => {
    expect(true).toBe(true);
  });

  describe('given UrlFile', () => {
    describe('when url is null', () => {
      test('then should throw error', async () => {
        const name = 'test.out';

        const file = new UrlFile({name, url: undefined as any});

        return file.contents.then(
          result => expect(result).toBeUndefined(),
          err => expect(err.message).toEqual('Url is missing for file: ' + name)
        );
      });
    });

    describe('when url is invalid', () => {
      test('then should throw error', async () => {
        const name = 'test.out';
        const url = 'https://bogus-url.com';

        const file = new UrlFile({name, url});

        return file.contents.then(
          result => expect(result).toBeUndefined(),
          err => expect(err.message).toEqual('Error retrieving file ' + name + ' from url: ' + url)
        );
      });
    });

    describe('when url is valid', () => {
      test('then should return contents', async () => {
        const name = 'test.out';
        const url = 'https://google.com';

        const file = new UrlFile({name, url});

        return file.contents.then(
          result => expect(result).toBeDefined(),
          err => expect(err).toBeUndefined(),
        );
      });
    });
  });
})
