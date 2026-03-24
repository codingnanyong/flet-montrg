# 📚 Documentation Hub

Project documentation lives under **`docs/`**. The root [README.md](../README.md) focuses on overview and how to run the project.

---

## 📂 Folder layout

| Path                           | Purpose                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| **[release/](./release/)**     | Versioned release notes (`v1.0.0.md`, …) — **index:** [release/README.md](./release/README.md) |
| **[proposals/](./proposals/)** | Design proposals (architecture, MSA, etc.)                                                     |
| **[examples/](./examples/)**   | API request/response examples                                                                  |

---

## 📑 Contents

| Document                                                                     | Description                             |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| [release/README.md](./release/README.md)                                     | Release notes index (links per version) |
| [proposals/MSA_EXTENSION_PROPOSAL.md](./proposals/MSA_EXTENSION_PROPOSAL.md) | MSA extension & architecture proposal   |
| [examples/ALERT_API_EXAMPLES.md](./examples/ALERT_API_EXAMPLES.md)           | Alert & notification API examples       |

---

## ➕ Adding new docs

1. **Project-wide** topics → place under one of the folders above and add a row to the table.
2. **Single service only** → `services/<service-name>/README.md`.
3. **New release** → add `docs/release/vX.Y.Z.md` and update the table in [release/README.md](./release/README.md).

---

## 🔗 Quick links

- [Release v1.0.0](./release/v1.0.0.md) · [v1.1.0](./release/v1.1.0.md)
- [Web UI](../services/web-service/README.md)
- [Integrated Swagger](../services/integrated-swagger-service/README.md)
