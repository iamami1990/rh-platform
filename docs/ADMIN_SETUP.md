# Repository Administration Guide

## 🛡️ Branch Protection Rules (Critical)

For the safety of the codebase, the Repository Administrator **MUST** configure the following protection rules on GitHub:

### 1. Protect `main` Branch
- **Pattern**: `main`
- **Settings**:
  - [x] Require a pull request before merging
  - [x] Require approvals (Recommend: 1)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Do not allow bypassing the above settings

### 2. Protect `dev` Branch
- **Pattern**: `dev`
- **Settings**:
  - [x] Require a pull request before merging
  - [x] Require status checks to pass before merging (if CI is set up)

## 🚀 Repository Setup

1. **Remote Configuration**:
   The remote URL has been set to: `https://github.com/iamami1990/rh-platform`

2. **Default Branch**:
   Ensure `dev` is set as the default branch in GitHub settings so that new PRs target it automatically.
