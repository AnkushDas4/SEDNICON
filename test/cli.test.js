import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.resolve('bin/sednicon.js');

describe('Sednicon CLI Script', () => {
  test('exits with 0 and prints usage on "help"', async () => {
    const { stdout } = await execFileAsync('node', [CLI_PATH, 'help']);
    assert.ok(stdout.includes('Sednicon CLI'));
    assert.ok(stdout.includes('Usage:'));
  });

  test('exits with non-zero on unknown command', async () => {
    await assert.rejects(
      async () => {
        await execFileAsync('node', [CLI_PATH, 'download', 'rocket']);
      },
      (err) => {
        assert.equal(err.code, 1);
        assert.ok(err.stderr.includes('Unknown command') || err.stdout.includes('Unknown command'));
        return true;
      }
    );
  });

  test('exits with non-zero when "get" is missing icon name', async () => {
    await assert.rejects(
      async () => {
        await execFileAsync('node', [CLI_PATH, 'get']);
      },
      (err) => {
        assert.equal(err.code, 1);
        assert.ok(err.stderr.includes('Please specify an icon name'));
        return true;
      }
    );
  });
});
