// AS compiler does not like interface
export class Addresses {
    Factory: string
    Accountant: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    Factory: '0x78be91dDC9377Ebd57d4f26f5470E233D467Cd15',
    Accountant: '0x699931bFee711A43e7aBa4b0242f88512F9b563F',
    blockNumber: '58780233',
    network: 'apothem'
  }