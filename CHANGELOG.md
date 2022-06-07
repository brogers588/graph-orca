# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added support for ingesting the following **new** resources:

  | Resource | Type           | Class      |
  | -------- | -------------- | ---------- |
  | Asset    | `orca_asset`   | `Resource` |
  | Finding  | `orca_finding` | `Finding`  |

- Added support for ingesting the following **new** relationships:

  | Source         | class   | Target         |
  | -------------- | ------- | -------------- |
  | `orca_account` | **HAS** | `orca_asset`   |
  | `orca_account` | **HAS** | `orca_finding` |
  | `orca_asset`   | **HAS** | `orca_finding` |
  | `orca_finding` | **HAS** | `cve`          |
  | `orca_finding` | **IS**  | `cve`          |

## 1.0.0 - 2022-03-31

### Added

Initial Orca Integration.

- Ingest new entity `orca_account`
- Ingest new entity `orca_user`
- Ingest new entity `orca_group`

- Build new relationship `orca_account_has_user`
- Build new relationship `orca_account_has_group`
- Build new relationship `orca_group_has_user`
