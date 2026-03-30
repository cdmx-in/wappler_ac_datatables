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

Listen to `server_request` and pass `serverState` values to your Server Connect:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  dmx-bind:fields_header='[{"field":"id","header":"ID"},{"field":"name","header":"Name"}]'
  page_size="25"
></dmx-datatable>
```

In your Server Connect, set the query parameters:
- **offset** → `datatable1.serverState.offset`
- **limit** → `datatable1.serverState.limit`
- **sort** → `datatable1.serverState.orderField`
- **dir** → `datatable1.serverState.orderDir`
- **search** → `datatable1.serverState.search`

On `server_request`, call `serverconnect1.load(...)` with those values.

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

### Auto-Detected

If `fields_header` is omitted, columns are generated from the keys of the first row.

### Manual

Define columns explicitly with `fields_header`:

```html
dmx-bind:fields_header='[{"field":"id","header":"ID"},{"field":"name","header":"Name"},{"field":"category_id","header":"Category"}]'
```

The `field` values **must exactly match** (case-sensitive) the keys in your data objects.

## Action Buttons

Enable an actions column with `enable_actions="true"`. Configure buttons via `action_btns`:

```html
<dmx-datatable
  id="datatable1"
  dmx-bind:data="serverconnect1.data"
  enable_actions="true"
  actions_column_position="right"
  dmx-bind:action_btns='[
    {"enabled":true,"name":"edit","tooltip":"Edit","icon_class":"fas fa-pencil-alt","btn_class":"btn btn-sm btn-primary"},
    {"enabled":true,"name":"view","tooltip":"View","icon_class":"fas fa-eye","btn_class":"btn btn-sm btn-info"},
    {"enabled":true,"name":"delete","tooltip":"Delete","icon_class":"fas fa-trash","btn_class":"btn btn-sm btn-danger"}
  ]'
></dmx-datatable>
```

### Action Button Properties

| Property | Description |
|---|---|
| `enabled` | `true` or `false` to show/hide the button |
| `name` | Action name: `edit`, `view`, `delete`, or any custom name |
| `title` | Button text label (optional) |
| `tooltip` | Hover tooltip |
| `icon_class` | CSS icon class (e.g. `fas fa-pencil-alt`) |
| `btn_class` | CSS button class (e.g. `btn btn-sm btn-primary`) |

When a button is clicked, the clicked row data is set on `datatable1.data` and `datatable1.id`, then the corresponding event fires.

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
| `count` | number | Number of rows currently in the table |
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
| `row_action_edit` | Fired when an action button with name `edit` is clicked |
| `row_action_view` | Fired when an action button with name `view` is clicked |
| `row_action_delete` | Fired when an action button with name `delete` is clicked |
| `row_action_custom` | Fired when an action button with any other name is clicked |

## Component Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `id` | text | — | Unique component ID (required) |
| `dmx-bind:data` | object/array | `null` | Wappler paginated response or plain array |
| `noload` | boolean | `false` | If set, table won't auto-load on render |
| `table_class` | text | `table table-striped table-bordered table-hover` | CSS classes for the table element |
| `page_size` | number | `20` | Default rows per page |
| `dmx-bind:fields_header` | array | `[]` | Column definitions `[{field, header}]` |
| `enable_actions` | boolean | `false` | Show actions column |
| `actions_column_position` | text | `right` | `left` or `right` |
| `dmx-bind:action_btns` | array | `[]` | Action button definitions |
| `dmx-bind:export_options` | array | `[]` | Export button definitions `[{enabled, type, title}]` |

## Troubleshooting

### Table initializes but shows no data

- **Data binding is wrong**: Make sure `dmx-bind:data` points to the correct path. For paginated APIs, bind to the full response object (e.g. `serverconnect1.data`), NOT to `serverconnect1.data.data`.
- **Fields mismatch**: If `fields_header` is set, ensure the `field` values match the data keys exactly (case-sensitive).
- **Data not yet loaded**: If your Server Connect hasn't loaded when the table creates, data will appear once the Server Connect completes.
- **Server request not wired**: In paginated mode, ensure your `server_request` event handler triggers the Server Connect with `serverState` params.

## Backup

Previous version files are stored in `backup/`.
