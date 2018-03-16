import createDebug from 'debug';
import { readFileSync as read } from 'fs';
import { exec as sudo } from 'sudo-prompt';
import { run } from '../utils';
import { Options } from '../index';
import { openCertificateInFirefox } from './shared';
import { Platform } from '.';

const debug = createDebug('devcert:platforms:windows');

export default class WindowsPlatform implements Platform {

  private HOST_FILE_PATH = 'C:\\Windows\\System32\\Drivers\\etc\\hosts';

  /**
   * Windows is at least simple. Like macOS, most applications will delegate to
   * the system trust store, which is updated with the confusingly named
   * `certutil` exe (not the same as the NSS/Mozilla certutil). Firefox does it's
   * own thing as usual, and getting a copy of NSS certutil onto the Windows
   * machine to try updating the Firefox store is basically a nightmare, so we
   * don't even try it - we just bail out to the GUI.
   */
  async addToTrustStores(certificatePath: string, options: Options = {}): Promise<void> {
    // IE, Chrome, system utils
    debug('adding devcert root to Windows OS trust store')
    run(`certutil -addstore -user root ${ certificatePath }`);
    // Firefox (don't even try NSS certutil, no easy install for Windows)
    await openCertificateInFirefox('start firefox', certificatePath);
  }

  addDomainToHostFileIfMissing(domain: string) {
    let hostsFileContents = read(this.HOST_FILE_PATH, 'utf8');
    if (!hostsFileContents.includes(domain)) {
      // Shell out to append the file so the subshell can prompt for sudo
      sudo(`bash -c "echo '127.0.0.1  ${ domain }' > ${ this.HOST_FILE_PATH }"`, { name: 'devcert' });
    }
  }

}