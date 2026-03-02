export const MOCK_LOCATIONS = [
  {
    id: "LOC001",
    name: "Site Alpha-1",
    lat: 28.622,
    lng: 77.215,
    stationId: "STN001",
    surveyorId: 4,
    status: "pending",
    priority: 2,
    remarks: "",
    images: [
      {
        id: "IMG001A",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        caption: "North view - open sky",
        uploadedAt: "2024-02-15",
      },
      {
        id: "IMG001B",
        url: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
        caption: "Ground stability check",
        uploadedAt: "2024-02-15",
      }
    ],
    accuracy: 98.5,
    elevation: 215,
    submissionDate: "2024-02-15",
    reviewerStatus: "Pending"
  },

  {
    id: "LOC002",
    name: "Site Alpha-2",
    lat: 28.608,
    lng: 77.202,
    stationId: "STN001",
    surveyorId: 4,
    status: "approved",
    priority: 1,
    remarks: "Excellent site",
    images: [
      {
        id: "IMG002A",
        url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        caption: "Clear horizon",
        uploadedAt: "2024-02-10",
      }
    ],
    accuracy: 99.1,
    elevation: 208,
    submissionDate: "2024-02-10",
    reviewerStatus: "Approved"
  },

  {
    id: "LOC003",
    name: "Site Beta-1",
    lat: 28.542,
    lng: 77.388,
    stationId: "STN002",
    surveyorId: 4,
    status: "pending",
    priority: 3,
    remarks: "",
    images: [
      {
        id: "IMG003A",
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        caption: "Obstruction from trees",
        uploadedAt: "2024-02-18",
      }
    ],
    accuracy: 97.2,
    elevation: 198,
    submissionDate: "2024-02-18",
    reviewerStatus: "Under Review"
  },

  {
    id: "LOC004",
    name: "Site Gamma-1",
    lat: 28.465,
    lng: 77.031,
    stationId: "STN003",
    surveyorId: 5,
    status: "rejected",
    priority: 2,
    remarks: "Obstructions found",
    images: [
      {
        id: "IMG004A",
        url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
        caption: "Building interference",
        uploadedAt: "2024-02-12",
      }
    ],
    accuracy: 85.3,
    elevation: 220,
    submissionDate: "2024-02-12",
    reviewerStatus: "Rejected"
  },

  {
    id: "LOC005",
    name: "Site Gamma-2",
    lat: 28.455,
    lng: 77.022,
    stationId: "STN003",
    surveyorId: 5,
    status: "pending",
    priority: 1,
    remarks: "",
    images: [
      {
        id: "IMG005A",
        url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
        caption: "Perfect clear sky",
        uploadedAt: "2024-02-20",
      },
      {
        id: "IMG005B",
        url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d",
        caption: "360° open visibility",
        uploadedAt: "2024-02-20",
      }
    ],
    accuracy: 99.5,
    elevation: 218,
    submissionDate: "2024-02-20",
    reviewerStatus: "Pending"
  },
];