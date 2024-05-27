import * as fs from 'fs';
import * as mustache from 'mustache';
import * as networkAddresses from '../networks/addresses.json';
import { Addresses } from './addresses.template';

// Change the NETWORK_ID and NETWORK_NAME to the appropriate values
const NETWORK_ID = '50';
const NETWORK_NAME = 'xinfin';

// mustache doesn't like numbered object keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let renameAddresses: any = networkAddresses;
renameAddresses[NETWORK_NAME] = networkAddresses[NETWORK_ID][process.argv[2]]["addresses"];

export let addresses: Addresses = {
  Factory: `{{${NETWORK_NAME}.Factory}}`,
  Accountant: `{{${NETWORK_NAME}.Accountant}}`,
  blockNumber: networkAddresses[NETWORK_ID][process.argv[2]]["blockNumber"],
  network: networkAddresses[NETWORK_ID]["network"],
};

const main = (): void => {
  try {
    let output = JSON.parse(mustache.render(JSON.stringify(addresses), renameAddresses));
    fs.writeFileSync(__dirname + '/generatedAddresses.json', JSON.stringify(output, null, 2));
  } catch (e) {
    console.log(`Error saving artifacts: ${e.message}`);
  }
};

main();