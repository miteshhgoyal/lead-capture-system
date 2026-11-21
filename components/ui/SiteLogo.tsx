/** The site logo from /public: logo-light.png on the light theme, logo-dark.png on the dark theme. */
export const SITE_LOGO_LIGHT = "/logo-light.png";
export const SITE_LOGO_DARK = "/logo-dark.png";

export function SiteLogo({ className = "h-9", alt = "Free Course Link" }: { className?: string; alt?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SITE_LOGO_LIGHT} alt={alt} className={`${className} w-auto object-contain dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SITE_LOGO_DARK} alt="" aria-hidden="true" className={`${className} hidden w-auto object-contain dark:block`} />
    </>
  );
}
