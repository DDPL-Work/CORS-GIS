import { fetchHierarchySites } from "../api/hierarchyApi";

export const reloadHierarchySites = async (dispatch, token, role) => {
  if (!token || !role) return [];

  dispatch({ type: "SET_LOADING_HIERARCHY", payload: true });

  try {
    const data = await fetchHierarchySites(token, role);
    const normalized = Array.isArray(data) ? data : [];

    dispatch({
      type: "SET_HIERARCHY_SITES",
      payload: normalized,
    });

    return normalized;
  } finally {
    dispatch({ type: "SET_LOADING_HIERARCHY", payload: false });
  }
};

export const findParentSiteBySubsiteId = (hierarchySites, subsiteId) => {
  if (!Array.isArray(hierarchySites) || !subsiteId) return null;

  return (
    hierarchySites.find((site) =>
      Array.isArray(site.subsites) &&
      site.subsites.some((subsite) => subsite.id === subsiteId)
    ) || null
  );
};

export const findSubsiteById = (hierarchySites, subsiteId) => {
  const parentSite = findParentSiteBySubsiteId(hierarchySites, subsiteId);
  if (!parentSite) return null;

  return parentSite.subsites.find((subsite) => subsite.id === subsiteId) || null;
};

export const getActorLabelForRole = (role) => {
  if (role === "SUPERVISOR") return "Surveyor";
  if (role === "DIRECTOR") return "Supervisor";
  if (role === "ZONAL_CHIEF") return "Director";
  if (role === "GNRB") return "Zonal Chief";
  return "User";
};

export const getSitePriority = (site) => {
  const priorities = (site?.subsites || [])
    .map((subsite) => Number(subsite.priority))
    .filter((priority) => Number.isFinite(priority));

  if (priorities.length > 0) {
    return Math.min(...priorities);
  }

  const sitePriority = Number(site?.priority);
  return Number.isFinite(sitePriority) ? sitePriority : null;
};

export const summarizeSiteLocations = (site) => {
  const names = (site?.subsites || [])
    .map((subsite) => subsite.location)
    .filter(Boolean);

  if (names.length === 0) return "-";
  if (names.length <= 3) return names.join(", ");

  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
};
