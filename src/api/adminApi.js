const BASE_URL = "https://survey.drdesigntech.com/api";

const authHeaders = (token) => ({
  Authorization: `Token ${token}`,
  "Content-Type": "application/json",
});

const ensureOk = async (res, fallbackMessage) => {
  if (res.ok) {
    try {
      return await res.json();
    } catch (err) {
      return {};
    }
  }

  let message = fallbackMessage;
  try {
    const data = await res.json();
    message = data?.detail || data?.message || fallbackMessage;
  } catch (err) {
    // ignore parse errors and keep fallback
  }
  throw new Error(message);
};

const tryMutationWithFallbacks = async ({
  token,
  endpoints,
  payload,
  fallbackMessage,
  methods = ["POST", "PATCH", "PUT"],
}) => {
  const body = JSON.stringify(payload);
  let lastResponse = null;

  for (const endpoint of endpoints) {
    for (const method of methods) {
      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(token),
        body,
      });

      if (res.ok) {
        return ensureOk(res, fallbackMessage);
      }

      if (res.status === 404 || res.status === 405) {
        lastResponse = res;
        continue;
      }

      return ensureOk(res, fallbackMessage);
    }
  }

  if (lastResponse) {
    return ensureOk(lastResponse, fallbackMessage);
  }

  throw new Error(fallbackMessage);
};

export const getAdminUsers = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/users/`, {
    headers: authHeaders(token),
  });
  return ensureOk(res, "Failed to fetch admin users");
};

export const approveAdminUser = async (token, userId, action = "APPROVE") => {
  const normalizedAction = action === "REJECT" ? "REJECT" : "APPROVE";
  const fallbackMessage =
    normalizedAction === "REJECT" ? "Failed to reject user" : "Failed to approve user";

  return tryMutationWithFallbacks({
    token,
    endpoints: [
      `${BASE_URL}/admin/user/${userId}/approve/`,
      `${BASE_URL}/admin/users/${userId}/approve/`,
    ],
    payload: { action: normalizedAction },
    fallbackMessage,
  });
};

export const assignDirectorToSurveyor = async (token, userId, directorId) => {
  return tryMutationWithFallbacks({
    token,
    endpoints: [
      `${BASE_URL}/admin/user/${userId}/assign-director/`,
      `${BASE_URL}/admin/users/${userId}/assign-director/`,
      `${BASE_URL}/admin/user/${userId}/assign_director/`,
      `${BASE_URL}/admin/users/${userId}/assign_director/`,
    ],
    payload: { director_id: directorId },
    fallbackMessage: "Failed to assign director",
  });
};

export const changeAdminUserRole = async (token, userId, role) => {
  return tryMutationWithFallbacks({
    token,
    endpoints: [
      `${BASE_URL}/admin/user/${userId}/change-role/`,
      `${BASE_URL}/admin/users/${userId}/change-role/`,
      `${BASE_URL}/admin/user/${userId}/change_role/`,
      `${BASE_URL}/admin/users/${userId}/change_role/`,
    ],
    payload: { role },
    fallbackMessage: "Failed to change role",
  });
};

export const getAdminSurveys = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/surveys/`, {
    headers: authHeaders(token),
  });
  return ensureOk(res, "Failed to fetch admin surveys");
};

export const getAdminDistricts = async (token) => {
  const res = await fetch(`${BASE_URL}/districtsdb/`, {
    headers: authHeaders(token),
  });
  return ensureOk(res, "Failed to fetch districts");
};

export const getAdminStations = async (token) => {
  const res = await fetch(`${BASE_URL}/stationsdb/`, {
    headers: authHeaders(token),
  });
  return ensureOk(res, "Failed to fetch stations");
};
