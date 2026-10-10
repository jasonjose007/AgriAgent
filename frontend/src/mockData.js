export const MOCK_RESPONSE = {
  reply: `### Eligible Government Schemes (4 Acres — Rice, Thanjavur)

**1. PM-KISAN Samman Nidhi**
- **Benefit:** Rs 6,000 per year in 3 installments directly to your bank account.
- **Documents:** Aadhaar Card, Patta/Chitta, Bank passbook.

**2. Pradhan Mantri Fasal Bima Yojana (PMFBY)**
- **Benefit:** Crop insurance at 2% premium for Kharif, 1.5% for Rabi.
- **Documents:** Aadhaar, Land records, Sowing certificate.

**3. TN State Crop Insurance (TNSCIS)**
- **Benefit:** Additional state-level top-up, Rs 20,000–40,000 coverage.

**4. Sub-Mission on Agricultural Mechanization (SMAM)**
- **Benefit:** 50–80% subsidy on farm machinery.

---

### Current Market Price — Rice, Thanjavur APMC
- **Modal Price:** Rs 2,180/quintal
- **Range:** Rs 2,050 – Rs 2,320/quintal
- **MSP:** Rs 2,300 — current market is Rs 120 below MSP. Consider govt procurement.

### Weather — Thanjavur
- 33°C, 78% humidity, partly cloudy with light showers.
- **Advisory:** Avoid pesticide spraying during rain. Ensure field drainage.

*This is a draft — please verify at your nearest CSC or agriculture office.*`,

  tool_calls: [
    {
      tool_name: 'match_agri_schemes',
      arguments: { crop_type: 'rice', acreage: 4, region: 'Thanjavur' },
      result: {
        farmer_profile: { crop: 'rice', acreage_acres: 4, region: 'Thanjavur' },
        matched_schemes: [
          {
            scheme_id: 'PMKISAN',
            name: 'PM-KISAN Samman Nidhi',
            benefit: 'Rs 6,000/year in 3 installments directly to bank account',
            documents_required: [
              'Aadhaar Card',
              'Land ownership records (patta/chitta)',
              'Bank account with IFSC',
              'Mobile number linked to Aadhaar',
            ],
            apply_url: 'https://pmkisan.gov.in',
            eligibility_status: 'LIKELY ELIGIBLE (draft — verify at nearest CSC)',
          },
          {
            scheme_id: 'PMFBY',
            name: 'Pradhan Mantri Fasal Bima Yojana',
            benefit: 'Crop insurance at 2% premium for Kharif, 1.5% for Rabi',
            documents_required: [
              'Aadhaar Card',
              'Land records / tenancy agreement',
              'Sowing certificate from agriculture officer',
              'Bank account passbook',
            ],
            apply_url: 'https://pmfby.gov.in',
            eligibility_status: 'LIKELY ELIGIBLE (draft — verify at nearest CSC)',
          },
          {
            scheme_id: 'TN_CROP_INSURANCE',
            name: 'TN State Crop Insurance (TNSCIS)',
            benefit: 'Additional state-level crop insurance top-up, Rs 20,000-40,000 coverage',
            documents_required: [
              'Aadhaar Card',
              'Land records',
              'Crop sowing certificate',
              'Village administrative officer certificate',
            ],
            apply_url: 'https://www.tn.gov.in/scheme/data_view/6738',
            eligibility_status: 'LIKELY ELIGIBLE (draft — verify at nearest CSC)',
          },
          {
            scheme_id: 'SMAM',
            name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
            benefit: '50-80% subsidy on farm machinery (tractors, harvesters, tillers)',
            documents_required: [
              'Aadhaar Card',
              'Land records',
              'Quotation from authorized dealer',
              'Bank account details',
              'Caste certificate (for SC/ST/women higher subsidy)',
            ],
            apply_url: 'https://agrimachinery.nic.in',
            eligibility_status: 'LIKELY ELIGIBLE (draft — verify at nearest CSC)',
          },
        ],
        total_matches: 4,
        disclaimer: 'This is a draft eligibility check. Visit your nearest CSC or agriculture office.',
        generated_at: new Date().toISOString(),
      },
    },
    {
      tool_name: 'fetch_mandi_and_weather',
      arguments: { district: 'Thanjavur', commodity: 'rice' },
      result: {
        district: 'Thanjavur',
        commodity: 'rice',
        market_price: {
          modal_price: 2180,
          min_price: 2050,
          max_price: 2320,
          mandi: 'Thanjavur APMC',
          unit: 'per quintal',
          date: '2026-10-10',
          msp_comparison: 'Market price is Rs 120/qtl BELOW MSP (Rs 2300). Consider selling via govt procurement.',
        },
        weather: {
          temperature_c: 33,
          humidity_pct: 78,
          rainfall_mm: 12,
          condition: 'Partly Cloudy with light showers',
          forecast_3day: 'Moderate rain expected. Good for transplanting paddy.',
          advisory: 'Avoid pesticide spraying during rain. Ensure field drainage.',
        },
      },
    },
  ],
  model_used: 'gemini-3.8-flash',
}
