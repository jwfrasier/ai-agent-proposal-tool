# Zachary Antosko — Senior Forms Developer (React/TypeScript) and Senior Oracle DBA (Key Personnel, dual role per Q&A 9)

Houston, TX · (361) 425-4862 · zachary.antosko@gmail.com

## Technologies in use on this contract — where used

| Technology | Direct use |
|---|---|
| React, Redux (RTK, RTK Query), TypeScript | Honeywell (2021–24): built React components and REST-call/state management for an operations web platform; ID Plans (2024–present): TypeScript throughout |
| Node / TypeScript REST backends (NestJS, Express) | ID Plans: migrated 50+ service methods from legacy Node APIs to NestJS with dependency injection and type safety; Honeywell: architected the NestJS/TypeORM backend with query validation |
| Relational data, ORMs, migrations | ID Plans: DynamoDB → MySQL/TypeORM migration framework with automated ETL and a validation engine across 1.15 million records, zero production downtime; PostgreSQL, MySQL, Sequelize/TypeORM |
| Authentication and authorization | JWT-based auth in Node/NestJS services |
| AWS (RDS, DynamoDB, Lambda, S3), Docker | Daily use at ID Plans and Honeywell |
| Real-time and streaming | RabbitMQ consumer + WebSocket broadcast of 10,000 messages in under two seconds to a live dashboard (Honeywell) |

## Proposed role

Dual key-personnel role under the Government's Q&A answer 9. **Senior Forms Developer** (React/TypeScript web forms): owns the `cwms-access-management` React application and the management API — the Users, Roles, and Policy tab increments in Technical Exhibit 1, the mask builder with catalog preview, bulk operations, validation, Storybook stories, and component tests; pairs with the Senior Java Developer on the CDA endpoints the UI calls. **Senior Oracle DBA**: owns the bounded schema increments in this design — reinstating the `at_sec_ts_group_embargo` table, extending the mask views, keeping the integration-test database images current — delivered as small, HEC-reviewed PL/SQL changes validated by the integration suite against the `database-ready` Oracle image, applying the same migration-and-validation discipline demonstrated at 1.15 M-record production scale.

## Experience

**ID Plans — Software Engineer (remote)** · February 2024 – present
- Developed a database-migration framework that reduced database operational cost by 40 % and improved query performance for complex filtering: automated ETL pipelines, a validation engine ensuring integrity across more than 1.15 million migrated records, and code-generation tools converting DynamoDB service methods to type-safe MySQL/TypeORM implementations with zero production downtime.
- Led the migration from legacy Node.js APIs to NestJS — more than 50 service methods with dependency injection and TypeScript type safety — for property-management, lease-tracking, and CRM integration systems serving millions of records; implemented real-time DynamoDB stream processing for cross-system consistency; established a reusable modular architecture that reduced API development time.

**Honeywell — Software Engineer II** · Houston, TX · October 2022 – February 2024
- Led a team of four in an Agile process to redesign, implement, and maintain a new version of the team's web platform; owned API design and React component construction; delivered a customer-demo pilot inside a three-month deadline.
- Selected for a micro-innovation team; designed and implemented a backend that propagated hardware errors into the database, cutting error-resolution time 15 %; collaborated with the AI team on model-seeding migration and optimization for larger data sets (25 % faster processing).

**Honeywell — Software Engineer I** · Houston, TX · September 2021 – October 2022
- Architected and maintained the NestJS/TypeORM backend for rapid prototyping of HTTP services with query validation across SQL and NoSQL stores; implemented the RabbitMQ/WebSocket streaming consumer feeding the operations dashboard.
- Built the React front end with TypeScript, Redux Toolkit, and RTK Query; implemented Three.js 3D visualization with instanced rendering of 20,000+ models in a single draw call.

## Education

B.S., Chemical Engineering — Texas A&M University–Kingsville, December 2018. DigitalCrafts Certificate in Software Engineering, Houston, June 2021.

## Certifications and special qualifications

Proficient: Node.js, TypeScript, NestJS, Express, React, Redux, Python, PostgreSQL, MySQL, MongoDB, TypeORM/Sequelize, RabbitMQ, JWT, AWS, Docker. Exposure: Redis, Tailwind, Azure. U.S. citizen.
