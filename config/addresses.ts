// AS compiler does not like interface
export class Addresses {
    Factory: string
    Accountant: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    Factory: '0x0c6e3fd64D5f33eac0DCCDd887A8c7512bCDB7D6',
    Accountant: '0x427Fd46B341C5a3E1eA19BE11D36E5c526A885d4',
    blockNumber: '72700000',
    network: 'xinfin'
  }