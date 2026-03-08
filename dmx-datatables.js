/**
 * dmx-datatables.js  –  Wappler App Connect component wrapping DataTables v2
 * Package: @cdmx/wappler_ac_datatables
 *
 * Features (DataTables-native where possible):
 *  - Client-side & Server-side pagination (native serverSide + ajax callback)
 *  - Multi-select column filter dropdowns (per-column checkbox dropdowns)
 *  - Floating column text filters (per-column input row)
 *  - Global quick-search
 *  - Row / cell click, double-click events
 *  - Row status toggle (boolean column → switch UI)
 *  - Row checkbox selection events
 *  - Action buttons (Edit / View / Delete + 10 custom buttons)
 *  - Condition-based cell & row styling
 *  - Date / Amount formatting
 *  - JS custom cell renderers (js_data_changes)
 *  - Display / data-change value mapping
 *  - CSV & PDF export
 *  - Footer row sums / counts
 *  - Column hide / show
 *  - Dark mode via table class
 *  - noload attribute to prevent auto-refresh
 *
 * Depends on:  DataTables v2 (window.DataTable), pdfMake (optional), PapaParse (optional)
 * jQuery is NOT required — DataTables v2 UMD works standalone.
 */
dmx.Component('datatables', {

  // ── State exposed to the page ─────────────────────────────────────────────
  initialData: {
    id: null,
    data: {},
    count: 0,
    fields: {},
    fileData: [],
    selectedRows: [],
    filterState: {},
    serverState: {
      page: 1,
      pageSize: 20,
      totalRecords: 0,
      totalPages: 0,
      search: '',
      orderField: '',
      orderDir: 'asc',
      columnFilters: {}
    },
    state: {
      tableReady: false,
      firstDataRendered: false,
      rowDataUpdated: false,
      loading: false
    }
  },

  // ── Attributes ────────────────────────────────────────────────────────────
  attributes: {
    id: { default: null },
    noload: { type: Boolean, default: false },

    // Style
    table_class: { type: String, default: 'table table-striped table-hover table-bordered' },
    dark_mode: { type: Boolean, default: false },

    // Data
    data: { type: Array, default: [] },
    total_records: { type: Number, default: 0 }, // server-side only

    // Column config
    cnames: { type: Object, default: {} },
    cwidths: { type: Object, default: {} },
    ctypes: { type: Array, default: [] },
    hide_fields: { type: String, default: null },
    hide_id_field: { type: Boolean, default: false },

    // Value mapping
    data_changes: { type: Array, default: [] },
    display_data_changes: { type: Array, default: [] },
    js_data_changes: { type: Array, default: [] },

    // Cell & row styling
    cstyles: { type: Array, default: [] },
    rstyles: { type: Array, default: [] },

    // Date / Amount
    date_locale: { type: String, default: 'en-US' },
    date_format: { type: String, default: 'dd/MM/yyyy hh:mm A' },
    timezone: { type: String, default: '' },
    amount_fields: { type: String, default: null },
    amount_field_precision: { type: Number, default: 2 },

    // Sorting
    sortable: { type: Boolean, default: true },
    ci_sort: { type: Boolean, default: false },
    csort: { type: Array, default: [] },

    // Filtering
    filter: { type: Boolean, default: true },
    floating_filter: { type: Boolean, default: false },
    multiselect_filter: { type: Boolean, default: false },
    cfilters: { type: Array, default: [] },
    quick_filter_field: { type: String, default: 'search_field' },

    // Pagination
    pagination: { type: Boolean, default: true },
    pagination_page_size: { type: Number, default: 20 },
    pagination_page_size_selector: { type: Array, default: [10, 20, 50, 100] },

    // Server-side mode
    server_side: { type: Boolean, default: false },

    // Layout
    scroll_x: { type: Boolean, default: false },
    scroll_y: { type: String, default: '' },
    wrap_text: { type: Boolean, default: false },

    // Row events
    row_click_event: { type: Boolean, default: false },
    row_double_click_event: { type: Boolean, default: false },
    cell_click_event: { type: Boolean, default: false },
    row_checkbox_event: { type: Boolean, default: false },
    row_status_event: { type: Boolean, default: false },
    suppress_row_click_selection: { type: Boolean, default: false },

    // Export
    export_to_csv: { type: Boolean, default: true },
    export_csv_filename: { type: String, default: 'export.csv' },
    export_to_pdf: { type: Boolean, default: false },
    export_pdf_filename: { type: String, default: 'export.pdf' },
    export_remove_html: { type: Boolean, default: false },
    export_trim_data: { type: Boolean, default: false },
    export_exclude_fields: { type: String, default: null },
    export_exclude_hidden_fields: { type: Boolean, default: false },

    // Action buttons
    enable_actions: { type: Boolean, default: false },
    actions_column_position: { type: String, default: 'right' },
    edit_action_btn: { type: Boolean, default: false },
    edit_action_title: { type: String, default: '' },
    edit_action_tooltip: { type: String, default: 'Edit' },
    edit_action_icon_class: { type: String, default: 'fas fa-pencil-alt' },
    edit_action_btn_class: { type: String, default: 'btn-primary btn-xs m-1' },
    edit_action_btn_condition: { type: String, default: null },
    view_action_btn: { type: Boolean, default: false },
    view_action_title: { type: String, default: '' },
    view_action_tooltip: { type: String, default: 'View' },
    view_action_icon_class: { type: String, default: 'fas fa-eye' },
    view_action_btn_class: { type: String, default: 'btn-info btn-xs m-1' },
    view_action_btn_condition: { type: String, default: null },
    delete_action_btn: { type: Boolean, default: false },
    delete_action_title: { type: String, default: '' },
    delete_action_tooltip: { type: String, default: 'Delete' },
    delete_action_icon_class: { type: String, default: 'fas fa-trash' },
    delete_action_btn_class: { type: String, default: 'btn-danger btn-xs m-1' },
    delete_action_btn_condition: { type: String, default: null },
    enable_custom_action_btns: { type: Boolean, default: false },
    button1_action_btn: { type: Boolean, default: false },
    button1_action_title: { type: String, default: '' },
    button1_action_tooltip: { type: String, default: '' },
    button1_action_icon_class: { type: String, default: 'fas fa-wrench' },
    button1_action_btn_class: { type: String, default: 'btn-primary btn-xs m-1' },
    button1_action_btn_condition: { type: String, default: null },
    button2_action_btn: { type: Boolean, default: false },
    button2_action_title: { type: String, default: '' },
    button2_action_tooltip: { type: String, default: '' },
    button2_action_icon_class: { type: String, default: 'fas fa-search-plus' },
    button2_action_btn_class: { type: String, default: 'btn-info btn-xs m-1' },
    button2_action_btn_condition: { type: String, default: null },
    button3_action_btn: { type: Boolean, default: false },
    button3_action_title: { type: String, default: '' },
    button3_action_tooltip: { type: String, default: '' },
    button3_action_icon_class: { type: String, default: 'fas fa-check-circle' },
    button3_action_btn_class: { type: String, default: 'btn-success btn-xs m-1' },
    button3_action_btn_condition: { type: String, default: null },
    button4_action_btn: { type: Boolean, default: false },
    button4_action_title: { type: String, default: '' },
    button4_action_tooltip: { type: String, default: '' },
    button4_action_icon_class: { type: String, default: 'fas fa-exclamation-triangle' },
    button4_action_btn_class: { type: String, default: 'btn-warning btn-xs m-1' },
    button4_action_btn_condition: { type: String, default: null },
    button5_action_btn: { type: Boolean, default: false },
    button5_action_title: { type: String, default: '' },
    button5_action_tooltip: { type: String, default: '' },
    button5_action_icon_class: { type: String, default: 'fas fa-times-circle' },
    button5_action_btn_class: { type: String, default: 'btn-danger btn-xs m-1' },
    button5_action_btn_condition: { type: String, default: null },
    button6_action_btn: { type: Boolean, default: false },
    button6_action_title: { type: String, default: '' },
    button6_action_tooltip: { type: String, default: '' },
    button6_action_icon_class: { type: String, default: 'fas fa-link' },
    button6_action_btn_class: { type: String, default: 'btn-secondary btn-xs m-1' },
    button6_action_btn_condition: { type: String, default: null },
    button7_action_btn: { type: Boolean, default: false },
    button7_action_title: { type: String, default: '' },
    button7_action_tooltip: { type: String, default: '' },
    button7_action_icon_class: { type: String, default: 'fas fa-download' },
    button7_action_btn_class: { type: String, default: 'btn-primary btn-sm m-1' },
    button7_action_btn_condition: { type: String, default: null },
    button8_action_btn: { type: Boolean, default: false },
    button8_action_title: { type: String, default: '' },
    button8_action_tooltip: { type: String, default: '' },
    button8_action_icon_class: { type: String, default: 'fas fa-file-pdf' },
    button8_action_btn_class: { type: String, default: 'btn-info btn-sm m-1' },
    button8_action_btn_condition: { type: String, default: null },
    button9_action_btn: { type: Boolean, default: false },
    button9_action_title: { type: String, default: '' },
    button9_action_tooltip: { type: String, default: '' },
    button9_action_icon_class: { type: String, default: 'fas fa-star' },
    button9_action_btn_class: { type: String, default: 'btn-success btn-sm m-1' },
    button9_action_btn_condition: { type: String, default: null },
    button10_action_btn: { type: Boolean, default: false },
    button10_action_title: { type: String, default: '' },
    button10_action_tooltip: { type: String, default: '' },
    button10_action_icon_class: { type: String, default: 'fas fa-trash-alt' },
    button10_action_btn_class: { type: String, default: 'btn-danger btn-sm m-1' },
    button10_action_btn_condition: { type: String, default: null },

    // Footer aggregation
    columns_to_sum: { type: String, default: null },
    footer_sum_precision: { type: Number, default: null },
    columns_to_count: { type: Array, default: [] }
  },

  // ── Public methods (exposed as Wappler actions) ───────────────────────────
  methods: {
    loadTable: function () {
      dmx.nextTick(function () {
        this.set('tableInstance', this._buildTable());
      }, this);
    },
    destroyTable: function () {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (inst) { try { inst.destroy(); } catch (e) {} }
        this.set('tableInstance', null);
      }, this);
    },
    reloadTable: function () {
      dmx.nextTick(function () {
        this.set('tableInstance', this._buildTable());
      }, this);
    },
    exportTable: function (Csv, Pdf) {
      if (!Csv && !Pdf) Csv = true;
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (!inst) { console.error('DataTables: not yet loaded.'); return; }
        if (Csv) this._exportCsv(inst);
        else if (Pdf) this._exportPdf(inst);
      }, this);
    },
    quickFilter: function () {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        const el = document.getElementById(this.props.quick_filter_field);
        if (!inst || !el) return;
        const q = el.value;
        if (this.props.server_side) {
          this._triggerServer({ search: q, page: 1 });
        } else {
          inst.search(q).draw();
        }
      }, this);
    },
    applyFilters: function (searchText) {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (!inst) return;
        if (this.props.server_side) {
          this._triggerServer({ search: searchText || '', page: 1 });
        } else {
          inst.search(searchText || '').draw();
          this.set('filterState', { search: searchText });
        }
      }, this);
    },
    clearFilters: function () {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (!inst) return;
        // Reset multi-select dropdowns
        this.$node.querySelectorAll('.dmx-ms-dropdown input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        this.$node.querySelectorAll('.dmx-ms-label').forEach(el => { el.textContent = 'All'; });
        this.$node.querySelectorAll('.dmx-col-search').forEach(inp => { inp.value = ''; });
        if (this.props.server_side) {
          this._triggerServer({ search: '', columnFilters: {}, page: 1 });
        } else {
          inst.search('').columns().search('').draw();
          this.set('filterState', {});
        }
      }, this);
    },
    getSelectedRows: function () {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (!inst) return;
        const sel = [];
        inst.rows('.selected').data().each(r => sel.push(r));
        this.set('selectedRows', sel);
      }, this);
    },
    hideColumns: function (fieldId) {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (inst) { const c = inst.column(fieldId + ':name'); if (c) c.visible(false); }
      }, this);
    },
    showColumns: function (fieldId) {
      dmx.nextTick(function () {
        const inst = this.get('tableInstance');
        if (inst) { const c = inst.column(fieldId + ':name'); if (c) c.visible(true); }
      }, this);
    },
    goToPage: function (page) {
      dmx.nextTick(function () {
        if (this.props.server_side) {
          this._triggerServer({ page: page });
        } else {
          const inst = this.get('tableInstance');
          if (inst) inst.page(page - 1).draw('page');
        }
      }, this);
    },
    setPageSize: function (size) {
      dmx.nextTick(function () {
        if (this.props.server_side) {
          this._triggerServer({ pageSize: size, page: 1 });
        } else {
          const inst = this.get('tableInstance');
          if (inst) inst.page.len(size).draw();
        }
      }, this);
    },
    importFileData: async function (fieldId) {
      const el = document.getElementById(fieldId);
      if (!el) { console.error('DataTables: field ' + fieldId + ' not found.'); return; }
      const file = el.files[0];
      if (!file) { console.error('DataTables: no file selected.'); return; }
      if (typeof Papa === 'undefined') { console.error('DataTables: PapaParse not loaded.'); return; }
      Papa.parse(file, {
        header: true, dynamicTyping: true, skipEmptyLines: true,
        complete: results => this.set('fileData', results.data),
        error: err => console.error('DataTables: CSV parse error:', err)
      });
    }
  },

  // ── Server-side helper ─────────────────────────────────────────────────────
  _triggerServer: function (patch) {
    const current = this.get('serverState') || {};
    this.set('serverState', Object.assign({}, current, patch));
    this.set('state', { loading: true });
    this.dispatchEvent('server_request');
  },

  // ── Utility: humanize a field name ────────────────────────────────────────
  _humanize: function (str) {
    if (!str) return str;
    return String(str).trim()
      .replace(/([a-z\D])([A-Z]+)/g, '$1_$2')
      .replace(/[-\s]+/g, '_').toLowerCase()
      .replace(/_id$/, '').replace(/_/g, ' ').trim()
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  },

  // ── Date formatting (same logic as AG Grid component) ─────────────────────
  _formatDate: function (timestamp) {
    const fmt = this.props.date_format;
    const d = new Date(timestamp);
    const y = d.getFullYear(), n = d.getMonth(), day = d.getDate(), w = d.getDay();
    const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    const pad = (v, l) => ('0000' + v).slice(-l);
    const ML = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const Ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const Ds = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return fmt.replace(/([yMdHhmsaA])(\1+)?/g, p => {
      switch (p) {
        case 'yyyy': return pad(y,4); case 'yy': return pad(y,2); case 'y': return y;
        case 'MMMM': return ML[n]; case 'MMM': return Ms[n];
        case 'MM': return pad(n+1,2); case 'M': return n+1;
        case 'dddd': return DL[w]; case 'ddd': return Ds[w];
        case 'dd': return pad(day,2); case 'd': return day;
        case 'HH': return pad(h,2); case 'H': return h;
        case 'hh': return pad((h%12)||12,2); case 'h': return (h%12)||12;
        case 'mm': return pad(m,2); case 'm': return m;
        case 'ss': return pad(s,2); case 's': return s;
        case 'a': return h<12?'am':'pm'; case 'A': return h<12?'AM':'PM';
        default: return p;
      }
    });
  },

  _formatTime: function (value) {
    if (!value) return '-';
    const tz = this.props.timezone;
    const date = new Date(value);
    if (tz) {
      const conv = date.toLocaleString('en-GB', { timeZone: tz });
      const [dp, tp] = conv.split(', ');
      const [day, month, year] = dp.split('/');
      const [hours, minutes, seconds] = tp.split(':');
      return this._formatDate(new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`).getTime());
    }
    return this._formatDate(date);
  },

  // ── Detect column data type from sample values ────────────────────────────
  _detectDataType: function (values) {
    let hasDate = false, hasNumber = false, hasText = false;
    for (const v of values) {
      if (v === null || v === undefined || v === '' || typeof v === 'boolean') { hasText = true; }
      else if (!isNaN(Number(v)) && typeof v !== 'string') { hasNumber = true; }
      else if ((new Date(v)).getTime() > 0 && /[-/]/.test(String(v))) { hasDate = true; }
      else { hasText = true; }
    }
    if (hasDate && !hasNumber && !hasText) return 'date';
    if (hasNumber && !hasText) return 'number';
    return 'text';
  },

  // ── Condition evaluation (same logic as AG Grid) ──────────────────────────
  _evalCond: function (condStr, rowData) {
    const ops = ['===','==','!=','>=','<=','>','<'];
    for (const op of ops) {
      if (condStr.includes(op)) {
        const [left, ...rest] = condStr.split(op).map(s => s.trim());
        const right = rest.join(op).trim();
        const v = rowData[left];
        if (v === null || v === undefined) return false;
        switch (op) {
          case '===': return String(v) === right;
          case '==':  return String(v) == right;  /* jshint eqeqeq:false */
          case '!=':  return String(v) != right;  /* jshint eqeqeq:false */
          case '>':   return Number(v) > parseFloat(right);
          case '<':   return Number(v) < parseFloat(right);
          case '>=':  return Number(v) >= parseFloat(right);
          case '<=':  return Number(v) <= parseFloat(right);
        }
      }
    }
    // No operator — truthy check
    return rowData[condStr] !== null && rowData[condStr] !== undefined && rowData[condStr] !== '';
  },

  _evalConditions: function (condStr, rowData) {
    const parts = condStr.split(/(\|\||&&)/);
    const results = [], ops = [];
    for (const p of parts) {
      const t = p.trim();
      if (t === '||' || t === '&&') { ops.push(t); }
      else if (t.endsWith('()')) {
        const fn = t.slice(0, -2);
        results.push(typeof window[fn] === 'function' ? window[fn](rowData) === true : false);
      } else {
        results.push(this._evalCond(t, rowData));
      }
    }
    let r = results[0] || false;
    for (let i = 0; i < ops.length; i++) {
      r = ops[i] === '||' ? r || results[i + 1] : r && results[i + 1];
    }
    return !!r;
  },

  // ── Get the display value for a cell ─────────────────────────────────────
  _getDisplayValue: function (key, value, rowData) {
    const opts = this.props;

    // display_data_changes: template string with %field% placeholders
    if (opts.display_data_changes && opts.display_data_changes.length > 0) {
      const dc = opts.display_data_changes.find(c => c.field === key);
      if (dc) {
        const pm = Object.fromEntries(Object.entries(rowData).map(([f, v]) => [`%${f}%`, v !== null ? v : '']));
        const rx = new RegExp(Object.keys(pm).join('|') + '|%[^%]+%', 'g');
        return dc.data.replace(rx, m => pm[m] !== undefined ? pm[m] : '');
      }
    }

    // data_changes: value → new_value mapping
    if (opts.data_changes && opts.data_changes.length > 0) {
      const mc = opts.data_changes.find(c => c.field === key && c.value === String(value) && c.area === 'cell');
      if (mc) return mc.new_value;
    }

    // js_data_changes: call a window function that returns HTML
    if (opts.js_data_changes && opts.js_data_changes.length > 0) {
      const jsc = opts.js_data_changes.find(c => c.field === key);
      if (jsc && typeof window[jsc.function] === 'function') return window[jsc.function](rowData);
    }

    // amount fields: format as locale number
    if (opts.amount_fields) {
      if (opts.amount_fields.split(',').includes(key)) {
        const n = parseFloat(value);
        if (!isNaN(n)) return n.toLocaleString(opts.date_locale, {
          minimumFractionDigits: opts.amount_field_precision,
          maximumFractionDigits: opts.amount_field_precision
        });
      }
    }

    return value;
  },

  // ── Get inline style for a cell ───────────────────────────────────────────
  _getCellStyle: function (key, value, rowData) {
    const cstyles = this.props.cstyles;
    if (!cstyles || !cstyles.length) return {};
    for (const style of cstyles.filter(s => s.field === key)) {
      let met = false;
      const cond = style.condition || '';
      if (cond.endsWith('()') && typeof window[cond.replace(/\(\)$/, '')] === 'function') {
        met = window[cond.replace(/\(\)$/, '')](rowData) === true;
      } else if (cond) {
        met = this._evalCond(cond, rowData);
      }
      if (met) {
        const area = style.area || 'text';
        return area === 'cell'
          ? { backgroundColor: style.customColor }
          : { color: style.customColor, fontStyle: style.font || 'normal', fontWeight: style.font === 'bold' ? 'bold' : '' };
      }
    }
    return {};
  },

  // ── Get inline style for a row ────────────────────────────────────────────
  _getRowStyle: function (rowData) {
    const rstyles = this.props.rstyles;
    if (!rstyles || !Array.isArray(rstyles)) return '';
    for (const style of rstyles) {
      const fn = (style.condition || '').replace(/\(\)$/, '');
      if (typeof window[fn] === 'function' && window[fn](rowData) === true) {
        return `background-color:${style.customColor};`;
      }
    }
    return '';
  },

  // ── Strip HTML tags from a string ─────────────────────────────────────────
  _stripHtml: function (str) {
    if (typeof str !== 'string') return str;
    return str.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  },

  // ── Build the actions cell HTML ───────────────────────────────────────────
  _buildActionsCell: function (rowData) {
    const opts = this.props;
    const parts = [];

    const addBtn = (title, tooltip, iconClass, btnClass, condition, action) => {
      if (condition && !this._evalConditions(condition, rowData)) return;
      const rowJson = JSON.stringify(rowData).replace(/'/g, '&#39;');
      parts.push(
        `<button type="button" class="btn ${btnClass}" title="${tooltip || ''}" ` +
        `data-dmx-action="${action}" data-dmx-row='${rowJson}' style="margin:1px;">` +
        `<i class="${iconClass}"></i>${title ? ' ' + title : ''}</button>`
      );
    };

    if (opts.edit_action_btn)   addBtn(opts.edit_action_title,   opts.edit_action_tooltip,   opts.edit_action_icon_class,   opts.edit_action_btn_class,   opts.edit_action_btn_condition,   'row_action_edit');
    if (opts.view_action_btn)   addBtn(opts.view_action_title,   opts.view_action_tooltip,   opts.view_action_icon_class,   opts.view_action_btn_class,   opts.view_action_btn_condition,   'row_action_view');
    if (opts.delete_action_btn) addBtn(opts.delete_action_title, opts.delete_action_tooltip, opts.delete_action_icon_class, opts.delete_action_btn_class, opts.delete_action_btn_condition, 'row_action_delete');

    if (opts.enable_custom_action_btns) {
      for (let i = 1; i <= 10; i++) {
        if (opts[`button${i}_action_btn`]) {
          addBtn(opts[`button${i}_action_title`], opts[`button${i}_action_tooltip`],
                 opts[`button${i}_action_icon_class`], opts[`button${i}_action_btn_class`],
                 opts[`button${i}_action_btn_condition`], `row_action_button${i}`);
        }
      }
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:2px;">${parts.join('')}</div>`;
  },

  // ── Build status toggle cell HTML ─────────────────────────────────────────
  _buildStatusCell: function (key, value, rowData) {
    const checked = value == true ? 'checked' : '';
    return `<div class="d-flex justify-content-center">
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" ${checked}
          data-dmx-action="row_status_toggle" data-dmx-field="${key}"
          data-dmx-row='${JSON.stringify(rowData).replace(/'/g,"&#39;")}' style="cursor:pointer;">
      </div></div>`;
  },

  // ── Build the multi-select filter dropdown for one column ─────────────────
  _buildMultiSelect: function (key, colIndex, allRowData, tableInstance) {
    const unique = [...new Set(allRowData.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== ''))].sort((a, b) => String(a).localeCompare(String(b)));
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'dmx-ms-btn';
    toggleBtn.style.cssText = 'width:100%;text-align:left;padding:2px 6px;border:1px solid #ced4da;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;display:flex;justify-content:space-between;align-items:center;';
    toggleBtn.innerHTML = '<span class="dmx-ms-label">All</span><span style="font-size:10px;">&#9660;</span>';

    const dropdown = document.createElement('div');
    dropdown.className = 'dmx-ms-dropdown';
    dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;min-width:160px;z-index:9999;background:#fff;border:1px solid #ced4da;border-radius:4px;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.15);';

    // Select-all row
    const saLabel = document.createElement('label');
    saLabel.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;cursor:pointer;border-bottom:1px solid #eee;font-weight:600;font-size:12px;';
    const saCheck = document.createElement('input');
    saCheck.type = 'checkbox';
    saCheck.className = 'dmx-ms-all';
    saLabel.appendChild(saCheck);
    saLabel.appendChild(document.createTextNode('Select All'));
    dropdown.appendChild(saLabel);

    // Option rows
    unique.forEach(v => {
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 10px;cursor:pointer;font-size:12px;white-space:nowrap;';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = String(v);
      const display = this._getDisplayValue(key, v, { [key]: v });
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(display !== null && display !== undefined ? display : v));
      dropdown.appendChild(lbl);
    });

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(dropdown);

    // Toggle open/close
    toggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dropdown.style.display !== 'none';
      document.querySelectorAll('.dmx-ms-dropdown').forEach(d => { d.style.display = 'none'; });
      dropdown.style.display = isOpen ? 'none' : 'block';
    });
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });
    dropdown.addEventListener('click', e => e.stopPropagation());

    const applyFilter = () => {
      const checked = [...dropdown.querySelectorAll('input[type="checkbox"]:not(.dmx-ms-all):checked')];
      const values = checked.map(cb => cb.value);
      const labelEl = toggleBtn.querySelector('.dmx-ms-label');

      // Update label
      labelEl.textContent = values.length === 0 ? 'All' : values.length === 1 ? values[0] : `${values.length} selected`;

      // Sync select-all state
      const allBoxes = dropdown.querySelectorAll('input[type="checkbox"]:not(.dmx-ms-all)');
      saCheck.checked = values.length === allBoxes.length;
      saCheck.indeterminate = values.length > 0 && values.length < allBoxes.length;

      if (this.props.server_side) {
        const cf = Object.assign({}, (this.get('serverState') || {}).columnFilters || {});
        if (values.length === 0) delete cf[key]; else cf[key] = values;
        this._triggerServer({ columnFilters: cf, page: 1 });
      } else {
        if (values.length === 0) {
          tableInstance.column(colIndex).search('').draw();
        } else {
          // Regex OR to match any selected value
          const rx = values.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          tableInstance.column(colIndex).search(`^(${rx})$`, true, false).draw();
        }
      }
    };

    saCheck.addEventListener('change', () => {
      dropdown.querySelectorAll('input[type="checkbox"]:not(.dmx-ms-all)').forEach(cb => { cb.checked = saCheck.checked; });
      applyFilter();
    });
    dropdown.querySelectorAll('input[type="checkbox"]:not(.dmx-ms-all)').forEach(cb => cb.addEventListener('change', applyFilter));

    return wrapper;
  },

  // ── Core: build / rebuild the DataTable ──────────────────────────────────
  _buildTable: function () {
    const opts = this.props;
    const rowData = opts.data;

    if (!this.$node || !rowData || rowData.length === 0) {
      console.debug('DataTables: no row data yet.');
      return null;
    }

    // Require DataTables v2 standalone (window.DataTable)
    if (typeof DataTable === 'undefined') {
      console.error('DataTables: window.DataTable not found. Ensure dataTables.min.js is loaded.');
      return null;
    }

    // Destroy existing instance
    const existing = this.get('tableInstance');
    if (existing) {
      try { existing.destroy(); } catch (e) {}
      this.set('tableInstance', null);
    }

    // ── Derive columns ────────────────────────────────────────────────────
    const firstRow = rowData[0];
    const allKeys = Object.keys(firstRow);
    const cnames = opts.cnames || {};
    const cwidths = opts.cwidths || {};
    const ctypes = opts.ctypes || [];
    const hideArr = opts.hide_fields ? opts.hide_fields.split(',').map(s => s.trim()) : [];
    const hasFilterRow = opts.multiselect_filter || opts.floating_filter;
    const hasFooter = !!(opts.columns_to_sum || (opts.columns_to_count && opts.columns_to_count.length));

    // Map key → column index (for sorting config)
    const keyToIdx = {};

    // ── Build <table> scaffold ────────────────────────────────────────────
    const tableId = `${opts.id}-dt`;
    const tableClass = opts.table_class + (opts.dark_mode ? ' table-dark' : '');

    let hdrRow = '', filterRow = '', ftRow = '';
    const colDefs = []; // DataTables column definitions
    const columnList = []; // for export

    const processKey = (key, idx) => {
      const hidden = (opts.hide_id_field && key === 'id') || hideArr.includes(key);
      const label = cnames[key] ? (cnames[key].custom_name || this._humanize(key)) : this._humanize(key);
      const widthStyle = cwidths[key] ? ` style="min-width:${cwidths[key].min_width}px;max-width:${cwidths[key].max_width}px;"` : '';

      hdrRow += `<th${widthStyle}>${label}</th>`;
      if (hasFilterRow) filterRow += `<th data-key="${key}" data-hidden="${hidden}"></th>`;
      if (hasFooter) ftRow += '<th></th>';

      const customType = ctypes.find ? ctypes.find(ct => ct.field === key) : null;
      const nonNull = rowData.map(r => r[key]).filter(v => v !== null && v !== undefined);
      const dataType = customType ? customType.type : this._detectDataType(nonNull);

      keyToIdx[key] = idx;
      columnList.push({ field: key, header: label, hidden });

      colDefs.push({
        title: label,
        data: key,
        name: key,
        visible: !hidden,
        type: dataType === 'number' ? 'num' : dataType === 'date' ? 'date' : 'html-num-fmt',
        // DataTables render function: type is 'display' | 'sort' | 'filter' | 'type'
        render: (data, type, row) => {
          // Sort/type: return raw value for correct sorting
          if (type === 'sort' || type === 'type') return data;

          // Status toggle column
          if (key === 'status' && opts.row_status_event) {
            return type === 'filter' ? String(data) : this._buildStatusCell(key, data, row);
          }

          // Display value (mapped)
          const displayVal = this._getDisplayValue(key, data, row);

          // Filter: return plain text
          if (type === 'filter') return displayVal !== null && displayVal !== undefined ? String(displayVal) : '';

          // Date formatting
          if (dataType === 'date' && data) return this._formatTime(data);

          // Build styled span
          const str = displayVal !== null && displayVal !== undefined ? String(displayVal) : '-';
          const style = this._getCellStyle(key, data, row);
          const inlineStyle = Object.entries(style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';');
          const wrapStyle = opts.wrap_text ? 'white-space:normal;word-break:break-word;' : '';
          return (inlineStyle || wrapStyle) ? `<span style="${inlineStyle};${wrapStyle}">${str}</span>` : str;
        },
        ...(cwidths[key] ? { width: `${cwidths[key].min_width}px` } : {})
      });
    };

    // Actions on left
    if (opts.enable_actions && opts.actions_column_position === 'left') {
      hdrRow += '<th>Actions</th>';
      if (hasFilterRow) filterRow += '<th></th>';
      if (hasFooter) ftRow += '<th></th>';
      colDefs.push({ title: 'Actions', data: null, orderable: false, searchable: false,
        render: (data, type, row) => type === 'display' ? this._buildActionsCell(row) : '' });
      columnList.push({ field: '__actions__', header: 'Actions', hidden: false });
    }

    allKeys.forEach((key, i) => processKey(key, colDefs.length - (opts.enable_actions && opts.actions_column_position === 'left' ? 1 : 0) + i));

    // Actions on right
    if (opts.enable_actions && opts.actions_column_position !== 'left') {
      hdrRow += '<th>Actions</th>';
      if (hasFilterRow) filterRow += '<th></th>';
      if (hasFooter) ftRow += '<th></th>';
      colDefs.push({ title: 'Actions', data: null, orderable: false, searchable: false,
        render: (data, type, row) => type === 'display' ? this._buildActionsCell(row) : '' });
      columnList.push({ field: '__actions__', header: 'Actions', hidden: false });
    }

    this.set('columnList', columnList);

    const filterTr = hasFilterRow ? `<tr class="dmx-filter-row">${filterRow}</tr>` : '';
    const tfootHtml = hasFooter ? `<tfoot><tr>${ftRow}</tr></tfoot>` : '';

    this.$node.innerHTML =
      `<div class="dmx-dt-outer" style="width:100%;">` +
      `<table id="${tableId}" class="${tableClass}" style="width:100%;">` +
      `<thead><tr>${hdrRow}</tr>${filterTr}</thead><tbody></tbody>${tfootHtml}</table></div>`;

    // ── Server-side ajax handler ──────────────────────────────────────────
    // DataTables calls this every time it needs data (page/sort/filter change).
    // We store the callback and fire a Wappler event; when `data` prop updates
    // we resolve the callback.
    const self = this;
    let dtAjaxFn;
    if (opts.server_side) {
      dtAjaxFn = function (dtParams, callback) {
        self._dtCallback = callback;
        self._dtDraw = dtParams.draw;

        const page = Math.floor(dtParams.start / dtParams.length) + 1;
        const orderCol = dtParams.order && dtParams.order[0] ? dtParams.order[0].column : 0;
        const orderField = colDefs[orderCol] ? colDefs[orderCol].name : '';
        const orderDir = dtParams.order && dtParams.order[0] ? dtParams.order[0].dir : 'asc';

        self._triggerServer({
          page,
          pageSize: dtParams.length,
          search: dtParams.search ? dtParams.search.value : '',
          orderField,
          orderDir
        });
      };
    }

    // ── DataTables config ─────────────────────────────────────────────────
    const dtConfig = {
      columns: colDefs,
      data: opts.server_side ? undefined : rowData,
      serverSide: opts.server_side,
      ajax: opts.server_side ? dtAjaxFn : undefined,
      ordering: opts.sortable,
      searching: opts.filter,
      paging: opts.pagination,
      pageLength: opts.pagination_page_size,
      lengthMenu: opts.pagination_page_size_selector,
      scrollX: opts.scroll_x,
      scrollY: opts.scroll_y || undefined,
      autoWidth: true,
      deferRender: !opts.server_side,
      language: { emptyTable: 'No data available', zeroRecords: 'No matching records found' },

      rowCallback: (row, data) => {
        const rs = this._getRowStyle(data);
        if (rs) row.setAttribute('style', (row.getAttribute('style') || '') + rs);
        if (!opts.suppress_row_click_selection &&
            (opts.row_click_event || opts.row_double_click_event || opts.cell_click_event)) {
          row.style.cursor = 'pointer';
        }
      },

      drawCallback: () => {
        this.set('state', { rowDataUpdated: true, loading: false, tableReady: true, firstDataRendered: true });
        if (hasFooter && !opts.server_side) this._computeFooter(tableInstance);
      },

      initComplete: () => {
        this.set('state', { tableReady: true, firstDataRendered: true });

        // ── Per-column filter row ─────────────────────────────────────────
        if (hasFilterRow) {
          const filterCells = this.$node.querySelectorAll('tr.dmx-filter-row th[data-key]');
          filterCells.forEach(th => {
            const key = th.dataset.key;
            if (th.dataset.hidden === 'true') { th.style.display = 'none'; return; }
            const colIdx = colDefs.findIndex(c => c.name === key);
            if (colIdx === -1) return;

            if (opts.multiselect_filter) {
              th.appendChild(this._buildMultiSelect(key, colIdx, rowData, tableInstance));
            } else {
              // Floating text input
              const inp = document.createElement('input');
              inp.type = 'text';
              inp.placeholder = 'Filter…';
              inp.className = 'dmx-col-search form-control form-control-sm';
              inp.addEventListener('input', () => {
                if (opts.server_side) {
                  const cf = Object.assign({}, (this.get('serverState') || {}).columnFilters || {});
                  if (inp.value) cf[key] = [inp.value]; else delete cf[key];
                  this._triggerServer({ columnFilters: cf, page: 1 });
                } else {
                  tableInstance.column(colIdx).search(inp.value).draw();
                }
              });
              th.appendChild(inp);
            }
          });
        }

        // Apply initial sort (client-side only)
        if (!opts.server_side && opts.csort && opts.csort.length > 0) {
          const sm = opts.csort.map(s => {
            const i = colDefs.findIndex(c => c.name === s.field);
            return i !== -1 ? [i, s.sort] : null;
          }).filter(Boolean);
          if (sm.length > 0) tableInstance.order(sm).draw();
        }

        // Apply initial column filters (client-side only)
        if (!opts.server_side && opts.cfilters && opts.cfilters.length > 0) {
          let changed = false;
          opts.cfilters.forEach(cf => {
            const i = colDefs.findIndex(c => c.name === cf.field);
            if (i !== -1) { tableInstance.column(i).search(cf.filter); changed = true; }
          });
          if (changed) tableInstance.draw();
        }
      }
    };

    // Create DataTables instance (DataTables v2 standalone, no jQuery needed)
    let tableInstance;
    try {
      tableInstance = new DataTable(`#${tableId}`, dtConfig);
    } catch (e) {
      console.error('DataTables: init error —', e);
      return null;
    }

    // ── DOM event delegation ──────────────────────────────────────────────
    const tableEl = this.$node.querySelector('table');
    if (tableEl) {
      // Action button & status toggle clicks
      tableEl.addEventListener('click', e => {
        const btn = e.target.closest('[data-dmx-action]');
        if (!btn) return;
        const action = btn.dataset.dmxAction;
        if (action === 'row_status_toggle') return;
        try {
          const rd = JSON.parse(btn.dataset.dmxRow || '{}');
          this.set('data', rd);
          this.set('id', rd.id !== undefined ? rd.id : null);
          this.dispatchEvent(action);
        } catch (err) {
          const tr = btn.closest('tr');
          const rd = tr ? tableInstance.row(tr).data() : null;
          if (rd) { this.set('data', rd); this.set('id', rd.id !== undefined ? rd.id : null); this.dispatchEvent(action); }
        }
      });

      // Status toggle change
      if (opts.row_status_event) {
        tableEl.addEventListener('change', e => {
          const inp = e.target.closest('[data-dmx-action="row_status_toggle"]');
          if (!inp) return;
          try {
            const rd = JSON.parse(inp.dataset.dmxRow || '{}');
            this.set('id', rd.id !== undefined ? rd.id : null);
            this.set('fields', { field: inp.dataset.dmxField, data: rd[inp.dataset.dmxField] });
            this.dispatchEvent(inp.checked ? 'row_status_enabled' : 'row_status_disabled');
          } catch (e) {}
        });
      }

      // Row click
      if (opts.row_click_event) {
        tableEl.addEventListener('click', e => {
          if (e.target.closest('[data-dmx-action], input')) return;
          const tr = e.target.closest('tbody tr');
          if (!tr) return;
          const rd = tableInstance.row(tr).data();
          if (!rd) return;
          this.set('data', rd);
          this.set('id', rd.id !== undefined ? rd.id : null);
          this.dispatchEvent('row_clicked');
        });
      }

      // Row double-click
      if (opts.row_double_click_event) {
        tableEl.addEventListener('dblclick', e => {
          const tr = e.target.closest('tbody tr');
          if (!tr) return;
          const rd = tableInstance.row(tr).data();
          if (!rd) return;
          this.set('data', rd);
          this.set('id', rd.id !== undefined ? rd.id : null);
          this.dispatchEvent('row_double_clicked');
        });
      }

      // Cell click
      if (opts.cell_click_event) {
        tableEl.addEventListener('click', e => {
          if (e.target.closest('[data-dmx-action], input')) return;
          const td = e.target.closest('tbody td');
          const tr = e.target.closest('tbody tr');
          if (!td || !tr) return;
          const rd = tableInstance.row(tr).data();
          const tdIdx = Array.from(tr.children).indexOf(td);
          const colName = colDefs[tdIdx] ? colDefs[tdIdx].name : '';
          if (!rd) return;
          this.set('fields', { field: colName, data: rd[colName] });
          this.set('id', rd.id !== undefined ? rd.id : null);
          this.dispatchEvent('cell_clicked');
        });
      }

      // Checkbox selection
      if (opts.row_checkbox_event) {
        tableEl.addEventListener('change', e => {
          const cb = e.target.closest('input[data-row-check]');
          if (!cb) return;
          const tr = cb.closest('tr');
          const rd = tr ? tableInstance.row(tr).data() : null;
          if (!rd) return;
          this.set('data', rd);
          this.set('id', rd.id !== undefined ? rd.id : null);
          this.dispatchEvent(cb.checked ? 'row_checkbox_checked' : 'row_checkbox_unchecked');
        });
      }
    }

    // ── Export buttons ────────────────────────────────────────────────────
    const outerDiv = this.$node.querySelector('.dmx-dt-outer');
    const insertTarget = outerDiv || this.$node;
    const parent = insertTarget.parentNode;

    if (opts.export_to_csv) {
      let btn = document.getElementById(`dmxCsvBtn-${opts.id}`);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = `dmxCsvBtn-${opts.id}`;
        btn.type = 'button';
        btn.innerHTML = '<i class="fas fa-file-csv"></i> Export CSV';
        btn.style.cssText = 'background:#28a745;border:none;color:#fff;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:13px;margin:0 6px 8px 0;';
        parent.insertBefore(btn, insertTarget);
      }
      btn.onclick = () => this._exportCsv(tableInstance);
    }

    if (opts.export_to_pdf) {
      let btn = document.getElementById(`dmxPdfBtn-${opts.id}`);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = `dmxPdfBtn-${opts.id}`;
        btn.type = 'button';
        btn.innerHTML = '<i class="fas fa-file-pdf"></i> Export PDF';
        btn.style.cssText = 'background:#dc3545;border:none;color:#fff;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:13px;margin:0 0 8px 0;';
        parent.insertBefore(btn, insertTarget);
      }
      btn.onclick = () => this._exportPdf(tableInstance);
    }

    return tableInstance;
  },

  // ── Footer sums / counts ─────────────────────────────────────────────────
  _computeFooter: function (tableInstance) {
    const opts = this.props;
    const sumFields = opts.columns_to_sum ? opts.columns_to_sum.split(',').map(s => s.trim()) : [];
    const countDefs = opts.columns_to_count || [];
    if (!sumFields.length && !countDefs.length) return;

    const sums = {};
    sumFields.forEach(f => { sums[f] = 0; });
    const counts = {};
    countDefs.forEach(c => { counts[c.field] = new Set(); });

    tableInstance.rows({ search: 'applied' }).data().each(row => {
      sumFields.forEach(f => {
        const v = Number(row[f]);
        if (!isNaN(v)) sums[f] += v;
      });
      countDefs.forEach(c => {
        const v = row[c.field];
        if (v !== null && v !== undefined && c.unique_values) {
          if (c.unique_values.split(',').includes(String(v))) counts[c.field].add(String(v));
        }
      });
    });

    const allKeys = Object.keys((opts.data && opts.data[0]) || {});
    const offset = opts.enable_actions && opts.actions_column_position === 'left' ? 1 : 0;
    const cells = this.$node.querySelectorAll('tfoot th');

    allKeys.forEach((key, i) => {
      const cell = cells[i + offset];
      if (!cell) return;
      if (sumFields.includes(key)) {
        const p = opts.footer_sum_precision !== null && opts.footer_sum_precision !== undefined ? opts.footer_sum_precision : 2;
        cell.textContent = Number(sums[key].toFixed(p)).toLocaleString(opts.date_locale);
      } else if (counts[key] !== undefined) {
        cell.textContent = counts[key].size;
      }
    });
  },

  // ── CSV export ────────────────────────────────────────────────────────────
  _exportCsv: function (tableInstance) {
    const opts = this.props;
    const cols = this._getExportCols();
    const rows = [`${cols.map(c => `"${c.header}"`).join(',')}`];
    tableInstance.rows({ search: 'applied' }).data().each(row => {
      rows.push(cols.map(col => {
        let v = this._getDisplayValue(col.field, row[col.field], row);
        if (opts.export_remove_html) v = this._stripHtml(String(v !== null && v !== undefined ? v : '-'));
        if (opts.export_trim_data && typeof v === 'string') v = v.trim();
        v = v !== null && v !== undefined ? String(v) : '-';
        return `"${v.replace(/"/g, '""')}"`;
      }).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: opts.export_csv_filename });
    a.click();
    URL.revokeObjectURL(a.href);
  },

  // ── PDF export ────────────────────────────────────────────────────────────
  _exportPdf: function (tableInstance) {
    const opts = this.props;
    if (typeof pdfMake === 'undefined') { console.error('DataTables: pdfMake not loaded.'); return; }
    const cols = this._getExportCols();
    const header = cols.map(c => ({ text: c.header, bold: true, fillColor: '#eeeeee' }));
    const body = [header];
    tableInstance.rows({ search: 'applied' }).data().each(row => {
      body.push(cols.map(col => {
        let v = this._getDisplayValue(col.field, row[col.field], row);
        if (opts.export_remove_html) v = this._stripHtml(String(v !== null && v !== undefined ? v : '-'));
        v = v !== null && v !== undefined ? String(v) : '-';
        const s = this._getCellStyle(col.field, row[col.field], row);
        return { text: v, color: s.color || 'black', fillColor: s.backgroundColor || undefined };
      }));
    });
    pdfMake.createPdf({
      pageOrientation: 'landscape',
      content: [{ table: { headerRows: 1, widths: cols.map(() => `${100 / cols.length}%`), body } }]
    }).download(opts.export_pdf_filename);
  },

  _getExportCols: function () {
    const opts = this.props;
    const exclude = opts.export_exclude_fields ? opts.export_exclude_fields.split(',').map(s => s.trim()) : [];
    return (this.get('columnList') || []).filter(c => {
      if (c.field === '__actions__') return false;
      if (exclude.includes(c.field)) return false;
      if (opts.export_exclude_hidden_fields && c.hidden) return false;
      return true;
    });
  },

  // ── Events ────────────────────────────────────────────────────────────────
  events: {
    row_clicked: Event,
    row_double_clicked: Event,
    cell_clicked: Event,
    row_checkbox_checked: Event,
    row_checkbox_unchecked: Event,
    row_status_enabled: Event,
    row_status_disabled: Event,
    row_action_edit: Event,
    row_action_view: Event,
    row_action_delete: Event,
    row_action_button1: Event,
    row_action_button2: Event,
    row_action_button3: Event,
    row_action_button4: Event,
    row_action_button5: Event,
    row_action_button6: Event,
    row_action_button7: Event,
    row_action_button8: Event,
    row_action_button9: Event,
    row_action_button10: Event,
    server_request: Event  // fires on page/sort/filter change in server_side mode
  },

  // ── Lifecycle hooks ───────────────────────────────────────────────────────
  init: function (node) {
    if (this.$node) this.$parse();
  },

  requestUpdate: function (props, oldValue) {
    this.set('count', this.props.data ? this.props.data.length : 0);

    if (props === 'data' && !dmx.equal(this.props.data, oldValue) && !this.props.noload) {
      if (this.props.server_side) {
        // Resolve pending DataTables ajax callback with the new data
        const inst = this.get('tableInstance');
        if (inst && this._dtCallback) {
          const total = this.props.total_records || this.props.data.length;
          this._dtCallback({
            draw: this._dtDraw || 1,
            recordsTotal: total,
            recordsFiltered: total,
            data: this.props.data
          });
          this._dtCallback = null;

          const ss = Object.assign({}, this.get('serverState') || {});
          ss.totalRecords = total;
          ss.totalPages = Math.ceil(total / (ss.pageSize || this.props.pagination_page_size));
          this.set('serverState', ss);
          this.set('state', { loading: false, rowDataUpdated: true });

          if (!!(this.props.columns_to_sum || (this.props.columns_to_count && this.props.columns_to_count.length))) {
            this._computeFooter(inst);
          }
        } else if (!inst) {
          // First load in server-side mode — build the table shell
          this.set('tableInstance', this._buildTable());
        }
      } else {
        // Client-side: update rows efficiently or build fresh
        const inst = this.get('tableInstance');
        if (inst) {
          inst.clear();
          inst.rows.add(this.props.data);
          inst.draw();
        } else {
          this.set('tableInstance', this._buildTable());
        }
      }
    }

    if (props === 'dark_mode' && !dmx.equal(this.props.dark_mode, oldValue)) {
      this.set('tableInstance', this._buildTable());
    }

    if (props === 'cfilters' && !dmx.equal(this.props.cfilters, oldValue)) {
      const inst = this.get('tableInstance');
      if (inst && !this.props.server_side && this.props.cfilters && this.props.cfilters.length > 0) {
        let changed = false;
        this.props.cfilters.forEach(cf => {
          const col = inst.column(cf.field + ':name');
          if (col) { col.search(cf.filter); changed = true; }
        });
        if (changed) inst.draw();
      }
    }
  }
});
