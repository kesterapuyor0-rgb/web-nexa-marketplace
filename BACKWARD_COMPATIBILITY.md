# Backward Compatibility Policy

## Rule

Existing users, records, and integrations must remain readable and usable after new fields, categories, payment providers, and frontend components are introduced. New features must never make an old record invalid merely because it predates the feature.

## Required behavior

- Preserve unknown legacy fields when a record is read, updated, or persisted.
- Treat newly introduced fields as optional unless a migration explicitly makes them required.
- Use safe defaults for missing values; do not replace stored legacy values with defaults.
- Treat malformed optional values as empty or zero only when the current consumer cannot safely use them.
- Return stable API shapes; additions are backward-compatible, while removals require a deprecation window.
- Never expose password hashes, secrets, private account fields, or internal payment credentials.
- Legacy records must remain valid when they lack modern category, location, review, image, or payment metadata.

## Migration sequence

1. Audit consumers for assumptions about field presence and types.
2. Add a normalization helper at the persistence/API boundary.
3. Add defensive frontend rendering for nullable values and optional collections.
4. Add regression tests with representative legacy records.
5. Run the production build and smoke-test the affected endpoints.
6. Deploy only after the compatibility tests pass.

## Safe defaults

| Field | Default |
| --- | --- |
| Product title | "Untitled product" |
| Product description | Empty string |
| Product category | "Hardware & Gear" |
| Product price | `0` |
| Product inventory | `0` |
| Product images | Empty array |
| Vendor business name | "Unnamed vendor" |
| Vendor country | "Nigeria" |
| Vendor approval | `false` |
| Vendor location fields | Empty string |
| Missing review collections | Empty array |

## Enforcement

A compatibility regression is considered resolved only when a legacy fixture can be normalized, rendered, and persisted without a crash, data loss, or accidental exposure of private fields.
