
//hierarchyApi.js

export const fetchHierarchySites = async (token) => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const res = await fetch(
    "https://survey.drdesigntech.com/api/hierarchy/sites/",
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch hierarchy sites");
  }

  return res.json();
};

export const approveSurvey = async (token, locationId, decision, remarks) => {
  const res = await fetch(
    `https://survey.drdesigntech.com/api/survey/${locationId}/approve/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        decision,
        remarks,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Approval action failed");
  }

  return res.json();
};