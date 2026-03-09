# @cdmx/wappler_ac_datatables

#### Developed and Maintained by: Roney Dsilva

A Wappler App Connect component wrapping **DataTables v2** — a feature-rich data grid with client-side and server-side pagination, multi-select column filters, CSV/PDF export, action buttons, and more. No jQuery required.

---

## Features

- **Client-side & Server-side pagination** — native DataTables v2 ajax callback
- **Global search bar** — built-in DataTables search
- **Floating column text filters** — per-column input row below headers
- **Multi-select column filters** — per-column checkbox dropdown
- **Initial column filters** — preset filters on load
- **Sortable columns** — with optional case-insensitive sort
- **Default sort order** — configure per field
- **Row / cell click events** — single and double-click
- **Row checkbox selection** — with checked/unchecked events
- **Row status toggle** — boolean column rendered as a switch UI
- **Action buttons** — Edit, View, Delete + 10 custom buttons with icon, tooltip, and condition support
- **Condition-based cell & row styling** — color and font per condition
- **Date formatting** — configurable format string and timezone
- **Amount/currency formatting** — locale-aware with configurable precision
- **JS custom cell renderers** — call a window function returning HTML
- **Display data changes** — combine fields using `%field%` placeholders
- **Value mapping** — replace field values in cell or tooltip
- **CSV export** — via PapaParse (built-in DataTables CSV or custom)
- **PDF export** — via pdfMake
- **Footer aggregation** — sum and count columns
- **Column hide/show** — via actions or attribute
- **Dark mode** — via table CSS class
- **Horizontal/vertical scroll** — configurable
- **File import** — parse CSV files into `fileData` via PapaParse
- **`noload` attribute** — prevent auto-refresh on data change

---

## Installation

Install via npm (in your Wappler project root):

```bash
npm install @cdmx/wappler_ac_datatables
```

Wappler will copy the required files automatically when you add the component in the UI. The following files are deployed:

| File | Destination |
|---|---|
| `dataTables.min.js` | `js/dataTables.min.js` |
| `dmx-datatables.js` | `js/dmx-datatables.js` |
| `papaparse.min.js` | `js/papaparse.min.js` |
| `pdfmake.min.js` | `js/pdfmake.min.js` |
| `vfs_fonts.js` | `js/vfs_fonts.js` |
| `dmx-datatables.css` | `css/dmx-datatables.css` |

---

## Quick Start

```html
<dmx-datatables
  id="myTable"
  dmx-bind:data="serverConnect1.data.rows"
  table_class="table table-striped table-hover table-bordered"
  pagination="true"
  pagination_page_size="20"
  export_to_csv="true"
></dmx-datatables>
```

---

## Properties

### Core

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| ID | `id` | text | — | Unique ID for the table (required) |
| Data Source | `dmx-bind:data` | array | `[]` | Data array to display |
| No Auto Load | `noload` | boolean | false | Prevent auto-initialise on data change |
| Table CSS Class | `table_class` | text | `table table-striped table-hover table-bordered` | Bootstrap table classes |
| Dark Mode | `dmx-bind:dark_mode` | boolean | false | Apply dark styling |

### Columns

| Property | Attribute | Type | Description |
|---|---|---|---|
| Column Names | `dmx-bind:cnames` | object | `{ field: { custom_name: "Label" } }` |
| Column Widths | `dmx-bind:cwidths` | object | `{ field: { min_width: 100, max_width: 200 } }` |
| Column Types | `dmx-bind:ctypes` | array | `[{ field, type }]` — type: `text`, `number`, `date` |
| Hide Fields | `hide_fields` | text | Comma-separated field names to hide |
| Hide ID Field | `hide_id_field` | boolean | Hide the `id` column |
| Wrap Cell Text | `wrap_text` | boolean | Wrap long text in cells |

### Formatting

| Property | Attribute | Default | Description |
|---|---|---|---|
| Date Format | `date_format` | `dd/MM/yyyy hh:mm A` | Format string for date columns |
| Date Locale | `date_locale` | `en-US` | Locale for number/date formatting |
| Timezone | `timezone` | — | IANA timezone string (e.g. `Asia/Kolkata`) |
| Amount Fields | `amount_fields` | — | Comma-separated fields to format as locale numbers |
| Amount Precision | `amount_field_precision` | `2` | Decimal places for amount fields |

### Sorting

| Property | Attribute | Default | Description |
|---|---|---|---|
| Enable Sorting | `sortable` | true | Allow column sorting |
| Case-Insensitive Sort | `ci_sort` | false | Sort strings case-insensitively |
| Default Sort | `dmx-bind:csort` | — | `[{ field, sort }]` — sort: `asc` or `desc` |

### Filtering

| Property | Attribute | Default | Description |
|---|---|---|---|
| Global Search Bar | `filter` | true | Show DataTables built-in search box |
| Column Text Filters | `floating_filter` | false | Per-column text input row |
| Multi-Select Filters | `multiselect_filter` | false | Per-column checkbox dropdown |
| Initial Column Filters | `dmx-bind:cfilters` | — | `[{ field, filter }]` — preset on load |
| Quick Filter Input ID | `quick_filter_field` | `search_field` | ID of an external `<input>` used by the `quickFilter` action |

### Pagination

| Property | Attribute | Default | Description |
|---|---|---|---|
| Enable Pagination | `pagination` | true | Show pagination controls |
| Page Size | `pagination_page_size` | `20` | Rows per page |
| Page Size Options | `dmx-bind:pagination_page_size_selector` | `[10,20,50,100]` | Dropdown options |

### Server-Side Pagination

| Property | Attribute | Default | Description |
|---|---|---|---|
| Server-Side Mode | `server_side` | false | Fire `server_request` event on page/sort/filter changes |
| Total Record Count | `dmx-bind:total_records` | — | Total rows from server (required for server-side paging) |

In server-side mode, bind your Server Connect action to the `server_request` event and pass `serverState.*` fields as parameters to your API.

### Layout

| Property | Attribute | Default | Description |
|---|---|---|---|
| Horizontal Scroll | `scroll_x` | false | Enable horizontal scrollbar |
| Scroll Height | `scroll_y` | — | Fixed height with vertical scroll (e.g. `400px`) |

### Row Events

| Property | Attribute | Default | Description |
|---|---|---|---|
| Row Click Event | `row_click_event` | false | Fire `row_clicked` on row click |
| Row Double-Click Event | `row_double_click_event` | false | Fire `row_double_clicked` |
| Cell Click Event | `cell_click_event` | false | Fire `cell_clicked` |
| Row Checkbox Event | `row_checkbox_event` | false | Fire `row_checkbox_checked` / `row_checkbox_unchecked` |
| Status Toggle Event | `row_status_event` | false | Fire `row_status_enabled` / `row_status_disabled` |
| Suppress Pointer Cursor | `suppress_row_click_selection` | false | Disable pointer cursor on rows |

### Export

| Property | Attribute | Default | Description |
|---|---|---|---|
| CSV Export Button | `export_to_csv` | true | Show CSV export button |
| CSV Filename | `export_csv_filename` | `export.csv` | Downloaded file name |
| PDF Export Button | `export_to_pdf` | false | Show PDF export button |
| PDF Filename | `export_pdf_filename` | `export.pdf` | Downloaded file name |
| Strip HTML on Export | `export_remove_html` | false | Remove HTML tags from exported values |
| Trim Values on Export | `export_trim_data` | false | Trim whitespace from exported values |
| Exclude Fields | `export_exclude_fields` | — | Comma-separated fields to omit from export |
| Exclude Hidden Fields | `export_exclude_hidden_fields` | false | Skip hidden columns in export |

### Value Mapping

| Property | Attribute | Description |
|---|---|---|
| Data Changes | `dmx-bind:data_changes` | `[{ field, value, new_value, area }]` — replace a value in `cell` or `tooltip` |
| Display Data Changes | `dmx-bind:display_data_changes` | `[{ field, data }]` — use `%field%` placeholders to combine columns |
| JS Data Changes | `dmx-bind:js_data_changes` | `[{ field, function }]` — call a `window` function returning HTML |

### Styling

| Property | Attribute | Description |
|---|---|---|
| Cell Styles | `dmx-bind:cstyles` | `[{ field, condition, customColor, font, area }]` — area: `text` or `cell` |
| Row Styles | `dmx-bind:rstyles` | `[{ condition, customColor }]` |

Conditions use simple expressions: `field==value`, `field!=value`, `field>value`, `field>=value`, or just `field` (truthy check). Combine with `&&` or `||`. You can also reference a window function: `myFn()`.

### Action Buttons

| Property | Attribute | Default | Description |
|---|---|---|---|
| Enable Actions Column | `enable_actions` | false | Show the actions column |
| Actions Position | `actions_column_position` | `right` | `left` or `right` |
| Edit Button | `edit_action_btn` | false | Enable Edit button |
| Edit Label | `edit_action_title` | — | Button label text |
| Edit Tooltip | `edit_action_tooltip` | `Edit` | Tooltip text |
| Edit Icon Class | `edit_action_icon_class` | `fas fa-pencil-alt` | Icon CSS class |
| Edit Button Class | `edit_action_btn_class` | `btn-primary btn-xs m-1` | Button CSS class |
| Edit Condition | `edit_action_btn_condition` | — | Show button only when condition is met |
| View Button | `view_action_btn` | false | Enable View button |
| Delete Button | `delete_action_btn` | false | Enable Delete button |
| Enable Custom Buttons | `enable_custom_action_btns` | false | Show buttons 1–10 |
| Button N | `buttonN_action_btn` | false | Enable custom button N (1–10) |

### Footer Aggregation

| Property | Attribute | Description |
|---|---|---|
| Sum Columns | `columns_to_sum` | Comma-separated fields to sum in footer |
| Sum Precision | `footer_sum_precision` | Decimal places for summed values |
| Count Columns | `dmx-bind:columns_to_count` | `[{ field, unique_values }]` — count distinct values |

---

## Exposed Data

Access these on the component (e.g. `datatables1.data.id`):

| Property | Type | Description |
|---|---|---|
| `id` | number | Row ID of last clicked/actioned row |
| `data` | object | Full row data of last clicked/actioned row |
| `count` | number | Total number of rows in the data array |
| `fields` | object | Column field values of last clicked cell |
| `fileData` | array | Rows parsed from imported CSV file |
| `selectedRows` | array | Currently selected rows (populated by `getSelectedRows`) |
| `filterState` | object | Current filter configuration |
| `serverState.page` | number | Current page (server-side) |
| `serverState.pageSize` | number | Rows per page (server-side) |
| `serverState.totalRecords` | number | Total records (server-side) |
| `serverState.totalPages` | number | Total pages (server-side) |
| `serverState.search` | text | Current search text (server-side) |
| `serverState.orderField` | text | Current sort field (server-side) |
| `serverState.orderDir` | text | Sort direction: `asc` or `desc` |
| `serverState.columnFilters` | object | Per-column filter values (server-side) |
| `state.tableReady` | boolean | Table has initialised |
| `state.loading` | boolean | Server request in progress |
| `state.rowDataUpdated` | boolean | Data was updated in last server response |

---

## Actions

| Action | Description |
|---|---|
| `loadTable` | Initialise or re-initialise the table |
| `destroyTable` | Destroy the DataTable instance |
| `reloadTable` | Rebuild and reload the table |
| `exportTable(csv, pdf)` | Export data to CSV or PDF |
| `quickFilter` | Apply global search from the configured input field |
| `applyFilters(searchText)` | Programmatically set the global search text |
| `clearFilters` | Clear all filters (search, column, multi-select) |
| `hideColumns(fieldName)` | Hide a column by field name |
| `showColumns(fieldName)` | Show a hidden column by field name |
| `goToPage(page)` | Navigate to a specific page (1-based) |
| `setPageSize(size)` | Change the rows-per-page count |
| `getSelectedRows` | Populate `selectedRows` with checked rows |
| `importFileData(fileInputId)` | Parse a CSV file into `fileData` |

---

## Events

| Event | Description |
|---|---|
| `row_clicked` | Row was single-clicked |
| `row_double_clicked` | Row was double-clicked |
| `cell_clicked` | Cell was clicked |
| `row_checkbox_checked` | Row checkbox was checked |
| `row_checkbox_unchecked` | Row checkbox was unchecked |
| `row_status_enabled` | Status toggle switched on |
| `row_status_disabled` | Status toggle switched off |
| `row_action_edit` | Edit button clicked |
| `row_action_view` | View button clicked |
| `row_action_delete` | Delete button clicked |
| `row_action_button1` … `row_action_button10` | Custom button N clicked |
| `server_request` | Page, sort, or filter changed in server-side mode |

---

## Server-Side Mode Example

1. Enable `server_side` on the component.
2. Bind `dmx-bind:total_records` to your API's total count.
3. On the `server_request` event, call your Server Connect action.
4. Pass `serverState` fields as parameters:

```
serverState.page         → your API's page parameter
serverState.pageSize     → your API's limit parameter
serverState.search       → your API's search parameter
serverState.orderField   → your API's sort field
serverState.orderDir     → your API's sort direction
serverState.columnFilters → per-column filter values
```

---

## JS Custom Cell Renderer Example

Define a function in your page's `<script>` block:

```javascript
function formatStatus(data) {
  const colour = data.status === 'active' ? 'green' : 'red';
  return `<span style="color:${colour}">${data.status}</span>`;
}
```

Then set **JS Data Changes** to `[{ field: "status", function: "formatStatus" }]`.

---

## Condition Syntax

Used in cell styles, row styles, and action button conditions:

```
status==active          → equality
amount>1000             → numeric comparison
status==active||status==pending   → OR
role==admin&&verified==true       → AND
myFn()                  → call a window function returning true/false
active                  → truthy check (non-null, non-empty)
```

---

## Dependencies

| Package | Version |
|---|---|
| `datatables.net` | ~2.2.2 |
| `datatables.net-buttons` | ~3.2.3 |
| `papaparse` | ~5.5.2 |
| `pdfmake` | ~0.2.18 |

jQuery is **not** required.

---

## License

MIT
