<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: CC0-1.0
-->

# noi-brennerlec-map



<!-- Auto Generated Below -->


## Overview

(INTERNAL) render leaflet map

## Events

| Event      | Description                                             | Type               |
| ---------- | ------------------------------------------------------- | ------------------ |
| `mapReady` | Emitted when map is initialized and ready to draw on it | `CustomEvent<Map>` |


## CSS Custom Properties

| Name                 | Description          |
| -------------------- | -------------------- |
| `--color-background` | Map background color |
| `--color-primary`    | Link text color      |
| `--map-filter`       | Map filter           |


## Dependencies

### Used by

 - [noi-a22-emission-index](../../public-components/a22-emission-index)

### Graph
```mermaid
graph TD;
  noi-a22-emission-index --> noi-map
  style noi-map fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
