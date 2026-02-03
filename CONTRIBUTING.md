# Contributing to Olympia HR Platform

## Git Workflow

We follow a strict Git workflow to ensure code stability and collaboration efficiency.

### Main Branches
- **`main`**: The stable production code. NEVER push directly to `main`.
- **`dev`**: The active development branch. All feature branches merge into `dev`.

### Feature Branches
Each developer must work on an isolated branch following this naming convention:
- `backend-<feature>` (e.g., `backend-auth`, `backend-attendance`)
- `mobile-kiosk-<feature>` (e.g., `mobile-kiosk-ui`)
- `web-admin-<feature>` (e.g., `web-admin-ui`)

### Workflow
1. **Pull the latest `dev` branch**
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. **Create a new branch**
   ```bash
   git checkout -b <branch-name>
   ```
3. **Commit your changes**
   - Write clear, descriptive commit messages.
   - Do not commit secrets or unnecessary files.
4. **Push to GitHub**
   ```bash
   git push origin <branch-name>
   ```
5. **Create a Pull Request (PR)**
   - Target the `dev` branch.
   - Request a review from a team member.
   - Address feedback and merge only after approval.

## Project Structure
- `backend/`: Node.js/Express API
- `mobile-kiosk/` (formerly `mobile-app`): React Native Kiosk Application
- `web-admin/`: React Admin Dashboard
- `docs/`: Project documentation

## Safety Rules
- **NEVER** overwrite existing code without a backup plan.
- **NEVER** merge broken code into `dev`.
- **ALWAYS** test locally before pushing.
