const FINAL_APPROVED_STATUSES = new Set([
  "FINAL_APPROVED",
  "GNRB_APPROVED",
  "APPROVED",
]);

const ROLE_ACTIONABLE_STATUS = {
  SUPERVISOR: new Set(["SUBMITTED"]),
  DIRECTOR: new Set(["SUPERVISOR_APPROVED"]),
  // Backend transition: Director must explicitly forward to zonal.
  ZONAL_CHIEF: new Set(["SENT_TO_ZONAL"]),
  // Final authority can act after zonal approval or explicit GNRB handoff.
  GNRB: new Set(["ZONAL_CHIEF_APPROVED", "SENT_TO_GNRB"]),
};

const ROLE_SUBMIT_STATUS = {
  DIRECTOR: new Set(["DIRECTOR_APPROVED"]),
};

const PENDING_COLOR = {
  background: "#f59e0b22",
  color: "#f59e0b",
};

const REJECTED_COLOR = {
  background: "#ef444422",
  color: "#ef4444",
};

const INTERMEDIATE_APPROVED_COLOR = {
  background: "#3b82f622",
  color: "#3b82f6",
};

const FINAL_APPROVED_COLOR = {
  background: "#10b98122",
  color: "#10b981",
};

export const normalizeWorkflowStatus = (status) =>
  String(status || "").trim().toUpperCase();

export const isFinalApprovedStatus = (status) =>
  FINAL_APPROVED_STATUSES.has(normalizeWorkflowStatus(status));

export const isRejectedStatus = (status) =>
  normalizeWorkflowStatus(status).includes("REJECT");

export const canRoleTakeSubsiteAction = (role, status) => {
  const normalizedStatus = normalizeWorkflowStatus(status);
  if (!normalizedStatus || isFinalApprovedStatus(normalizedStatus) || isRejectedStatus(normalizedStatus)) {
    return false;
  }

  return ROLE_ACTIONABLE_STATUS[role]?.has(normalizedStatus) || false;
};

export const canRoleSubmitToNextLevel = (role, status) => {
  const normalizedStatus = normalizeWorkflowStatus(status);
  if (!normalizedStatus || isRejectedStatus(normalizedStatus)) return false;
  return ROLE_SUBMIT_STATUS[role]?.has(normalizedStatus) || false;
};

export const getStatusStyleForRole = (status, role) => {
  const normalizedStatus = normalizeWorkflowStatus(status);

  if (!normalizedStatus || normalizedStatus === "PENDING" || normalizedStatus === "DRAFT") {
    return PENDING_COLOR;
  }

  if (isRejectedStatus(normalizedStatus)) {
    return REJECTED_COLOR;
  }

  if (isFinalApprovedStatus(normalizedStatus)) {
    return FINAL_APPROVED_COLOR;
  }

  if (
    canRoleTakeSubsiteAction(role, normalizedStatus) ||
    canRoleSubmitToNextLevel(role, normalizedStatus) ||
    normalizedStatus.startsWith("SENT_TO_") ||
    normalizedStatus === "SUBMITTED"
  ) {
    return PENDING_COLOR;
  }

  if (normalizedStatus.includes("APPROVED")) {
    return INTERMEDIATE_APPROVED_COLOR;
  }

  return PENDING_COLOR;
};

export const getStatusDotColorForRole = (status, role) =>
  getStatusStyleForRole(status, role).color;
