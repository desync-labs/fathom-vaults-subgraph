// AS compiler does not like interface
export class Addresses {
    Factory: string
    Accountant: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    Factory: '0xE3E22410ea34661F2b7d5c13EDf7b0c069BD4153',
    Accountant: '0xe732aAd84ed3a55B02FBE7DF10334c4d2a06afBf',
    blockNumber: '60600000',
    network: 'apothem'
  }