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

export const getAdminUsers = async (token) => {
  const res = await fetch(`${BASE_URL}/admin/users/`, {
    headers: authHeaders(token),
  });
  return ensureOk(res, "Failed to fetch admin users");
};

export const approveAdminUser = async (token, userId) => {
  const res = await fetch(`${BASE_URL}/admin/user/${userId}/approve/`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return ensureOk(res, "Failed to approve user");
};

export const assignDirectorToSurveyor = async (token, userId, directorId) => {
  const res = await fetch(`${BASE_URL}/admin/user/${userId}/assign-director/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ director_id: directorId }),
  });
  return ensureOk(res, "Failed to assign director");
};

export const changeAdminUserRole = async (token, userId, role) => {
  const res = await fetch(`${BASE_URL}/admin/user/${userId}/change-role/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  return ensureOk(res, "Failed to change role");
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
