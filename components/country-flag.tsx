import { getCountryFlagUrl, getCountryName } from "@/lib/utils/countries";
import { cn } from "@/lib/utils";

type CountryFlagProps = {
  code?: string | null;
  className?: string;
  title?: string;
};

export function CountryFlag({ code, className, title }: CountryFlagProps) {
  const src = getCountryFlagUrl(code);
  if (!src) {
    return null;
  }

  const name = title ?? getCountryName(code) ?? undefined;

  return (
    <img
      src={src}
      alt={name ?? ""}
      title={name}
      className={cn(
        "inline-block shrink-0 rounded-xs object-cover",
        className,
      )}
    />
  );
}
