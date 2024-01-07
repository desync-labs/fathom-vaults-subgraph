// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0xa325128620749556D9AA3b1b3515B416364eE213',
    blockNumber: '58513233',
    network: 'apothem'
  }