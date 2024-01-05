// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0x4763E9478bA03Acc8a927BCd7600f1862F6126b9',
    blockNumber: '58464826',
    network: 'apothem'
  }