import { getSiteDocument } from "@/lib/site-store";

/** Injecte les tokens thème + CSS global du document publié. */
export async function ThemeStyle() {
  const doc = await getSiteDocument("published");
  const t = doc.settings.theme;
  const extra = doc.settings.customCss?.trim() ?? "";
  const css = `:root{
    --background:${t.background};
    --foreground:${t.foreground};
    --cms-accent:${t.accent};
    --cms-sun:${t.sun};
  }
${extra}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
