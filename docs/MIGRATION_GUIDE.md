# Legacy Migration (Offline Export)

This project uses MongoDB only. If you need to migrate data from a previous system, export data as JSON and import it via the provided script.

## File Locations

Place the files in:

```
backend/data/employees.json
backend/data/users.json
```

## employees.json (example)

```json
[
  {
    "legacy_id": "EMP-001",
    "firstName": "Amine",
    "lastName": "Ben Ali",
    "email": "amine@example.com",
    "department": "IT",
    "position": "Developer",
    "contract_type": "CDI",
    "hireDate": "2024-01-15",
    "salary_brut": 1800,
    "cin": "12345678",
    "cnss_number": "CNSS-987"
  }
]
```

## users.json (example)

```json
[
  {
    "email": "amine@example.com",
    "password": "PlainTextOrBcryptHash",
    "role": "employee",
    "employee_id": "EMP-001",
    "employee_email": "amine@example.com"
  }
]
```

`password` can be a bcrypt hash (starting with `$2`). If it is not hashed, the script will hash it.

## Run Import

```bash
cd backend
npm run import:legacy
```
