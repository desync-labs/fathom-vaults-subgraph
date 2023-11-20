// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0xbe401B027d4D21716c6bd5Be351520E880D764dB',
    blockNumber: '56840754',
    network: 'apothem'
  }