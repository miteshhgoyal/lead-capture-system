import { MAX_BUTTON_LABEL, MAX_BUTTON_TEXT, MAX_BUTTONS, MAX_COMMENT_REPLY, MAX_DM_TEXT, MAX_KEYWORD_LEN, MAX_KEYWORDS } from "./config";
import { isSafeHttpsUrl } from "./url-safety";

export interface DmButton {
  label: string;
  url: string;
}

export interface ComposeInput {
  message: string;
  buttons?: DmButton[];
  /** Commenter / sender username when Meta actually gave it to us. */
  username?: string;
  /** Appended when the automation captures email. */
  emailPrompt?: string;
}

export interface ComposedDm {
  text: string;
  buttons: DmButton[];
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

/**
 * Variable substitution: only {{username}} is supported, and only where Meta supplied it (comments, some story events).
 * A first name is never available from the API, so {{first_name}} falls back to "there" instead of guessing.
 */
export function fillVariables(text: string, vars: { username?: string }): string {
  return text
    .replace(/\{\{\s*username\s*\}\}/gi, vars.username ? `@${vars.username.replace(/^@/, "")}` : "there")
    .replace(/\{\{\s*first_?name\s*\}\}/gi, "there");
}

/** Plain-text sanitiser: strips control characters, collapses blank-line runs. */
export const cleanText = (s: string): string => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\n{3,}/g, "\n\n").trim();

export function composeDm(input: ComposeInput): ComposedDm {
  let text = cleanText(fillVariables(input.message, { username: input.username }));
  if (input.emailPrompt) text = `${text}\n\n${cleanText(input.emailPrompt)}`;
  const buttons = (input.buttons ?? []).slice(0, MAX_BUTTONS).filter((b) => b.label.trim() && isSafeHttpsUrl(b.url));
  return { text: clip(text, buttons.length ? MAX_BUTTON_TEXT : MAX_DM_TEXT), buttons: buttons.map((b) => ({ label: clip(cleanText(b.label), MAX_BUTTON_LABEL), url: b.url })) };
}

export interface AutomationInputIssues {
  errors: string[];
}

/** Validation shared by the create/update API (also usable in tests). */
export function validateAutomationContent(a: { dmMessage?: string; buttons?: DmButton[]; commentReplyVariants?: string[]; keywordList?: string[] }): AutomationInputIssues {
  const errors: string[] = [];
  const msg = (a.dmMessage ?? "").trim();
  if (!msg) errors.push("The DM message is required.");
  const limit = (a.buttons?.length ?? 0) > 0 ? MAX_BUTTON_TEXT : MAX_DM_TEXT;
  if (msg.length > limit) errors.push(`The DM message must be at most ${limit} characters${limit === MAX_BUTTON_TEXT ? " when buttons are used" : ""}.`);
  const buttons = a.buttons ?? [];
  if (buttons.length > MAX_BUTTONS) errors.push(`At most ${MAX_BUTTONS} buttons are allowed.`);
  for (const b of buttons) {
    if (!b.label?.trim() || b.label.length > MAX_BUTTON_LABEL) errors.push(`Button labels must be 1-${MAX_BUTTON_LABEL} characters.`);
    if (!isSafeHttpsUrl(b.url ?? "")) errors.push(`"${(b.url ?? "").slice(0, 60)}" is not an allowed link (https only, no private addresses).`);
  }
  for (const v of a.commentReplyVariants ?? []) if (!v.trim() || v.length > MAX_COMMENT_REPLY) errors.push(`Public replies must be 1-${MAX_COMMENT_REPLY} characters.`);
  if ((a.keywordList?.length ?? 0) > MAX_KEYWORDS) errors.push(`At most ${MAX_KEYWORDS} keywords are allowed.`);
  for (const k of a.keywordList ?? []) if (!k.trim() || k.length > MAX_KEYWORD_LEN) errors.push(`Keywords must be 1-${MAX_KEYWORD_LEN} characters.`);
  return { errors: [...new Set(errors)] };
}
