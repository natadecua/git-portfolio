# La Mesa Ecopark LiDAR Tree Species Identification UI

Interactive thesis web application for exploring tree species classification outputs using:

- a **2D Leaflet map** for crown polygons, predictions, and map overlays
- a **3D point cloud workflow** (Potree + Three.js) for tree-level LiDAR inspection
- an **Express API** that streams per-tree sampled points with in-memory caching

---

## Table of Contents

1. [Portfolio Summary](#portfolio-summary)
2. [Thesis Context](#thesis-context)
3. [My Role and Ownership](#my-role-and-ownership)
4. [Key Achievements](#key-achievements)
5. [Screenshots (Project Showcase)](#screenshots-project-showcase)
6. [System Overview](#system-overview)
7. [Architecture](#architecture)
8. [Tech Stack](#tech-stack)
9. [Repository Layout](#repository-layout)
10. [Data Assets and Requirements](#data-assets-and-requirements)
11. [GitHub + Large File Strategy](#github--large-file-strategy)
12. [Quick Start](#quick-start)
13. [Run and Validate](#run-and-validate)
14. [API Reference](#api-reference)
15. [Point Cache Build Workflow](#point-cache-build-workflow)
16. [Development Commands](#development-commands)
17. [Cloudflare Tunnel (Remote Testing)](#cloudflare-tunnel-remote-testing)
18. [Performance Notes](#performance-notes)
19. [Troubleshooting](#troubleshooting)
20. [Known Limitations](#known-limitations)

---

## Portfolio Summary

This project is an end-to-end geospatial and machine-learning visualization system I built for my thesis. It transforms large LiDAR-derived tree datasets into an interactive web product that supports model validation, spatial analysis, and communication of results to both technical and non-technical audiences.

For employers, this project demonstrates my ability to:

- build full-stack systems from research requirements to deployable software
- handle large geospatial data under real storage and bandwidth constraints
- design for performance, maintainability, and clear user workflows
- translate academic work into practical decision-support tools

---

## Thesis Context

### Problem

Tree-species classification outputs from LiDAR pipelines are difficult to evaluate using static outputs alone. Users need spatial context, model prediction visibility, and tree-level 3D drill-down in one workflow.

### Objective

Design and implement a web application that enables users to:

1. explore crown polygons and prediction layers in 2D,
2. inspect point-cloud structure in 3D,
3. retrieve tree-level points quickly without loading massive raw files directly in the browser,
4. support repeatable analysis for thesis validation and presentation.

### Outcome

I delivered a working thesis UI that combines Leaflet, Potree, and a custom Express API with reservoir sampling and cache preloading. The system provides practical performance on large datasets and supports both research review and demonstration use cases.

---

## My Role and Ownership

I led implementation across data, backend, frontend, and operations:

- **System architecture:** route/data design, static serving strategy, and integration flow
- **Backend engineering:** point-cloud API with cache-first loading and CSV fallback behavior
- **Data engineering:** streaming cache builder for very large source CSV files
- **Frontend engineering:** interactive 2D/3D workflows and tree-level inspection UX
- **Repository operations:** Git/LFS large-file strategy and maintainable documentation

---

## Key Achievements

- Built a browser-based geospatial thesis product on real-world, high-volume assets.
- Implemented efficient per-tree point retrieval using reservoir sampling.
- Added precomputed NDJSON cache loading for faster repeated tree queries.
- Tuned static asset delivery and caching behavior for map tiles and point-cloud binaries.
- Created a reproducible workflow for dataset updates and cache regeneration.

---

## Screenshots (Project Showcase)

### 1) Main 2D map interface

![Main 2D map interface](https://raw.githubusercontent.com/natadecua/rialc1-ui/HEAD/docs/screenshots/01-map-overview.png)

### 2) Potree main scene viewer

![Potree main viewer](https://raw.githubusercontent.com/natadecua/rialc1-ui/HEAD/docs/screenshots/02-potree-main.png)

### 3) Alternate Potree workflow

![Potree alternate viewer](https://raw.githubusercontent.com/natadecua/rialc1-ui/HEAD/docs/screenshots/03-potree-alt-viewer.png)

### 4) Per-tree point cloud viewer

![Per-tree point cloud viewer](https://raw.githubusercontent.com/natadecua/rialc1-ui/HEAD/docs/screenshots/04-tree-point-viewer.png)

---

## System Overview

This project supports analysis of LiDAR-derived tree data in two complementary views:

- **2D analysis view**: interact with crowns, predictions, and map layers.
- **3D analysis view**: inspect sampled point clouds per tree or view full scene point cloud assets.

The backend is optimized to avoid sending huge CSV/LAS files directly to the client for tree-level interactions. Instead, it serves a sampled JSON response per tree via `GET /api/trees/:treeId/pointcloud`.

---

## Architecture

### Backend (`server.js`)

- Serves static frontend files from `public/`.
- Serves local vendor Three.js modules under `/vendor/three` and `/vendor/three/examples/jsm`.
- Serves project data folders:
   - `/raw_data` → `raw_data/`
   - `/tiles` → `lamesa_forest_final_fixed/`
   - `/Potree_1.8.2` → `Potree_1.8.2/`
- Exposes API endpoints:
   - `/api/status`
   - `/api/trees/:treeId/pointcloud`

### Point cloud API data flow

1. Try to load precomputed samples from `raw_data/tree_point_samples.json` (NDJSON format).
2. If present, materialize sampled tuples in memory and serve quickly.
3. If absent or missing tree entry, fall back to streaming scan of `raw_data/newgroups_adjusted_all_v3.csv` with reservoir sampling.
4. Cache results in process memory for subsequent requests.

### Frontend

- Main app: `public/index.html` + `public/script.js`
- Main Potree page: `public/view_lamesa.html`
- Additional viewer pages for alternate workflows in `public/`

---

## Tech Stack

- **Runtime**: Node.js + Express
- **Frontend map**: Leaflet
- **3D rendering**: Potree 1.8.2 + Three.js
- **Data parsing**: `csv-parser`, `shapefile`
- **Dev tooling**: ESLint, Prettier
- **Large assets**: Git LFS

---

## Repository Layout

```text
rialc1-ui/
├─ server.js                          # Express server, static mounts, API
├─ package.json                       # Scripts and dependencies
├─ public/                            # Frontend pages/scripts/styles/service worker
│  ├─ index.html                      # Main 2D map entry page
│  ├─ script.js                       # Main map logic
│  ├─ view_lamesa.html                # Main Potree scene viewer page
│  ├─ lamesa_potree_viewer.html       # Potree viewer variant
│  ├─ js/                             # Point cloud viewer modules
│  └─ service-worker.js               # Client caching behavior
├─ raw_data/                          # Shapefiles, predictions, point-cloud assets, cache
│  ├─ merged_recropped_brotli/        # Potree metadata + octree/hierarchy binaries
│  ├─ shapefiles/                     # Crown/line shapefile bundles
│  ├─ tree_point_samples.json         # Precomputed NDJSON per-tree cache (LFS)
│  └─ prediction_results*.csv         # Model outputs used by UI
├─ lamesa_forest_final_fixed/         # Pre-rendered map tiles (LFS)
├─ Potree_1.8.2/                      # Potree distribution
└─ scripts/
    └─ build-tree-point-samples.js     # Builds `tree_point_samples.json`
```

---

## Data Assets and Requirements

### Required for normal app usage

- `raw_data/tree_point_samples.json` (recommended for fast per-tree API responses)
- `raw_data/shapefiles/*` (polygon/line overlays)
- `raw_data/prediction_results_top5.csv` (classification outputs)
- `lamesa_forest_final_fixed/` tiles

### Required for rebuilding the cache

- `raw_data/newgroups_adjusted_all_v3.csv`

This source CSV is intentionally **not tracked on GitHub** (see large-file policy below), so place it manually in `raw_data/` before running cache rebuild.

---

## GitHub + Large File Strategy

This repository uses **Git LFS** for large assets (tiles, point cloud binaries, large cache artifacts).

### Why this is necessary

- GitHub blocks regular Git blobs over 100 MB.
- GitHub LFS also has hard size