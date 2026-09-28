import { blankLine, newQuote } from './engine.js'

// A worked example so a first-time visitor sees every panel filled in. The
// figures are illustrative; the page says so wherever it is loaded.
export function exampleQuote(number) {
  const q = newQuote(number)
  return {
    ...q,
    buyer: { company: 'Example Buyer GmbH', contact: '', city: 'Kassel', country: 'DE' },
    originPlace: 'Cixi, Zhejiang',
    destPlace: 'Kassel',
    lines: [
      { ...blankLine(), name: 'Brass ball valve DN25', spec: 'PN25 · CW617N', hs: '8481.80', unitCost: '38.50', qty: '12000', perCarton: '50', cartonL: '48', cartonW: '36', cartonH: '30', cartonKg: '24.5', rebateRate: 13, dutyRate: '2.2' },
      { ...blankLine(), name: 'Brass gate valve DN50', spec: 'PN16', hs: '8481.80', unitCost: '96.00', qty: '4000', perCarton: '20', cartonL: '52', cartonW: '40', cartonH: '34', cartonKg: '26', rebateRate: 13, dutyRate: '2.2' },
    ],
    rates: {
      LCL: { freight: '60', origin: '180', haulage: '600', dest: '45', delivery: '450' },
      '20GP': { freight: '1450', origin: '1350', haulage: '1800', dest: '380', delivery: '520' },
      '40GP': { freight: '2300', origin: '1900', haulage: '2200', dest: '520', delivery: '650' },
      '40HQ': { freight: '2380', origin: '1900', haulage: '2200', dest: '520', delivery: '650' },
      AIR: { freight: '4.2', origin: '2', haulage: '400', dest: '0.6', delivery: '250' },
    },
    exportDocs: '450',
    importBroker: '180',
    insuranceRate: 0.15,
    sinosure: 0.3,
    commission: 0,
    margin: 18,
    overhead: 6,
    sheetTerms: ['CIF', 'DAP'],
    example: true,
  }
}
