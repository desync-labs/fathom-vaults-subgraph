// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0x50Af347866A1C2BdA1b29d896cE054FF18225C91',
    blockNumber: '58251668',
    network: 'apothem'
  }