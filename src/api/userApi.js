// src/api/userApi.js

const BASE_URL = "https://survey.drdesigntech.com/api";

const headers = (token) => ({
  Authorization: `Token ${token}`,   // 🔥 FIX HERE
  "Content-Type": "application/json",
});

/* ---------------- USERS ---------------- */

export const getAllUsers = async (token) => {

  const res = await fetch(`${BASE_URL}/users/`, {
    headers: headers(token)
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return res.json();
};

/* ---------------- PENDING SUPERVISORS ---------------- */

export const getPendingSupervisors = async (token) => {

  const res = await fetch(`${BASE_URL}/pending-supervisors/`, {
    headers: headers(token)
  });

  if (!res.ok) {
    throw new Error("Failed to fetch pending supervisors");
  }

  return res.json();
};

/* ---------------- PENDING SURVEYORS ---------------- */

export const getPendingSurveyors = async (token) => {

  const res = await fetch(`${BASE_URL}/pending-surveyors/`, {
    headers: headers(token)
  });

  if (!res.ok) {
    throw new Error("Failed to fetch pending surveyors");
  }

  return res.json();
};

/* ---------------- APPROVE SUPERVISOR ---------------- */

export const approveSupervisor = async (token, id) => {

  const res = await fetch(`${BASE_URL}/approve-supervisor/${id}/`, {
    method: "POST",
    headers: headers(token)
  });

  if (!res.ok) {
    throw new Error("Failed to approve supervisor");
  }

  return res.json();
};

/* ---------------- APPROVE SURVEYOR ---------------- */

export const approveSurveyor = async (token, id) => {

  const res = await fetch(`${BASE_URL}/approve-surveyor/${id}/`, {
    method: "POST",
    headers: headers(token)
  });

  if (!res.ok) {
    throw new Error("Failed to approve surveyor");
  }

  return res.json();
};