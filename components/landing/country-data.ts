export interface CountryOption {
  name: string;
  code: string; // ISO 2-letter
  dialCode: string; // e.g. "+91"
}

export const COUNTRIES: CountryOption[] = [
  { name: "India", code: "IN", dialCode: "+91" },
  { name: "United States", code: "US", dialCode: "+1" },
  { name: "United Kingdom", code: "GB", dialCode: "+44" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
  { name: "Canada", code: "CA", dialCode: "+1" },
  { name: "Australia", code: "AU", dialCode: "+61" },
  { name: "Singapore", code: "SG", dialCode: "+65" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
  { name: "Qatar", code: "QA", dialCode: "+974" },
  { name: "Kuwait", code: "KW", dialCode: "+965" },
  { name: "Oman", code: "OM", dialCode: "+968" },
  { name: "Bahrain", code: "BH", dialCode: "+973" },
  { name: "Germany", code: "DE", dialCode: "+49" },
  { name: "France", code: "FR", dialCode: "+33" },
  { name: "Malaysia", code: "MY", dialCode: "+60" },
  { name: "Nepal", code: "NP", dialCode: "+977" },
  { name: "Bangladesh", code: "BD", dialCode: "+880" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94" },
  { name: "New Zealand", code: "NZ", dialCode: "+64" },
  { name: "South Africa", code: "ZA", dialCode: "+27" },
  { name: "Netherlands", code: "NL", dialCode: "+31" },
  { name: "Switzerland", code: "CH", dialCode: "+41" },
  { name: "Ireland", code: "IE", dialCode: "+353" },
  { name: "Mauritius", code: "MU", dialCode: "+230" },
  { name: "Other Country", code: "XX", dialCode: "+1" },
];
