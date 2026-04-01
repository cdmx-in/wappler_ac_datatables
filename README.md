# @cdmx/wappler_ac_datatables

A Wappler App Connect DataTables wrapper with automatic data format detection. Bind a single data source — the component auto-detects whether it's a Wappler paginated response or a plain array and configures itself accordingly.

## Installation

```bash
npm install @cdmx/wappler_ac_datatables
```

## Features

- Single component: `dmx-datatable`
- **One data binding** — no mode selector, no separate total_records
- Auto-detects Wappler paginated responses (`{ data, total, offset, limit, page }`)
- Falls back to client-side DataTables for plain arrays
- Exposes `serverState` with `offset`/`limit` matching Wappler's API params
- Optional column definitions via `fields_header`
- Optional action buttons column with edit/view/delete/custom actions
- Export buttons (Copy, CSV, Excel, PDF, Print) via `export_options`
- Row click and action button events

## How It Works

The component inspects the bound `data` value:

- **Paginated object** (has `.data` array, `.total`, `.offset`, `.limit`) → uses DataTables **server-side** processing. Fires `server_request` on page/search/sort changes.
- **Plain array** → uses DataTables **client-side** processing. Pagination, search, and sort are handled locally.

No configuration needed — just bind your data source.

## Data Formats

### Wappler Paginated Response (Server-Side)

This is the standard response from a Wappler Server Action with pagination enabled:

```json
{
  "offset": 0,
  "limit": 25,
  "total": 4,
  "page": {
    "offset": {
      "first": 0,
      "prev": 0,
      "next": 0,
      "last": 0
    },
    "current": 1,
    "total": 1
  },
  "data": [
    { "id": 1, "category_id": 1, "name": "Test flavour" },
    { "id": 2, "category_id": null, "name": "Privacy Vault" },
    { "id": 3, "category_id": null, "name": "Alfboard" },
    { "id": 4, "category_id": null, "name": "Sprints" }
  ]
}
```

The component extracts:
- `data` → table rows
- `total` → total record count for pagination
- `offset` / `limit` → current page position
- `page.current` / `page.total` → page numbers

### Plain Array (Client-Side)

A standard non-paginated response:

```json
[
  { "id": 1, "name": "Test flavour" },
  { "id": 2, "name": "Privacy Vault" },
  { "id": 3, "name": "Alfboard" },
  { "id": 4, "name": "Sprints" }
]
```

DataTables handles pagination, search, and sorting entirely in the browser.

## Usage with Paginated API (Recommended)

Bind `dmx-bind:data` directly to your Server Connect's paginated output. The component handles everything:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  dmx-bind:fields_header='[{"field":"id","header":"ID"},{"field":"name","header":"Name"}]'
  page_size="25"
></dmx-datatable>
```

### Server-Side Flow

1. Component detects paginated data → enables server-side DataTables
2. On first load, existing data is used immediately (no extra request)
3. When user paginates, searches, or sorts → `server_request` event fires
4. `serverState` is updated with the new `offset`, `limit`, `search`, `orderField`, `orderDir`
5. Your event handler triggers the Server Connect with those params
6. Server Connect returns new paginated response → table updates

### Wiring the Server Request

Listen to `server_request` and pass `params` values to your Server Connect. The `params` object exposes Server Connect-friendly names that you can data-pick directly:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  dmx-bind:fields_header='[{"field":"id","header":"ID"},{"field":"name","header":"Name"}]'
  page_size="25"
></dmx-datatable>
```

In your Server Connect, set the query parameters using the data picker:
- **offset** → `datatable1.params.offset`
- **limit** → `datatable1.params.limit`
- **sort** → `datatable1.params.sort`
- **dir** → `datatable1.params.dir`
- **search** → `datatable1.params.search`

On `server_request`, call `serverconnect1.load(...)` with those values.

> **Note**: `serverState` is still available with additional metadata (`page`, `total`, `totalPages`, `orderField`, `orderDir`). Use `params` for Server Connect bindings and `serverState` when you need full pagination info.

## Usage with Plain Array

For non-paginated data, the component works the same way — just bind the array:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data.results"
  page_size="20"
></dmx-datatable>
```

All pagination, search, and sorting happens in the browser. No `server_request` event fires.

## Column Definitions

Column behavior is controlled by two booleans:

| Setting | Default | Description |
|---|---|---|
| `auto_detect_columns` | `true` | Auto-detect columns from API response data |
| `use_grid_as_override` | `false` | When auto-detect is ON, use grid entries to override auto-detected properties |

### Mode 1: Auto-Detect (default)

`auto_detect_columns="true"` + `use_grid_as_override="false"`

Columns, headers, and search types are all detected automatically from your data. No configuration needed:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  enable_column_search="true"
></dmx-datatable>
```

Search types are auto-detected by sampling the data:
- JavaScript `number` type or numeric strings → **number** search (operator + value input)
- Values matching `YYYY-MM-DD` date format (10+ chars) → **date** search (from/to date pickers)
- Everything else → **text** search (plain text input)

### Mode 2: Auto-Detect with Overrides

`auto_detect_columns="true"` + `use_grid_as_override="true"`

Columns are detected from data, but grid entries override properties like header names, searchable, orderable, and search_type:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  auto_detect_columns="true"
  use_grid_as_override="true"
  dmx-bind:fields_header='[{"field":"id","header":"User ID","orderable":false},{"field":"created_at","header":"Created Date","search_type":"date"}]'
  enable_column_search="true"
></dmx-datatable>
```

Only columns matching a grid `field` are overridden; other columns remain auto-detected.

### Mode 3: Manual Columns

`auto_detect_columns="false"`

Columns are defined entirely by the grid. Only the columns you define will appear:

```html
dmx-bind:fields_header='[{"field":"id","header":"ID","searchable":true,"orderable":true},{"field":"name","header":"Name","searchable":true,"orderable":true},{"field":"category_id","header":"Category","searchable":false,"orderable":false}]'
```

The `field` values **must exactly match** (case-sensitive) the keys in your data objects.

### Column Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `field` | text | — | Data key (must match your data object keys exactly) |
| `header` | text | — | Column display title |
| `name` | text | (same as field) | Column identifier |
| `default_content` | text | `""` | Fallback when value is null |
| `searchable` | boolean | `true` | Whether the column can be searched (global + column search) |
| `orderable` | boolean | `true` | Whether the column can be sorted |
| `search_type` | text | auto-detected | Override the search input type: `text`, `number`, or `date`. Leave empty for auto-detection from data. |

When `searchable` is `false`, the column is excluded from global search results and won't show a column search input. When `orderable` is `false`, clicking the column header won't sort.

The `search_type` is **auto-detected from your data** by default:
- Numeric values → **`number`** — A dropdown (=, >, >=, <, <=, Between) plus a number input (and a second input when "Between" is selected)
- Date-formatted values (YYYY-MM-DD) → **`date`** — Two date pickers (From / To) for date range filtering
- Everything else → **`text`** — A plain text input for substring matching

You can override the auto-detected type by explicitly setting `search_type` in `fields_header`.

## Column Search

Enable per-column search inputs by setting `enable_column_search="true"`. This adds a search input in the header of each searchable column. The input type (text/number/date) is **auto-detected from your data** — no configuration needed.

You can also control global search separately with `enable_global_search`. Both can be used together or independently.

**Simplest usage (auto-detect everything):**

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  enable_column_search="true"
  page_size="25"
></dmx-datatable>
```

**With manual column overrides (optional):**

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  dmx-bind:fields_header='[
    {"field":"id","header":"ID","searchable":false},
    {"field":"name","header":"Name"},
    {"field":"amount","header":"Amount","search_type":"number"},
    {"field":"created_at","header":"Created","search_type":"date"},
    {"field":"status","header":"Status"}
  ]'
  enable_column_search="true"
  page_size="25"
></dmx-datatable>
```

### Search Combinations

| `enable_global_search` | `enable_column_search` | Behavior |
|---|---|---|
| `true` (default) | `false` (default) | Only global search box shown |
| `true` | `true` | Both global search box and column search inputs |
| `false` | `true` | Only column search inputs (global box hidden) |
| `false` | `false` | No search at all |

### How It Works

1. When enabled, a search row is appended to `<thead>` with type-specific inputs for each searchable column
2. Input changes are debounced (300ms) before triggering a search
3. In server-side mode, this fires the `server_request` event
4. The individual column search values are exposed in `params.columnSearch` as a **JSON string**

### Column Search Value Formats

The `params.columnSearch` JSON string contains key-value pairs for each active column filter. The value format depends on the `search_type`:

| Search Type | Value Format | Example |
|---|---|---|
| `text` | Plain string | `"john"` |
| `number` | `operator:value` or `between:min:max` | `"gt:100"`, `"between:10:50"` |
| `date` | `from\|to` (pipe-separated) | `"2024-01-01\|2024-12-31"`, `"2024-01-01\|"`, `"\|2024-12-31"` |

Full example: `{"name":"john","amount":"gt:100","created_at":"2024-01-01|2024-06-30"}`

### Using Column Search Values in Server Connect

Parse `params.columnSearch` as JSON on the server, then build WHERE clauses based on value format:

- **Text**: `WHERE name LIKE '%john%'`
- **Number**: Parse `op:value` → `WHERE amount > 100`, or `between:min:max` → `WHERE amount BETWEEN 10 AND 50`
- **Date**: Parse `from|to` → `WHERE created_at >= '2024-01-01' AND created_at <= '2024-06-30'`

### Example Server Connect Wiring

On `server_request`, pass the params to your Server Connect:
- **offset** → `datatable1.params.offset`
- **limit** → `datatable1.params.limit`
- **sort** → `datatable1.params.sort`
- **dir** → `datatable1.params.dir`
- **search** → `datatable1.params.search` (global search)
- **column_search** → `datatable1.params.columnSearch` (JSON string with per-column filters)

On the server side, parse `column_search` as JSON and add WHERE clauses for each column filter.

## Action Buttons

Enable an actions column with `enable_actions="true"`. Configure buttons via `action_btns`:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  enable_actions="true"
  actions_column_position="right"
  dmx-bind:action_btns='[
    {"enabled":true,"name":"activate","tooltip":"Activate","icon_class":"fas fa-check","btn_class":"btn btn-sm btn-success","condition":"row.status == `pending`"},
    {"enabled":true,"name":"edit","tooltip":"Edit","icon_class":"fas fa-pencil-alt","btn_class":"btn btn-sm btn-primary","condition":""},
    {"enabled":true,"name":"delete","tooltip":"Delete","icon_class":"fas fa-trash","btn_class":"btn btn-sm btn-danger","condition":""}
  ]'
></dmx-datatable>
```

### Action Button Properties

| Property | Description |
|---|---|
| `enabled` | `true` or `false` to show/hide the button globally |
| `name` | Action name — a label for your reference (e.g. `edit`, `activate`, `delete`) |
| `title` | Button text label (optional) |
| `tooltip` | Hover tooltip |
| `icon_class` | CSS icon class (e.g. `fas fa-pencil-alt`) |
| `btn_class` | CSS button class (e.g. `btn btn-sm btn-primary`) |
| `condition` | Expression evaluated per-row to show/hide the button (see Conditions below) |

### Action Numbering & Events

Each action button is assigned a **number based on its position** (1-indexed) in the `action_btns` array, up to a maximum of **15 actions**. The numbering is stable — it is based on array index, not on which buttons are enabled or visible.

| Array Position | Event Fired |
|---|---|
| 1st button | `action_1` |
| 2nd button | `action_2` |
| 3rd button | `action_3` |
| ... | ... |
| 15th button | `action_15` |

When a button is clicked:
1. The clicked **row data** is set on `datatable1.data` and `datatable1.id`
2. The action's **name** is set on `datatable1.action_name`
3. The action's **number** is set on `datatable1.action_number`
4. The corresponding **numbered event** fires (e.g. `action_1`)

You can handle each action event separately in the Wappler Events panel. The row data is accessible via `datatable1.data` — for example `datatable1.data.id`, `datatable1.data.email`, etc.

**Example**: If you have 3 buttons (Activate, Edit, Delete) in that order:
- Clicking "Activate" → fires `action_1`, sets `datatable1.action_name` = `activate`
- Clicking "Edit" → fires `action_2`, sets `datatable1.action_name` = `edit`
- Clicking "Delete" → fires `action_3`, sets `datatable1.action_name` = `delete`

### Conditions (Show/Hide per Row)

The `condition` field accepts an **expression** that is evaluated for each row. If the condition evaluates to a falsy value, the button is **hidden** for that row. If the condition is empty, the button is always shown.

Conditions can reference:
- **Row data** via `row.<field>` — e.g. `row.status`, `row.is_active`, `row.role`
- **Page-level data** — any data available on the page (Server Connect values, variables, permissions, etc.)

The condition field supports **data picking** in the Wappler UI — click the data picker icon to browse available data sources.

#### Condition Examples

| Condition | Behavior |
|---|---|
| *(empty)* | Button always shown |
| `row.status == 'pending'` | Show only when the row's `status` field is `"pending"` |
| `row.is_active == false` | Show only for inactive rows |
| `row.role != 'admin'` | Show for all rows except admin role |
| `permissions.data.can_delete` | Show only if the page-level permission allows delete |
| `row.status == 'pending' && permissions.data.can_approve` | Combine row data + page permissions |

#### How Conditions Work

1. When DataTables renders each row, the component evaluates every action button's condition
2. The current row's data is temporarily available as `row` (e.g. `row.status`, `row.id`)
3. The expression is evaluated using `dmx.parse`, so it has full access to the App Connect scope tree (page data, Server Connect values, variables, etc.)
4. If the result is truthy → button is shown; if falsy → button is hidden
5. If the condition throws an error → button is shown (fail-open)

#### Real-World Use Case

**Scenario**: You have a users table and want an "Activate" button that only appears for pending accounts, and a "Delete" button that only shows if the logged-in user has admin permissions.

```html
dmx-bind:action_btns='[
  {"enabled":true,"name":"activate","tooltip":"Activate Account","icon_class":"fas fa-check","btn_class":"btn btn-sm btn-success","condition":"row.status == `pending`"},
  {"enabled":true,"name":"edit","tooltip":"Edit","icon_class":"fas fa-pencil-alt","btn_class":"btn btn-sm btn-primary","condition":""},
  {"enabled":true,"name":"delete","tooltip":"Delete","icon_class":"fas fa-trash","btn_class":"btn btn-sm btn-danger","condition":"permissions.data.is_admin"}
]'
```

Then in the Wappler Events panel:
- **Action 1** (`action_1`) → Handle activate: call a Server Action with `datatable1.data.id`
- **Action 2** (`action_2`) → Handle edit: navigate or open modal with `datatable1.data`
- **Action 3** (`action_3`) → Handle delete: call a Server Action with `datatable1.data.id`

## Export Options

Add export buttons (Copy, CSV, Excel, PDF, Print) to the table toolbar via `export_options`. When any export button is enabled, the DataTables `dom` is set to `Bfrtip` to show the button bar.

> **Prerequisite**: Export buttons require the [DataTables Buttons extension](https://datatables.net/extensions/buttons/) JS and CSS to be loaded in your page.

### Example

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  dmx-bind:export_options='[
    {"enabled":true,"type":"csv","title":"Export CSV"},
    {"enabled":true,"type":"excel","title":"Export Excel"},
    {"enabled":false,"type":"pdf","title":"Export PDF"},
    {"enabled":false,"type":"copy","title":"Copy"},
    {"enabled":false,"type":"print","title":"Print"}
  ]'
></dmx-datatable>
```

### Export Option Properties

| Property | Type | Description |
|---|---|---|
| `enabled` | boolean | `true` to show the button, `false` to hide |
| `type` | text | Button type: `copy`, `csv`, `excel`, `pdf`, or `print` |
| `title` | text | Label shown on the button (defaults to capitalized type name) |

### How It Works

- Only buttons with `enabled: true` are added
- Each enabled button becomes `{ extend: "<type>", text: "<title>" }` in the DataTables buttons config
- If at least one button is enabled, `dom` is set to `Bfrtip` to render the button toolbar
- If no buttons are enabled, `dom` is left at the DataTables default (no button bar)

## Exposed Data

| Property | Type | Description |
|---|---|---|
| `id` | text | `id` field of the last clicked row |
| `data` | object | Full row data of the last clicked row |
| `row` | object | Current row data (available during condition evaluation) |
| `action_name` | text | Name of the last clicked action button |
| `action_number` | number | Number (1-15) of the last clicked action button |
| `count` | number | Number of rows currently in the table |
| **params** | | **Server Connect parameters (use these in data picker)** |
| `params.offset` | number | Current offset for the API query |
| `params.limit` | number | Current page size / limit |
| `params.sort` | text | Column field name being sorted |
| `params.dir` | text | Sort direction: `asc` or `desc` |
| `params.search` | text | Current search string |
| `params.columnSearch` | text | Per-column search values as JSON string (e.g. `{"name":"john","status":"pending"}`) |
| **serverState** | | **Full pagination metadata** |
| `serverState.offset` | number | Current offset for the API query |
| `serverState.limit` | number | Current page size / limit for the API query |
| `serverState.page` | number | Current page number (1-based) |
| `serverState.total` | number | Total records from the API response |
| `serverState.totalPages` | number | Total pages calculated from response |
| `serverState.search` | text | Current search string from DataTables |
| `serverState.orderField` | text | Column field name being sorted |
| `serverState.orderDir` | text | Sort direction: `asc` or `desc` |
| `state.tableReady` | boolean | Whether the table has been initialized |
| `state.loading` | boolean | Whether a server request is in progress |

## Actions (Methods)

| Action | Description |
|---|---|
| `loadTable` | Initialize/load the DataTable |
| `reloadTable` | Destroy and recreate the DataTable |
| `destroyTable` | Destroy the DataTable instance |

## Events

| Event | Description |
|---|---|
| `server_request` | Fired when the table needs new data (paginated mode: page change, search, sort) |
| `row_clicked` | Fired when a row is clicked (not on action buttons) |
| `action_1` | Fired when the 1st action button is clicked |
| `action_2` | Fired when the 2nd action button is clicked |
| `action_3` | Fired when the 3rd action button is clicked |
| `action_4` – `action_15` | Fired for the 4th through 15th action buttons respectively |

All `action_N` events set `datatable1.data` (full row), `datatable1.id` (row id), `datatable1.action_name`, and `datatable1.action_number` before firing.

## Component Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `id` | text | — | Unique component ID (required) |
| `dmx-bind:data` | object/array | `null` | Wappler paginated response or plain array |
| `noload` | boolean | `false` | If set, table won't auto-load on render |
| `table_class` | text | `table table-striped table-bordered table-hover` | CSS classes for the table element |
| `page_size` | number | `20` | Default rows per page |
| `dmx-bind:fields_header` | array | `[]` | Column definitions / overrides `[{field, header, searchable, orderable, search_type}]` |
| `auto_detect_columns` | boolean | `true` | Auto-detect columns from data |
| `use_grid_as_override` | boolean | `false` | When auto-detect ON, use grid as overrides |
| `enable_actions` | boolean | `false` | Show actions column |
| `actions_column_position` | text | `right` | `left` or `right` |
| `dmx-bind:action_btns` | array | `[]` | Action button definitions |
| `enable_column_search` | boolean | `false` | Show per-column search inputs (type auto-detected from data) |
| `enable_global_search` | boolean | `true` | Show the global search box |
| `dmx-bind:export_options` | array | `[]` | Export button definitions `[{enabled, type, title}]` |

## Troubleshooting

### Table initializes but shows no data

- **Data binding is wrong**: Make sure `dmx-bind:data` points to the correct path. For paginated APIs, bind to the full response object (e.g. `serverconnect1.data`), NOT to `serverconnect1.data.data`.
- **Fields mismatch**: If `fields_header` is set, ensure the `field` values match the data keys exactly (case-sensitive).
- **Data not yet loaded**: If your Server Connect hasn't loaded when the table creates, data will appear once the Server Connect completes.
- **Server request not wired**: In paginated mode, ensure your `server_request` event handler triggers the Server Connect with `serverState` params.

## Backup

Previous version files are stored in `backup/`.
