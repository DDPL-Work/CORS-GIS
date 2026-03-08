
//hierarchyApi.js

const BASE = "https://survey.drdesigntech.com/api";

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

  if (!res.ok) throw new Error("Failed to fetch hierarchy data");

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
    `${BASE}/survey/${surveyId}/supervisor/`,
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

  if (!res.ok) throw new Error("Supervisor action failed");

  return res.json();
};

/* ---------------- UPDATE SUBSITE PRIORITY (SUPERVISOR) ---------------- */

export const updateSubsitePriority = async (token, subsiteId, priority) => {

  const res = await fetch(
    `${BASE}/subsite/${subsiteId}/priority/`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        priority
      }),
    }
  );

  if (!res.ok) throw new Error("Priority update failed");

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

  if (!res.ok) throw new Error("Director decision failed");

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

  if (!res.ok) throw new Error("Zonal decision failed");

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

  if (!res.ok) throw new Error("GNRB decision failed");

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

  if (!res.ok) throw new Error("Failed to send to zonal");

  return res.json();
};



