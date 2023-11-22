// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0x0174522d4150f868C6429cEF45c9246fABF5Dd5b',
    blockNumber: '57208000',
    network: 'apothem'
  }