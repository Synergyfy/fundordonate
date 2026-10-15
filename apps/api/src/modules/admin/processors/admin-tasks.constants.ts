// Shared identifiers for the admin background queue.
// Kept in a standalone module so both the processor and the services that
// enqueue jobs can import it without creating a circular dependency.

export const ADMIN_TASKS_QUEUE = "admin-tasks";
