// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0xB0Ad5b4F823BB2CE82Ab9B3C0CB076d313010FC5',
    blockNumber: '58293392',
    network: 'apothem'
  }