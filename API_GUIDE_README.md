# Survey Application - API Documentation

Complete API reference for the Survey Application with all endpoints, payloads, and frontend integration details.

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [Survey Management APIs](#survey-management-apis)
4. [Subsite Management APIs](#subsite-management-apis)
5. [Survey Data Collection APIs](#survey-data-collection-apis)
6. [Approval Workflow APIs](#approval-workflow-apis)
7. [RINEX File Management APIs](#rinex-file-management-apis)
8. [Map and Location APIs](#map-and-location-apis)
9. [Common Response Formats](#common-response-formats)

---

## Authentication APIs

### 1. User Signup
**Endpoint:** `POST /api/signup/`

**Description:** Register a new user in the system.

**Permission:** AllowAny

**Request Payload:**
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "mobile": "string",
  "role": "SURVEYOR|SUPERVISOR|DIRECTOR|GNRB|ZONAL_CHIEF",
  "zone": "string",
  "director": "uuid (only required for SURVEYOR)"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Waiting for approval.",
  "user_id": "uuid",
  "username": "string",
  "role": "string",
  "zone": "string",
  "director": "string or null"
}
```

**Frontend Usage:** Signup form, new user registration page

---

### 2. User Login
**Endpoint:** `POST /api/login/`

**Description:** Authenticate user and obtain authentication token.

**Permission:** AllowAny

**Request Payload:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user_id": "uuid",
  "username": "string",
  "role": "string",
  "token": "authentication_token"
}
```

**Frontend Usage:** Login page, authentication mechanism

---

### 3. Logout
**Endpoint:** `POST /api/logout/`

**Description:** Logout user and invalidate token.

**Permission:** IsAuthenticated

**Request Payload:** None

**Response:**
```json
{
  "message": "Logout successful"
}
```

**Frontend Usage:** Logout functionality, session termination

---

### 4. Forgot Password
**Endpoint:** `POST /api/forgot-password/`

**Description:** Generate OTP and send to user email.

**Permission:** AllowAny

**Request Payload:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

**Frontend Usage:** Forgot password page, email verification

---

### 5. Reset Password
**Endpoint:** `POST /api/reset-password/`

**Description:** Reset password using OTP.

**Permission:** AllowAny

**Request Payload:**
```json
{
  "email": "string",
  "otp": "string (6 digits)",
  "new_password": "string",
  "confirm_password": "string"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

**Frontend Usage:** Password reset form, OTP verification

---

### 6. Get Directors by Zone
**Endpoint:** `GET /api/directors_by_zone/`

**Description:** Get list of all directors in a specific zone.

**Permission:** AllowAny

**Query Parameters:**
```
zone: string
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "username": "string"
  }
]
```

**Frontend Usage:** Dropdown in surveyor signup, zone-based director selection

---

## User Management APIs

### 1. Get All Users
**Endpoint:** `GET /api/users/`

**Description:** Retrieve all users in the system.

**Permission:** IsAuthenticated

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "email": "string",
    "mobile": "string",
    "role": "string",
    "zone": "string",
    "created_at": "datetime"
  }
]
```

**Frontend Usage:** User management dashboard, admin panel

---

### 2. Get Users by Role
**Endpoint:** `GET /api/users/role/{role}/`

**Description:** Get all users with a specific role.

**Permission:** IsAuthenticated

**Path Parameters:**
```
role: SURVEYOR|SUPERVISOR|DIRECTOR|GNRB|ZONAL_CHIEF|ADMIN
```

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "email": "string",
    "mobile": "string",
    "role": "string",
    "zone": "string",
    "created_at": "datetime"
  }
]
```

**Frontend Usage:** User filtering by role, role-based dashboards

---

### 3. Get Pending Surveyors (Requiring Approval)
**Endpoint:** `GET /api/pending-surveyors/`

**Description:** Get list of surveyors awaiting approval (Supervisor only).

**Permission:** IsAuthenticated (Supervisor role required)

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "email": "string"
  }
]
```

**Frontend Usage:** Supervisor dashboard, surveyor approval list

---

### 4. Approve Surveyor
**Endpoint:** `POST /api/approve-surveyor/{user_id}/`

**Description:** Approve a surveyor registration (Supervisor only).

**Permission:** IsAuthenticated (Supervisor role required)

**Path Parameters:**
```
user_id: uuid
```

**Request Payload:** None

**Response:**
```json
{
  "message": "Surveyor approved successfully"
}
```

**Frontend Usage:** Approval button in surveyor list

---

### 5. Get Pending Supervisors (Requiring Approval)
**Endpoint:** `GET /api/pending-supervisors/`

**Description:** Get list of supervisors awaiting approval (Director only).

**Permission:** IsAuthenticated (Director role required)

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "email": "string"
  }
]
```

**Frontend Usage:** Director dashboard, supervisor approval list

---

### 6. Approve Supervisor
**Endpoint:** `POST /api/approve-supervisor/{user_id}/`

**Description:** Approve a supervisor registration (Director only).

**Permission:** IsAuthenticated (Director role required)

**Path Parameters:**
```
user_id: uuid
```

**Request Payload:** None

**Response:**
```json
{
  "message": "Supervisor approved successfully"
}
```

**Frontend Usage:** Approval button in supervisor list

---

## Survey Management APIs

### 1. Create Survey
**Endpoint:** `POST /api/survey/create_site/`

**Description:** Create a new survey with location hierarchy.

**Permission:** IsAuthenticated

**Request Payload:**
```json
{
  "state": "uuid",
  "district": "uuid",
  "subdistrict": "uuid",
  "station": "uuid",
  "remarks": "string (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "state": "uuid",
  "state_name": "string",
  "district": "uuid",
  "district_name": "string",
  "subdistrict": "uuid",
  "subdistrict_name": "string",
  "station": "uuid",
  "station_name": "string",
  "status": "DRAFT",
  "remarks": "string",
  "created_at": "datetime"
}
```

**Frontend Usage:** Survey creation form, first step in survey workflow

---

### 2. Get Survey by ID
**Endpoint:** `GET /api/survey/create_site/{survey_id}/`

**Description:** Retrieve details of a specific survey.

**Permission:** IsAuthenticated

**Path Parameters:**
```
survey_id: uuid
```

**Response:** (Single survey object as in Create Survey response)

**Frontend Usage:** Survey detail view, edit existing survey

---

### 3. Get All My Surveys
**Endpoint:** `GET /api/survey/create_site/`

**Description:** Retrieve all surveys created by current user.

**Permission:** IsAuthenticated

**Response:**
```json
[
  {
    "id": "uuid",
    "state": "uuid",
    "state_name": "string",
    "district": "uuid",
    "district_name": "string",
    "subdistrict": "uuid",
    "subdistrict_name": "string",
    "station": "uuid",
    "station_name": "string",
    "status": "DRAFT|SUBMITTED|SUPERVISOR_APPROVED|...",
    "remarks": "string",
    "created_at": "datetime"
  }
]
```

**Frontend Usage:** Survey list page, dashboard

---

### 4. Update Survey
**Endpoint:** `PUT /api/survey/create_site/{survey_id}/`

**Description:** Update survey details (partial update).

**Permission:** IsAuthenticated (Owner only)

**Path Parameters:**
```
survey_id: uuid
```

**Request Payload:**
```json
{
  "state": "uuid (optional)",
  "district": "uuid (optional)",
  "subdistrict": "uuid (optional)",
  "station": "uuid (optional)",
  "remarks": "string (optional)"
}
```

**Response:** (Updated survey object)

**Frontend Usage:** Edit survey form

---

### 5. Delete Survey
**Endpoint:** `DELETE /api/survey/create_site/{survey_id}/`

**Description:** Delete a survey.

**Permission:** IsAuthenticated (Owner only)

**Path Parameters:**
```
survey_id: uuid
```

**Response:**
```json
{
  "message": "Survey deleted successfully"
}
```

**Frontend Usage:** Delete survey button, draft surveys

---

### 6. Get Full Survey Data
**Endpoint:** `GET /api/survey/{survey_id}/full_data/`

**Description:** Get complete survey data with all subsites and their details.

**Permission:** IsAuthenticated

**Path Parameters:**
```
survey_id: uuid
```

**Response:**
```json
{
  "survey_id": "uuid",
  "site_name": "string",
  "status": "string",
  "surveyor": "string",
  "director": "string",
  "subsites": [
    {
      "subsite_id": "uuid",
      "subsite_name": "string",
      "priority": "integer",
      "status": "string",
      "rinex_file": "url or null",
      "location": {
        "id": "uuid",
        "latitude": "float",
        "longitude": "float",
        "address": "string",
        "city": "string",
        "district": "string",
        "state": "string"
      },
      "monument": {
        "id": "uuid",
        "monument_type": "ROOFTOP|GROUND",
        "building_stories": "integer or null",
        "site_conditions": ["string"]
      },
      "sky_visibility": {
        "id": "uuid",
        "polar_chart_image": "url or null",
        "multipath_emi_source": [
          {
            "source": "string",
            "direction": "string",
            "approx_distance_meter": "integer",
            "other_text": "string or null"
          }
        ],
        "remarks": "string"
      },
      "power": {
        "id": "uuid",
        "ac_grid": "boolean",
        "ac_grid_distance_meter": "integer or null",
        "solar_possible": "boolean",
        "solar_exposure_hours": "float"
      },
      "connectivity": {
        "id": "uuid",
        "gsm_4g": ["string"],
        "others_gsm_4g": "string or null",
        "broadband": ["string"],
        "others_broadband": "string or null",
        "fiber": ["string"],
        "others_fiber": "string or null",
        "airfiber": ["string"],
        "others_airfiber": "string or null",
        "remarks": "string"
      },
      "photo": {
        "id": "uuid",
        "north_photo": "url or null",
        "east_photo": "url or null",
        "south_photo": "url or null",
        "west_photo": "url or null",
        "captured_at": "datetime"
      }
    }
  ]
}
```

**Frontend Usage:** Complete survey view, review before submission

---

### 7. List My Surveys
**Endpoint:** `GET /api/survey/my-sites/`

**Description:** Get all surveys for current user with full details.

**Permission:** IsAuthenticated

**Response:**
```json
{
  "count": "integer",
  "surveys": [
    {
      "id": "uuid",
      "state": "uuid",
      "state_name": "string",
      "district": "uuid",
      "district_name": "string",
      "subdistrict": "uuid",
      "subdistrict_name": "string",
      "station": "uuid",
      "station_name": "string",
      "status": "string",
      "remarks": "string",
      "created_at": "datetime"
    }
  ]
}
```

**Frontend Usage:** User's survey dashboard, my surveys page

---

### 8. Submit Survey
**Endpoint:** `POST /api/survey/create_site/{survey_id}/submit/`

**Description:** Submit a completed survey for approval. Validates all required data is present.

**Permission:** IsAuthenticated (Owner only)

**Path Parameters:**
```
survey_id: uuid
```

**Request Payload:** None

**Response:**
```json
{
  "message": "Survey submitted successfully",
  "survey_id": "uuid",
  "status": "SUBMITTED"
}
```

**Validation Checks:**
- Survey must be in DRAFT or REJECTED status
- All subsites must have unique priorities
- All subsites must have: Location, Monument, Sky Visibility, Power, Connectivity, 4 directional photos

**Error Response (incomplete data):**
```json
{
  "error": "Survey cannot be submitted",
  "current_status": "string",
  "incomplete_subsites": [
    {
      "subsite_id": "uuid",
      "subsite_name": "string",
      "missing": ["Location", "Monument", ...]
    }
  ]
}
```

**Frontend Usage:** Submit survey button, completion checklist

---

### 8. Submit Survey (Local/Test)
**Endpoint:** `POST /api/survey/{survey_id}/submitlocal/`

**Description:** Local survey submission endpoint for testing (alternative submission method).

**Permission:** IsAuthenticated (Owner only)

**Path Parameters:**
```
survey_id: uuid
```

**Request Payload:** None

**Response:**
```json
{
  "message": "Survey submitted successfully"
}
```

**Frontend Usage:** Alternative submit button, local submission

---

### 9. Get Pending Surveys
**Endpoint:** `GET /api/survey/pending/`

**Description:** Get role-based list of pending surveys for approval.

**Permission:** IsAuthenticated

**Response:** (Array of survey objects based on user role)

**Frontend Usage:** Approval queue, pending items dashboard

---

## Subsite Management APIs

### 1. Create SubSite
**Endpoint:** `POST /api/survey/create_site/{survey_id}/subsite/`

**Description:** Create a new subsite within a survey.

**Permission:** IsAuthenticated

**Path Parameters:**
```
survey_id: uuid
```

**Request Payload:**
```json
{
  "location": "string (required)",
  "priority": "integer (required)",
  "rinex_file": "file upload (optional)",
  "contact_details": "string (optional)",
  "remarks": "string (optional)",
  "noc": "file upload (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "survey": "uuid",
  "location": "string",
  "priority": "integer",
  "status": "DRAFT",
  "rinex_file": "url or null",
  "contact_details": "string",
  "remarks": "string",
  "noc": "url or null",
  "created_at": "datetime"
}
```

**Validations:**
- Location must be unique within survey
- Priority must be unique within survey
- RINEX file must have extensions: .obs, .nav, .rnx

**Frontend Usage:** Add subsite form, multiple subsites in survey

---

### 2. Get SubSites
**Endpoint:** `GET /api/survey/create_site/{survey_id}/subsite/`

**Description:** Get all subsites for a survey.

**Permission:** IsAuthenticated

**Path Parameters:**
```
survey_id: uuid
```

**Response:** (Array of subsite objects)

**Frontend Usage:** Subsite list view

---

### 3. Get SubSite by ID
**Endpoint:** `GET /api/survey/create_site/{survey_id}/subsite/{subsite_id}/`

**Description:** Get details of a specific subsite.

**Permission:** IsAuthenticated

**Path Parameters:**
```
survey_id: uuid
subsite_id: uuid
```

**Response:** (Single subsite object)

**Frontend Usage:** Subsite detail view

---

## Survey Data Collection APIs

### 1. Survey Location
**Endpoint:** `POST/GET/PUT/DELETE /api/survey/subsite/{subsite_id}/location/`

**Description:** Manage location details for a subsite.

**Permission:** IsAuthenticated

**POST - Create Location:**
```json
{
  "latitude": "float (required)",
  "longitude": "float (required)",
  "address": "string (required)",
  "city": "string (required)",
  "district": "string (required)",
  "state": "string (required)"
}
```

**GET Response:**
```json
[
  {
    "id": "uuid",
    "latitude": "float",
    "longitude": "float",
    "address": "string",
    "city": "string",
    "district": "string",
    "state": "string"
  }
]
```

**PUT - Update Location:**
```json
{
  "latitude": "float (optional)",
  "longitude": "float (optional)",
  "address": "string (optional)",
  "city": "string (optional)",
  "district": "string (optional)",
  "state": "string (optional)"
}
```

**DELETE Response:**
```json
{
  "message": "Location deleted successfully"
}
```

**Frontend Usage:** GPS coordinates input, address entry form

---

### 2. Survey Monument
**Endpoint:** `POST/GET/PUT/DELETE /api/survey/subsite/{subsite_id}/monument/`

**Description:** Manage monument details (structure type and conditions).

**Permission:** IsAuthenticated

**POST - Create Monument:**
```json
{
  "monument_type": "ROOFTOP|GROUND (required)",
  "building_stories": "integer (required only for ROOFTOP)",
  "site_conditions": [
    "Site Properly Accessible",
    "Site is clean and free from litter",
    "Site NOT in low-lying areas or flood area"
  ]
}
```

**GET Response:**
```json
[
  {
    "id": "uuid",
    "monument_type": "ROOFTOP|GROUND",
    "building_stories": "integer or null",
    "site_conditions": ["string"]
  }
]
```

**Frontend Usage:** Monument type selection, building details form

---

### 3. Survey Sky Visibility
**Endpoint:** `POST/GET/PUT/DELETE /api/survey/subsite/{subsite_id}/sky-visibility/`

**Description:** Manage sky visibility and EMI/Multipath sources.

**Permission:** IsAuthenticated

**POST - Create Sky Visibility:**
```json
{
  "polar_chart_image": "file upload (optional)",
  "multipath_emi_source": [
    {
      "source": "Trees|Power Lines|Buildings|Others|None (required)",
      "direction": "N|NE|E|SE|S|SW|W|NW (required)",
      "approx_distance_meter": "integer (required if not None)",
      "other_text": "string (required if source is Others)"
    }
  ],
  "remarks": "string (optional)"
}
```

**GET Response:**
```json
{
  "id": "uuid",
  "polar_chart_image": "url or null",
  "multipath_emi_source": [
    {
      "source": "string",
      "direction": "string",
      "approx_distance_meter": "integer",
      "other_text": "string or null"
    }
  ],
  "remarks": "string"
}
```

**Frontend Usage:** Polar chart image upload, EMI source selection

---

### 4. Survey Power
**Endpoint:** `POST/GET/PUT/DELETE /api/survey/subsite/{subsite_id}/power/`

**Description:** Manage power availability details.

**Permission:** IsAuthenticated

**POST - Create Power:**
```json
{
  "ac_grid": "boolean (required)",
  "ac_grid_distance_meter": "integer (required if ac_grid is true)",
  "solar_possible": "boolean (required)",
  "solar_exposure_hours": "float (optional)"
}
```

**GET Response:**
```json
{
  "id": "uuid",
  "ac_grid": "boolean",
  "ac_grid_distance_meter": "integer or null",
  "solar_possible": "boolean",
  "solar_exposure_hours": "float"
}
```

**Frontend Usage:** Power availability form, solar and grid options

---

### 5. Survey Connectivity
**Endpoint:** `POST/GET/PUT/DELETE /api/survey/subsite/{subsite_id}/connectivity/`

**Description:** Manage internet and communication connectivity options.

**Permission:** IsAuthenticated

**POST - Create Connectivity:**
```json
{
  "gsm_4g": ["Airtel", "Vodafone Idea", "JIO", "BSNL", "Others"],
  "others_gsm_4g": "string (required if Others selected)",
  "broadband": ["Airtel", "Vodafone Idea", "JIO", "BSNL", "Others"],
  "others_broadband": "string (required if Others selected)",
  "fiber": ["Airtel", "Vodafone Idea", "JIO", "BSNL", "Others"],
  "others_fiber": "string (required if Others selected)",
  "airfiber": ["Airtel", "Vodafone Idea", "JIO", "BSNL", "Others"],
  "others_airfiber": "string (required if Others selected)",
  "remarks": "string (optional)"
}
```

**GET Response:**
```json
{
  "id": "uuid",
  "gsm_4g": ["string"],
  "others_gsm_4g": "string or null",
  "broadband": ["string"],
  "others_broadband": "string or null",
  "fiber": ["string"],
  "others_fiber": "string or null",
  "airfiber": ["string"],
  "others_airfiber": "string or null",
  "remarks": "string"
}
```

**Frontend Usage:** Connectivity checkboxes, provider selection form

---

### 6. Survey Photos Upload
**Endpoint:** `POST/GET/PUT/DELETE /api/survey/subsite/{subsite_id}/photo/`

**Description:** Upload and manage directional photos (North, East, South, West).

**Permission:** IsAuthenticated

**POST - Upload Photos:**
```json
{
  "north_photo": "file upload (required)",
  "east_photo": "file upload (required)",
  "south_photo": "file upload (required)",
  "west_photo": "file upload (required)"
}
```

**GET Response:**
```json
[
  {
    "id": "uuid",
    "north_photo": "url",
    "east_photo": "url",
    "south_photo": "url",
    "west_photo": "url",
    "captured_at": "datetime"
  }
]
```

**PUT - Update Photo:**
```json
{
  "north_photo": "file upload (optional)",
  "east_photo": "file upload (optional)",
  "south_photo": "file upload (optional)",
  "west_photo": "file upload (optional)"
}
```

**DELETE Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

**Frontend Usage:** Photo upload interface, 4-directional image gallery

---

## Approval Workflow APIs

### 1. Survey Approval (Generic)
**Endpoint:** `POST /api/survey/{survey_id}/approve/`

**Description:** Role-based survey approval at different levels.

**Permission:** IsAuthenticated

**Path Parameters:**
```
survey_id: uuid
```

**Request Payload:**
```json
{
  "decision": "APPROVED|REJECTED (required)",
  "remarks": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Decision recorded successfully",
  "new_status": "SUPERVISOR_APPROVED|DIRECTOR_APPROVED|ZONAL_CHIEF_APPROVED|GNRB_APPROVED|REJECTED"
}
```

**Role-based Workflow:**
- SUPERVISOR: SUBMITTED → SUPERVISOR_APPROVED or REJECTED
- DIRECTOR: SUPERVISOR_APPROVED → DIRECTOR_APPROVED or REJECTED
- ZONAL_CHIEF: DIRECTOR_APPROVED → ZONAL_CHIEF_APPROVED or REJECTED
- GNRB: ZONAL_CHIEF_APPROVED → GNRB_APPROVED or REJECTED

**Frontend Usage:** Approval buttons, workflow status indicators

---

### 2. Supervisor Approval & Update
**Endpoint:** `POST /api/survey/{survey_id}/supervisor/`

**Description:** Supervisor approves/rejects individual subsites and updates priority/remarks/NOC (Supervisor role only).

**Permission:** IsAuthenticated (Supervisor role)

**Path Parameters:**
```
survey_id: uuid
```

**POST - Approve/Reject Subsite:**
```json
{
  "subsite_id": "uuid (required)",
  "decision": "APPROVE|REJECT (required)",
  "remarks": "string (optional)"
}
```

**PUT - Update Priority/Remarks/NOC:**
```json
{
  "subsite_id": "uuid (required)",
  "priority": "integer (optional)",
  "remarks": "string (optional)",
  "noc": "file upload (optional)"
}
```

**Response (POST):**
```json
{
  "message": "Decision updated successfully",
  "subsite_id": "uuid",
  "status": "SUPERVISOR_APPROVED|REJECTED_BY_SUPERVISOR"
}
```

**Response (PUT):**
```json
{
  "message": "Subsite updated successfully",
  "subsite_id": "uuid",
  "priority": "integer",
  "remarks": "string",
  "noc_uploaded": "boolean"
}
```

**Frontend Usage:** Subsite-level approval checklist, priority management

---

### 3. Supervisor Submit Survey to Director
**Endpoint:** `POST /api/survey/{survey_id}/supervisor/submit/`

**Description:** Submit approved subsites to Director for further review.

**Permission:** IsAuthenticated (Supervisor role)

**Path Parameters:**
```
survey_id: uuid
```

**Request Payload:** None

**Response:**
```json
{
  "message": "Survey successfully submitted to Director",
  "approved_subsites": "integer"
}
```

**Frontend Usage:** Submit button in supervisor workflow

---

### 4. Director Subsite Decision
**Endpoint:** `POST /api/subsite/{subsite_id}/director-decision/`

**Description:** Director approves/rejects subsites (Director role only).

**Permission:** IsAuthenticated (Director role)

**Path Parameters:**
```
subsite_id: uuid
```

**Request Payload:**
```json
{
  "decision": "APPROVE|REJECT (required)",
  "remarks": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Director decision saved"
}
```

**Frontend Usage:** Director approval workflow, subsite review

---

### 5. Director Update & Send to Zonal
**Endpoint:** `POST /api/subsite/{subsite_id}/send-to-zonal/`

**Description:** Director updates priority/remarks/NOC and sends subsite to Zonal Chief.

**Important:** Backend currently allows `POST` only. `PUT` returns `405 Method Not Allowed`.

**Permission:** IsAuthenticated (Director role)

**Path Parameters:**
```
subsite_id: uuid
```

**POST - Send to Zonal (optional update payload):**
```json
{
  "priority": "integer (optional)",
  "remarks": "string (optional)",
  "noc": "file upload (optional)"
}
```

**Response (POST):**
```json
{
  "message": "Subsite successfully sent to Zonal Chief"
}
```

**Frontend Usage:** Forward to next level button, update priority/remarks

---

### 6. Zonal Decision
**Endpoint:** `POST /api/subsite/{subsite_id}/zonal-decision/`

**Description:** Zonal Chief approves/rejects subsites (Zonal Chief role only).

**Permission:** IsAuthenticated (Zonal Chief role)

**Path Parameters:**
```
subsite_id: uuid
```

**Request Payload:**
```json
{
  "decision": "APPROVE|REJECT (required)",
  "remarks": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Zonal decision saved"
}
```

**Frontend Usage:** Zonal Chief approval dashboard

---

### 7. GNRB Decision
**Endpoint:** `POST /api/subsite/{subsite_id}/gnrb-decision/`

**Description:** GNRB gives final approval/rejection (GNRB role only).

**Permission:** IsAuthenticated (GNRB role)

**Path Parameters:**
```
subsite_id: uuid
```

**Request Payload:**
```json
{
  "decision": "APPROVE|REJECT (required)",
  "remarks": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Final decision saved"
}
```

**Frontend Usage:** GNRB final approval interface

---

### 8. Supervisor Survey List
**Endpoint:** `GET /api/supervisor/surveys/`

**Description:** Get list of surveys for supervisor review.

**Permission:** IsAuthenticated (Supervisor role)

**Response:**
```json
[
  {
    "id": "uuid",
    "site_name": "string",
    "latitude": "float",
    "longitude": "float",
    "status": "string",
    "surveyor_name": "string",
    "remarks": "string",
    "created_at": "datetime",
    "subsites": [
      {
        "id": "uuid",
        "location": "string",
        "priority": "integer",
        "status": "string",
        "location_details": {...},
        "monument_details": {...},
        ...
      }
    ]
  }
]
```

**Frontend Usage:** Supervisor dashboard, surveys awaiting approval

---

### 9. Director Subsite List
**Endpoint:** `GET /api/director/subsites/`

**Description:** Get list of subsites for director review.

**Permission:** IsAuthenticated (Director role)

**Response:** (Array of survey objects with subsite details)

**Frontend Usage:** Director dashboard

---

### 10. Zonal Subsite List
**Endpoint:** `GET /api/zonal/subsites/`

**Description:** Get list of subsites for zonal chief review.

**Permission:** IsAuthenticated (Zonal Chief role)

**Response:** (Array of survey objects with subsite details)

**Frontend Usage:** Zonal Chief dashboard

---

### 11. GNRB Subsite List
**Endpoint:** `GET /api/gnrb/subsites/`

**Description:** Get list of subsites for GNRB review.

**Permission:** IsAuthenticated (GNRB role)

**Response:** (Array of survey objects with subsite details)

**Frontend Usage:** GNRB dashboard

---

### 12. Hierarchy Survey API
**Endpoint:** `GET /api/hierarchy/sites/`

**Description:** Get surveys based on user role and zone with complete subsite details.

**Permission:** IsAuthenticated

**Response:**
```json
[
  {
    "id": "uuid",
    "state": "string",
    "district": "string",
    "subdistrict": "string",
    "station": "string",
    "status": "string",
    "remarks": "string",
    "created_at": "datetime",
    "surveyor_name": "string",
    "surveyor_username": "string",
    "subsites": [
      {
        "id": "uuid",
        "location": "string",
        "priority": "integer",
        "created_at": "datetime",
        "location_details": {...},
        "monument": {...},
        "sky_visibility": {...},
        "power": {...},
        "connectivity": {...},
        "photos": {...}
      }
    ]
  }
]
```

**Frontend Usage:** Hierarchical survey view, role-based filtering

---

## Location Hierarchy APIs

### 1. Get States List
**Endpoint:** `GET /api/states/`

**Description:** Get all states in the system.

**Permission:** AllowAny

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "latitude": "float",
    "longitude": "float",
    "districts": [...]
  }
]
```

**Frontend Usage:** Survey location hierarchy, state dropdown

---

### 2. Get Districts by State
**Endpoint:** `GET /api/states/{state_id}/districts/` OR `GET /api/districts/`

**Description:** Get all districts in a state.

**Permission:** AllowAny

**Path Parameters:**
```
state_id: integer
```

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "subdistricts": [...]
  }
]
```

**Frontend Usage:** District dropdown, hierarchical selection

---

### 3. Get SubDistricts by District
**Endpoint:** `GET /api/districts/{district_id}/subdistricts/`

**Description:** Get all sub-districts in a district.

**Permission:** AllowAny

**Path Parameters:**
```
district_id: integer
```

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "towns": [...]
  }
]
```

**Frontend Usage:** Sub-district dropdown

---

### 4. Get Towns by SubDistrict
**Endpoint:** `GET /api/subdistricts/{subdistrict_id}/towns/`

**Description:** Get all towns in a sub-district.

**Permission:** AllowAny

**Path Parameters:**
```
subdistrict_id: integer
```

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string"
  }
]
```

**Frontend Usage:** Town/location dropdown

---

### 5. Get Full Location Hierarchy
**Endpoint:** `GET /api/location/`

**Description:** Get complete location hierarchy (states, districts, subdistricts, towns).

**Permission:** AllowAny

**Response:** (Nested hierarchy of locations)

**Frontend Usage:** Complete hierarchical location picker

---

### 6. Get States DB
**Endpoint:** `GET /api/statesdb/`

**Description:** Get all states from database.

**Permission:** AllowAny

**Response:**
```json
[
  {
    "id": "integer",
    "name": "string",
    "latitude": "float",
    "longitude": "float"
  }
]
```

**Frontend Usage:** State selection for surveys

---

### 7. Get Districts by State DB
**Endpoint:** `GET /api/statesdb/{state_id}/districtsdb/`

**Description:** Get districts from a specific state.

**Permission:** AllowAny

**Path Parameters:**
```
state_id: integer
```

**Response:**
```json
[
  {
    "id": "integer",
    "state": "integer",
    "name": "string",
    "latitude": "float",
    "longitude": "float"
  }
]
```

**Frontend Usage:** District selection

---

### 8. Get Stations by District DB
**Endpoint:** `GET /api/districtsdb/{district_id}/stationdb/`

**Description:** Get stations/sampling locations in a district.

**Permission:** AllowAny

**Path Parameters:**
```
district_id: integer
```

**Response:**
```json
[
  {
    "id": "integer",
    "district": "integer",
    "sl_no": "integer",
    "name": "string",
    "code": "string",
    "latitude": "float",
    "longitude": "float",
    "height": "float"
  }
]
```

**Frontend Usage:** Station/site selection for surveys

---

### 9. Districts CRUD Operations
**Endpoint:** `GET/POST /api/districtsdb/` OR `GET/PUT/DELETE /api/districtsdb/{pk}/`

**Description:** Create, read, update, delete districts.

**Permission:** IsAuthenticated (Admin only)

**POST - Create District:**
```json
{
  "state": "integer (required)",
  "name": "string (required)",
  "latitude": "float (required)",
  "longitude": "float (required)"
}
```

**PUT - Update District:**
```json
{
  "state": "integer (optional)",
  "name": "string (optional)",
  "latitude": "float (optional)",
  "longitude": "float (optional)"
}
```

**Response:**
```json
{
  "id": "integer",
  "state": "integer",
  "name": "string",
  "latitude": "float",
  "longitude": "float"
}
```

**Frontend Usage:** Admin district management

---

### 10. Stations CRUD Operations
**Endpoint:** `GET/POST /api/stationsdb/` OR `GET/PUT/DELETE /api/stationsdb/{pk}/`

**Description:** Create, read, update, delete stations.

**Permission:** IsAuthenticated (Admin only)

**POST - Create Station:**
```json
{
  "district": "integer (required)",
  "sl_no": "integer (required)",
  "name": "string (required)",
  "code": "string (required)",
  "latitude": "float (required)",
  "longitude": "float (required)",
  "height": "float (optional)"
}
```

**PUT - Update Station:**
```json
{
  "district": "integer (optional)",
  "sl_no": "integer (optional)",
  "name": "string (optional)",
  "code": "string (optional)",
  "latitude": "float (optional)",
  "longitude": "float (optional)",
  "height": "float (optional)"
}
```

**Response:**
```json
{
  "id": "integer",
  "district": "integer",
  "sl_no": "integer",
  "name": "string",
  "code": "string",
  "latitude": "float",
  "longitude": "float",
  "height": "float"
}
```

**Frontend Usage:** Admin station management

---

## Admin APIs

### 1. Get All Users (Admin)
**Endpoint:** `GET /api/admin/users/`

**Description:** Admin can view all users in the system.

**Permission:** IsAuthenticated (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "email": "string",
    "mobile": "string",
    "role": "string",
    "zone": "string",
    "is_approved": "boolean",
    "created_at": "datetime"
  }
]
```

**Frontend Usage:** Admin user management dashboard

---

### 2. Approve User (Admin)
**Endpoint:** `POST /api/admin/user/{user_id}/approve/`

**Description:** Admin approves user registration.

**Permission:** IsAuthenticated (Admin only)

**Path Parameters:**
```
user_id: uuid
```

**Request Payload:** None (or empty JSON)

**Response:**
```json
{
  "message": "User approved successfully"
}
```

**Frontend Usage:** Admin user approval interface

---

### 3. Assign Director to Surveyor (Admin)
**Endpoint:** `POST /api/admin/user/{user_id}/assign-director/`

**Description:** Admin assigns a director to a surveyor.

**Permission:** IsAuthenticated (Admin only)

**Path Parameters:**
```
user_id: uuid
```

**Request Payload:**
```json
{
  "director_id": "uuid (required)"
}
```

**Response:**
```json
{
  "message": "Director assigned successfully"
}
```

**Frontend Usage:** Admin user management, surveyor-director assignment

---

### 4. Change User Role (Admin)
**Endpoint:** `POST /api/admin/user/{user_id}/change-role/`

**Description:** Admin changes user role.

**Permission:** IsAuthenticated (Admin only)

**Path Parameters:**
```
user_id: uuid
```

**Request Payload:**
```json
{
  "role": "SURVEYOR|SUPERVISOR|DIRECTOR|GNRB|ZONAL_CHIEF (required)"
}
```

**Response:**
```json
{
  "message": "User role changed successfully"
}
```

**Frontend Usage:** Admin role management

---

### 5. Get All Surveys (Admin)
**Endpoint:** `GET /api/admin/surveys/`

**Description:** Admin can view all surveys in the system.

**Permission:** IsAuthenticated (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "state": "string",
    "district": "string",
    "subdistrict": "string",
    "station": "string",
    "status": "string",
    "surveyor_name": "string",
    "remarks": "string",
    "created_at": "datetime"
  }
]
```

**Frontend Usage:** Admin survey monitoring dashboard

---

## RINEX File Management APIs

### 1. Upload RINEX File
**Endpoint:** `POST /api/rinex/upload/`

**Description:** Upload RINEX observation files.

**Permission:** IsAuthenticated

**Request Payload:** (Multipart form data)
```
file: file (.obs, .nav, .rnx)
```

**Response:**
```json
{
  "message": "RINEX file uploaded successfully",
  "rinex_id": "uuid"
}
```

**Validations:**
- File extensions: .obs, .nav, .rnx
- Duplicate check: Same user cannot upload same filename twice

**Frontend Usage:** RINEX file upload form, file manager

---

### 2. Get RINEX Files
**Endpoint:** `GET /api/rinex/upload/`

**Description:** Get all RINEX files uploaded by current user.

**Permission:** IsAuthenticated

**Response:**
```json
[
  {
    "id": "uuid",
    "file": "url",
    "uploaded_at": "datetime"
  }
]
```

**Frontend Usage:** RINEX file list view

---

### 3. Get Single RINEX File
**Endpoint:** `GET /api/rinex/upload/{file_id}/`

**Description:** Get details of a specific RINEX file.

**Permission:** IsAuthenticated

**Path Parameters:**
```
file_id: uuid
```

**Response:**
```json
{
  "id": "uuid",
  "file": "url",
  "uploaded_at": "datetime"
}
```

**Frontend Usage:** File detail view

---

### 4. Update RINEX File
**Endpoint:** `PUT /api/rinex/upload/{file_id}/`

**Description:** Replace existing RINEX file.

**Permission:** IsAuthenticated

**Path Parameters:**
```
file_id: uuid
```

**Request Payload:** (Multipart form data)
```
file: file (.obs, .nav, .rnx)
```

**Response:**
```json
{
  "message": "RINEX file updated successfully",
  "rinex_id": "uuid"
}
```

**Frontend Usage:** File replacement/update

---

### 5. Delete RINEX File
**Endpoint:** `DELETE /api/rinex/upload/{file_id}/`

**Description:** Delete a RINEX file.

**Permission:** IsAuthenticated

**Path Parameters:**
```
file_id: uuid
```

**Response:**
```json
{
  "message": "RINEX file deleted successfully"
}
```

**Frontend Usage:** Delete button in file list

---

## Map and Location APIs

### 1. Get Survey Map Data
**Endpoint:** `GET /api/survey/map/`

**Description:** Get all survey locations with coordinates and photos for map display.

**Permission:** AllowAny

**Response:**
```json
[
  {
    "id": "uuid",
    "lat": "float",
    "lon": "float",
    "address": "string",
    "city": "string",
    "district": "string",
    "state": "string",
    "photos": {
      "north": "url or null",
      "east": "url or null",
      "south": "url or null",
      "west": "url or null"
    }
  }
]
```

**Frontend Usage:** Interactive map view, location markers

---

### 2. Get Map Data for Specific Location
**Endpoint:** `GET /api/survey/map/{location_id}/`

**Description:** Get map data for a specific location.

**Permission:** AllowAny

**Path Parameters:**
```
location_id: uuid
```

**Response:** (Single location object)

**Frontend Usage:** Specific location detail on map

---

### 3. Update Map Location
**Endpoint:** `PUT /api/survey/map/{location_id}/`

**Description:** Update location coordinates and address.

**Permission:** IsAuthenticated

**Path Parameters:**
```
location_id: uuid
```

**Request Payload:**
```json
{
  "latitude": "float (optional)",
  "longitude": "float (optional)",
  "address": "string (optional)",
  "city": "string (optional)",
  "district": "string (optional)",
  "state": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Location updated successfully",
  "location_id": "uuid"
}
```

**Frontend Usage:** Map update, coordinate adjustment

---

### 4. Delete Map Location
**Endpoint:** `DELETE /api/survey/map/{location_id}/`

**Description:** Delete a location entry.

**Permission:** IsAuthenticated

**Path Parameters:**
```
location_id: uuid
```

**Response:**
```json
{
  "message": "Location deleted successfully"
}
```

**Frontend Usage:** Remove location from map

---

## Common Response Formats

### Success Response Format
```json
{
  "message": "string (optional)",
  "data": "object or array (optional)",
  "count": "integer (optional for list responses)"
}
```

### Error Response Format
```json
{
  "error": "string (error message)",
  "details": "object (optional - field-level errors)",
  "code": "string (optional - error code)"
}
```

### Standard HTTP Status Codes
- **200 OK:** Successful GET/PUT request
- **201 Created:** Successful POST request (resource created)
- **204 No Content:** Successful DELETE request
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Missing/invalid authentication token
- **403 Forbidden:** Insufficient permissions for operation
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server error

---

## Authentication

### Token-Based Authentication

All authenticated endpoints require:

**Header:**
```
Authorization: Token <authentication_token>
```

Obtain token from login response and include in all subsequent requests.

---

## Base URL
```
http://localhost:8000/api/
```

---

## Frontend Pages Using These APIs

| Page | APIs Used |
|------|-----------|
| Signup | signup/, directors_by_zone/ |
| Login | login/ |
| Dashboard | survey/my-sites/, survey/pending/ |
| Create Survey | survey/create_site/, states/, districts/, subdistricts/, towns/ |
| Create Subsite | survey/create_site/{survey_id}/subsite/ |
| Location Form | survey/subsite/{subsite_id}/location/ |
| Monument Form | survey/subsite/{subsite_id}/monument/ |
| Sky Visibility | survey/subsite/{subsite_id}/sky-visibility/ |
| Power Info | survey/subsite/{subsite_id}/power/ |
| Connectivity | survey/subsite/{subsite_id}/connectivity/ |
| Photo Upload | survey/subsite/{subsite_id}/photo/ |
| Submit Survey | survey/create_site/{survey_id}/submit/ |
| Map View | survey/map/ |
| Supervisor Dashboard | supervisor/surveys/, survey/{survey_id}/supervisor/ |
| Director Dashboard | director/subsites/, subsite/{subsite_id}/director-decision/, subsite/{subsite_id}/send-to-zonal/ |
| Zonal Dashboard | zonal/subsites/, subsite/{subsite_id}/zonal-decision/ |
| GNRB Dashboard | gnrb/subsites/, subsite/{subsite_id}/gnrb-decision/ |
| Survey Hierarchy | hierarchy/sites/ |
| RINEX Upload | rinex/upload/ |
| User Approval | pending-surveyors/, approve-surveyor/, pending-supervisors/, approve-supervisor/ |
| User Management | users/, users/role/{role}/ |
| Location Hierarchy | states/, districts/, subdistricts/, towns/, location/ |
| Admin Users | admin/users/, admin/user/{user_id}/approve/, admin/user/{user_id}/assign-director/, admin/user/{user_id}/change-role/ |
| Admin Surveys | admin/surveys/ |
| Admin Districts/Stations | districtsdb/, stationsdb/ |

---

## Notes

- All timestamps are in ISO 8601 format
- UUIDs are in standard format (8-4-4-4-12)
- Coordinates (latitude/longitude) are in decimal degrees
- File uploads use multipart/form-data
- All nested objects are read-only in requests, write via their dedicated endpoints
- Approval workflows follow role hierarchy: Surveyor → Supervisor → Director → Zonal Chief → GNRB
