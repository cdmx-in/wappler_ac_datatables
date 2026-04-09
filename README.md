# @cdmx/wappler_ac_datatables

A Wappler App Connect DataTables 2.x component with automatic data format detection, advanced column search, multi-row selection, column reorder/resize, RTL, theming, and export.

## Installation

```bash
npm install @cdmx/wappler_ac_datatables
```

## Features

- **Single component**: `dmx-datatable`
- **One data binding** — auto-detects Wappler paginated responses or plain arrays
- **Theming** — Bootstrap 5, Bootstrap 4, or default DataTables styling
- **Column search** — Simple (text input) or Advanced (type-aware operators & conditions) per column
  - Auto-detected types: text, number, date
  - Manual types: dropdown (unique values), boolean (true/false)
  - Search position: header popup or inline row
- **Column reorder** — Drag-and-drop column headers, persisted in localStorage
- **Column resize** — Drag column borders to resize, persisted in localStorage
- **Multi-row selection** — Click rows to select/deselect, exposes `selected_rows` array
- **RTL support** — Right-to-left layout for Arabic, Hebrew, etc.
- **Row & column highlight** — Hover highlighting for rows and/or columns
- **Export** — Copy, CSV, Excel, PDF, Print via toolbar buttons or programmatic `exportData` method
- **Export field exclusion** — Comma-separated list of fields to exclude from exports
- **Action buttons** — Up to 15 configurable action buttons per row with conditional visibility
- **Advanced columns** — Footer values, render functions, width, CSS class, external data per column
- **Filters data** — Live `filters` object exposing current global search and column search state
- **Methods** — `loadTable`, `reloadTable`, `destroyTable`, `exportData`, `getSelectedRows`, `getFilters`, `clearFilters`, `resetColumnState`

## How It Works

The component inspects the bound `data` value:

- **Paginated object** (has `.data` array, `.total`, `.offset`, `.limit`) → **server-side** processing. Fires `server_request` on page/search/sort changes.
- **Plain array** → **client-side** processing. Pagination, search, and sort handled locally.

## Quick Start

### Paginated API (server-side)

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  page_length="25"
></dmx-datatable>
```

Wire the `server_request` event to reload your Server Connect with:
- `datatable1.params.offset`, `datatable1.params.limit`, `datatable1.params.sort`, `datatable1.params.dir`, `datatable1.params.search`, `datatable1.params.columnSearch`

### Plain Array (client-side)

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data.results"
  page_length="20"
></dmx-datatable>
```

## Properties

### General

| Attribute | Type | Default | Description |
|---|---|---|---|
| `id` | text | — | Unique component ID (required) |
| `dmx-bind:data` | object/array | `null` | Data source — paginated response or plain array |
| `noload` | boolean | `false` | Don't auto-load on render |
| `table_class` | text | `table table-striped table-bordered table-hover` | CSS classes for the `<table>` element |
| `theme` | droplist | `bootstrap5` | Styling theme: `dataTables`, `bootstrap5`, `bootstrap4` |
| `enable_global_search` | boolean | `true` | Show global search box |
| `enable_column_reorder` | boolean | `false` | Drag-and-drop column reorder (saved in localStorage) |
| `enable_column_resize` | boolean | `false` | Drag column borders to resize (saved in localStorage) |
| `enable_rtl` | boolean | `false` | Right-to-left text direction |
| `enable_row_highlight` | boolean | `false` | Highlight row on hover |
| `enable_column_highlight` | boolean | `false` | Highlight column on hover |
| `enable_multi_select` | boolean | `false` | Allow multi-row selection by clicking |

### Pagination

| Attribute | Type | Default | Description |
|---|---|---|---|
| `page_length` | number | `20` | Rows per page |
| `length_menu` | text | `10,20,50,100` | Comma-separated page length options |

### Column Search

| Attribute | Type | Default | Description |
|---|---|---|---|
| `enable_column_search` | boolean | `false` | Show per-column search controls |
| `column_search_mode` | droplist | `simple` | `simple` (text input) or `advanced` (type-aware operators) |
| `column_search_position` | droplist | `row` | `header` (popup) or `row` (inline row below headers) |

### Columns (Basic) — `fields_header` grid

| Field | Type | Description |
|---|---|---|
| `field` | text | Data key (must match your data keys exactly) |
| `header` | text | Column display title |
| `name` | text | Column identifier |
| `default_content` | text | Fallback when value is null |
| `searchable` | checkbox | Whether the column is searchable |
| `orderable` | checkbox | Whether the column is sortable |
| `search_type` | droplist | Override search type: Auto, Text, Number, Date, Dropdown, Boolean |
| `isHidden` | checkbox | Hide the column |

### Columns (Advanced) — `fields_header_advanced` grid

| Field | Type | Description |
|---|---|---|
| `field` | text | Data key (matches basic grid field) |
| `footer_value` | datapicker | Footer aggregate value |
| `render` | text | JS render function: `function(data, type, row) { return '<b>' + data + '</b>'; }` |
| `width` | text | Column width (e.g. `150px`, `20%`) |
| `className` | text | CSS class for the column |
| `external_data` | datapicker | External data accessible in render via `row.__ext_<fieldName>` |

### Column Auto-Detection

| Setting | Default | Description |
|---|---|---|
| `auto_detect_columns` | `true` | Auto-detect columns from data |
| `use_grid_as_override` | `false` | Use grid entries to override auto-detected properties |

Search types are auto-detected from data:
- Numeric values → **number** (operator + value input)
- Date values (YYYY-MM-DD) → **date** (from/to pickers)
- Everything else → **text**

Additional manual search types:
- **dropdown** — `<select>` populated with unique column values
- **boolean** — `<select>` with All / True / False options

### Actions

| Attribute | Type | Default | Description |
|---|---|---|---|
| `enable_actions` | boolean | `false` | Show actions column |
| `actions_column_position` | droplist | `right` | `left` or `right` |
| `dmx-bind:action_btns` | grid | `[]` | Action button definitions (up to 15) |

Action button fields: `enabled`, `name`, `title`, `tooltip`, `icon_class`, `btn_class`, `condition`

The `condition` field accepts an expression evaluated per-row using `dmx.parse`. Reference row data via `row.<field>` and page-level data directly. Empty condition = always shown.

### Export Options

| Attribute | Type | Default | Description |
|---|---|---|---|
| `dmx-bind:export_options` | grid | `[]` | Export buttons: `[{enabled, type, title}]` |
| `export_exclude_fields` | text | `""` | Comma-separated field names to exclude from exports |

Export types: `copy`, `csv`, `excel`, `pdf`, `print`

## Exposed Data

| Property | Type | Description |
|---|---|---|
| `id` | text | `id` field of last clicked row |
| `data` | object | Full row data of last clicked row |
| `row` | object | Current row data (during condition evaluation) |
| `action_name` | text | Name of last clicked action button |
| `action_number` | number | Number (1-15) of last clicked action button |
| `count` | number | Number of rows in the table |
| `selected_rows` | array | Currently selected rows (when multi-select enabled) |
| `params.offset` | number | Current offset |
| `params.limit` | number | Current page size |
| `params.sort` | text | Sort column field |
| `params.dir` | text | Sort direction (`asc`/`desc`) |
| `params.search` | text | Global search string |
| `params.columnSearch` | text | Per-column search as JSON string |
| `serverState.offset` | number | API offset |
| `serverState.limit` | number | API limit |
| `serverState.page` | number | Current page (1-based) |
| `serverState.total` | number | Total records |
| `serverState.totalPages` | number | Total pages |
| `serverState.search` | text | Search string |
| `serverState.orderField` | text | Sort field |
| `serverState.orderDir` | text | Sort direction |
| `state.tableReady` | boolean | Table initialized |
| `state.loading` | boolean | Server request in progress |
| `filters.global_search` | text | Current global search value |
| `filters.column_search` | object | Current column search values (keyed by column name) |

## Methods

| Method | Parameters | Description |
|---|---|---|
| `loadTable` | — | Initialize/load the DataTable |
| `reloadTable` | — | Destroy and recreate the DataTable |
| `destroyTable` | — | Destroy the DataTable instance |
| `exportData` | `type` (csv, excel, pdf, copy, print) | Trigger an export programmatically |
| `getSelectedRows` | — | Returns currently selected rows |
| `getFilters` | — | Returns current filter state (`global_search` + `column_search`) |
| `clearFilters` | — | Clears all filters (global + column) and redraws |
| `resetColumnState` | — | Clears saved column order & widths from localStorage and rebuilds |

## Events

| Event | Description |
|---|---|
| `server_request` | Table needs new data (page change, search, sort) |
| `row_clicked` | Row clicked (not on action buttons) |
| `selection_changed` | Multi-select row selection changed |
| `action_1` – `action_15` | Action button clicked (by array position) |

All `action_N` events set `data`, `id`, `action_name`, and `action_number` before firing.

## Column Search Value Formats

When using `params.columnSearch`, values are formatted by type:

| Search Type | Format | Example |
|---|---|---|
| text (simple) | plain string | `"john"` |
| text (advanced) | `txt:operator:value` | `"txt:contains:john"`, `"txt:equals:active"` |
| number | `operator:value` | `"gt:100"`, `"between:10:50"` |
| date | `from\|to` | `"2024-01-01T00:00\|2024-12-31T23:59"` |
| dropdown | `txt:equals:value` | `"txt:equals:Active"` |
| boolean | `txt:equals:value` | `"txt:equals:true"` |

Text advanced operators: `contains`, `notContains`, `equals`, `notEquals`, `startsWith`, `endsWith`, `blank`, `notBlank`. Two conditions can be joined with `and`/`or`.

## Troubleshooting

- **No data**: Ensure `dmx-bind:data` points to the full paginated response, not `serverconnect1.data.data`.
- **Fields mismatch**: `field` values in `fields_header` must exactly match data keys (case-sensitive).
- **Server request not wired**: In paginated mode, wire the `server_request` event to reload your Server Connect with `params` values.
- **Exports not working**: Ensure DataTables Buttons extension JS/CSS is loaded. Use `export_options` grid to enable buttons.
- **Column reorder/resize not persisting**: Requires localStorage access. State is keyed by page path + component ID.
