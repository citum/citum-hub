---
# style-hub-7z3i
title: Add multi-user DB persistence
status: completed
type: task
priority: high
created_at: 2026-02-13T21:49:35Z
updated_at: 2026-02-13T22:05:00Z
---

Implement multi-user persistence to allow users to save their progress, manage multiple styles, and collaborate.

### User Roles & Permissions
- **User**: 
  - Create and save multiple `StyleIntent` drafts to their personal library.
  - Export/Download Citum YAML.
  - Fork existing public styles from the "Hub".
- **Editor**:
  - All User permissions.
  - Curate and edit shared styles in the public library.
  - Approve/Reject submissions to the "Verified" category.

### Technical Requirements
1. **Authentication**: 
   - Implement JWT-based auth or a session-based approach compatible with Axum.
   - Support OAuth (GitHub/Google) for developer-friendly onboarding.
2. **Database Schema**:
   - `users`: Profile data and role assignment.
   - `styles`: Stores the `StyleIntent` (JSONB) and the generated `Citum` (text/YAML).
   - `history`: Versioning for style changes to allow rollback.
3. **API Enhancements**:
   - Secure existing preview/generate endpoints.
   - Add CRUD operations for the `styles` table.
4. **Frontend Integration**:
   - "My Library" view to manage saved styles.
   - "Auto-save" functionality within the Decision Wizard.
   - User profile and authentication state management.
