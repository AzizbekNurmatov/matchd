export type FootballCountry = {
  code: string;
  name: string;
};

export const FOOTBALL_COUNTRIES: FootballCountry[] = [
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "GB-ENG", name: "England" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "IN", name: "India" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "CI", name: "Ivory Coast" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "GB-NIR", name: "Northern Ireland" },
  { code: "NO", name: "Norway" },
  { code: "PE", name: "Peru" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "GB-SCT", name: "Scotland" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "GB-WLS", name: "Wales" },
];

const ISO_CODE = /^[A-Z]{2}$/;
const SUBDIVISION_CODE = /^[A-Z]{2}-[A-Z]{2,3}$/;

export function getCountryFlag(countryCode?: string | null): string {
  if (!countryCode) {
    return "";
  }

  const code = countryCode.trim().toUpperCase();
  if (!code) {
    return "";
  }

  // Unicode has no Northern Ireland flag; use the UK flag instead.
  if (code === "GB-NIR") {
    return getCountryFlag("GB");
  }

  if (SUBDIVISION_CODE.test(code)) {
    const tags = code.replace(/-/g, "").toLowerCase();
    return String.fromCodePoint(
      0x1f3f4,
      ...[...tags].map((char) => 0xe0000 + char.charCodeAt(0)),
      0xe007f,
    );
  }

  if (!ISO_CODE.test(code)) {
    return "";
  }

  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
}

export function getCountryName(countryCode?: string | null): string | null {
  if (!countryCode) {
    return null;
  }

  const code = countryCode.trim().toUpperCase();
  return FOOTBALL_COUNTRIES.find((country) => country.code === code)?.name ?? null;
}

export function isFootballCountryCode(value: string): boolean {
  return FOOTBALL_COUNTRIES.some((country) => country.code === value);
}
