import { ValidationError } from "@/lib/normalizeEntityInput";

export { ValidationError };

/** An error the entity service expects; routes turn it into an HTTP response. */
export class EntityServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "EntityServiceError";
  }
}

export class NotFoundError extends EntityServiceError {
  constructor(what = "Entity") {
    super(`${what} not found`, 404, "not_found");
  }
}

export class ForbiddenError extends EntityServiceError {
  constructor(message = "You can't change this listing") {
    super(message, 403, "forbidden");
  }
}

/** The entity changed after the editor loaded it. */
export class StaleVersionError extends EntityServiceError {
  constructor(currentVersion?: number) {
    super("This listing changed since you opened it. Reload and try again.", 409, "stale_version", {
      currentVersion,
    });
  }
}

/** A proposal touches fields that changed after it was submitted. */
export class ConflictError extends EntityServiceError {
  constructor(public readonly fields: string[]) {
    super(
      `The listing changed since this was submitted: ${fields.join(", ")}. Edit the proposal to rebase it, then approve.`,
      409,
      "conflict",
      { fields }
    );
  }
}

export class AlreadyProcessedError extends EntityServiceError {
  constructor() {
    super("This approval was already processed", 409, "already_processed");
  }
}

export class NoChangesError extends EntityServiceError {
  constructor() {
    super("Nothing changed", 400, "no_changes");
  }
}
