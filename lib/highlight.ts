import { codeToHtml } from "shiki";

export function highlight(code: string, lang: string) {
  return codeToHtml(code.trim(), {
    lang,
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    defaultColor: false,
  });
}
