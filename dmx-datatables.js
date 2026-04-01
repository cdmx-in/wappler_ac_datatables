dmx.Component("datatable", {
  initialData: {
    id: null,
    data: {},
    row: {},
    action_name: '',
    action_number: 0,
    count: 0,
    serverState: {
      offset: 0,
      limit: 20,
      page: 1,
      total: 0,
      totalPages: 0,
      search: '',
      orderField: '',
      orderDir: 'asc'
    },
    params: {
      offset: 0,
      limit: 20,
      sort: '',
      dir: 'asc',
      search: '',
      columnSearch: ''
    },
    state: {
      tableReady: false,
      loading: false
    }
  },

  attributes: {
    id: { type: String, default: '' },
    data: { default: null },
    noload: { type: Boolean, default: false },
    table_class: { type: String, default: 'table table-striped table-bordered table-hover' },
    page_size: { type: Number, default: 20 },
    fields_header: {
      type: Array, default: []
    },
    auto_detect_columns: { type: Boolean, default: true },
    use_grid_as_override: { type: Boolean, default: false },
    enable_actions: { type: Boolean, default: false },
    actions_column_position: { type: String, default: 'right' },
    action_btns: { type: Array, default: [] },
    enable_column_search: { type: Boolean, default: false },
    enable_global_search: { type: Boolean, default: true },
    export_options: { type: Array, default: [
      { "enabled": false, "type": "copy", "title": "Copy" },
      { "enabled": true, "type": "csv", "title": "CSV" },
      { "enabled": true, "type": "excel", "title": "Excel" },
      { "enabled": false, "type": "pdf", "title": "PDF" },
      { "enabled": false, "type": "print", "title": "Print" }
    ] },
    theme: { type: String, default: 'bootstrap5' }
  },

  methods: {
    loadTable: function () {
      this._createTable();
    },

    reloadTable: function () {
      this._createTable();
    },

    destroyTable: function () {
      this._destroyTable();
      this.set('state', { tableReady: false, loading: false });
    }
  },

  events: {
    server_request: Event,
    row_clicked: Event,
    action_1: Event,
    action_2: Event,
    action_3: Event,
    action_4: Event,
    action_5: Event,
    action_6: Event,
    action_7: Event,
    action_8: Event,
    action_9: Event,
    action_10: Event,
    action_11: Event,
    action_12: Event,
    action_13: Event,
    action_14: Event,
    action_15: Event
  },

  init: function () {
    this._tableInstance = null;
    this._tableEl = null;
    this._pendingCallback = null;
    this._pendingDraw = 1;
    this._rowClickHandler = null;
    this._detectedSearchTypes = {};
    this._searchTypesDetected = false;
    this._columnsDetected = false;
    this._loadedTheme = null;
    this._themeElements = [];
  },

  render: function () {
    this.$parse();

    this.$node.innerHTML = '<table></table>';
    this._tableEl = this.$node.querySelector('table');

    this._loadTheme(this.props.theme || 'bootstrap5');

    if (!this.props.noload) {
      this._createTable();
    }
  },

  _parseData: function () {
    var raw = this.props.data;

    // Handle new structure: { query: { ... } }
    if (
      raw &&
      typeof raw === 'object' &&
      raw.query &&
      typeof raw.query === 'object' &&
      Array.isArray(raw.query.data)
    ) {
      var q = raw.query;

      return {
        rows: q.data,
        total: Number(q.total || q.data.length),
        offset: Number(q.offset || 0),
        limit: Number(q.limit || this.props.page_size || 20),
        page: q.page || null
      };
    }

    // Existing structure: { data: [...] }
    if (
      raw &&
      typeof raw === 'object' &&
      !Array.isArray(raw) &&
      Array.isArray(raw.data)
    ) {
      return {
        rows: raw.data,
        total: Number(raw.total || raw.data.length),
        offset: Number(raw.offset || 0),
        limit: Number(raw.limit || this.props.page_size || 20),
        page: raw.page || null
      };
    }

    // Fallback
    return {
      rows: [],
      total: 0,
      offset: 0,
      limit: this.props.page_size || 20,
      page: null
    };
  },

  performUpdate: function (updatedProps) {
    var parsed = this._parseData();

    this.set('count', parsed.rows.length);

    if (
      updatedProps.has('fields_header') ||
      updatedProps.has('auto_detect_columns') ||
      updatedProps.has('use_grid_as_override') ||
      updatedProps.has('enable_actions') ||
      updatedProps.has('actions_column_position') ||
      updatedProps.has('action_btns') ||
      updatedProps.has('export_options') ||
      updatedProps.has('table_class') ||
      updatedProps.has('page_size') ||
      updatedProps.has('enable_column_search') ||
      updatedProps.has('enable_global_search')
    ) {
      this._createTable();
      return;
    }

    if (updatedProps.has('theme')) {
      this._loadTheme(this.props.theme || 'bootstrap5');
      this._createTable();
      return;
    }

    if (!this._tableInstance && !this.props.noload) {
      this._createTable();
      return;
    }

    if (updatedProps.has('data')) {
      // If auto-detect is on and we haven't detected columns yet, rebuild the entire table
      // because DataTables needs column definitions at init time
      if (this.props.auto_detect_columns !== false && !this._columnsDetected && parsed.rows.length > 0) {
        this._createTable();
        return;
      }

      if (this._tableInstance && this._pendingCallback) {
        var currentState = this.get('serverState') || {};

        // Detect search types from actual data if not yet done
        if (!this._searchTypesDetected && parsed.rows.length > 0) {
          this._detectAllSearchTypes(parsed.rows);
          this._searchTypesDetected = true;
          // Rebuild column search UI with correct types
          this._setupColumnSearch();
        }

        this._pendingCallback({
          draw: this._pendingDraw,
          recordsTotal: parsed.total,
          recordsFiltered: parsed.total,
          data: parsed.rows
        });
        this._pendingCallback = null;

        var pageNum = parsed.page ? parsed.page.current : Math.floor(parsed.offset / (parsed.limit || 1)) + 1;
        var totalPages = parsed.page ? parsed.page.total : Math.ceil(parsed.total / (parsed.limit || 1));

        this.set('serverState', {
          offset: parsed.offset,
          limit: parsed.limit,
          page: pageNum,
          total: parsed.total,
          totalPages: totalPages,
          search: currentState.search || '',
          orderField: currentState.orderField || '',
          orderDir: currentState.orderDir || 'asc'
        });

        var currentParams = this.get('params') || {};
        this.set('params', {
          offset: parsed.offset,
          limit: parsed.limit,
          sort: currentState.orderField || '',
          dir: currentState.orderDir || 'asc',
          search: currentState.search || '',
          columnSearch: currentParams.columnSearch || ''
        });

        this.set('state', { tableReady: true, loading: false });
      }
    }
  },

  destroy: function () {
    this._destroyTable();
    this._unloadTheme();
    this._pendingCallback = null;
  },

  _destroyTable: function () {
    if (this._rowClickHandler && this._tableEl) {
      this._tableEl.removeEventListener('click', this._rowClickHandler);
      this._rowClickHandler = null;
    }

    if (this._tableInstance) {
      try {
        this._tableInstance.destroy();
      } catch (e) { }
      this._tableInstance = null;
    }
  },

  _getBasePath: function () {
    var scripts = document.querySelectorAll('script[src*="dmx-datatables"]');
    if (scripts.length) {
      var src = scripts[0].getAttribute('src');
      return src.replace(/js\/dmx-datatables\.js.*$/, '');
    }
    return '';
  },

  _unloadTheme: function () {
    this._themeElements.forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    this._themeElements = [];
    this._loadedTheme = null;
  },

  _loadTheme: function (theme) {
    var validThemes = { 'dataTables': true, 'bootstrap5': true, 'bootstrap4': true };
    if (!validThemes[theme]) theme = 'bootstrap5';

    if (this._loadedTheme === theme) return;

    this._unloadTheme();

    var base = this._getBasePath();
    var head = document.head;
    var hasExportButtons = this._getExportButtons().length > 0;

    // Theme CSS: dataTables.<theme>.min.css
    var dtCss = document.createElement('link');
    dtCss.rel = 'stylesheet';
    dtCss.href = base + 'css/dataTables.' + theme + '.min.css';
    dtCss.setAttribute('data-dmx-dt-theme', theme);
    head.appendChild(dtCss);
    this._themeElements.push(dtCss);

    // Theme JS: dataTables.<theme>.min.js (not needed for default theme)
    if (theme !== 'dataTables') {
      var dtJs = document.createElement('script');
      dtJs.src = base + 'js/dataTables.' + theme + '.min.js';
      dtJs.setAttribute('data-dmx-dt-theme', theme);
      head.appendChild(dtJs);
      this._themeElements.push(dtJs);
    }

    // Buttons theme CSS: buttons.<theme>.min.css
    if (hasExportButtons) {
      var btnCss = document.createElement('link');
      btnCss.rel = 'stylesheet';
      btnCss.href = base + 'css/buttons.' + theme + '.min.css';
      btnCss.setAttribute('data-dmx-dt-theme', theme);
      head.appendChild(btnCss);
      this._themeElements.push(btnCss);

      // Buttons theme JS: buttons.<theme>.min.js (not needed for default theme)
      if (theme !== 'dataTables') {
        var btnJs = document.createElement('script');
        btnJs.src = base + 'js/buttons.' + theme + '.min.js';
        btnJs.setAttribute('data-dmx-dt-theme', theme);
        head.appendChild(btnJs);
        this._themeElements.push(btnJs);
      }
    }

    this._loadedTheme = theme;
  },

  _detectSearchType: function (key, rows) {
    var sampleSize = Math.min(rows.length, 20);
    var isNumber = true;
    var isDate = true;
    var hasValue = false;
    // ISO date pattern: YYYY-MM-DD with optional time, must be full match
    var dateRegex = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})?)?$/;

    for (var i = 0; i < sampleSize; i++) {
      var val = rows[i][key];
      if (val === null || val === undefined || val === '') continue;
      hasValue = true;

      // If the raw value is already a number type, mark it
      if (typeof val === 'number') {
        isDate = false;
        continue;
      }

      var str = String(val).trim();

      if (isNumber) {
        // Must be a finite number and not empty string
        var num = Number(str);
        if (str === '' || isNaN(num) || !isFinite(num)) {
          isNumber = false;
        }
      }
      if (isDate) {
        // Must match full date pattern and be 10+ chars (YYYY-MM-DD minimum)
        if (str.length < 10 || !dateRegex.test(str)) {
          isDate = false;
        }
      }
    }

    if (!hasValue) return 'text';
    // Check date before number since date strings can sometimes parse as numbers
    if (isDate) return 'date';
    if (isNumber) return 'number';
    return 'text';
  },

  _detectAllSearchTypes: function (rows) {
    if (!rows || !rows.length) return;
    var comp = this;
    var headers = Array.isArray(this.props.fields_header) ? this.props.fields_header : [];
    var headerMap = {};
    headers.forEach(function (h) {
      if (h && h.field) headerMap[h.name || h.field] = h;
    });

    // Detect types for all data keys
    var keys = Object.keys(rows[0]);
    keys.forEach(function (key) {
      var header = headerMap[key];
      // If there's an explicit search_type set in the grid, use it
      if (header && header.search_type) {
        comp._detectedSearchTypes[key] = header.search_type;
      } else {
        // Auto-detect from data
        comp._detectedSearchTypes[key] = comp._detectSearchType(key, rows);
      }
    });
  },

  _getColumns: function (rows) {
    var comp = this;
    var headers = Array.isArray(this.props.fields_header) ? this.props.fields_header : [];
    var autoDetect = this.props.auto_detect_columns !== false;
    var useOverride = this.props.use_grid_as_override === true;
    var cols = [];

    // Reset detected types on each table creation
    this._detectedSearchTypes = {};
    this._searchTypesDetected = false;
    this._columnsDetected = false;

    if (autoDetect) {
      // Auto-detect columns from data
      if (!rows.length) return cols;

      // Build override map from grid
      var overrideMap = {};
      if (useOverride && headers.length) {
        headers.forEach(function (h) {
          if (h && h.field) overrideMap[h.field] = h;
        });
      }

      Object.keys(rows[0]).forEach(function (key) {
        var override = overrideMap[key];
        comp._detectedSearchTypes[key] = comp._detectSearchType(key, rows);

        // If override exists and has explicit search_type, use it
        if (override && override.search_type) {
          comp._detectedSearchTypes[override.name || key] = override.search_type;
        }

        var col = {
          data: key,
          name: (override && override.name) || key,
          title: (override && override.header) || key,
          defaultContent: (override && override.default_content) || ''
        };
        if (override) {
          if (override.searchable === false || override.searchable === 'false') col.searchable = false;
          if (override.orderable === false || override.orderable === 'false') col.orderable = false;
        }
        cols.push(col);
      });

      this._searchTypesDetected = true;
      this._columnsDetected = true;
      return cols;
    }

    // Manual mode: use grid definitions
    if (!headers.length) {
      // No grid entries — fall back to data keys if available
      if (!rows.length) return cols;
      Object.keys(rows[0]).forEach(function (key) {
        comp._detectedSearchTypes[key] = comp._detectSearchType(key, rows);
        cols.push({ data: key, name: key, title: key, defaultContent: '' });
      });
      this._searchTypesDetected = rows.length > 0;
      this._columnsDetected = true;
      return cols;
    }

    headers.forEach(function (h) {
      if (!h || !h.field) return;
      if (h.search_type) {
        comp._detectedSearchTypes[h.name || h.field] = h.search_type;
      } else if (rows.length) {
        comp._detectedSearchTypes[h.name || h.field] = comp._detectSearchType(h.field, rows);
      }
      var col = {
        data: h.field,
        name: h.name || h.field,
        title: h.header || h.field,
        defaultContent: h.default_content || ''
      };
      if (h.searchable === false || h.searchable === 'false') col.searchable = false;
      if (h.orderable === false || h.orderable === 'false') col.orderable = false;
      cols.push(col);
    });
    this._searchTypesDetected = rows.length > 0;
    this._columnsDetected = headers.length > 0;
    return cols;
  },

  _escapeAttr: function (str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  _evaluateCondition: function (condition, row) {
    if (!condition || !condition.trim()) return true;
    try {
      this.data.row = row;
      var result = dmx.parse(condition, this);
      this.data.row = undefined;
      return !!result;
    } catch (e) {
      this.data.row = undefined;
      return true;
    }
  },

  _getActionHtml: function (row) {
    var buttons = [];
    var defs = Array.isArray(this.props.action_btns) ? this.props.action_btns : [];
    var comp = this;

    defs.forEach(function (btn, i) {
      var actionNum = i + 1;
      if (actionNum > 15) return;
      if (!btn || btn.enabled === false || btn.enabled === 'false') return;

      if (btn.condition && btn.condition.trim() !== '') {
        if (!comp._evaluateCondition(btn.condition, row)) return;
      }

      var name = btn.name || ('action_' + actionNum);
      var icon = btn.icon_class ? '<i class="' + comp._escapeAttr(btn.icon_class) + '"></i>' : '';
      var title = btn.title ? '<span>' + comp._escapeAttr(btn.title) + '</span>' : '';
      var cls = btn.btn_class || 'btn btn-sm btn-secondary';
      var tooltip = btn.tooltip || name;

      buttons.push(
        '<button type="button" class="' + comp._escapeAttr(cls) + ' dmx-dt-action-btn" data-dmx-action="' + comp._escapeAttr(name) + '" data-dmx-action-num="' + actionNum + '" title="' + comp._escapeAttr(tooltip) + '">' +
        icon + title +
        '</button>'
      );
    });

    if (!buttons.length) return '';
    return '<div class="dmx-dt-action-wrap">' + buttons.join('') + '</div>';
  },

  _getExportButtons: function () {
    var opts = Array.isArray(this.props.export_options) ? this.props.export_options : [];
    var buttons = [];

    opts.forEach(function (opt) {
      if (!opt || opt.enabled === false || opt.enabled === 'false') return;
      var type = String(opt.type || '').toLowerCase();
      if (!type) return;
      buttons.push({ extend: type, text: opt.title || type.charAt(0).toUpperCase() + type.slice(1) });
    });

    return buttons;
  },

  _getColumnSearchValues: function (dtColumns) {
    var result = {};
    if (!dtColumns) return result;
    dtColumns.forEach(function (col) {
      if (col.name && col.name !== '__actions__' && col.search && col.search.value) {
        result[col.name] = col.search.value;
      }
    });
    return result;
  },

  _getSearchTypeForColumn: function (colName) {
    // First check explicit fields_header config
    var headers = Array.isArray(this.props.fields_header) ? this.props.fields_header : [];
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (h && (h.name || h.field) === colName && h.search_type) {
        return h.search_type;
      }
    }
    // Fall back to auto-detected type
    if (this._detectedSearchTypes && this._detectedSearchTypes[colName]) {
      return this._detectedSearchTypes[colName];
    }
    return 'text';
  },

  _buildDateSearchInput: function (col, th) {
    var comp = this;
    var container = document.createElement('div');
    container.className = 'dmx-dt-col-search-date';

    var fromInput = document.createElement('input');
    fromInput.type = 'datetime-local';
    fromInput.className = 'dmx-dt-col-search form-control form-control-sm';
    fromInput.title = 'From date';

    var toInput = document.createElement('input');
    toInput.type = 'datetime-local';
    toInput.className = 'dmx-dt-col-search form-control form-control-sm';
    toInput.title = 'To date';

    var debounceTimer;
    function onDateChange() {
      var from = fromInput.value || '';
      var to = toInput.value || '';
      var val = '';
      if (from && to) val = from + '|' + to;
      else if (from) val = from + '|';
      else if (to) val = '|' + to;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (col.search() !== val) col.search(val).draw();
      }, 300);
    }

    fromInput.addEventListener('change', onDateChange);
    toInput.addEventListener('change', onDateChange);
    fromInput.addEventListener('click', function (e) { e.stopPropagation(); });
    toInput.addEventListener('click', function (e) { e.stopPropagation(); });

    container.appendChild(fromInput);
    container.appendChild(toInput);
    th.appendChild(container);
  },

  _buildNumberSearchInput: function (col, th) {
    var comp = this;
    var container = document.createElement('div');
    container.className = 'dmx-dt-col-search-number';

    var opSelect = document.createElement('select');
    opSelect.className = 'dmx-dt-col-search form-control form-control-sm dmx-dt-num-op';
    var ops = [
      { value: '', label: 'Any' },
      { value: 'eq', label: '=' },
      { value: 'gt', label: '>' },
      { value: 'gte', label: '>=' },
      { value: 'lt', label: '<' },
      { value: 'lte', label: '<=' },
      { value: 'between', label: 'Between' }
    ];
    ops.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      opSelect.appendChild(opt);
    });

    var valInput = document.createElement('input');
    valInput.type = 'number';
    valInput.className = 'dmx-dt-col-search form-control form-control-sm';
    valInput.placeholder = 'Value';

    var val2Input = document.createElement('input');
    val2Input.type = 'number';
    val2Input.className = 'dmx-dt-col-search form-control form-control-sm dmx-dt-num-val2';
    val2Input.placeholder = 'Max';
    val2Input.style.display = 'none';

    opSelect.addEventListener('change', function () {
      val2Input.style.display = this.value === 'between' ? '' : 'none';
      if (this.value !== 'between') val2Input.value = '';
      triggerSearch();
    });

    var debounceTimer;
    function triggerSearch() {
      var op = opSelect.value;
      var v1 = valInput.value;
      var v2 = val2Input.value;
      var val = '';
      if (op && v1 !== '') {
        val = op + ':' + v1;
        if (op === 'between' && v2 !== '') val += ':' + v2;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (col.search() !== val) col.search(val).draw();
      }, 300);
    }

    valInput.addEventListener('input', triggerSearch);
    val2Input.addEventListener('input', triggerSearch);
    opSelect.addEventListener('click', function (e) { e.stopPropagation(); });
    valInput.addEventListener('click', function (e) { e.stopPropagation(); });
    val2Input.addEventListener('click', function (e) { e.stopPropagation(); });

    container.appendChild(opSelect);
    container.appendChild(valInput);
    container.appendChild(val2Input);
    th.appendChild(container);
  },

  _setupColumnSearch: function () {
    if (!this.props.enable_column_search || !this._tableInstance) return;

    var comp = this;
    var api = this._tableInstance;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    // Remove any previous search row
    var existing = thead.querySelector('.dmx-dt-col-search-row');
    if (existing) existing.parentNode.removeChild(existing);

    var tr = document.createElement('tr');
    tr.className = 'dmx-dt-col-search-row';
    api.columns().every(function () {
      var col = this;
      var th = document.createElement('th');
      var colName = col.dataSrc();
      var colSettings = api.settings()[0].aoColumns[col.index()];

      if (colName === null || col.header().textContent === 'Actions' || colSettings.bSearchable === false) {
        th.innerHTML = '';
      } else {
        var searchType = comp._getSearchTypeForColumn(colSettings.sName || colName);

        if (searchType === 'date') {
          comp._buildDateSearchInput(col, th);
        } else if (searchType === 'number') {
          comp._buildNumberSearchInput(col, th);
        } else {
          var input = document.createElement('input');
          input.type = 'text';
          input.className = 'dmx-dt-col-search form-control form-control-sm';
          input.placeholder = 'Search ' + (col.header().textContent || '');
          input.setAttribute('data-col-index', col.index());

          var debounceTimer;
          input.addEventListener('input', function () {
            var val = this.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
              if (col.search() !== val) {
                col.search(val).draw();
              }
            }, 300);
          });

          input.addEventListener('click', function (e) {
            e.stopPropagation();
          });

          th.appendChild(input);
        }
      }
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  },

  _createTable: function () {
    if (!this._tableEl || typeof window.DataTable === 'undefined') {
      return;
    }

    this._destroyTable();

    var comp = this;
    var parsed = this._parseData();
    var columns = this._getColumns(parsed.rows);

    // If auto-detect is on but no data yet, don't create table — wait for data to arrive
    if (this.props.auto_detect_columns !== false && columns.length === 0 && parsed.rows.length === 0) {
      return;
    }

    if (this.props.enable_actions) {
      var actionsCol = {
        data: null,
        name: '__actions__',
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'dt-nowrap',
        render: function (data, type, row) {
          if (type !== 'display') return '';
          return comp._getActionHtml(row);
        }
      };

      if (String(this.props.actions_column_position || 'right').toLowerCase() === 'left') {
        columns.unshift(actionsCol);
      } else {
        columns.push(actionsCol);
      }
    }

    this._tableEl.className = this.props.table_class || 'table table-striped table-bordered table-hover';

    var exportButtons = this._getExportButtons();

    var options = {
      columns: columns,
      searching: true,
      ordering: true,
      paging: true,
      info: true,
      pageLength: Number(this.props.page_size || 20),
      lengthMenu: [10, 20, 50, 100],
      serverSide: true,
      processing: true,
      destroy: true,
      deferRender: true
    };

    if (!this.props.enable_global_search && !this.props.enable_column_search) {
      options.searching = false;
    }

    if (exportButtons.length) {
      options.dom = 'Bfrtip';
      options.buttons = exportButtons;
    }

    options.ajax = function (dtRequest, callback) {
      var order = (dtRequest.order || [])[0] || {};
      var orderColumn = (dtRequest.columns || [])[order.column] || {};
      var limit = Number(dtRequest.length || comp.props.page_size || 20);
      var offset = Number(dtRequest.start || 0);
      var page = Math.floor(offset / (limit || 1)) + 1;

      comp._pendingCallback = callback;
      comp._pendingDraw = dtRequest.draw || 1;

      // On initial draw, use existing data if already loaded
      if (dtRequest.draw === 1 && parsed.rows.length > 0) {
        callback({
          draw: 1,
          recordsTotal: parsed.total,
          recordsFiltered: parsed.total,
          data: parsed.rows
        });
        comp._pendingCallback = null;

        comp.set('serverState', {
          offset: parsed.offset,
          limit: parsed.limit,
          page: parsed.page ? parsed.page.current : 1,
          total: parsed.total,
          totalPages: parsed.page ? parsed.page.total : Math.ceil(parsed.total / (parsed.limit || 1)),
          search: '',
          orderField: orderColumn.name || '',
          orderDir: order.dir || 'asc'
        });

        var colSearch = comp._getColumnSearchValues(dtRequest.columns);
        comp.set('params', {
          offset: parsed.offset,
          limit: parsed.limit,
          sort: orderColumn.name || '',
          dir: order.dir || 'asc',
          search: '',
          columnSearch: Object.keys(colSearch).length ? JSON.stringify(colSearch) : ''
        });

        comp.set('state', { tableReady: true, loading: false });
        return;
      }

      comp.set('serverState', {
        offset: offset,
        limit: limit,
        page: page,
        total: parsed.total,
        totalPages: Math.ceil(parsed.total / (limit || 1)),
        search: (dtRequest.search || {}).value || '',
        orderField: orderColumn.name || '',
        orderDir: order.dir || 'asc'
      });

      var colSearch = comp._getColumnSearchValues(dtRequest.columns);
      comp.set('params', {
        offset: offset,
        limit: limit,
        sort: orderColumn.name || '',
        dir: order.dir || 'asc',
        search: (dtRequest.search || {}).value || '',
        columnSearch: Object.keys(colSearch).length ? JSON.stringify(colSearch) : ''
      });

      comp.set('state', { tableReady: true, loading: true });
      comp.dispatchEvent('server_request');
    };

    this._tableInstance = new DataTable(this._tableEl, options);

    this._setupColumnSearch();

    // Hide global search box when disabled but column search is still active
    if (!this.props.enable_global_search && this.props.enable_column_search) {
      var wrapper = this._tableEl.closest('.dataTables_wrapper');
      if (wrapper) {
        var filterDiv = wrapper.querySelector('.dataTables_filter');
        if (filterDiv) filterDiv.style.display = 'none';
      }
    }

    this._rowClickHandler = function (evt) {
      var tr = evt.target.closest('tr');
      if (!tr) return;

      var dtRow = comp._tableInstance.row(tr).data();
      if (!dtRow) return;

      // Create a plain object copy to ensure all properties are accessible via data binding
      var row = JSON.parse(JSON.stringify(dtRow));

      comp.set('id', row.id != null ? row.id : null);
      comp.set('data', row);
      comp.set('row', row);

      var actionButton = evt.target.closest('.dmx-dt-action-btn');
      if (actionButton) {
        var actionNum = parseInt(actionButton.getAttribute('data-dmx-action-num'), 10) || 0;
        var actionName = actionButton.getAttribute('data-dmx-action') || '';
        comp.set('action_name', actionName);
        comp.set('action_number', actionNum);
        if (actionNum >= 1 && actionNum <= 15) {
          comp.dispatchEvent('action_' + actionNum);
        }
        return;
      }

      comp.dispatchEvent('row_clicked');
    };

    this._tableEl.addEventListener('click', this._rowClickHandler);

    this.set('count', parsed.rows.length);
    this.set('state', { tableReady: true, loading: false });
  }
});
