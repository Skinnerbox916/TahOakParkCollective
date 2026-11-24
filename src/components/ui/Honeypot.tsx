/**
 * A form field people never see. Bots that fill every input fill this one,
 * and the API quietly drops their submission (src/lib/rate-limit.ts).
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Homepage
        <input type="text" name="homepage" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** The honeypot's value from a form element (empty for people). */
export function honeypotValue(form: HTMLFormElement | null): string {
  return (form?.elements.namedItem("homepage") as HTMLInputElement | null)?.value ?? "";
}
