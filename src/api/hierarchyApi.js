
//hierarchyApi.js

const BASE = "https://survey.drdesigntech.com/api";

const throwApiError = async (res, fallbackMessage) => {
  let message = fallbackMessage;

  try {
    const data = await res.json();
    message =
      data?.error ||
      data?.detail ||
      data?.message ||
      fallbackMessage;
  } catch {
    // Keep the fallback message when response body is not JSON.
  }

  throw new Error(message);
};

/* ---------------- FETCH DATA BY ROLE ---------------- */

export const fetchHierarchySites = async (token, role) => {

  let endpoint = "";

  if (role === "SUPERVISOR") endpoint = "/supervisor/surveys/";
  if (role === "DIRECTOR") endpoint = "/director/subsites/";
  if (role === "ZONAL_CHIEF") endpoint = "/zonal/subsites/";
  if (role === "GNRB") endpoint = "/gnrb/subsites/";

  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!res.ok) await throwApiError(res, "Failed to fetch hierarchy data");

  return res.json();
};

/* ---------------- SUPERVISOR APPROVAL ---------------- */

export const supervisorDecision = async (
  token,
  surveyId,
  decision,
  remarks
) => {

  const res = await fetch(
    `${BASE}/survey/${surveyId}/supervisor/submit/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        decision,
        remarks
      }),
    }
  );

  if (!res.ok) await throwApiError(res, "Supervisor action failed");

  return res.json();
};

/* ---------------- UPDATE SUBSITE PRIORITY (SUPERVISOR) ---------------- */

export const updateSubsitePriority = async (
  token,
  surveyId,
  subsiteId,
  priority
) => {
  return updateSupervisorSubsite(token, surveyId, {
    subsiteId,
    priority,
  });
};

export const updateSupervisorSubsite = async (
  token,
  surveyId,
  { subsiteId, remarks, priority, nocFile }
) => {
  const formData = new FormData();

  formData.append("subsite_id", subsiteId);

  if (typeof priority === "number") {
    formData.append("priority", String(priority));
  }

  if (typeof remarks === "string") {
    formData.append("remark", remarks);
    formData.append("remarks", remarks);
  }

  if (nocFile) {
    formData.append("NOC", nocFile);
  }

  const res = await fetch(
    `${BASE}/survey/${surveyId}/supervisor/`,
    {
      method: "PUT",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) await throwApiError(res, "Supervisor subsite update failed");

  return res.json();
};

export const submitSupervisorSurvey = async (token, surveyId) => {
  const res = await fetch(
    `${BASE}/survey/${surveyId}/supervisor/submit/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!res.ok) await throwApiError(res, "Supervisor submit failed");

  return res.json();
};

export const supervisorSubsiteDecision = async (
  token,
  surveyId,
  subsiteId,
  decision,
  remarks
) => {
  const res = await fetch(
    `${BASE}/survey/${surveyId}/supervisor/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        subsite_id: subsiteId,
        decision,
        remarks,
      }),
    }
  );

  if (!res.ok) await throwApiError(res, "Supervisor subsite decision failed");

  return res.json();
};

/* ---------------- DIRECTOR DECISION ---------------- */

export const directorDecision = async (
  token,
  subsiteId,
  decision,
  remarks
) => {

  const res = await fetch(
    `${BASE}/subsite/${subsiteId}/director-decision/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        decision,
        remarks
      }),
    }
  );

  if (!res.ok) await throwApiError(res, "Director decision failed");

  return res.json();
};

/* ---------------- ZONAL CHIEF DECISION ---------------- */

export const zonalDecision = async (
  token,
  subsiteId,
  decision,
  remarks
) => {

  const res = await fetch(
    `${BASE}/subsite/${subsiteId}/zonal-decision/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        decision,
        remarks
      }),
    }
  );

  if (!res.ok) await throwApiError(res, "Zonal decision failed");

  return res.json();
};

/* ---------------- GNRB FINAL DECISION ---------------- */

export const gnrbDecision = async (
  token,
  subsiteId,
  decision,
  remarks
) => {

  const res = await fetch(
    `${BASE}/subsite/${subsiteId}/gnrb-decision/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        decision,
        remarks
      }),
    }
  );

  if (!res.ok) await throwApiError(res, "GNRB decision failed");

  return res.json();
};

/* ---------------- SEND TO ZONAL (DIRECTOR) ---------------- */

export const sendToZonal = async (token, subsiteId) => {

  const res = await fetch(
    `${BASE}/subsite/${subsiteId}/send-to-zonal/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!res.ok) await throwApiError(res, "Failed to send to zonal");

  return res.json();
};

export const updateDirectorSubsite = async (
  token,
  subsiteId,
  { remarks, priority, nocFile } = {}
) => {
  const hasPriority = typeof priority === "number";
  const hasRemarks = typeof remarks === "string" && remarks.trim().length > 0;
  const hasNoc = Boolean(nocFile);

  if (!hasPriority && !hasRemarks && !hasNoc) {
    return sendToZonal(token, subsiteId);
  }

  const formData = new FormData();

  if (hasPriority) {
    formData.append("priority", String(priority));
  }

  if (typeof remarks === "string") {
    formData.append("remarks", remarks);
  }

  if (hasNoc) {
    formData.append("noc", nocFile);
  }

  const res = await fetch(
    `${BASE}/subsite/${subsiteId}/send-to-zonal/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) await throwApiError(res, "Director subsite update failed");

  return res.json();
};
