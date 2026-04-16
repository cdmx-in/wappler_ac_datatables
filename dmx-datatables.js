dmx.Component("datatable", {
  initialData: {
    id: null,
    data: {},
    row: {},
    action_name: '',
    action_number: 0,
    count: 0,
    selected_rows: [],
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
      columnSearch: '',
      columnSearchOps: ''
    },
    state: {
      tableReady: false,
      loading: false
    },
    filters: {
      global_search: '',
      column_search: {}
    },
    edited_cell: {
      field: '',
      old_value: '',
      new_value: '',
      row_data: {}
    }
  },

  attributes: {
    id: { type: String, default: '' },
    data: { default: null },
    noload: { type: Boolean, default: false },
    table_class: { type: String, default: 'table table-striped table-bordered table-hover' },
    page_size: { type: Number, default: 20 },
    page_length: { type: Number, default: 0 },
    length_menu: { type: String, default: '' },
    fields_header: {
      type: Array, default: []
    },
    auto_detect_columns: { type: Boolean, default: true },
    use_grid_as_override: { type: Boolean, default: false },
    enable_actions: { type: Boolean, default: false },
    actions_column_position: { type: String, default: 'right' },
    action_btns: { type: Array, default: [] },
    enable_column_search: { type: Boolean, default: false },
    column_search_mode: { type: String, default: 'simple' },
    column_search_position: { type: String, default: 'row' },
    enable_global_search: { type: Boolean, default: true },
    enable_column_reorder: { type: Boolean, default: false },
    enable_column_resize: { type: Boolean, default: false },
    enable_rtl: { type: Boolean, default: false },
    enable_row_highlight: { type: Boolean, default: false },
    enable_column_highlight: { type: Boolean, default: false },
    enable_multi_select: { type: Boolean, default: false },
    checkbox_select: { type: Boolean, default: false },
    export_options: {
      type: Array, default: [
        { "enabled": false, "type": "copy", "title": "Copy" },
        { "enabled": true, "type": "csv", "title": "CSV" },
        { "enabled": true, "type": "excel", "title": "Excel" },
        { "enabled": false, "type": "pdf", "title": "PDF" },
        { "enabled": false, "type": "print", "title": "Print" }
      ]
    },
    theme: { type: String, default: 'bootstrap5' },
    fields_header_advanced: { type: Array, default: [] },
    export_exclude_fields: { type: String, default: '' },
    editable_fields: { type: String, default: '' },
    editable_cells: { type: Boolean, default: false },
    editable_rows: { type: Boolean, default: false },
    enable_selector_editors: { type: Boolean, default: false },
    static_selectors: { type: Array, default: [] },
    dynamic_selectors: { type: Array, default: [] },
    default_sort_field: { type: String, default: '' },
    default_sort_dir: { type: String, default: 'asc' },
    initial_global_search: { type: String, default: '' },
    initial_column_search: { type: String, default: '' },
    fixed_columns_left: { type: Number, default: 0 },
    fix_actions_column: { type: Boolean, default: false },
    actions_min_width: { type: String, default: '' },
    actions_max_width: { type: String, default: '' },
    column_groups: { type: Array, default: [] },
    table_language: { type: String, default: '' },
    enable_fixed_header: { type: Boolean, default: false },
    fixed_header_top_offset: { type: Number, default: 0 },
    enable_responsive: { type: Boolean, default: false },
    responsive_details_type: { type: String, default: 'inline' },
    dark_mode: { type: Boolean, default: false },
    wrap_header_text: { type: Boolean, default: false },
    enable_row_animate: { type: Boolean, default: false },
    enable_scroll_x: { type: Boolean, default: false },
    scroll_y: { type: String, default: '' }
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
    },

    exportData: function (type) {
      if (!this._tableInstance) return;
      type = type ? String(type).toLowerCase() : 'csv';
      var buttons = this._tableInstance.buttons();
      if (buttons) {
        try {
          this._tableInstance.button('.' + type + ':first').trigger();
        } catch (e) {
          // Fallback: find button by extend type
          var allBtns = this._tableInstance.buttons();
          for (var i = 0; i < allBtns.length; i++) {
            try {
              var inst = allBtns[i].inst;
              if (inst && inst.s && inst.s.buttons) {
                for (var j = 0; j < inst.s.buttons.length; j++) {
                  var btn = inst.s.buttons[j];
                  if (btn.conf && btn.conf.extend === type) {
                    btn.node.click();
                    return;
                  }
                  // Check child buttons in collection
                  if (btn.buttons) {
                    for (var k = 0; k < btn.buttons.length; k++) {
                      if (btn.buttons[k].conf && btn.buttons[k].conf.extend === type) {
                        btn.buttons[k].node.click();
                        return;
                      }
                    }
                  }
                }
              }
            } catch (ex) { }
          }
        }
      }
    },

    getFilters: function () {
      return this.get('filters') || { global_search: '', column_search: {} };
    },

    clearFilters: function () {
      if (!this._tableInstance) return;
      // Clear global search
      this._tableInstance.search('');
      // Clear all column searches
      this._tableInstance.columns().every(function () {
        this.search('');
      });
      this._colSearchOps = {};
      this._tableInstance.draw();
      // Reset filter UI inputs
      this._clearFilterUI();
      // Update exposed data
      this.set('filters', { global_search: '', column_search: {} });
    },

    getSelectedRows: function () {
      return this.get('selected_rows') || [];
    },

    resetColumnState: function () {
      try {
        localStorage.removeItem(this._getReorderStorageKey());
      } catch (e) { }
      try {
        localStorage.removeItem(this._getResizeStorageKey());
      } catch (e) { }
      this._createTable();
    },

    quickFilter: function (value) {
      if (!this._tableInstance) return;
      this._tableInstance.search(value != null ? String(value) : '').draw();
      this._updateFiltersData();
    },

    getFilteredData: function () {
      if (!this._tableInstance) return [];
      return this._tableInstance.rows({ search: 'applied' }).data().toArray();
    },

    applyFilters: function (model) {
      if (!this._tableInstance || !model || typeof model !== 'object') return;
      if (model.global_search !== undefined) {
        this._tableInstance.search(String(model.global_search || ''));
        var container = this._tableEl ? this._tableEl.closest('.dt-container') : null;
        if (container) {
          var globalInput = container.querySelector('input[type="search"]');
          if (globalInput) globalInput.value = String(model.global_search || '');
        }
      }
      if (model.column_search && typeof model.column_search === 'object') {
        var colSearch = model.column_search;
        this._tableInstance.columns().every(function () {
          var colName = this.dataSrc();
          if (colName != null && colSearch[colName] !== undefined) {
            this.search(String(colSearch[colName] || ''));
          }
        });
      }
      this._tableInstance.draw();
      this._syncColumnSearchUI();
      this._updateFiltersData();
    },

    showColumn: function (fieldName) {
      if (!this._tableInstance || !fieldName) return;
      this._tableInstance.column('[name="' + fieldName + '"]').visible(true);
    },

    hideColumn: function (fieldName) {
      if (!this._tableInstance || !fieldName) return;
      this._tableInstance.column('[name="' + fieldName + '"]').visible(false);
    }
  },

  events: {
    server_request: Event,
    row_clicked: Event,
    selection_changed: Event,
    cell_edited: Event,
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
    this._themeVars = null;
    this._reorderCleanup = null;
    this._resizeCleanup = null;
    this._highlightCleanup = null;
    this._selectedRowIndices = new Set();
    this._selectAllHandler = null;
    this._activeEditor = null;
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

    // Structure: { data: [...], total, offset, limit, page }
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
        limit: Number(raw.limit || this.props.page_length || this.props.page_size || 20),
        page: raw.page || null
      };
    }

    // Fallback
    return {
      rows: [],
      total: 0,
      offset: 0,
      limit: this.props.page_length || this.props.page_size || 20,
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
      updatedProps.has('page_length') ||
      updatedProps.has('length_menu') ||
      updatedProps.has('enable_column_search') ||
      updatedProps.has('column_search_mode') ||
      updatedProps.has('column_search_position') ||
      updatedProps.has('enable_global_search') ||
      updatedProps.has('enable_column_reorder') ||
      updatedProps.has('enable_column_resize') ||
      updatedProps.has('enable_rtl') ||
      updatedProps.has('enable_row_highlight') ||
      updatedProps.has('enable_column_highlight') ||
      updatedProps.has('enable_multi_select') ||
      updatedProps.has('checkbox_select') ||
      updatedProps.has('fields_header_advanced') ||
      updatedProps.has('export_exclude_fields') ||
      updatedProps.has('editable_fields') ||
      updatedProps.has('editable_cells') ||
      updatedProps.has('editable_rows') ||
      updatedProps.has('enable_selector_editors') ||
      updatedProps.has('static_selectors') ||
      updatedProps.has('dynamic_selectors') ||
      updatedProps.has('default_sort_field') ||
      updatedProps.has('default_sort_dir') ||
      updatedProps.has('initial_global_search') ||
      updatedProps.has('initial_column_search') ||
      updatedProps.has('fixed_columns_left') ||
      updatedProps.has('fix_actions_column') ||
      updatedProps.has('actions_min_width') ||
      updatedProps.has('actions_max_width') ||
      updatedProps.has('table_language') ||
      updatedProps.has('enable_fixed_header') ||
      updatedProps.has('fixed_header_top_offset') ||
      updatedProps.has('enable_responsive') ||
      updatedProps.has('responsive_details_type') ||
      updatedProps.has('column_groups') ||
      updatedProps.has('dark_mode') ||
      updatedProps.has('wrap_header_text') ||
      updatedProps.has('enable_row_animate') ||
      updatedProps.has('enable_scroll_x') ||
      updatedProps.has('scroll_y')
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

        this._updateFiltersData();
        this.set('state', { tableReady: true, loading: false });
      }
    }
  },

  destroy: function () {
    this._closeActivePopup();
    this._destroyTable();
    this._unloadTheme();
    this._pendingCallback = null;
  },

  _destroyTable: function () {
    this._closeActivePopup();

    // Clean up column reorder listeners
    if (this._reorderCleanup) {
      this._reorderCleanup();
      this._reorderCleanup = null;
    }

    // Clean up column resize listeners
    if (this._resizeCleanup) {
      this._resizeCleanup();
      this._resizeCleanup = null;
    }

    // Clean up highlight listeners
    if (this._highlightCleanup) {
      this._highlightCleanup();
      this._highlightCleanup = null;
    }

    // Remove all filter popups belonging to this instance
    var popups = document.querySelectorAll('.dmx-dt-filter-popup[data-dmx-dt-id="' + (this.props.id || '') + '"]');
    popups.forEach(function (el) { el.parentNode.removeChild(el); });

    if (this._rowClickHandler && this._tableEl) {
      this._tableEl.removeEventListener('click', this._rowClickHandler);
      this._rowClickHandler = null;
    }

    if (this._selectAllHandler && this._tableEl) {
      this._tableEl.removeEventListener('click', this._selectAllHandler);
      this._selectAllHandler = null;
    }

    if (this._editDblClickHandler && this._tableEl) {
      this._tableEl.removeEventListener('dblclick', this._editDblClickHandler);
      this._editDblClickHandler = null;
    }
    this._activeEditor = null;

    if (this._tableInstance) {
      try {
        this._tableInstance.destroy();
      } catch (e) { }
      this._tableInstance = null;
    }

    // Clear selection state
    this._selectedRowIndices.clear();
    this.set('selected_rows', []);
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

  _loadExtension: function (name) {
    var flagKey = '_ext_' + name + '_loaded';
    if (this[flagKey]) return;
    var base = this._getBasePath();
    var theme = this._loadedTheme || 'bootstrap5';
    var head = document.head;

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = base + 'css/' + name + '.' + theme + '.min.css';
    css.setAttribute('data-dmx-dt-ext', name);
    head.appendChild(css);

    var js = document.createElement('script');
    js.src = base + 'js/' + name + '.min.js';
    js.setAttribute('data-dmx-dt-ext', name);
    head.appendChild(js);

    this[flagKey] = true;
  },

  _loadFixedColumns: function () {
    this._loadExtension('fixedColumns');
  },

  // Build a multi-row <thead> for column groups (3.2).
  // Row 1: group header cells with colspan; Row 2: regular header cells (DataTables populates titles).
  _buildGroupedHeader: function (columns, groups) {
    var totalCols = columns.length;
    if (!groups || groups.length === 0) return;

    // Normalise spans — ensure positive integers summing exactly to totalCols
    var spans = groups.map(function (g) { return Math.max(1, Number(g.span) || 1); });
    var spanSum = spans.reduce(function (a, b) { return a + b; }, 0);
    if (spanSum !== totalCols && spans.length > 0) {
      spans[spans.length - 1] = Math.max(1, spans[spans.length - 1] + (totalCols - spanSum));
    }

    // Group header row
    var groupTr = document.createElement('tr');
    groupTr.className = 'dmx-dt-col-groups';
    groups.forEach(function (g, i) {
      var th = document.createElement('th');
      th.textContent = g.label || '';
      th.colSpan = spans[i];
      groupTr.appendChild(th);
    });

    // Regular header row — empty <th> elements; DataTables will fill in column titles + sort icons
    var headerTr = document.createElement('tr');
    for (var c = 0; c < totalCols; c++) {
      headerTr.appendChild(document.createElement('th'));
    }

    var thead = document.createElement('thead');
    thead.appendChild(groupTr);
    thead.appendChild(headerTr);

    var existingThead = this._tableEl.querySelector('thead');
    if (existingThead) {
      this._tableEl.removeChild(existingThead);
    }
    this._tableEl.appendChild(thead);
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

    // Set theme-adaptive CSS custom properties
    this._applyThemeVars(theme);

    this._loadedTheme = theme;
  },

  _applyThemeVars: function (theme) {
    var vars = {};
    if (theme === 'bootstrap4') {
      vars = {
        '--dmx-dt-border': 'rgba(0, 0, 0, 0.125)',
        '--dmx-dt-bg-subtle': 'rgba(0, 0, 0, 0.03)',
        '--dmx-dt-text': 'inherit',
        '--dmx-dt-text-muted': '#6c757d',
        '--dmx-dt-accent': '#007bff',
        '--dmx-dt-accent-bg': 'rgba(0, 123, 255, 0.1)',
        '--dmx-dt-popup-bg': '#fff',
        '--dmx-dt-popup-shadow': 'rgba(0, 0, 0, 0.08)',
        '--dmx-dt-input-bg': '#e9ecef',
        '--dmx-dt-input-border': 'rgba(0, 0, 0, 0.1)'
      };
    } else if (theme === 'dataTables') {
      vars = {
        '--dmx-dt-border': '#d0d0d0',
        '--dmx-dt-bg-subtle': 'rgba(0, 0, 0, 0.02)',
        '--dmx-dt-text': '#333',
        '--dmx-dt-text-muted': '#666',
        '--dmx-dt-accent': '#0d6efd',
        '--dmx-dt-accent-bg': 'rgba(13, 110, 253, 0.08)',
        '--dmx-dt-popup-bg': '#fff',
        '--dmx-dt-popup-shadow': 'rgba(0, 0, 0, 0.08)',
        '--dmx-dt-input-bg': '#f5f5f5',
        '--dmx-dt-input-border': '#d0d0d0'
      };
    } else {
      // bootstrap5 defaults — already set in CSS, but apply explicitly for popups
      vars = {
        '--dmx-dt-border': 'rgba(0, 0, 0, 0.125)',
        '--dmx-dt-bg-subtle': 'rgba(0, 0, 0, 0.03)',
        '--dmx-dt-text': 'inherit',
        '--dmx-dt-text-muted': 'rgba(0, 0, 0, 0.55)',
        '--dmx-dt-accent': 'rgb(13, 110, 253)',
        '--dmx-dt-accent-bg': 'rgba(13, 110, 253, 0.1)',
        '--dmx-dt-popup-bg': '#fff',
        '--dmx-dt-popup-shadow': 'rgba(0, 0, 0, 0.08)',
        '--dmx-dt-input-bg': '#f8f9fa',
        '--dmx-dt-input-border': 'rgba(0, 0, 0, 0.1)'
      };
    }

    // Apply to the wrapper element so scoped styles pick them up
    var wrapper = this._tableEl ? this._tableEl.closest('.dt-container') : null;
    if (wrapper) {
      for (var key in vars) {
        wrapper.style.setProperty(key, vars[key]);
      }
    }

    // Also apply to any popups belonging to this instance (they live on document.body)
    var popups = document.querySelectorAll('.dmx-dt-filter-popup[data-dmx-dt-id="' + (this.props.id || '') + '"]');
    popups.forEach(function (popup) {
      for (var key in vars) {
        popup.style.setProperty(key, vars[key]);
      }
    });

    // Store vars for applying to popups created later
    this._themeVars = vars;
  },

  _applyThemeVarsToPopup: function (popup) {
    if (!this._themeVars) return;
    var vars = this._themeVars;
    for (var key in vars) {
      popup.style.setProperty(key, vars[key]);
    }
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

  _parseLengthMenu: function () {
    var raw = this.props.length_menu;
    if (raw && typeof raw === 'string' && raw.trim()) {
      var nums = raw.split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n) && n > 0; });
      if (nums.length) return nums;
    }
    return [10, 20, 50, 100];
  },

  _getAdvancedMap: function () {
    var adv = Array.isArray(this.props.fields_header_advanced) ? this.props.fields_header_advanced : [];
    var map = {};
    adv.forEach(function (a) {
      if (a && a.field) map[a.field] = a;
    });
    return map;
  },

  _applyAdvancedProps: function (col, fieldKey) {
    var advMap = this._advancedMap || {};
    var adv = advMap[fieldKey];
    if (!adv) return;
    if (adv.footer_value != null && adv.footer_value !== '') col.footerValue = adv.footer_value;
    if (adv.render) {
      var renderFn = this._parseRenderFn(adv.render);
      if (renderFn) {
        // If external_data is provided, wrap the render function to inject it
        if (adv.external_data != null && adv.external_data !== '') {
          col.render = (function (origFn, extData) {
            return function (data, type, row, meta) {
              // Inject external data as row.__ext_<fieldName> for access in render
              row['__ext_' + fieldKey] = extData;
              return origFn(data, type, row, meta);
            };
          })(renderFn, adv.external_data);
        } else {
          col.render = renderFn;
        }
      }
    }
    if (adv.width != null && adv.width !== '') col.width = adv.width;
    if (adv.min_width != null && adv.min_width !== '') {
      col.minWidth = adv.min_width;
      (function (minW, prevCreatedCell) {
        col.createdCell = function (td) {
          td.style.minWidth = minW;
          if (prevCreatedCell) prevCreatedCell.apply(this, arguments);
        };
      })(adv.min_width, col.createdCell || null);
    }
    if (adv.max_width != null && adv.max_width !== '') {
      col.maxWidth = adv.max_width;
      (function (maxW, prevCreatedCell) {
        col.createdCell = function (td) {
          td.style.maxWidth = maxW;
          if (prevCreatedCell) prevCreatedCell.apply(this, arguments);
        };
      })(adv.max_width, col.createdCell || null);
    }
    if (adv.className != null && adv.className !== '') col.className = adv.className;
    if (adv.external_data != null && adv.external_data !== '') col.externalData = adv.external_data;
  },

  _getColumns: function (rows) {
    var comp = this;
    var headers = Array.isArray(this.props.fields_header) ? this.props.fields_header : [];
    var autoDetect = this.props.auto_detect_columns !== false;
    var useOverride = this.props.use_grid_as_override === true;
    var cols = [];

    // Build advanced settings map
    this._advancedMap = this._getAdvancedMap();

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

        // Skip hidden columns
        if (override && (override.isHidden === true || override.isHidden === 'true')) return;

        comp._detectedSearchTypes[key] = comp._detectSearchType(key, rows);

        // If override exists and has explicit search_type, use it
        if (override && override.search_type) {
          comp._detectedSearchTypes[override.name || key] = override.search_type;
        }

        var col = {
          data: key,
          name: (override && override.name) || key,
          title: (override && override.header) || comp._humanizeField(key),
          defaultContent: (override && override.default_content) || ''
        };
        if (override) {
          if (override.searchable === false || override.searchable === 'false') col.searchable = false;
          if (override.orderable === false || override.orderable === 'false') col.orderable = false;
        }
        // Apply advanced grid props (footer_value, render, width, className, external_data)
        comp._applyAdvancedProps(col, key);
        // Auto date render if no user render supplied
        if (!col.render && comp._detectedSearchTypes[key] === 'date') {
          col.render = comp._defaultDateRender;
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
        var col = { data: key, name: key, title: comp._humanizeField(key), defaultContent: '' };
        // Apply advanced grid props
        comp._applyAdvancedProps(col, key);
        if (!col.render && comp._detectedSearchTypes[key] === 'date') {
          col.render = comp._defaultDateRender;
        }
        cols.push(col);
      });
      this._searchTypesDetected = rows.length > 0;
      this._columnsDetected = true;
      return cols;
    }

    headers.forEach(function (h) {
      if (!h || !h.field) return;
      // Skip hidden columns
      if (h.isHidden === true || h.isHidden === 'true') return;
      if (h.search_type) {
        comp._detectedSearchTypes[h.name || h.field] = h.search_type;
      } else if (rows.length) {
        comp._detectedSearchTypes[h.name || h.field] = comp._detectSearchType(h.field, rows);
      }
      var col = {
        data: h.field,
        name: h.name || h.field,
        title: h.header || comp._humanizeField(h.field),
        defaultContent: h.default_content || ''
      };
      if (h.searchable === false || h.searchable === 'false') col.searchable = false;
      if (h.orderable === false || h.orderable === 'false') col.orderable = false;
      // Apply advanced grid props (footer_value, render, width, className, external_data)
      comp._applyAdvancedProps(col, h.field);
      // Auto date render if no user render supplied
      if (!col.render) {
        var colKey = h.name || h.field;
        if (comp._detectedSearchTypes[colKey] === 'date') {
          col.render = comp._defaultDateRender;
        }
      }
      cols.push(col);
    });
    this._searchTypesDetected = rows.length > 0;
    this._columnsDetected = headers.length > 0;
    return cols;
  },

  _defaultDateRender: function (data, type) {
    if (type !== 'display' && type !== 'print') return data;
    if (data == null || data === '') return '';
    var d = new Date(data);
    if (isNaN(d.getTime())) return String(data);
    var str = String(data).trim();
    // Datetime if value has a time component (longer than YYYY-MM-DD)
    if (str.length > 10) {
      return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  },

  _humanizeField: function (str) {
    if (!str || typeof str !== 'string') return str;
    // Replace underscores and hyphens with spaces first
    var result = str.replace(/[_-]+/g, ' ');
    // Split acronym runs before a Title-case word: XMLParser → XML Parser
    result = result
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      // Split lowercase→uppercase boundary: camelCase → camel Case
      .replace(/([a-z\d])([A-Z])/g, '$1 $2');
    // Capitalise each word
    return result.replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
  },

  _parseRenderFn: function (str) {
    if (!str || typeof str !== 'string') return null;
    var trimmed = str.trim();
    if (!trimmed) return null;
    try {
      // eslint-disable-next-line no-new-func
      var fn = new Function('return (' + trimmed + ')')();
      if (typeof fn !== 'function') {
        console.warn('[dmx-datatable] render value is not a function:', trimmed);
        return null;
      }
      return fn;
    } catch (e) {
      console.warn('[dmx-datatable] Invalid render function, column render skipped:', e.message);
      return null;
    }
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
      // inject all row fields directly
      Object.assign(this.data, row);

      var result = dmx.parse(condition, this);

      // cleanup
      Object.keys(row).forEach(key => delete this.data[key]);

      return !!result;
    } catch (e) {
      Object.keys(row).forEach(key => delete this.data[key]);
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

  _getExportButtons: function (columns) {
    var opts = Array.isArray(this.props.export_options) ? this.props.export_options : [];
    var childButtons = [];
    var exportOpts = null;

    // Resolve export exclude fields to column indices
    if (columns) {
      var excludeSet = this._getExportColumnOptions();
      if (excludeSet) {
        var includeIndices = [];
        columns.forEach(function (col, i) {
          var key = col.name || col.data;
          if (key && !excludeSet[key] && key !== '__actions__' && key !== '__checkbox__') {
            includeIndices.push(i);
          }
        });
        exportOpts = { columns: includeIndices };
      }
    }

    opts.forEach(function (opt) {
      if (!opt || opt.enabled === false || opt.enabled === 'false') return;
      var type = String(opt.type || '').toLowerCase();
      if (!type) return;
      var btn = { extend: type, text: opt.title || type.charAt(0).toUpperCase() + type.slice(1) };
      if (exportOpts) btn.exportOptions = exportOpts;
      childButtons.push(btn);
    });

    if (!childButtons.length) return [];

    // Wrap in a collection dropdown (Paces style)
    return [{
      extend: 'collection',
      text: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1 align-baseline"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 11l5 5l5-5"/><path d="M12 4l0 12"/></svg> Export',
      className: 'dmx-dt-export-btn',
      autoClose: true,
      buttons: childButtons
    }];
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
    fromInput.className = 'dmx-dt-col-search';
    fromInput.title = 'From date';

    var toInput = document.createElement('input');
    toInput.type = 'datetime-local';
    toInput.className = 'dmx-dt-col-search';
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
    opSelect.className = 'dmx-dt-col-search dmx-dt-num-op';
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
    valInput.className = 'dmx-dt-col-search';
    valInput.placeholder = 'Value';

    var val2Input = document.createElement('input');
    val2Input.type = 'number';
    val2Input.className = 'dmx-dt-col-search dmx-dt-num-val2';
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
      if (v1 !== '') {
        var effectiveOp = op || 'eq';
        val = effectiveOp + ':' + v1;
        if (effectiveOp === 'between' && v2 !== '') val += ':' + v2;
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

  _buildTextConditionRow: function () {
    var row = document.createElement('div');
    row.className = 'dmx-dt-text-condition';

    var opSelect = document.createElement('select');
    opSelect.className = 'dmx-dt-col-search dmx-dt-text-op';
    var ops = [
      { value: 'contains', label: 'Contains' },
      { value: 'notContains', label: 'Does not contain' },
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Does not equal' },
      { value: 'startsWith', label: 'Starts with' },
      { value: 'endsWith', label: 'Ends with' },
      { value: 'blank', label: 'Is blank' },
      { value: 'notBlank', label: 'Is not blank' }
    ];
    ops.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      opSelect.appendChild(opt);
    });

    var valInput = document.createElement('input');
    valInput.type = 'text';
    valInput.className = 'dmx-dt-col-search dmx-dt-text-val';
    valInput.placeholder = 'Filter value...';

    // Hide input for blank/notBlank
    opSelect.addEventListener('change', function () {
      var isBlankOp = this.value === 'blank' || this.value === 'notBlank';
      valInput.style.display = isBlankOp ? 'none' : '';
      if (isBlankOp) valInput.value = '';
    });

    opSelect.addEventListener('click', function (e) { e.stopPropagation(); });
    valInput.addEventListener('click', function (e) { e.stopPropagation(); });

    row.appendChild(opSelect);
    row.appendChild(valInput);
    return { container: row, opSelect: opSelect, valInput: valInput };
  },

  _buildTextSearchInput: function (col, container, iconBtn, clearBtn) {
    var comp = this;

    // Build condition 1
    var cond1 = this._buildTextConditionRow();
    container.appendChild(cond1.container);

    // AND/OR join selector (hidden initially)
    var joinRow = document.createElement('div');
    joinRow.className = 'dmx-dt-text-join';
    joinRow.style.display = 'none';
    var andRadio = document.createElement('input');
    andRadio.type = 'radio';
    andRadio.name = 'dmx-text-join-' + col.index();
    andRadio.id = 'dmx-text-join-and-' + col.index();
    andRadio.value = 'and';
    andRadio.checked = true;
    var andLabel = document.createElement('label');
    andLabel.htmlFor = andRadio.id;
    andLabel.textContent = 'AND';
    andLabel.className = 'dmx-dt-join-label';

    var orRadio = document.createElement('input');
    orRadio.type = 'radio';
    orRadio.name = 'dmx-text-join-' + col.index();
    orRadio.id = 'dmx-text-join-or-' + col.index();
    orRadio.value = 'or';
    var orLabel = document.createElement('label');
    orLabel.htmlFor = orRadio.id;
    orLabel.textContent = 'OR';
    orLabel.className = 'dmx-dt-join-label';

    joinRow.appendChild(andRadio);
    joinRow.appendChild(andLabel);
    joinRow.appendChild(orRadio);
    joinRow.appendChild(orLabel);
    joinRow.addEventListener('click', function (e) { e.stopPropagation(); });
    container.appendChild(joinRow);

    // Build condition 2 (hidden initially)
    var cond2 = this._buildTextConditionRow();
    cond2.container.style.display = 'none';
    container.appendChild(cond2.container);

    // Show/hide second condition based on first condition having a value
    function updateSecondConditionVisibility() {
      var op1 = cond1.opSelect.value;
      var v1 = cond1.valInput.value;
      var hasCond1 = (op1 === 'blank' || op1 === 'notBlank') || v1.trim() !== '';

      if (hasCond1) {
        joinRow.style.display = '';
        cond2.container.style.display = '';
      } else {
        joinRow.style.display = 'none';
        cond2.container.style.display = 'none';
      }
    }

    var debounceTimer;
    function triggerSearch() {
      updateSecondConditionVisibility();

      var op1 = cond1.opSelect.value;
      var v1 = cond1.valInput.value;
      var op2 = cond2.opSelect.value;
      var v2 = cond2.valInput.value;
      var join = andRadio.checked ? 'and' : 'or';

      var parts = [];
      var hasCond1 = (op1 === 'blank' || op1 === 'notBlank') || v1.trim() !== '';
      var hasCond2 = (op2 === 'blank' || op2 === 'notBlank') || v2.trim() !== '';

      if (hasCond1) {
        parts.push('txt:' + op1 + ':' + v1);
      }
      // Only include second condition if first is filled AND second has a value
      if (hasCond1 && hasCond2) {
        parts.push(join);
        parts.push('txt:' + op2 + ':' + v2);
      }

      var val = parts.join('|');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (col.search() !== val) {
          col.search(val).draw();
        }
        comp._updateFilterIconState(iconBtn, !!val);
      }, 300);
    }

    cond1.valInput.addEventListener('input', triggerSearch);
    cond1.opSelect.addEventListener('change', triggerSearch);
    cond2.valInput.addEventListener('input', triggerSearch);
    cond2.opSelect.addEventListener('change', triggerSearch);
    andRadio.addEventListener('change', triggerSearch);
    orRadio.addEventListener('change', triggerSearch);

    // Clear handler
    clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      cond1.opSelect.selectedIndex = 0;
      cond1.valInput.value = '';
      cond1.valInput.style.display = '';
      cond2.opSelect.selectedIndex = 0;
      cond2.valInput.value = '';
      cond2.valInput.style.display = '';
      andRadio.checked = true;
      joinRow.style.display = 'none';
      cond2.container.style.display = 'none';
      col.search('').draw();
      comp._updateFilterIconState(iconBtn, false);
      comp._closeActivePopup();
    });
  },

  _buildDropdownSearchInput: function (col, container, iconBtn, clearBtn) {
    var comp = this;
    var api = this._tableInstance;

    var select = document.createElement('select');
    select.className = 'dmx-dt-col-search dmx-dt-dropdown-search';

    var allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = '-- All --';
    select.appendChild(allOpt);

    // Collect unique values from the column data
    var colData = api.column(col.index()).data().toArray();
    var uniqueVals = {};
    colData.forEach(function (v) {
      if (v === null || v === undefined || v === '') return;
      var s = String(v).trim();
      if (s && !uniqueVals[s]) uniqueVals[s] = true;
    });
    var sorted = Object.keys(uniqueVals).sort();
    sorted.forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });

    select.addEventListener('change', function () {
      var val = select.value;
      col.search(val ? 'txt:equals:' + val : '').draw();
      if (iconBtn) comp._updateFilterIconState(iconBtn, !!val);
    });
    select.addEventListener('click', function (e) { e.stopPropagation(); });

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        select.value = '';
        col.search('').draw();
        if (iconBtn) comp._updateFilterIconState(iconBtn, false);
        comp._closeActivePopup();
      });
    }

    container.appendChild(select);
  },

  _buildBooleanSearchInput: function (col, container, iconBtn, clearBtn) {
    var comp = this;

    var select = document.createElement('select');
    select.className = 'dmx-dt-col-search dmx-dt-boolean-search';

    var opts = [
      { value: '', label: '-- All --' },
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' }
    ];
    opts.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      select.appendChild(opt);
    });

    select.addEventListener('change', function () {
      var val = select.value;
      col.search(val ? 'txt:equals:' + val : '').draw();
      if (iconBtn) comp._updateFilterIconState(iconBtn, !!val);
    });
    select.addEventListener('click', function (e) { e.stopPropagation(); });

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        select.value = '';
        col.search('').draw();
        if (iconBtn) comp._updateFilterIconState(iconBtn, false);
        comp._closeActivePopup();
      });
    }

    container.appendChild(select);
  },

  _activeFilterPopup: null,
  _outsideClickHandler: null,

  _closeActivePopup: function () {
    if (this._activeFilterPopup) {
      this._activeFilterPopup.classList.remove('dmx-dt-filter-popup-open');
      this._activeFilterPopup = null;
    }
    if (this._outsideClickHandler) {
      document.removeEventListener('mousedown', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  },

  _openFilterPopup: function (popup, iconBtn) {
    var comp = this;

    // Close any previously open popup
    this._closeActivePopup();

    // Position the popup below the icon button
    var rect = iconBtn.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    popup.style.top = (rect.bottom + scrollTop + 4) + 'px';
    popup.style.left = (rect.left + scrollLeft) + 'px';
    popup.classList.add('dmx-dt-filter-popup-open');
    this._activeFilterPopup = popup;

    // Auto-focus first input
    var firstInput = popup.querySelector('input, select');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 50);

    // Close on outside click
    this._outsideClickHandler = function (e) {
      if (!popup.contains(e.target) && e.target !== iconBtn && !iconBtn.contains(e.target)) {
        comp._closeActivePopup();
      }
    };
    setTimeout(function () {
      document.addEventListener('mousedown', comp._outsideClickHandler);
    }, 0);
  },

  _updateFilterIconState: function (iconBtn, hasValue) {
    if (hasValue) {
      iconBtn.classList.add('dmx-dt-filter-active');
    } else {
      iconBtn.classList.remove('dmx-dt-filter-active');
    }
  },

  _setupFooter: function (columns) {
    // Remove existing tfoot
    var existingFoot = this._tableEl.querySelector('tfoot');
    if (existingFoot) existingFoot.parentNode.removeChild(existingFoot);

    // Check if any column has a footer value
    var hasFooter = columns.some(function (col) {
      return col.footerValue != null && col.footerValue !== '';
    });
    if (!hasFooter) return;

    var tfoot = document.createElement('tfoot');
    var tr = document.createElement('tr');
    tr.className = 'dmx-dt-footer-row';
    columns.forEach(function (col) {
      var td = document.createElement('th');
      if (col.footerValue != null && col.footerValue !== '') {
        td.textContent = col.footerValue;
        td.className = 'dmx-dt-footer-value';
      }
      tr.appendChild(td);
    });
    tfoot.appendChild(tr);
    this._tableEl.appendChild(tfoot);
  },

  _setupColumnSearch: function () {
    if (!this.props.enable_column_search || !this._tableInstance) return;

    var mode = (this.props.column_search_mode || 'simple').toLowerCase();
    var position = (this.props.column_search_position || 'header').toLowerCase();

    // Clean up any previous column search UI before building new one
    this._cleanupColumnSearchUI();

    if (mode === 'advanced') {
      if (position === 'row') {
        this._setupAdvancedSearchRow();
      } else {
        this._setupAdvancedSearchHeader();
      }
    } else {
      // simple mode
      if (position === 'row') {
        this._setupSimpleSearchRow();
      } else {
        this._setupSimpleSearchHeader();
      }
    }
  },

  _cleanupColumnSearchUI: function () {
    var thead = this._tableEl ? this._tableEl.querySelector('thead') : null;
    if (thead) {
      var existingRow = thead.querySelector('.dmx-dt-col-search-row');
      if (existingRow) existingRow.parentNode.removeChild(existingRow);
      var oldIcons = thead.querySelectorAll('.dmx-dt-filter-icon');
      oldIcons.forEach(function (el) { el.parentNode.removeChild(el); });
    }
    var oldPopups = document.querySelectorAll('.dmx-dt-filter-popup[data-dmx-dt-id="' + (this.props.id || '') + '"]');
    oldPopups.forEach(function (el) { el.parentNode.removeChild(el); });
  },

  _clearFilterUI: function () {
    // Clear inline search inputs in the search row
    var thead = this._tableEl ? this._tableEl.querySelector('thead') : null;
    if (thead) {
      var inputs = thead.querySelectorAll('.dmx-dt-col-search-row input, .dmx-dt-col-search-row select');
      inputs.forEach(function (el) {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
    }
    // Clear popup inputs
    var popups = document.querySelectorAll('.dmx-dt-filter-popup[data-dmx-dt-id="' + (this.props.id || '') + '"]');
    popups.forEach(function (popup) {
      popup.querySelectorAll('input').forEach(function (inp) { inp.value = ''; });
      popup.querySelectorAll('select').forEach(function (sel) { sel.selectedIndex = 0; });
      var val2 = popup.querySelector('.dmx-dt-num-val2');
      if (val2) val2.style.display = 'none';
    });
    // Clear global search input
    var container = this._tableEl ? this._tableEl.closest('.dt-container') : null;
    if (container) {
      var globalInput = container.querySelector('input[type="search"]');
      if (globalInput) globalInput.value = '';
    }
    // Reset all filter icon states
    if (thead) {
      thead.querySelectorAll('.dmx-dt-filter-active').forEach(function (el) {
        el.classList.remove('dmx-dt-filter-active');
      });
    }
    this._closeActivePopup();
  },

  _updateFiltersData: function () {
    if (!this._tableInstance) return;
    var globalSearch = this._tableInstance.search() || '';
    var columnSearch = {};
    var settings = this._tableInstance.settings()[0];
    if (settings && settings.aoColumns) {
      settings.aoColumns.forEach(function (col) {
        if (col.sName && col.sName !== '__actions__') {
          var searchVal = col.search ? col.search.search : '';
          if (searchVal) columnSearch[col.sName] = searchVal;
        }
      });
    }
    this.set('filters', {
      global_search: globalSearch,
      column_search: columnSearch
    });
  },

  // Syncs column search UI (row inputs or header icons) to match the current DataTables
  // column search state. Called after applying initial_column_search or applyFilters().
  _syncColumnSearchUI: function () {
    if (!this._tableInstance || !this.props.enable_column_search) return;
    var comp = this;
    var position = (this.props.column_search_position || 'header').toLowerCase();

    if (position === 'row') {
      var mode = (comp.props.column_search_mode || 'simple').toLowerCase();
      var searchRow = this._tableEl ? this._tableEl.querySelector('.dmx-dt-col-search-row') : null;
      if (!searchRow) return;
      this._tableInstance.columns().every(function () {
        var currentSearch = this.search() || '';
        var th = searchRow.children[this.index()];
        if (!th) return;
        if (mode === 'advanced') {
          var colSettings = comp._tableInstance.settings()[0].aoColumns[this.index()];
          var colField = colSettings ? (colSettings.sName || this.dataSrc()) : this.dataSrc();
          var opSel = th.querySelector('.dmx-dt-adv-row-op');
          var valInp = th.querySelector('.dmx-dt-col-search');
          if (opSel && valInp) {
            valInp.value = currentSearch;
            var savedOp = comp._colSearchOps && colField ? comp._colSearchOps[colField] : null;
            if (savedOp) opSel.value = savedOp;
          }
        } else {
          var input = th.querySelector('.dmx-dt-col-search');
          if (input && input.tagName === 'INPUT' && input.value !== currentSearch) {
            input.value = currentSearch;
          }
        }
      });
    } else {
      // Header / popup mode: update filter icon active states
      this._tableInstance.columns().every(function () {
        var currentSearch = this.search() || '';
        var headerEl = this.header();
        if (!headerEl) return;
        var iconBtn = headerEl.querySelector('.dmx-dt-filter-icon');
        if (iconBtn) comp._updateFilterIconState(iconBtn, !!currentSearch);
      });
    }
    this._updateFiltersData();
  },

  // ── Simple Column Search: Header mode (icon + popup with simple text input) ──

  _setupSimpleSearchHeader: function () {
    var comp = this;
    var api = this._tableInstance;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    api.columns().every(function () {
      var col = this;
      var headerEl = col.header();
      var colName = col.dataSrc();
      var colSettings = api.settings()[0].aoColumns[col.index()];

      if (colName === null || headerEl.textContent === 'Actions' || colSettings.bSearchable === false) {
        return;
      }

      // Wrap header text if not already wrapped
      headerEl.style.position = 'relative';
      if (!headerEl.querySelector('.dmx-dt-header-content')) {
        var titleText = headerEl.innerHTML;
        headerEl.innerHTML = '';
        var contentSpan = document.createElement('span');
        contentSpan.className = 'dmx-dt-header-content';
        contentSpan.innerHTML = titleText;
        headerEl.appendChild(contentSpan);
      }

      // Create filter icon button
      var iconBtn = document.createElement('span');
      iconBtn.className = 'dmx-dt-filter-icon';
      iconBtn.title = 'Search ' + (headerEl.querySelector('.dmx-dt-header-content').textContent || '');
      iconBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>';
      headerEl.appendChild(iconBtn);

      // Create floating popup
      var popup = document.createElement('div');
      popup.className = 'dmx-dt-filter-popup';
      popup.setAttribute('data-dmx-dt-id', comp.props.id || '');

      var popupHeader = document.createElement('div');
      popupHeader.className = 'dmx-dt-filter-popup-header';
      popupHeader.innerHTML = '<span>Search: ' + comp._escapeAttr(headerEl.querySelector('.dmx-dt-header-content').textContent || '') + '</span>';

      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'dmx-dt-filter-clear-btn';
      clearBtn.textContent = 'Clear';
      popupHeader.appendChild(clearBtn);
      popup.appendChild(popupHeader);

      var popupBody = document.createElement('div');
      popupBody.className = 'dmx-dt-filter-popup-body';

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'dmx-dt-col-search';
      input.placeholder = 'Type to search...';

      var debounceTimer;
      input.addEventListener('input', function () {
        var val = input.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          if (col.search() !== val) col.search(val).draw();
          comp._updateFilterIconState(iconBtn, !!val);
        }, 300);
      });
      input.addEventListener('click', function (e) { e.stopPropagation(); });

      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        input.value = '';
        col.search('').draw();
        comp._updateFilterIconState(iconBtn, false);
        comp._closeActivePopup();
      });

      popupBody.appendChild(input);
      popup.appendChild(popupBody);
      document.body.appendChild(popup);
      comp._applyThemeVarsToPopup(popup);

      popup.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      popup.addEventListener('click', function (e) { e.stopPropagation(); });

      iconBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (comp._activeFilterPopup === popup) {
          comp._closeActivePopup();
        } else {
          comp._openFilterPopup(popup, iconBtn);
        }
      });
    });
  },

  // ── Simple Column Search: Row mode ──

  _setupSimpleSearchRow: function () {
    var comp = this;
    var api = this._tableInstance;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    var searchRow = document.createElement('tr');
    searchRow.className = 'dmx-dt-col-search-row';

    api.columns().every(function () {
      var col = this;
      var colName = col.dataSrc();
      var colSettings = api.settings()[0].aoColumns[col.index()];
      var th = document.createElement('th');
      th.className = 'dmx-dt-col-search-cell';

      if (colName === null || col.header().textContent === 'Actions' || colSettings.bSearchable === false) {
        searchRow.appendChild(th);
        return;
      }

      var colTitle = col.header().textContent.trim();
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'dmx-dt-inline-search';
      input.placeholder = colTitle;

      var debounceTimer;
      input.addEventListener('input', function () {
        var val = input.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          if (col.search() !== val) col.search(val).draw();
        }, 300);
      });
      input.addEventListener('click', function (e) { e.stopPropagation(); });

      th.appendChild(input);
      searchRow.appendChild(th);
    });

    thead.appendChild(searchRow);
  },

  // ── Advanced Column Search: Header (popup) mode ──

  _setupAdvancedSearchHeader: function () {
    var comp = this;
    var api = this._tableInstance;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    api.columns().every(function () {
      var col = this;
      var headerEl = col.header();
      var colName = col.dataSrc();
      var colSettings = api.settings()[0].aoColumns[col.index()];

      if (colName === null || headerEl.textContent === 'Actions' || colSettings.bSearchable === false) {
        return;
      }

      // Make header a flex container for title + icon
      headerEl.style.position = 'relative';
      if (!headerEl.querySelector('.dmx-dt-header-content')) {
        var titleText = headerEl.innerHTML;
        headerEl.innerHTML = '';
        var contentSpan = document.createElement('span');
        contentSpan.className = 'dmx-dt-header-content';
        contentSpan.innerHTML = titleText;
        headerEl.appendChild(contentSpan);
      }

      // Create filter icon button
      var iconBtn = document.createElement('span');
      iconBtn.className = 'dmx-dt-filter-icon';
      iconBtn.title = 'Filter ' + (headerEl.querySelector('.dmx-dt-header-content').textContent || '');
      iconBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/></svg>';
      headerEl.appendChild(iconBtn);

      // Create floating popup
      var popup = document.createElement('div');
      popup.className = 'dmx-dt-filter-popup';
      popup.setAttribute('data-dmx-dt-id', comp.props.id || '');

      var popupHeader = document.createElement('div');
      popupHeader.className = 'dmx-dt-filter-popup-header';
      popupHeader.innerHTML = '<span>Filter: ' + comp._escapeAttr(headerEl.querySelector('.dmx-dt-header-content').textContent || '') + '</span>';

      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'dmx-dt-filter-clear-btn';
      clearBtn.textContent = 'Clear';
      popupHeader.appendChild(clearBtn);
      popup.appendChild(popupHeader);

      var popupBody = document.createElement('div');
      popupBody.className = 'dmx-dt-filter-popup-body';

      var searchType = comp._getSearchTypeForColumn(colSettings.sName || colName);

      if (searchType === 'date') {
        comp._buildDateSearchInput(col, popupBody);
      } else if (searchType === 'number') {
        comp._buildNumberSearchInput(col, popupBody);
      } else if (searchType === 'dropdown') {
        comp._buildDropdownSearchInput(col, popupBody, iconBtn, clearBtn);
      } else if (searchType === 'boolean') {
        comp._buildBooleanSearchInput(col, popupBody, iconBtn, clearBtn);
      } else {
        comp._buildTextSearchInput(col, popupBody, iconBtn, clearBtn);
      }

      // Clear button handler for date/number
      if (searchType === 'date' || searchType === 'number') {
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var inputs = popupBody.querySelectorAll('input');
          inputs.forEach(function (inp) { inp.value = ''; });
          var selects = popupBody.querySelectorAll('select');
          selects.forEach(function (sel) { sel.selectedIndex = 0; });
          // Hide "Max" field for number between
          var val2 = popupBody.querySelector('.dmx-dt-num-val2');
          if (val2) val2.style.display = 'none';
          col.search('').draw();
          comp._updateFilterIconState(iconBtn, false);
          comp._closeActivePopup();
        });
      }

      popup.appendChild(popupBody);
      document.body.appendChild(popup);
      comp._applyThemeVarsToPopup(popup);

      // Stop propagation within popup to prevent DataTables sorting
      popup.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      popup.addEventListener('click', function (e) { e.stopPropagation(); });

      // Toggle popup on icon click
      iconBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (comp._activeFilterPopup === popup) {
          comp._closeActivePopup( );
        } else {
          comp._openFilterPopup(popup, iconBtn);
        }
      });

      // Track filter state on date/number changes too
      if (searchType === 'date' || searchType === 'number') {
        var allInputs = popupBody.querySelectorAll('input');
        allInputs.forEach(function (inp) {
          var origHandler = inp.oninput;
          inp.addEventListener('input', function () {
            setTimeout(function () {
              comp._updateFilterIconState(iconBtn, !!col.search());
            }, 350);
          });
          inp.addEventListener('change', function () {
            setTimeout(function () {
              comp._updateFilterIconState(iconBtn, !!col.search());
            }, 350);
          });
        });
      }
    });
  },

  // ── Advanced Column Search: Row mode (compact: simple input + popup icon) ──

  _setupAdvancedSearchRow: function () {
    var comp = this;
    var api = this._tableInstance;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    var searchRow = document.createElement('tr');
    searchRow.className = 'dmx-dt-col-search-row';

    var operators = [
      { value: 'contains',    label: 'Contains' },
      { value: 'notContains', label: 'Not contains' },
      { value: 'equals',      label: 'Equals' },
      { value: 'startsWith',  label: 'Starts with' },
      { value: 'endsWith',    label: 'Ends with' }
    ];

    api.columns().every(function () {
      var col = this;
      var colName = col.dataSrc();
      var colSettings = api.settings()[0].aoColumns[col.index()];
      var th = document.createElement('th');
      th.className = 'dmx-dt-col-search-cell';

      if (colName === null || col.header().textContent === 'Actions' || colSettings.bSearchable === false) {
        searchRow.appendChild(th);
        return;
      }

      var colTitle = col.header().textContent.trim();

      var opSelect = document.createElement('select');
      opSelect.className = 'dmx-dt-adv-row-op';
      operators.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        opSelect.appendChild(opt);
      });

      var colField = colSettings.sName || colName;

      var valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.className = 'dmx-dt-col-search dmx-dt-inline-search';
      valInput.placeholder = colTitle;

      function applySearch() {
        var op = opSelect.value;
        var val = valInput.value.trim();
        // Track operator separately; col.search() receives the plain value so
        // the server receives it in the expected format (same as simple mode).
        if (!comp._colSearchOps) comp._colSearchOps = {};
        if (val) {
          comp._colSearchOps[colField] = op;
        } else {
          delete comp._colSearchOps[colField];
        }
        if (col.search() !== val) col.search(val).draw();
      }

      var debounceTimer;
      valInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applySearch, 300);
      });
      opSelect.addEventListener('change', function () {
        if (valInput.value.trim()) applySearch();
      });

      valInput.addEventListener('click', function (e) { e.stopPropagation(); });
      opSelect.addEventListener('click', function (e) { e.stopPropagation(); });

      var wrapper = document.createElement('div');
      wrapper.className = 'dmx-dt-adv-row-cell';
      wrapper.appendChild(opSelect);
      wrapper.appendChild(valInput);
      th.appendChild(wrapper);
      searchRow.appendChild(th);
    });

    thead.appendChild(searchRow);
  },

  _createTable: function () {
    if (!this._tableEl || typeof window.DataTable === 'undefined') {
      return;
    }

    this._destroyTable();

    var comp = this;
    var parsed = this._parseData();
    var columns = this._getColumns(parsed.rows);

    // Apply selector label rendering to columns that have static/dynamic selectors
    this._applySelectorRenders(columns);

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
      if (this.props.actions_min_width) actionsCol.minWidth = this.props.actions_min_width;
      if (this.props.actions_max_width) actionsCol.maxWidth = this.props.actions_max_width;
      if (this.props.actions_min_width || this.props.actions_max_width) {
        var _aMinW = this.props.actions_min_width || '';
        var _aMaxW = this.props.actions_max_width || '';
        actionsCol.createdCell = function (td) {
          if (_aMinW) td.style.minWidth = _aMinW;
          if (_aMaxW) td.style.maxWidth = _aMaxW;
        };
      }

      if (String(this.props.actions_column_position || 'right').toLowerCase() === 'left') {
        columns.unshift(actionsCol);
      } else {
        columns.push(actionsCol);
      }
    }

    // Checkbox select column — always prepended as the very first column
    if (this.props.enable_multi_select && this.props.checkbox_select) {
      columns.unshift({
        data: null,
        name: '__checkbox__',
        title: '<input type="checkbox" class="dmx-dt-select-all" title="Select all">',
        orderable: false,
        searchable: false,
        className: 'dmx-dt-checkbox-cell dt-nowrap',
        width: '36px',
        render: function (data, type, row) {
          if (type !== 'display') return '';
          return '<input type="checkbox" class="dmx-dt-row-checkbox">';
        }
      });
    }

    this._tableEl.className = this.props.table_class || 'table table-striped table-bordered table-hover align-middle';

    var exportButtons = this._getExportButtons(columns);

    var options = {
      columns: columns,
      searching: true,
      ordering: true,
      paging: true,
      info: true,
      pageLength: Number(this.props.page_length || this.props.page_size || 20),
      lengthMenu: this._parseLengthMenu(),
      serverSide: true,
      processing: true,
      destroy: true,
      deferRender: true,
      language: {
        lengthMenu: '_MENU_ entries per page',
        search: 'Search:',
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        infoEmpty: 'Showing 0 to 0 of 0 entries',
        infoFiltered: '(filtered from _MAX_ total entries)',
        paginate: {
          first: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 7l-5 5l5 5"/><path d="M17 7l-5 5l5 5"/></svg>',
          previous: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6l6 6"/></svg>',
          next: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg>',
          last: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l5 5l-5 5"/><path d="M13 7l5 5l-5 5"/></svg>'
        }
      }
    };

    // Merge user language overrides / locale URL (2.1)
    var _langRaw = (this.props.table_language || '').trim();
    if (_langRaw) {
      if (_langRaw.charAt(0) === '{') {
        try {
          var _langObj = JSON.parse(_langRaw);
          // Deep-merge paginate sub-object if present
          if (_langObj.paginate && typeof _langObj.paginate === 'object') {
            Object.assign(options.language.paginate, _langObj.paginate);
            delete _langObj.paginate;
          }
          Object.assign(options.language, _langObj);
        } catch (e) { /* ignore bad JSON */ }
      } else {
        // Treat as URL — let DataTables fetch and merge it
        options.language.url = _langRaw;
      }
    }

    if (!this.props.enable_global_search && !this.props.enable_column_search) {
      options.searching = false;
    }

    // Build DT2 layout for proper Bootstrap grid structure
    var layoutConfig = {
      bottomStart: 'info',
      bottomEnd: 'paging'
    };

    if (exportButtons.length) {
      layoutConfig.topStart = ['buttons', 'pageLength'];
      options.buttons = exportButtons;
    } else {
      layoutConfig.topStart = 'pageLength';
    }

    if (this.props.enable_global_search) {
      layoutConfig.topEnd = 'search';
    } else {
      layoutConfig.topEnd = null;
    }

    options.layout = layoutConfig;

    options.ajax = function (dtRequest, callback) {
      var order = (dtRequest.order || [])[0] || {};
      var orderColumn = (dtRequest.columns || [])[order.column] || {};
      var limit = Number(dtRequest.length || comp.props.page_length || comp.props.page_size || 20);
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
        var colOps = comp._colSearchOps || {};
        comp.set('params', {
          offset: parsed.offset,
          limit: parsed.limit,
          sort: orderColumn.name || '',
          dir: order.dir || 'asc',
          search: '',
          columnSearch: Object.keys(colSearch).length ? JSON.stringify(colSearch) : '',
          columnSearchOps: Object.keys(colOps).length ? JSON.stringify(colOps) : ''
        });

        comp._updateFiltersData();
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
      var colOps = comp._colSearchOps || {};
      comp.set('params', {
        offset: offset,
        limit: limit,
        sort: orderColumn.name || '',
        dir: order.dir || 'asc',
        search: (dtRequest.search || {}).value || '',
        columnSearch: Object.keys(colSearch).length ? JSON.stringify(colSearch) : '',
        columnSearchOps: Object.keys(colOps).length ? JSON.stringify(colOps) : ''
      });

      comp._updateFiltersData();
      comp.set('state', { tableReady: true, loading: true });
      comp.dispatchEvent('server_request');
    };

    // Apply saved column order before creating the table
    if (this.props.enable_column_reorder) {
      var savedOrder = this._loadColumnOrder();
      if (savedOrder && savedOrder.length === columns.length) {
        var reordered = new Array(columns.length);
        var valid = true;
        for (var i = 0; i < savedOrder.length; i++) {
          var idx = savedOrder[i];
          if (idx < 0 || idx >= columns.length || reordered[i] !== undefined) { valid = false; break; }
          reordered[i] = columns[idx];
        }
        if (valid) options.columns = reordered;
      }
    }

    // Apply saved column widths before creating the table
    if (this.props.enable_column_resize) {
      var savedWidths = this._loadColumnWidths();
      if (savedWidths && Object.keys(savedWidths).length) {
        options.columns.forEach(function (col) {
          var key = col.name || col.data;
          if (key && savedWidths[key]) {
            col.width = savedWidths[key];
          }
        });
      }
    }

    // Preset sort order on load
    var _initColSearch = {};
    if (this.props.default_sort_field) {
      var _defaultSortField = String(this.props.default_sort_field);
      var _defaultSortDir = String(this.props.default_sort_dir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
      var _defaultSortIdx = -1;
      options.columns.forEach(function (col, idx) {
        if (_defaultSortIdx === -1 && (col.name === _defaultSortField || col.data === _defaultSortField)) {
          _defaultSortIdx = idx;
        }
      });
      if (_defaultSortIdx >= 0) options.order = [[_defaultSortIdx, _defaultSortDir]];
    }

    // Preset global search on load
    if (this.props.initial_global_search) {
      options.search = { search: String(this.props.initial_global_search) };
    }

    // Preset column searches on load (JSON object keyed by field name)
    if (this.props.initial_column_search) {
      try { _initColSearch = JSON.parse(this.props.initial_column_search); } catch (e) { _initColSearch = {}; }
      if (_initColSearch && typeof _initColSearch === 'object' && Object.keys(_initColSearch).length) {
        var _searchCols = options.columns.map(function (col) {
          var name = col.name || col.data;
          return (name && _initColSearch[name] != null && _initColSearch[name] !== '') ? { search: String(_initColSearch[name]) } : null;
        });
        if (_searchCols.some(function (s) { return s !== null; })) {
          options.searchCols = _searchCols;
        }
      }
    }

    // RTL direction support
    if (this.props.enable_rtl) {
      this.$node.setAttribute('dir', 'rtl');
    } else {
      this.$node.removeAttribute('dir');
    }

    // FixedColumns support (3.3 Pin Columns Left, 3.8 Pin Actions Column)
    var _fixLeft = Number(this.props.fixed_columns_left) || 0;
    var _fixRight = (this.props.fix_actions_column &&
      this.props.enable_actions &&
      String(this.props.actions_column_position || 'right').toLowerCase() === 'right') ? 1 : 0;
    if (_fixLeft > 0 || _fixRight > 0) {
      this._loadExtension('fixedColumns');
      options.scrollX = true;
      options.fixedColumns = {};
      if (_fixLeft > 0) options.fixedColumns.left = _fixLeft;
      if (_fixRight > 0) options.fixedColumns.right = _fixRight;
    }

    // FixedHeader (1.12 Sticky Header)
    if (this.props.enable_fixed_header) {
      this._loadExtension('fixedHeader');
      var _fhOffset = Number(this.props.fixed_header_top_offset) || 0;
      options.fixedHeader = _fhOffset ? { header: true, headerOffset: _fhOffset } : true;
    }

    options.scrollX =true;

    // Responsive extension (1.11 Compact/Card View)
    if (this.props.enable_responsive) {
      this._loadExtension('responsive');
      var _detailsType = (this.props.responsive_details_type || 'inline').toLowerCase();
      options.responsive = { details: { type: _detailsType } };
    }

    // 1.13 Scroll X / Scroll Y (DataTables native scrolling)
    // enable_scroll_x activates horizontal scrolling; scroll_y sets a fixed viewport height
    // (e.g. "400px") for vertical scrolling. These are independent — either or both can be set.
    if (this.props.enable_scroll_x) {
      options.scrollX = true;
    }
    if (this.props.scroll_y && String(this.props.scroll_y).trim()) {
      options.scrollY = String(this.props.scroll_y).trim();
      options.scrollCollapse = true;
    }

    // 1.10 Animate Rows — attach a drawCallback that applies an entry animation to
    // each newly-rendered tbody row using a CSS class + keyframe defined in the stylesheet.
    if (this.props.enable_row_animate) {
      var _prevDrawCallback = options.drawCallback;
      options.drawCallback = function (settings) {
        var tbody = settings.nTBody;
        if (tbody) {
          var rows = tbody.querySelectorAll('tr');
          rows.forEach(function (tr) {
            tr.classList.remove('dmx-dt-row-entering');
            // Force reflow so the animation restarts on each draw
            void tr.offsetWidth; // eslint-disable-line no-void
            tr.classList.add('dmx-dt-row-entering');
          });
        }
        if (_prevDrawCallback) _prevDrawCallback.call(this, settings);
      };
    }

    // 1.1 Dark Mode — toggle CSS class on the dt-container wrapper
    // Done here (and not in _createTable) so it re-applies after each rebuild.
    // We defer one tick so the container exists after DataTables wraps the table.
    var _applyDarkMode = function () {
      var wrapper = comp.$node.querySelector('div.dt-container');
      if (!wrapper) wrapper = comp.$node.closest('div.dt-container');
      if (wrapper) {
        wrapper.classList.toggle('dmx-dt-dark', !!comp.props.dark_mode);
        wrapper.classList.toggle('dmx-dt-wrap-header', !!comp.props.wrap_header_text);
        wrapper.classList.toggle('dmx-dt-animate-rows', !!comp.props.enable_row_animate);
      }
    };

    // Column Groups (3.2) — inject multi-row thead before DataTable init
    if (this.props.column_groups && this.props.column_groups.length > 0) {
      this._buildGroupedHeader(options.columns, this.props.column_groups);
    }

    this._tableInstance = new DataTable(this._tableEl, options);

    // Apply dark mode / wrap-header / animate-rows CSS classes to the dt-container
    setTimeout(_applyDarkMode, 0);

    // Add data-dt-order="disable" to the checkbox column TH so DataTables never
    // attaches a sort click listener to it (belt-and-suspenders alongside orderable:false)
    if (this.props.enable_multi_select && this.props.checkbox_select) {
      var _dtCbSettings = this._tableInstance.settings()[0];
      var _dtCbCols = _dtCbSettings.aoColumns;
      for (var _ci = 0; _ci < _dtCbCols.length; _ci++) {
        if (_dtCbCols[_ci].sName === '__checkbox__') {
          var _cbThApi = this._tableInstance.column(_ci).header();
          var _cbTh = _cbThApi && _cbThApi[0] ? _cbThApi[0] : (_cbThApi && _cbThApi.nodeType ? _cbThApi : null);
          if (_cbTh) _cbTh.setAttribute('data-dt-order', 'disable');
          break;
        }
      }
    }

    // Apply min/max width inline styles to header TH cells (DataTables does not
    // read back col.minWidth / col.maxWidth from the column config itself)
    for (var _wi = 0; _wi < options.columns.length; _wi++) {
      var _wc = options.columns[_wi];
      if (_wc.minWidth || _wc.maxWidth) {
        var _thApi = this._tableInstance.column(_wi).header();
        var _thEl = _thApi && _thApi[0] ? _thApi[0] : (_thApi && _thApi.nodeType ? _thApi : null);
        if (_thEl) {
          if (_wc.minWidth) _thEl.style.minWidth = _wc.minWidth;
          if (_wc.maxWidth) _thEl.style.maxWidth = _wc.maxWidth;
        }
      }
    }

    // Add footer row after DataTables init so it aligns with the final column order
    this._setupFooter(options.columns);

    if (this.props.enable_column_reorder) {
      this._setupColumnReorder();
    }

    if (this.props.enable_column_resize) {
      this._setupColumnResize();
    }

    if (this.props.enable_row_highlight || this.props.enable_column_highlight) {
      this._setupHighlight();
    }

    this._setupColumnSearch();

    // Sync column search UI inputs to reflect any initial_column_search values
    if (Object.keys(_initColSearch).length) {
      this._syncColumnSearchUI();
    }

    this._setupInlineEditing();

    this._rowClickHandler = function (evt) {
      var tr = evt.target.closest('tr');
      if (!tr) return;

      var dtRow = comp._tableInstance.row(tr).data();
      if (!dtRow) return;

      // Create a plain object copy to ensure all properties are accessible via data binding
      var row = JSON.parse(JSON.stringify(dtRow));

      comp.set('id', row.id != null ? row.id : null);
      comp.set('data', Object.assign({}, row));
      comp.set('row', Object.assign({}, row));

      // Never toggle selection when clicking inside the actions column
      var isActionClick = !!evt.target.closest('.dmx-dt-action-wrap');

      // Multi-select handling
      if (comp.props.enable_multi_select && !isActionClick) {
        var doSelect;
        if (comp.props.checkbox_select) {
          // Checkbox-select mode: only toggle when clicking the checkbox input itself
          doSelect = evt.target.type === 'checkbox' && evt.target.classList.contains('dmx-dt-row-checkbox');
        } else {
          doSelect = true;
        }

        if (doSelect) {
          var rowIdx = comp._tableInstance.row(tr).index();
          if (typeof rowIdx !== 'undefined') {
            if (comp._selectedRowIndices.has(rowIdx)) {
              comp._selectedRowIndices.delete(rowIdx);
              tr.classList.remove('dmx-dt-row-selected');
            } else {
              comp._selectedRowIndices.add(rowIdx);
              tr.classList.add('dmx-dt-row-selected');
            }
            // Sync the row checkbox visual state
            if (comp.props.checkbox_select) {
              var chk = tr.querySelector('.dmx-dt-row-checkbox');
              if (chk) chk.checked = comp._selectedRowIndices.has(rowIdx);
            }
            comp._updateSelectedRows();
            comp._updateSelectAllState();
          }
        }
      }

      // Force Wappler reactivity to pick up nested property changes
      dmx.nextTick(function () {
        var actionButton = evt.target.closest('.dmx-dt-action-btn');
        if (actionButton) {
          var actionNum = parseInt(actionButton.getAttribute('data-dmx-action-num'), 10) || 0;
          var actionName = actionButton.getAttribute('data-dmx-action') || '';
          comp.set('action_name', actionName);
          comp.set('action_number', actionNum);
          if (actionNum >= 1 && actionNum <= 15) {
            comp.dispatchEvent('action_' + actionNum);
            console.log('Action Dispatched:', 'action_' + actionNum);
          }
          return;
        }

        comp.dispatchEvent('row_clicked');
      });
    };

    this._tableEl.addEventListener('click', this._rowClickHandler);

    // Checkbox-select mode: wire up "select all" header checkbox and draw sync
    if (this.props.enable_multi_select && this.props.checkbox_select) {
      this._selectAllHandler = function (e) {
        if (!e.target.classList.contains('dmx-dt-select-all')) return;
        var checked = e.target.checked;
        var rows = comp._tableEl.querySelectorAll('tbody tr');
        rows.forEach(function (tr) {
          var idx = comp._tableInstance.row(tr).index();
          if (typeof idx === 'undefined' || idx === null || idx < 0) return;
          var cb = tr.querySelector('.dmx-dt-row-checkbox');
          if (checked) {
            comp._selectedRowIndices.add(idx);
            tr.classList.add('dmx-dt-row-selected');
            if (cb) cb.checked = true;
          } else {
            comp._selectedRowIndices.delete(idx);
            tr.classList.remove('dmx-dt-row-selected');
            if (cb) cb.checked = false;
          }
        });
        comp._updateSelectedRows();
      };
      this._tableEl.addEventListener('click', this._selectAllHandler);

      this._tableInstance.on('draw', function () {
        comp._syncCheckboxes();
      });
    }

    this.set('count', parsed.rows.length);
    this.set('state', { tableReady: true, loading: false });
  },

  // ── Multi-Select ──

  _updateSelectedRows: function () {
    if (!this._tableInstance) {
      this.set('selected_rows', []);
      return;
    }
    var comp = this;
    var selected = [];
    this._selectedRowIndices.forEach(function (idx) {
      try {
        var data = comp._tableInstance.row(idx).data();
        if (data) selected.push(JSON.parse(JSON.stringify(data)));
      } catch (e) { }
    });
    this.set('selected_rows', selected);
    this.dispatchEvent('selection_changed');
  },

  _updateSelectAllState: function () {
    if (!this._tableEl) return;
    var comp = this;
    var selectAllChk = this._tableEl.querySelector('.dmx-dt-select-all');
    if (!selectAllChk) return;
    var rows = this._tableEl.querySelectorAll('tbody tr');
    var total = rows.length;
    var selected = 0;
    rows.forEach(function (tr) {
      var idx = comp._tableInstance ? comp._tableInstance.row(tr).index() : -1;
      if (comp._selectedRowIndices.has(idx)) selected++;
    });
    selectAllChk.checked = total > 0 && selected === total;
    selectAllChk.indeterminate = selected > 0 && selected < total;
  },

  _syncCheckboxes: function () {
    if (!this._tableEl || !this._tableInstance) return;
    var comp = this;
    var rows = this._tableEl.querySelectorAll('tbody tr');
    rows.forEach(function (tr) {
      var idx = comp._tableInstance.row(tr).index();
      var chk = tr.querySelector('.dmx-dt-row-checkbox');
      var isSelected = comp._selectedRowIndices.has(idx);
      if (chk) chk.checked = isSelected;
      if (isSelected) {
        tr.classList.add('dmx-dt-row-selected');
      } else {
        tr.classList.remove('dmx-dt-row-selected');
      }
    });
    comp._updateSelectAllState();
  },

  // ── Column Reorder ──

  _getReorderStorageKey: function () {
    var page = window.location.pathname;
    var id = this.props.id || 'default';
    return 'dmx-dt-col-order::' + page + '::' + id;
  },

  _saveColumnOrder: function (order) {
    try {
      localStorage.setItem(this._getReorderStorageKey(), JSON.stringify(order));
    } catch (e) { }
  },

  _loadColumnOrder: function () {
    try {
      var raw = localStorage.getItem(this._getReorderStorageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
  },

  _setupColumnReorder: function () {
    if (!this._tableInstance) return;

    var comp = this;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    var headerRow = thead.querySelector('tr');
    if (!headerRow) return;

    var dragSrcIndex = null;
    var dragGhost = null;
    var placeholder = null;
    var headerCells = null;

    function getHeaderCells() {
      return Array.prototype.slice.call(headerRow.querySelectorAll('th'));
    }

    function onDragStart(e) {
      var th = e.target.closest('th');
      if (!th || !headerRow.contains(th)) return;
      // Don't drag from filter icons or interactive elements
      if (e.target.closest('.dmx-dt-filter-icon')) return;

      headerCells = getHeaderCells();
      dragSrcIndex = headerCells.indexOf(th);
      if (dragSrcIndex === -1) return;

      th.classList.add('dmx-dt-reorder-dragging');

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(dragSrcIndex));

      // Create a minimal drag ghost
      dragGhost = document.createElement('div');
      dragGhost.className = 'dmx-dt-reorder-ghost';
      dragGhost.textContent = (th.querySelector('.dmx-dt-header-content') || th).textContent;
      document.body.appendChild(dragGhost);
      e.dataTransfer.setDragImage(dragGhost, 40, 16);
    }

    function onDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      var th = e.target.closest('th');
      if (!th || !headerRow.contains(th)) return;

      // Remove previous indicators
      headerCells.forEach(function (cell) {
        cell.classList.remove('dmx-dt-reorder-left', 'dmx-dt-reorder-right');
      });

      var targetIndex = headerCells.indexOf(th);
      if (targetIndex === -1 || targetIndex === dragSrcIndex) return;

      // Show drop indicator on the correct side
      if (targetIndex < dragSrcIndex) {
        th.classList.add('dmx-dt-reorder-left');
      } else {
        th.classList.add('dmx-dt-reorder-right');
      }
    }

    function onDragLeave(e) {
      var th = e.target.closest('th');
      if (th) {
        th.classList.remove('dmx-dt-reorder-left', 'dmx-dt-reorder-right');
      }
    }

    function onDrop(e) {
      e.preventDefault();
      var th = e.target.closest('th');
      if (!th || !headerRow.contains(th)) return;

      var targetIndex = headerCells.indexOf(th);
      if (targetIndex === -1 || targetIndex === dragSrcIndex || dragSrcIndex === null) return;

      // Reorder via DataTables: swap column positions
      comp._reorderColumns(dragSrcIndex, targetIndex);
    }

    function onDragEnd(e) {
      // Clean up all drag state
      if (headerCells) {
        headerCells.forEach(function (cell) {
          cell.classList.remove('dmx-dt-reorder-dragging', 'dmx-dt-reorder-left', 'dmx-dt-reorder-right');
        });
      }
      if (dragGhost && dragGhost.parentNode) {
        dragGhost.parentNode.removeChild(dragGhost);
      }
      dragGhost = null;
      dragSrcIndex = null;
      headerCells = null;
    }

    // Make header cells draggable — respect orderable:false (bSortable) from DataTables config
    var _dtCols = comp._tableInstance ? comp._tableInstance.settings()[0].aoColumns : [];
    getHeaderCells().forEach(function (th, i) {
      if (_dtCols[i] && _dtCols[i].bSortable === false) return;
      th.setAttribute('draggable', 'true');
      th.style.cursor = 'grab';
    });

    headerRow.addEventListener('dragstart', onDragStart);
    headerRow.addEventListener('dragover', onDragOver);
    headerRow.addEventListener('dragleave', onDragLeave);
    headerRow.addEventListener('drop', onDrop);
    headerRow.addEventListener('dragend', onDragEnd);

    // Store cleanup function
    this._reorderCleanup = function () {
      headerRow.removeEventListener('dragstart', onDragStart);
      headerRow.removeEventListener('dragover', onDragOver);
      headerRow.removeEventListener('dragleave', onDragLeave);
      headerRow.removeEventListener('drop', onDrop);
      headerRow.removeEventListener('dragend', onDragEnd);
      getHeaderCells().forEach(function (th) {
        th.removeAttribute('draggable');
        th.style.cursor = '';
      });
    };
  },

  _reorderColumns: function (fromIndex, toIndex) {
    if (!this._tableInstance) return;

    var api = this._tableInstance;
    var colCount = api.columns()[0].length;

    // Build the new order array
    var order = [];
    for (var i = 0; i < colCount; i++) order.push(i);

    // Move fromIndex to toIndex
    var moved = order.splice(fromIndex, 1)[0];
    order.splice(toIndex, 0, moved);

    // Save order to localStorage
    this._saveColumnOrder(order);

    // Rebuild the table with new column order
    this._createTable();
  },

  // ── Column Resize ──

  _getResizeStorageKey: function () {
    var page = window.location.pathname;
    var id = this.props.id || 'default';
    return 'dmx-dt-col-widths::' + page + '::' + id;
  },

  _saveColumnWidths: function (widths) {
    try {
      localStorage.setItem(this._getResizeStorageKey(), JSON.stringify(widths));
    } catch (e) { }
  },

  _loadColumnWidths: function () {
    try {
      var raw = localStorage.getItem(this._getResizeStorageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
  },

  _setupColumnResize: function () {
    if (!this._tableInstance || !this._tableEl) return;

    var comp = this;
    var thead = this._tableEl.querySelector('thead');
    if (!thead) return;

    var headerRow = thead.querySelector('tr');
    if (!headerRow) return;

    var handles = [];
    var isResizing = false;
    var currentTh = null;
    var startX = 0;
    var startWidth = 0;

    function getHeaderCells() {
      return Array.prototype.slice.call(headerRow.querySelectorAll('th'));
    }

    function createHandle(th) {
      var handle = document.createElement('div');
      handle.className = 'dmx-dt-resize-handle';
      th.style.position = 'relative';
      th.appendChild(handle);
      handles.push(handle);

      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        currentTh = th;
        startX = e.pageX;
        startWidth = th.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        th.classList.add('dmx-dt-resizing');
      });
    }

    function onMouseMove(e) {
      if (!isResizing || !currentTh) return;
      var diff = e.pageX - startX;
      var newWidth = Math.max(30, startWidth + diff);
      currentTh.style.width = newWidth + 'px';
      currentTh.style.minWidth = newWidth + 'px';
    }

    function onMouseUp() {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (currentTh) {
        currentTh.classList.remove('dmx-dt-resizing');
      }
      currentTh = null;

      // Save all column widths to localStorage
      var widths = {};
      var cells = getHeaderCells();
      var dtColumns = comp._tableInstance.settings()[0].aoColumns;
      cells.forEach(function (th, i) {
        if (dtColumns[i]) {
          var key = dtColumns[i].sName || dtColumns[i].data || ('col_' + i);
          widths[key] = th.style.width || (th.offsetWidth + 'px');
        }
      });
      comp._saveColumnWidths(widths);
    }

    // Create resize handles on all header cells — skip checkbox and actions columns
    var _dtResizeCols = comp._tableInstance ? comp._tableInstance.settings()[0].aoColumns : [];
    getHeaderCells().forEach(function (th, i) {
      var colName = _dtResizeCols[i] && _dtResizeCols[i].sName;
      if (colName === '__checkbox__' || colName === '__actions__') return;
      createHandle(th);
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    this._resizeCleanup = function () {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      handles.forEach(function (h) {
        if (h.parentNode) h.parentNode.removeChild(h);
      });
      handles = [];
    };
  },

  // ── Row & Column Highlight ──

  _setupHighlight: function () {
    if (!this._tableInstance || !this._tableEl) return;

    var comp = this;
    var table = this._tableInstance;
    var enableRow = this.props.enable_row_highlight;
    var enableCol = this.props.enable_column_highlight;

    function onMouseEnter(e) {
      var td = e.target.closest('td');
      if (!td) return;

      if (enableRow) {
        var tr = td.closest('tr');
        if (tr) tr.classList.add('dmx-dt-row-highlight');
      }

      if (enableCol) {
        try {
          var cellIndex = table.cell(td).index();
          if (cellIndex) {
            table.column(cellIndex.column).nodes().each(function (el) {
              el.classList.add('dmx-dt-col-highlight');
            });
          }
        } catch (ex) { }
      }
    }

    function onMouseLeave(e) {
      var td = e.target.closest('td');
      if (!td) return;

      if (enableRow) {
        var tr = td.closest('tr');
        if (tr) tr.classList.remove('dmx-dt-row-highlight');
      }

      if (enableCol) {
        try {
          var cellIndex = table.cell(td).index();
          if (cellIndex) {
            table.column(cellIndex.column).nodes().each(function (el) {
              el.classList.remove('dmx-dt-col-highlight');
            });
          }
        } catch (ex) { }
      }
    }

    var tbody = this._tableEl.querySelector('tbody');
    if (!tbody) return;

    tbody.addEventListener('mouseenter', onMouseEnter, true);
    tbody.addEventListener('mouseleave', onMouseLeave, true);

    this._highlightCleanup = function () {
      tbody.removeEventListener('mouseenter', onMouseEnter, true);
      tbody.removeEventListener('mouseleave', onMouseLeave, true);
    };
  },

  // ── Export Column Exclusion ──

  _getExportColumnOptions: function () {
    var raw = this.props.export_exclude_fields;
    if (!raw || typeof raw !== 'string' || !raw.trim()) return null;

    var excludeFields = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!excludeFields.length) return null;

    // Build set for quick lookup
    var excludeSet = {};
    excludeFields.forEach(function (f) { excludeSet[f] = true; });

    // We return the excludeSet; actual index resolution happens in _createTable
    // after columns are finalized
    return excludeSet;
  },

  // ── Inline Editing ──

  _isFieldEditable: function (fieldName) {
    if (!fieldName || fieldName === '__actions__') return false;
    if (this.props.editable_cells) return true;
    if (this.props.editable_fields) {
      var fields = this.props.editable_fields.split(',').map(function (f) { return f.trim(); }).filter(Boolean);
      return fields.indexOf(fieldName) !== -1;
    }
    return false;
  },

  // Normalizes options input to a plain JS object.
  // Handles: Wappler reactive proxies (Object.keys extraction), already-evaluated
  // plain objects, valid JSON strings, JS object literals with unquoted/integer keys,
  // and Wappler {{...}} bracket-wrapped strings.
  _normalizeOptions: function (opts) {
    if (opts == null) return null;

    var result = null;

    if (typeof opts === 'object') {
      // Primary: Object.keys + direct access — works on reactive proxies where
      // JSON.stringify may silently produce '{}' due to non-enumerable properties.
      try {
        result = {};
        var keys = Object.keys(opts);
        for (var i = 0; i < keys.length; i++) {
          result[keys[i]] = opts[keys[i]];
        }
      } catch (e) { result = null; }

      // Fallback: JSON round-trip
      if (!result || Object.keys(result).length === 0) {
        try {
          var j = JSON.stringify(opts);
          if (j && j !== '{}' && j !== 'null') result = JSON.parse(j);
          else result = null;
        } catch (e) { result = null; }
      }
    } else if (typeof opts === 'string') {
      var str = opts.trim();
      // Strip Wappler bracket template markers: {{expr}} → expr
      if (str.substring(0, 2) === '{{' && str.slice(-2) === '}}') {
        str = str.slice(2, -2).trim();
      }
      if (!str || str.charAt(0) !== '{') return null;
      // Try valid JSON first
      try { result = JSON.parse(str); } catch (e) {}
      // Handle JS object literal syntax: quote unquoted/integer keys ({1:"L"} → {"1":"L"})
      if (!result) {
        try {
          var norm = str.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
          result = JSON.parse(norm);
        } catch (e) {}
      }
    }

    if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
    if (Object.keys(result).length === 0) return null;
    return result;
  },

  _getStaticSelectorMap: function () {
    var map = {};
    var self = this;
    var selectors = Array.isArray(this.props.static_selectors) ? this.props.static_selectors : [];
    selectors.forEach(function (s) {
      if (s && s.field && s.options) {
        var parsed = self._normalizeOptions(s.options);
        if (parsed) map[s.field] = parsed;
      }
    });
    return map;
  },

  _getDynamicSelectorMap: function () {
    var map = {};
    var self = this;
    var selectors = Array.isArray(this.props.dynamic_selectors) ? this.props.dynamic_selectors : [];
    selectors.forEach(function (s) {
      if (s && s.field && s.options_field) {
        var optField = s.options_field;
        if (typeof optField === 'object' && optField !== null) {
          // Already an evaluated options object — normalize and store directly
          var parsed = self._normalizeOptions(optField);
          if (parsed) map[s.field] = parsed;
        } else if (typeof optField === 'string') {
          var str = optField.trim();
          if (str.charAt(0) === '{') {
            // Looks like an options literal string — parse and store directly
            var parsed = self._normalizeOptions(str);
            if (parsed) map[s.field] = parsed;
          } else {
            // Plain field name — store as string for row-data lookup
            map[s.field] = str;
          }
        }
      }
    });
    return map;
  },

  _applySelectorRenders: function (columns) {
    if (!this.props.enable_selector_editors) return;
    var staticMap = this._getStaticSelectorMap();
    var dynamicMap = this._getDynamicSelectorMap();

    columns.forEach(function (col) {
      var fieldName = col.data;
      if (!fieldName) return;

      var hasStatic = staticMap[fieldName];
      var hasDynamic = dynamicMap[fieldName];
      if (!hasStatic && !hasDynamic) return;

      var origRender = col.render;

      if (hasStatic) {
        var opts = staticMap[fieldName];
        col.render = function (data, type, row, meta) {
          if (type === 'display' || type === 'print') {
            var key = data != null ? String(data) : '';
            if (opts[key] != null) return opts[key];
          }
          if (origRender) return origRender(data, type, row, meta);
          return data;
        };
      } else if (hasDynamic) {
        var optionsField = dynamicMap[fieldName];
        col.render = function (data, type, row, meta) {
          if (type === 'display' || type === 'print') {
            // optionsField is either a pre-normalized options object or a row field name string
            var dynOpts = (typeof optionsField === 'object' && optionsField !== null)
              ? optionsField
              : row[optionsField];
            if (dynOpts) {
              try {
                var parsed;
                if (typeof dynOpts === 'string') {
                  try { parsed = JSON.parse(dynOpts); } catch (e) {
                    var norm = dynOpts.trim().replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
                    parsed = JSON.parse(norm);
                  }
                } else {
                  parsed = dynOpts;
                }
                var key = data != null ? String(data) : '';
                if (parsed[key] != null) return parsed[key];
              } catch (e) { /* skip */ }
            }
          }
          if (origRender) return origRender(data, type, row, meta);
          return data;
        };
      }
    });
  },

  _setupInlineEditing: function () {
    if (!this._tableEl || !this._tableInstance) return;
    if (!this.props.editable_cells && !this.props.editable_fields && !this.props.editable_rows) return;

    var comp = this;

    this._editDblClickHandler = function (evt) {
      var td = evt.target.closest('td');
      if (!td) return;
      // Don't edit if clicking inside an already active editor
      if (td.querySelector('.dmx-dt-edit-input, .dmx-dt-edit-select')) return;

      var tr = td.closest('tr');
      if (!tr) return;

      var dtRow = comp._tableInstance.row(tr);
      if (!dtRow || !dtRow.data()) return;

      var rowData = dtRow.data();
      var cellIndex = comp._tableInstance.cell(td).index();
      if (!cellIndex) return;

      var colSettings = comp._tableInstance.settings()[0].aoColumns[cellIndex.column];
      var fieldName = colSettings.mData || colSettings.sName || '';

      if (comp.props.editable_rows) {
        // Edit all editable cells in the row
        comp._editRow(tr, dtRow, rowData);
      } else {
        // Edit single cell
        if (!comp._isFieldEditable(fieldName)) return;
        comp._editCell(td, dtRow, rowData, fieldName, cellIndex);
      }
    };

    this._tableEl.addEventListener('dblclick', this._editDblClickHandler);
  },

  _editRow: function (tr, dtRow, rowData) {
    var comp = this;
    var cells = tr.querySelectorAll('td');

    cells.forEach(function (td) {
      // Skip if already has an editor
      if (td.querySelector('.dmx-dt-edit-input, .dmx-dt-edit-select')) return;

      var cellIndex = comp._tableInstance.cell(td).index();
      if (!cellIndex) return;

      var colSettings = comp._tableInstance.settings()[0].aoColumns[cellIndex.column];
      var fieldName = colSettings.mData || colSettings.sName || '';

      if (!fieldName || fieldName === '__actions__') return;

      // In editable_rows mode, check editable_fields filter if set
      if (comp.props.editable_fields) {
        var fields = comp.props.editable_fields.split(',').map(function (f) { return f.trim(); }).filter(Boolean);
        if (fields.length && fields.indexOf(fieldName) === -1) return;
      }

      comp._editCell(td, dtRow, rowData, fieldName, cellIndex, true);
    });
  },

  _editCell: function (td, dtRow, rowData, fieldName, cellIndex, rowEditMode) {
    var comp = this;
    var currentValue = rowData[fieldName];
    var oldValue = currentValue != null ? String(currentValue) : '';

    // Check if this field has a selector editor
    var selectorOptions = null;
    if (comp.props.enable_selector_editors) {
      // Check static selectors first
      var staticMap = comp._getStaticSelectorMap();
      if (staticMap[fieldName]) {
        // Re-normalize at edit time in case the prop resolved after table build
        selectorOptions = comp._normalizeOptions(staticMap[fieldName]) || staticMap[fieldName];
      }

      // Check dynamic selectors — value is either a pre-normalized options object or a row field name string
      if (!selectorOptions) {
        var dynamicMap = comp._getDynamicSelectorMap();
        if (dynamicMap[fieldName]) {
          var optionsFieldValue = dynamicMap[fieldName];
          var dynamicOpts = (typeof optionsFieldValue === 'object' && optionsFieldValue !== null)
            ? optionsFieldValue
            : rowData[optionsFieldValue];
          selectorOptions = comp._normalizeOptions(dynamicOpts);
        }
      }
    }

    // Store original content for reverting
    var originalHTML = td.innerHTML;
    var tr = td.closest('tr');

    if (selectorOptions) {
      comp._createSelectEditor(td, dtRow, rowData, fieldName, oldValue, selectorOptions, originalHTML, rowEditMode, tr);
    } else {
      comp._createInputEditor(td, dtRow, rowData, fieldName, oldValue, originalHTML, rowEditMode, tr);
    }
  },

  _createInputEditor: function (td, dtRow, rowData, fieldName, oldValue, originalHTML, rowEditMode, tr) {
    var comp = this;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'dmx-dt-edit-input';
    input.value = oldValue;

    td.innerHTML = '';
    td.appendChild(input);

    if (!rowEditMode) {
      input.focus();
      input.select();
    }

    var committed = false;

    function commit() {
      if (committed) return;
      committed = true;
      var newValue = input.value;
      comp._commitEdit(td, dtRow, rowData, fieldName, oldValue, newValue, originalHTML, rowEditMode);
    }

    function cancel() {
      if (committed) return;
      committed = true;
      td.innerHTML = originalHTML;
    }

    input.addEventListener('blur', function () {
      setTimeout(function () {
        // In row-edit mode, don't commit if focus moved to another cell in the same row
        if (rowEditMode && tr && tr.contains(document.activeElement)) return;
        commit();
      }, 100);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    // Prevent row click from firing when editing
    input.addEventListener('click', function (e) { e.stopPropagation(); });
  },

  _createSelectEditor: function (td, dtRow, rowData, fieldName, oldValue, options, originalHTML, rowEditMode, tr) {
    var comp = this;
    var select = document.createElement('select');
    select.className = 'dmx-dt-edit-select';

    // Add empty option
    var emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '-- Select --';
    select.appendChild(emptyOpt);

    // options is an object like {"1": "Angie", "2": "Radar"}
    Object.keys(options).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = options[key];
      if (key === oldValue) opt.selected = true;
      select.appendChild(opt);
    });

    td.innerHTML = '';
    td.appendChild(select);

    if (!rowEditMode) {
      select.focus();
    }

    var committed = false;

    function commit() {
      if (committed) return;
      committed = true;
      var newValue = select.value;
      var displayText = select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : newValue;
      comp._commitEdit(td, dtRow, rowData, fieldName, oldValue, newValue, originalHTML, rowEditMode, displayText);
    }

    function cancel() {
      if (committed) return;
      committed = true;
      td.innerHTML = originalHTML;
    }

    select.addEventListener('change', function () {
      commit();
    });

    select.addEventListener('blur', function () {
      setTimeout(function () {
        if (rowEditMode && tr && tr.contains(document.activeElement)) return;
        commit();
      }, 100);
    });

    select.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    select.addEventListener('click', function (e) { e.stopPropagation(); });
  },

  _commitEdit: function (td, dtRow, rowData, fieldName, oldValue, newValue, originalHTML, rowEditMode, displayText) {
    if (newValue === oldValue) {
      // No change — restore original
      td.innerHTML = originalHTML;
      return;
    }

    // Update the row data in-place
    rowData[fieldName] = newValue;

    if (rowEditMode) {
      // In row-edit mode, update just the cell display without re-rendering the entire row
      td.textContent = displayText || newValue;
    } else {
      // Single cell mode: use DataTables API to update and re-render
      dtRow.data(Object.assign({}, rowData));
    }

    // Expose edited cell data
    this.set('edited_cell', {
      field: fieldName,
      old_value: oldValue,
      new_value: newValue,
      row_data: JSON.parse(JSON.stringify(rowData))
    });

    // Also update data/row for easy access
    this.set('data', Object.assign({}, rowData));
    this.set('row', Object.assign({}, rowData));

    this.dispatchEvent('cell_edited');
  }
});
