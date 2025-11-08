# TODO: Fix 404 Error for /api/activities and Implement Attachments API

## Tasks
- [x] Add GET /api/activities endpoint to server.js to proxy requests to GAS backend
- [x] Test the endpoint to ensure it resolves the 404 error in ActivityFeed component
- [x] Fix duplicate React keys warning in Complaints.tsx
- [x] Implement attachment endpoints in server.js and code.gs
- [x] Add Google Drive integration for file storage in GAS backend
- [x] Test attachment upload, download, and delete functionality

## Details
The ActivityFeed component is attempting to fetch activities from 'http://localhost:3001/api/activities', but this endpoint is not defined in server.js. The server proxies requests to a Google Apps Script (GAS) backend. Need to add the endpoint following the same pattern as other endpoints like /api/complaints.

The AttachmentsList component is failing because attachment endpoints are missing:
- GET /api/complaints/{id}/attachments
- GET /api/attachments/{id}/download
- DELETE /api/attachments/{id}

Need to implement these in both server.js proxy and GAS backend with Google Drive integration.
