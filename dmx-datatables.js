dmx.Component("datatable", {
  initialData: {
    id: null,
    data: {},
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
      type: Array, default: [
        { "field": "id", "header": "ID", "name": "", "default_content": "" },
        { "field": "name", "header": "Name", "name": "", "default_content": "" }
      ]
    },
    enable_actions: { type: Boolean, default: false },
    actions_column_position: { type: String, default: 'right' },
    action_btns: { type: Array, default: [] },
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
    row_action_edit: Event,
    row_action_view: Event,
    row_action_delete: Event,
    row_action_custom: Event
  },

  init: function () {
    this._tableInstance = null;
    this._tableEl = null;
    this._pendingCallback = null;
    this._pendingDraw = 1;
    this._rowClickHandler = null;
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
      updatedProps.has('enable_actions') ||
      updatedProps.has('actions_column_position') ||
      updatedProps.has('action_btns') ||
      updatedProps.has('export_options') ||
      updatedProps.has('table_class') ||
      updatedProps.has('page_size')
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

    if (updatedProps.has('data') && this._tableInstance && this._pendingCallback) {
      var currentState = this.get('serverState') || {};

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

      this.set('state', { tableReady: true, loading: false });
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

  _getColumns: function (rows) {
    var headers = Array.isArray(this.props.fields_header) ? this.props.fields_header : [];
    var cols = [];

    if (headers.length) {
      headers.forEach(function (h) {
        if (!h || !h.field) return;
        cols.push({
          data: h.field,
          name: h.name || h.field,
          title: h.header || h.field,
          defaultContent: h.default_content || ''
        });
      });
      return cols;
    }

    if (!rows.length) return cols;

    Object.keys(rows[0]).forEach(function (key) {
      cols.push({ data: key, name: key, title: key, defaultContent: '' });
    });

    return cols;
  },

  _getActionHtml: function (row) {
    var buttons = [];
    var defs = Array.isArray(this.props.action_btns) ? this.props.action_btns : [];

    defs.forEach(function (btn, i) {
      if (!btn || btn.enabled === false || btn.enabled === 'false') return;
      var name = btn.name || ('custom_' + (i + 1));
      var icon = btn.icon_class ? '<i class="' + btn.icon_class + '"></i>' : '';
      var title = btn.title ? '<span>' + btn.title + '</span>' : '';
      var cls = btn.btn_class || 'btn btn-sm btn-secondary';
      var tooltip = btn.tooltip || name;

      buttons.push(
        '<button type="button" class="' + cls + ' dmx-dt-action-btn" data-dmx-action="' + name + '" title="' + tooltip + '">' +
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

  _dispatchActionEvent: function (actionName) {
    var action = String(actionName || '').toLowerCase();
    if (action === 'edit') {
      this.dispatchEvent('row_action_edit');
      return;
    }
    if (action === 'view') {
      this.dispatchEvent('row_action_view');
      return;
    }
    if (action === 'delete') {
      this.dispatchEvent('row_action_delete');
      return;
    }
    this.dispatchEvent('row_action_custom');
  },

  _createTable: function () {
    if (!this._tableEl || typeof window.DataTable === 'undefined') {
      return;
    }

    this._destroyTable();

    var comp = this;
    var parsed = this._parseData();
    var columns = this._getColumns(parsed.rows);

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

      comp.set('state', { tableReady: true, loading: true });
      comp.dispatchEvent('server_request');
    };

    this._tableInstance = new DataTable(this._tableEl, options);

    this._rowClickHandler = function (evt) {
      var tr = evt.target.closest('tr');
      if (!tr) return;

      var row = comp._tableInstance.row(tr).data();
      if (!row) return;

      comp.set('id', row.id != null ? row.id : null);
      comp.set('data', row);

      var actionButton = evt.target.closest('.dmx-dt-action-btn');
      if (actionButton) {
        comp._dispatchActionEvent(actionButton.getAttribute('data-dmx-action'));
        return;
      }

      comp.dispatchEvent('row_clicked');
    };

    this._tableEl.addEventListener('click', this._rowClickHandler);

    this.set('count', parsed.rows.length);
    this.set('state', { tableReady: true, loading: false });
  }
});
