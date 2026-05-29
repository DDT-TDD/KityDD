(function () {
    const { ipcRenderer } = require('electron');

    // ---------------------------------------------------------
    // 0. FIX KITYCHART OVERWRITE BUG
    // kitychart.all.js overwrites kity.Pie but forgets setAngle method
    // used by ProgressRenderer in kityminder-core
    // ---------------------------------------------------------
    if (window.kity && kity.Pie && !kity.Pie.prototype.setAngle) {
        kity.Pie.prototype.setAngle = function (angle) {
            this.pieAngle = angle;
            this.draw();
            return this;
        };
    }

    // ---------------------------------------------------------
    // 1. CUSTOM TEMPLATES & THEMES
    // Registered before Angular bootstrap so pickers reflect them immediately.
    // ---------------------------------------------------------
    (function () {
        // Template: left-only tree
        kityminder.Minder.getTemplateList()['left'] = {
            getLayout: function (node) { return 'left'; },
            getConnect: function (node) { return node.getLevel() <= 1 ? 'arc' : 'bezier'; }
        };

        // Template: logical horizontal diagram (right layout + poly connectors)
        kityminder.Minder.getTemplateList()['logical'] = {
            getLayout: function (node) { return 'right'; },
            getConnect: function (node) { return 'poly'; }
        };

        kityminder.Minder.getTemplateList()['bottom-tree'] = {
            getLayout: function (node) { return 'bottom'; },
            getConnect: function (node) { return 'bezier'; }
        };

        kityminder.Minder.getTemplateList()['top-tree'] = {
            getLayout: function (node) { return 'top'; },
            getConnect: function (node) { return 'bezier'; }
        };

        function applyNodeLayoutInterceptor() {
            const templateList = kityminder.Minder.getTemplateList();
            for (let name in templateList) {
                let template = templateList[name];
                if (template && template.getLayout) {
                    let originalGetLayout = template.getLayout;
                    template.getLayout = function (node) {
                        let p = node;
                        while (p) {
                            let customLayout = p.getData('layout');
                            if (customLayout) {
                                return customLayout;
                            }
                            p = p.parent;
                        }
                        return originalGetLayout.call(this, node);
                    };
                }
            }
        }

        function applyNodeConnectInterceptor() {
            const templateList = kityminder.Minder.getTemplateList();
            for (let name in templateList) {
                let template = templateList[name];
                if (template && template.getConnect) {
                    let originalGetConnect = template.getConnect;
                    template.getConnect = function (node) {
                        if (node.getData('isIsolated')) {
                            return 'none';
                        }
                        // Traverse up to inherit custom connect style from parent/ancestors
                        let p = node;
                        while (p) {
                            let customConnect = p.getData('connect');
                            if (customConnect !== undefined && customConnect !== null) {
                                // Sibling children should not inherit 'none' connection style from an isolated parent
                                if (p === node || customConnect !== 'none') {
                                    return customConnect;
                                }
                            }
                            p = p.parent;
                        }
                        return originalGetConnect.call(this, node);
                    };
                }
            }
        }

        applyNodeLayoutInterceptor();
        applyNodeConnectInterceptor();

        var themes = kityminder.Minder.getThemeList();

        themes['dark'] = {
            'background': '#1e1e2e',
            'root-color': '#cdd6f4', 'root-background': '#45475a', 'root-stroke': '#585b70',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.5)',
            'main-color': '#cdd6f4', 'main-background': '#313244', 'main-stroke': '#45475a',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.4)',
            'sub-color': '#cdd6f4', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#585b70', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#f38ba8', 'selected-stroke': '#f38ba8', 'selected-color': '#1e1e2e',
            'marquee-background': 'rgba(203,166,247,0.2)', 'marquee-stroke': '#cba6f7',
            'drop-hint-color': '#a6e3a1', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(166,227,161,0.4)', 'order-hint-path-color': '#a6e3a1', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(137,180,250)', 'line-height': 1.5
        };
        themes['dark-compact'] = Object.assign({}, themes['dark'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
        themes['ocean'] = {
            'background': '#0a1628',
            'root-color': '#e0f2fe', 'root-background': '#0369a1', 'root-stroke': '#0284c7',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.6)',
            'main-color': '#e0f2fe', 'main-background': '#164e63', 'main-stroke': '#155e75',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.4)',
            'sub-color': '#bae6fd', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#0369a1', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#06b6d4', 'selected-stroke': '#06b6d4', 'selected-color': '#0a1628',
            'marquee-background': 'rgba(6,182,212,0.15)', 'marquee-stroke': '#06b6d4',
            'drop-hint-color': '#22d3ee', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(34,211,238,0.3)', 'order-hint-path-color': '#22d3ee', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(56,189,248)', 'line-height': 1.5
        };
        themes['ocean-compact'] = Object.assign({}, themes['ocean'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
        themes['monochrome'] = {
            'background': '#ffffff',
            'root-color': '#ffffff', 'root-background': '#1a1a1a', 'root-stroke': '#1a1a1a',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.15)',
            'main-color': '#1a1a1a', 'main-background': '#e5e5e5', 'main-stroke': '#cccccc',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.1)',
            'sub-color': '#333333', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#999999', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#1a1a1a', 'selected-stroke': '#1a1a1a', 'selected-color': '#ffffff',
            'marquee-background': 'rgba(0,0,0,0.1)', 'marquee-stroke': '#666666',
            'drop-hint-color': '#333333', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(0,0,0,0.2)', 'order-hint-path-color': '#333333', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(100,100,100)', 'line-height': 1.5
        };
        themes['monochrome-compact'] = Object.assign({}, themes['monochrome'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
        themes['forest'] = {
            'background': '#f0f7ee',
            'root-color': '#ffffff', 'root-background': '#2d6a2d', 'root-stroke': '#1e4d1e',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,80,0,0.3)',
            'main-color': '#1a3c1a', 'main-background': '#a8d5a2', 'main-stroke': '#6aa96a',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,60,0,0.15)',
            'sub-color': '#2d4a2d', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#4a7c4a', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#f59b0e', 'selected-stroke': '#d97706', 'selected-color': '#ffffff',
            'marquee-background': 'rgba(106,169,106,0.2)', 'marquee-stroke': '#6aa96a',
            'drop-hint-color': '#2d6a2d', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(45,106,45,0.3)', 'order-hint-path-color': '#2d6a2d', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(74,124,74)', 'line-height': 1.5
        };
        themes['forest-compact'] = Object.assign({}, themes['forest'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
        themes['sunrise'] = {
            'background': '#fffbf0',
            'root-color': '#ffffff', 'root-background': '#c2440e', 'root-stroke': '#a33a0a',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(160,60,0,0.3)',
            'main-color': '#7c2d12', 'main-background': '#fed7aa', 'main-stroke': '#fb923c',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(200,80,0,0.15)',
            'sub-color': '#92400e', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#ea580c', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#7c3aed', 'selected-stroke': '#6d28d9', 'selected-color': '#ffffff',
            'marquee-background': 'rgba(234,88,12,0.15)', 'marquee-stroke': '#ea580c',
            'drop-hint-color': '#c2440e', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(194,68,14,0.3)', 'order-hint-path-color': '#c2440e', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(234,88,12)', 'line-height': 1.5
        };
        themes['sunrise-compact'] = Object.assign({}, themes['sunrise'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
        themes['rose'] = {
            'background': '#fff0f5',
            'root-color': '#ffffff', 'root-background': '#be185d', 'root-stroke': '#9d174d',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(190,24,93,0.3)',
            'main-color': '#831843', 'main-background': '#fbcfe8', 'main-stroke': '#f9a8d4',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(190,24,93,0.15)',
            'sub-color': '#9d174d', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#ec4899', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#1e40af', 'selected-stroke': '#1d4ed8', 'selected-color': '#ffffff',
            'marquee-background': 'rgba(236,72,153,0.15)', 'marquee-stroke': '#ec4899',
            'drop-hint-color': '#be185d', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(190,24,93,0.3)', 'order-hint-path-color': '#be185d', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(236,72,153)', 'line-height': 1.5
        };
        themes['rose-compact'] = Object.assign({}, themes['rose'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
        themes['solarized'] = {
            'background': '#fdf6e3',
            'root-color': '#fdf6e3', 'root-background': '#073642', 'root-stroke': '#002b36',
            'root-font-size': 24, 'root-padding': [15, 25], 'root-margin': [30, 100],
            'root-radius': 30, 'root-space': 10, 'root-shadow': 'rgba(0,0,0,0.2)',
            'main-color': '#002b36', 'main-background': '#eee8d5', 'main-stroke': '#93a1a1',
            'main-font-size': 16, 'main-padding': [6, 20], 'main-margin': 20,
            'main-radius': 10, 'main-space': 5, 'main-shadow': 'rgba(0,0,0,0.1)',
            'sub-color': '#586e75', 'sub-background': 'transparent', 'sub-stroke': 'none',
            'sub-font-size': 12, 'sub-padding': [5, 10], 'sub-margin': [15, 20],
            'sub-tree-margin': 30, 'sub-radius': 5, 'sub-space': 5,
            'connect-color': '#2aa198', 'connect-width': 2, 'main-connect-width': 3, 'connect-radius': 5,
            'selected-background': '#b58900', 'selected-stroke': '#b58900', 'selected-color': '#fdf6e3',
            'marquee-background': 'rgba(42,161,152,0.15)', 'marquee-stroke': '#2aa198',
            'drop-hint-color': '#2aa198', 'sub-drop-hint-width': 2, 'main-drop-hint-width': 4, 'root-drop-hint-width': 4,
            'order-hint-area-color': 'rgba(42,161,152,0.3)', 'order-hint-path-color': '#2aa198', 'order-hint-path-width': 1,
            'text-selection-color': 'rgb(42,161,152)', 'line-height': 1.5
        };
        themes['solarized-compact'] = Object.assign({}, themes['solarized'], {
            'root-padding': [8, 13], 'root-margin': [10, 20],
            'main-padding': [4, 10], 'main-margin': 8,
            'sub-padding': [3, 5], 'sub-margin': [4, 8], 'sub-tree-margin': 12
        });
    })();


    // ---------------------------------------------------------
    // 2. SESSION MANAGEMENT
    // ---------------------------------------------------------
    let sessions = [];
    let activeSessionId = null;

    class Session {
        constructor(id, name = 'Untitled', content = null, filePath = null) {
            this.id = id || 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.name = name;
            this.filePath = filePath;
            this.content = content || JSON.stringify({
                "root": { "data": { "id": "root", "created": Date.now(), "text": "Central Topic" }, "children": [] },
                "template": "default", "theme": "fresh-green", "version": "1.4.50"
            });
            this.isModified = false;
        }
    }

    async function createNewSession(name = 'Untitled', content = null, filePath = null) {
        const session = new Session(null, name, content, filePath);
        sessions.push(session);
        renderTabs();
        await switchSession(session.id);
        return session;
    }

    async function switchSession(id) {
        if (id === activeSessionId) return;

        // Commit any active text edit before exporting
        if (editor && editor.fsm && editor.fsm.state() === 'input') {
            editor.fsm.jump('normal', 'input-commit');
        }

        // Save current session data before switching
        if (activeSessionId && editor && editor.minder) {
            const currentSession = sessions.find(s => s.id === activeSessionId);
            if (currentSession) {
                const data = await editor.minder.exportData('json');
                currentSession.content = data;
            }
        }

        activeSessionId = id;
        const targetSession = sessions.find(s => s.id === id);
        if (targetSession && editor && editor.minder) {
            await editor.minder.importData('json', targetSession.content);
            renderTabs();
            // Update modified status in main process
            ipcRenderer.send('set-modified-status', sessions.some(s => s.isModified));
        }
    }

    function closeSession(id) {
        const sessionIndex = sessions.findIndex(s => s.id === id);
        if (sessionIndex === -1) return;

        const session = sessions[sessionIndex];
        if (session.isModified) {
            if (!confirm(`Close "${session.name}"? Unsaved changes will be lost.`)) {
                return;
            }
        }

        sessions.splice(sessionIndex, 1);

        if (sessions.length === 0) {
            createNewSession();
        } else if (id === activeSessionId) {
            const nextId = sessions[Math.min(sessionIndex, sessions.length - 1)].id;
            switchSession(nextId);
        } else {
            renderTabs();
        }
    }

    function renderTabs() {
        const $tabBar = $('#tabBar');
        if ($tabBar.length === 0) return;
        $tabBar.empty();

        sessions.forEach(session => {
            const isActive = session.id === activeSessionId;
            const $tab = $('<div class="tab"></div>')
                .toggleClass('active', isActive)
                .toggleClass('modified', session.isModified)
                .attr('data-id', session.id);

            $('<span class="tab-name"></span>').text(session.name).appendTo($tab);
            $('<span class="tab-close">&times;</span>').on('click', (e) => {
                e.stopPropagation();
                closeSession(session.id);
            }).appendTo($tab);

            $tab.on('click', () => switchSession(session.id));
            $tabBar.append($tab);
        });
    }

    // ---------------------------------------------------------
    // 2. ELECTRON NATIVE MENU HOOKS
    // ---------------------------------------------------------
    window.kityddPrompt = function (title, placeholder, callback, showSideSelect, defaultSide, showDelete, deleteCallback, showRelOptions, defaultStyle, defaultColor, defaultValue) {
        $('#kityddPromptLabel').text(title);
        $('#kityddPromptInput').attr('placeholder', placeholder).val(defaultValue !== undefined && defaultValue !== null ? defaultValue : '');

        if (showSideSelect) {
            $('#kityddPromptSideGroup').show();
            $('#kityddPromptSideSelect').val(defaultSide || 'right');
        } else {
            $('#kityddPromptSideGroup').hide();
        }

        if (showRelOptions) {
            $('#kityddPromptRelStyleGroup').show();
            $('#kityddPromptRelStyle').val(defaultStyle || 'dashed');
            $('#kityddPromptRelColorGroup').show();
            $('#kityddPromptRelColor').val(defaultColor || '#ef4444');
        } else {
            $('#kityddPromptRelStyleGroup').hide();
            $('#kityddPromptRelColorGroup').hide();
        }

        if (showDelete) {
            $('#kityddPromptDelete').show().off('click').on('click', function () {
                $('#kityddPromptModal').modal('hide');
                if (deleteCallback) deleteCallback();
            });
        } else {
            $('#kityddPromptDelete').hide();
        }

        $('#kityddPromptConfirm').off('click').on('click', function () {
            let val = $('#kityddPromptInput').val();
            let side = $('#kityddPromptSideSelect').val();
            let relStyle = $('#kityddPromptRelStyle').val();
            let relColor = $('#kityddPromptRelColor').val();
            $('#kityddPromptModal').modal('hide');
            if (callback) callback(val, side, relStyle, relColor);
        });

        $('#kityddPromptInput').off('keydown').on('keydown', function (e) {
            if (e.key === 'Enter' && (!e.shiftKey)) {
                e.preventDefault();
                $('#kityddPromptConfirm').click();
            }
        });

        $('#kityddPromptModal').modal('show');
        setTimeout(() => $('#kityddPromptInput').focus(), 300);
    };

    ipcRenderer.on('menu-command', async (event, command, arg) => {
        if (!editor || !editor.minder) return;

        const currentSession = sessions.find(s => s.id === activeSessionId);

        switch (command) {
            case 'new':
                createNewSession();
                break;
            case 'open-recent': {
                // arg is the file path passed from the recent‐files menu
                if (!arg) break;
                const recentResult = await ipcRenderer.invoke('read-file-by-path', arg);
                if (!recentResult) {
                    alert('Could not open file: ' + arg);
                    break;
                }
                // Re-use the same import logic as 'open'
                const recentFileName = recentResult.filePath.split(/[\\/]/).pop();
                const recentSession = await createNewSession(recentFileName, null, recentResult.filePath);
                let rExt = recentResult.extension;
                try {
                    if (rExt === 'xmind') {
                        await importXMindFromBase64(recentResult.content);
                    } else if (rExt === 'mmap') {
                        await importMindManagerFromBase64(recentResult.content);
                    } else if (rExt === 'mm') {
                        await importFreeMindContent(recentResult.content);
                    } else if (rExt === 'md' || rExt === 'markdown') {
                        await editor.minder.importData('markdown', recentResult.content);
                    } else if (rExt === 'drwdd') {
                        let drawddData = JSON.parse(recentResult.content);
                        let minderData = convertDrawDDToKityMinder(drawddData);
                        await editor.minder.importData('json', JSON.stringify(minderData));
                    } else if (rExt === 'json' || rExt === 'km') {
                        try {
                            let jsonData = JSON.parse(recentResult.content);
                            if (jsonData.cells || jsonData.pages || jsonData.nodes || jsonData.edges) {
                                jsonData = convertDrawDDToKityMinder(jsonData);
                            }
                            let importDataStr = jsonData.root ? JSON.stringify(jsonData) : JSON.stringify({ root: jsonData, template: 'default', theme: 'fresh-green', version: '1.4.50' });
                            await editor.minder.importData('json', importDataStr);
                        } catch (err) {
                            await editor.minder.importData('json', recentResult.content);
                        }
                    } else {
                        await editor.minder.importData(rExt, recentResult.content);
                    }
                    const finalExport = await editor.minder.exportData('json');
                    recentSession.content = finalExport;
                    recentSession.isModified = false;
                    renderTabs();
                    setTimeout(() => {
                        if (editor.minder) {
                            editor.minder.execCommand('camera', editor.minder.getRoot(), 100);
                            if (window.applyNodeTextAlignmentForAll) window.applyNodeTextAlignmentForAll();
                            refreshNavigator();
                        }
                    }, 200);
                } catch (err) {
                    console.error('Open recent error:', err);
                    alert('Failed to open recent file: ' + err.message);
                }
                break;
            }
            case 'open':
                const openResult = await ipcRenderer.invoke('open-file-dialog');
                if (openResult) {
                    const fileName = openResult.filePath.split(/[\\/]/).pop();

                    // Create a new session and switch to it first
                    // We must await this to ensure the editor is ready for the subsequent import
                    const newSession = await createNewSession(fileName, null, openResult.filePath);

                    let ext = openResult.extension;
                    try {
                        if (ext === 'xmind') {
                            await importXMindFromBase64(openResult.content);
                        } else if (ext === 'mmap') {
                            await importMindManagerFromBase64(openResult.content);
                        } else if (ext === 'mm') {
                            await importFreeMindContent(openResult.content);
                        } else if (ext === 'md' || ext === 'markdown') {
                            await editor.minder.importData('markdown', openResult.content);
                        } else if (ext === 'drwdd') {
                            let drawddData = JSON.parse(openResult.content);
                            let minderData = convertDrawDDToKityMinder(drawddData);
                            await editor.minder.importData('json', JSON.stringify(minderData));
                        } else if (ext === 'json' || ext === 'km') {
                            try {
                                let jsonData = JSON.parse(openResult.content);
                                if (jsonData.cells || jsonData.pages || jsonData.nodes || jsonData.edges) {
                                    jsonData = convertDrawDDToKityMinder(jsonData);
                                }
                                let importDataStr = jsonData.root ? JSON.stringify(jsonData) : JSON.stringify({ root: jsonData, template: 'default', theme: 'fresh-green', version: '1.4.50' });
                                await editor.minder.importData('json', importDataStr);
                            } catch (err) {
                                await editor.minder.importData('json', openResult.content);
                            }
                        } else {
                            await editor.minder.importData(ext, openResult.content);
                        }

                        // CRITICAL: Await export to ensure session has the actual imported data
                        const finalExport = await editor.minder.exportData('json');
                        newSession.content = finalExport;
                        newSession.isModified = false;
                        renderTabs();

                        // Refresh UI
                        setTimeout(() => {
                            if (editor.minder) {
                                editor.minder.execCommand('camera', editor.minder.getRoot(), 100);
                                if (window.applyNodeTextAlignmentForAll) window.applyNodeTextAlignmentForAll();
                                refreshNavigator();
                            }
                        }, 200);

                    } catch (err) {
                        console.error('Open error:', err);
                        alert('Failed to open file: ' + err.message);
                    }
                }
                break;
            case 'save':
                if (currentSession.filePath) {
                    let saveExt = currentSession.filePath.split('.').pop().toLowerCase();
                    let content;
                    if (saveExt === 'drwdd') {
                        const minderJsonStr = await editor.minder.exportData('json');
                        const minderJson = JSON.parse(minderJsonStr);
                        const drawddJson = convertKityMinderToDrawDD(minderJson);
                        content = JSON.stringify(drawddJson, null, 2);
                    } else {
                        content = await editor.minder.exportData('json');
                    }
                    const savedPath = await ipcRenderer.invoke('save-file-direct', {
                        filePath: currentSession.filePath,
                        data: content
                    });
                    if (savedPath) {
                        currentSession.isModified = false;
                        renderTabs();
                        ipcRenderer.send('set-modified-status', sessions.some(s => s.isModified));
                    }
                    break;
                }
            // Fall through to save-as if no file path
            case 'save-as':
            case 'export-json':
            case 'export-km':
            case 'export-drwdd':
            case 'export-md':
            case 'export-png':
            case 'export-svg':
                let type = command.replace('export-', '');
                if (command === 'save' || command === 'save-as') { type = 'km'; }
                let exportType = type === 'km' || type === 'drwdd' ? 'json' : (type === 'md' ? 'markdown' : type);

                editor.minder.exportData(exportType).then(async function (content) {
                    let exportContent = content;
                    if (type === 'drwdd') {
                        const minderJson = JSON.parse(content);
                        const drawddJson = convertKityMinderToDrawDD(minderJson);
                        exportContent = JSON.stringify(drawddJson, null, 2);
                    }

                    const defaultName = currentSession.name.includes('.') ? currentSession.name.split('.')[0] : currentSession.name;
                    
                    const saveFilters = type === 'km' ? [
                        { name: 'Kityminder Mindmap', extensions: ['km'] },
                        { name: 'JSON File', extensions: ['json'] }
                    ] : (type === 'drwdd' ? [
                        { name: 'DrawDD Diagram', extensions: ['drwdd'] }
                    ] : [{ name: exportType.toUpperCase(), extensions: [type] }]);

                    const resultPath = await ipcRenderer.invoke('save-file-dialog', {
                        data: exportContent,
                        isBinary: type === 'png',
                        options: { defaultPath: defaultName + '.' + type, filters: saveFilters }
                    });

                    if (resultPath && (command === 'save' || command === 'save-as' || command === 'export-km' || command === 'export-drwdd')) {
                        currentSession.filePath = resultPath;
                        currentSession.name = resultPath.split(/[\\/]/).pop();
                        currentSession.isModified = false;
                        renderTabs();
                        ipcRenderer.send('set-modified-status', sessions.some(s => s.isModified));
                    }
                });
                break;
            case 'insert-equation':
                window.kityddPrompt("Insert Equation", "Enter LaTeX equation (e.g. \\frac{a}{b})", function (latex) {
                    let encodedLatex = encodeURIComponent(latex);
                    let url = "https://latex.codecogs.com/svg.image?" + encodedLatex;
                    editor.minder.execCommand('Image', url, 'LaTeX Equation');
                });
                break;
            case 'insert-hyperlink':
                window.kityddPrompt("Insert Hyperlink", "Enter URL (e.g. https://kityminder.com)", function (url) {
                    editor.minder.execCommand('HyperLink', url);
                });
                break;
            case 'insert-image':
                ipcRenderer.invoke('open-image-dialog').then(function (imgData) {
                    if (imgData) {
                        editor.minder.execCommand('Image', imgData);
                    }
                });
                break;
            case 'insert-note':
                window.kityddPrompt("Insert Note", "Enter Note text...", function (text) {
                    editor.minder.execCommand('note', text);
                });
                break;
            case 'isolated':
                createIsolatedNode();
                break;
            case 'link-nodes':
                addLinkBetweenSelectedNodes();
                break;
            case 'boundary':
                createBoundaryForSelectedNodes();
                break;
            case 'undo':
            case 'redo':
                editor.minder.execCommand(command);
                break;
        }
    });

    ipcRenderer.on('ask-close-confirmation', () => {
        const modifiedSessions = sessions.filter(s => s.isModified).map(s => s.name).join(', ');
        if (confirm(`You have unsaved changes in: ${modifiedSessions}. Exit anyway?`)) {
            ipcRenderer.send('confirm-close', true);
        } else {
            ipcRenderer.send('confirm-close', false);
        }
    });

    ipcRenderer.on('show-about', () => {
        $('#kityddAboutModal').modal('show');
    });

    // ---------------------------------------------------------
    // 3. TEXT ALIGNMENT (left / center / right)
    // ---------------------------------------------------------
    // Uses SVG text-anchor (start / middle / end) with matching X
    // offsets.  Applied per-node after each render via 'noderender'
    // event, plus safety re-application on layoutfinish.
    //
    // For MULTI-LINE nodes the shorter lines shift visually.
    // For SINGLE-LINE nodes all three alignments look identical
    // because the node outline wraps the text tightly.

    /**
     * Safely obtain the kity.Group containing a node's text items.
     * Returns null when unavailable (e.g. node not yet rendered).
     */
    function getTextGroupSafe(node) {
        try {
            if (node.getTextGroup) return node.getTextGroup();
        } catch (e) { /* fallthrough */ }
        try {
            var r = node.getRenderer && node.getRenderer('TextRenderer');
            return r && r.getRenderShape ? r.getRenderShape() : null;
        } catch (e) { return null; }
    }

    /**
     * Apply text-align to one node.
     *
     * Strategy:
     *   1. Reset every <text> to x=0, text-anchor=start (SVG default).
     *   2. Measure each line's intrinsic width via getBoundaryBox().
     *   3. For center → text-anchor=middle, x = maxWidth/2
     *      For right  → text-anchor=end,    x = maxWidth
     *
     * The outline is unaffected because the widest line still spans
     * 0…maxWidth regardless of anchor mode.
     */
    function applyNodeTextAlign(node) {
        if (!node) return;

        var textGroup = getTextGroupSafe(node);
        if (!textGroup) return;

        var textItems;
        try { textItems = textGroup.getItems(); } catch (e) { return; }
        if (!textItems || !textItems.length) return;

        var i, item;

        // --- Step 1: reset every item to native left-aligned ---
        for (i = 0; i < textItems.length; i++) {
            item = textItems[i];
            try {
                item.setX(0);
                if (item.setTextAnchor) item.setTextAnchor('start');
                else item.node.setAttribute('text-anchor', 'start');
            } catch (e) { /* skip item */ }
        }

        var align = node.getData('text-align');
        // No explicit alignment, or explicit 'left' → native default is fine
        if (!align || align === 'left') return;

        // --- Step 2: measure natural width of every line ---
        var widths = [], maxWidth = 0;
        for (i = 0; i < textItems.length; i++) {
            var w = 0;
            try {
                var bbox = textItems[i].getBoundaryBox();
                w = (bbox && bbox.width) || 0;
            } catch (e) { /* leave w = 0 */ }
            widths.push(w);
            if (w > maxWidth) maxWidth = w;
        }
        if (!maxWidth || !isFinite(maxWidth)) return;

        // --- Step 3: apply SVG text-anchor + matching X offset ---
        for (i = 0; i < textItems.length; i++) {
            item = textItems[i];
            try {
                if (align === 'center') {
                    if (item.setTextAnchor) item.setTextAnchor('middle');
                    else item.node.setAttribute('text-anchor', 'middle');
                    item.setX(maxWidth / 2);
                } else if (align === 'right') {
                    if (item.setTextAnchor) item.setTextAnchor('end');
                    else item.node.setAttribute('text-anchor', 'end');
                    item.setX(maxWidth);
                }
            } catch (e) { /* skip item */ }
        }
    }

    function setupTextAlignHook() {
        if (!editor || !editor.minder) {
            setTimeout(setupTextAlignHook, 500);
            return;
        }
        var minder = editor.minder;

        // Primary hook: fires right after each node's render pipeline
        minder.on('noderender', function (e) {
            if (e && e.node) applyNodeTextAlign(e.node);
        });

        // Safety net: re-apply after layout animation finishes
        minder.on('layoutallfinish', function () {
            window.applyNodeTextAlignmentForAll();
        });
    }

    /** Traverse the whole tree and (re-)apply alignment to every node. */
    window.applyNodeTextAlignmentForAll = function () {
        if (!editor || !editor.minder) return;
        try {
            editor.minder.getRoot().traverse(function (node) {
                applyNodeTextAlign(node);
            });
        } catch (e) { /* ignore */ }
    };

    // ---------------------------------------------------------
    // 4. IMPORTERS (XMind, FreeMind, MindManager)
    // ---------------------------------------------------------

    function importFreeMindContent(content) {
        return new Promise((resolve, reject) => {
            try {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(content, 'text/xml');
                let parseError = xmlDoc.querySelector('parsererror');
                if (parseError) throw new Error('Invalid XML format');

                let kityMinderData = convertFreeMindToKityMinder(xmlDoc);
                editor.minder.importJson(kityMinderData);
                resolve();
            } catch (error) {
                alert('Failed to import FreeMind file: ' + error.message);
                reject(error);
            }
        });
    }

    function convertFreeMindToKityMinder(xmlDoc) {
        let mapEl = xmlDoc.querySelector('map');
        if (!mapEl) throw new Error('Invalid FreeMind file: No map element found');

        let rootNode = mapEl.querySelector('node');
        if (!rootNode) throw new Error('Invalid FreeMind file: No root node found');

        function convertNode(nodeElement) {
            let text = nodeElement.getAttribute('TEXT') || nodeElement.getAttribute('text') || 'Untitled';
            let nodeData = {
                data: { text: text, id: 'fm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) },
                children: []
            };

            let link = nodeElement.getAttribute('LINK') || nodeElement.getAttribute('link');
            if (link) nodeData.data.hyperlink = link;

            let noteEl = nodeElement.querySelector('richcontent[TYPE="NOTE"]');
            if (noteEl) nodeData.data.note = noteEl.textContent.trim();

            let icons = nodeElement.querySelectorAll('icon');
            icons.forEach(function (icon) {
                let builtin = icon.getAttribute('BUILTIN') || icon.getAttribute('builtin');
                if (builtin && builtin.includes('full-')) {
                    nodeData.data.priority = parseInt(builtin.replace(/\D/g, '')) || 1;
                }
            });

            let childNodes = nodeElement.querySelectorAll(':scope > node');
            childNodes.forEach(function (child) { nodeData.children.push(convertNode(child)); });

            return nodeData;
        }

        return { root: convertNode(rootNode), template: 'default', theme: 'fresh-blue', version: '1.4.50' };
    }

    function importXMindFromBase64(base64Content) {
        if (typeof JSZip === 'undefined') {
            alert('JSZip library not loaded.');
            return Promise.reject(new Error('JSZip not loaded'));
        }

        return JSZip.loadAsync(base64Content, { base64: true }).then(function (zip) {
            var contentFile = zip.file('content.xml') || zip.file('content.json');
            if (!contentFile) throw new Error('Invalid XMind file: content.xml or content.json not found');
            return contentFile.async('string');
        }).then(function (content) {
            var mindmapData;
            if (content.startsWith('{')) {
                mindmapData = convertXMindJSONToKityMinder(JSON.parse(content));
            } else {
                var xmlDoc = new DOMParser().parseFromString(content, 'text/xml');
                if (xmlDoc.querySelector('parsererror')) throw new Error('Invalid XMind XML structure');
                mindmapData = convertXMindXMLToKityMinder(xmlDoc);
            }
            return editor.minder.importData('json', JSON.stringify({ root: mindmapData, template: 'default', theme: 'fresh-green', version: '1.4.50' }));
        }).catch(function (error) {
            alert('Failed to import XMind file: ' + error.message);
            throw error;
        });
    }

    function convertXMindJSONToKityMinder(xmindData) {
        var rootTopic = xmindData[0] && xmindData[0].rootTopic;
        if (!rootTopic) throw new Error('Invalid XMind JSON structure');
        return convertXMindTopicToNode(rootTopic);
    }

    function convertXMindTopicToNode(topic) {
        var text = topic.title || topic.text || topic.name || 'Topic';
        var node = { data: { text: text }, children: [] };

        if (topic.markers) {
            var markerMap = {
                "priority-1": ["priority", 1], "priority-2": ["priority", 2], "priority-3": ["priority", 3],
                "priority-4": ["priority", 4], "priority-5": ["priority", 5], "priority-6": ["priority", 6],
                "priority-7": ["priority", 7], "priority-8": ["priority", 8], "priority-9": ["priority", 9],
                "task-start": ["progress", 1], "task-oct": ["progress", 2], "task-quarter": ["progress", 3],
                "task-3oct": ["progress", 4], "task-half": ["progress", 5], "task-5oct": ["progress", 6],
                "task-3quar": ["progress", 7], "task-7oct": ["progress", 8], "task-done": ["progress", 9]
            };
            var markers = topic.markers;
            if (Array.isArray(markers)) {
                markers.forEach(function (m) {
                    var type = markerMap[m.markerId];
                    if (type) node.data[type[0]] = type[1];
                });
            } else if (markers.markerId) {
                var type = markerMap[markers.markerId];
                if (type) node.data[type[0]] = type[1];
            }
        }

        if (topic.href) node.data.hyperlink = topic.href;
        if (topic.notes && topic.notes.plain) node.data.note = topic.notes.plain.content;
        if (topic.labels) node.data.resource = topic.labels;

        if (topic.children) {
            if (topic.children.attached) {
                node.children = topic.children.attached.map(convertXMindTopicToNode);
            } else if (Array.isArray(topic.children)) {
                node.children = topic.children.map(convertXMindTopicToNode);
            }
        }
        return node;
    }

    function convertXMindXMLToKityMinder(xmlDoc) {
        var rootTopic = xmlDoc.querySelector('topic[id="root"]') || xmlDoc.querySelector('sheet > topic');
        if (!rootTopic) throw new Error('Invalid XMind XML structure');
        return convertXMindXMLTopicToNode(rootTopic);
    }

    function convertXMindXMLTopicToNode(topicElement) {
        var titleElement = topicElement.querySelector(':scope > title');
        var text = titleElement ? titleElement.textContent.trim() : (topicElement.getAttribute('text') || topicElement.getAttribute('title') || 'Topic');
        var node = { data: { text: text }, children: [] };

        var href = topicElement.getAttribute('xlink:href');
        if (href) node.data.hyperlink = href;

        var notesEl = topicElement.querySelector(':scope > notes > plain');
        if (notesEl) node.data.note = notesEl.textContent.trim();

        var labels = topicElement.querySelectorAll(':scope > labels > label');
        if (labels.length > 0) {
            node.data.resource = Array.from(labels).map(function (l) { return l.textContent.trim(); });
        }

        var markerRefs = topicElement.querySelectorAll(':scope > marker-refs > marker-ref');
        if (markerRefs.length > 0) {
            var markerMap = {
                "priority-1": ["priority", 1], "priority-2": ["priority", 2], "priority-3": ["priority", 3],
                "priority-4": ["priority", 4], "priority-5": ["priority", 5], "priority-6": ["priority", 6],
                "priority-7": ["priority", 7], "priority-8": ["priority", 8], "priority-9": ["priority", 9],
                "task-start": ["progress", 1], "task-oct": ["progress", 2], "task-quarter": ["progress", 3],
                "task-3oct": ["progress", 4], "task-half": ["progress", 5], "task-5oct": ["progress", 6],
                "task-3quar": ["progress", 7], "task-7oct": ["progress", 8], "task-done": ["progress", 9]
            };
            markerRefs.forEach(function (m) {
                var id = m.getAttribute('marker-id');
                var type = markerMap[id];
                if (type) node.data[type[0]] = type[1];
            });
        }

        var childrenElement = topicElement.querySelector(':scope > children');
        if (childrenElement) {
            var childTopics = childrenElement.querySelectorAll(':scope > topics > topic');
            if (childTopics.length === 0) childTopics = childrenElement.querySelectorAll(':scope > topic');
            node.children = Array.from(childTopics).map(convertXMindXMLTopicToNode);
        } else {
            var directTopics = topicElement.querySelectorAll(':scope > topic');
            node.children = Array.from(directTopics).map(convertXMindXMLTopicToNode);
        }
        return node;
    }

    function importMindManagerFromBase64(base64Content) {
        if (typeof JSZip === 'undefined') {
            alert('JSZip library not loaded.');
            return Promise.reject(new Error('JSZip not loaded'));
        }

        return JSZip.loadAsync(base64Content, { base64: true }).then(function (zip) {
            var contentFile = zip.file('Document.xml') || zip.file('document.xml');
            if (!contentFile) throw new Error('Invalid MindManager file: Document.xml not found');
            return contentFile.async('string');
        }).then(function (content) {
            var xmlDoc = new DOMParser().parseFromString(content, 'text/xml');
            if (xmlDoc.querySelector('parsererror')) throw new Error('Invalid MindManager XML structure');
            var mindmapData = convertMindManagerToKityMinder(xmlDoc);
            return editor.minder.importData('json', JSON.stringify({ root: mindmapData, template: 'default', theme: 'fresh-green', version: '1.4.50' }));
        }).catch(function (error) {
            alert('Failed to import MindManager file: ' + error.message);
            throw error;
        });
    }

    function importMindManagerFile(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var xmlDoc = new DOMParser().parseFromString(e.target.result, 'text/xml');
                if (xmlDoc.querySelector('parsererror')) throw new Error('Invalid MindManager XML structure');

                var mindmapData = convertMindManagerToKityMinder(xmlDoc);
                editor.minder.importData({ root: mindmapData, template: 'default', theme: 'fresh-green', version: '1.4.50' });
            } catch (error) {
                alert('MindManager import failed: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    function convertMindManagerToKityMinder(xmlDoc) {
        var rootTopic = xmlDoc.querySelector('map > topic') || xmlDoc.querySelector('ap > topic');
        if (!rootTopic) throw new Error('Invalid MindManager XML structure');
        return convertMindManagerTopicToNode(rootTopic);
    }

    function convertMindManagerTopicToNode(topicElement) {
        var text = topicElement.getAttribute('text') || topicElement.getAttribute('TEXT') || topicElement.getAttribute('title') ||
            (topicElement.querySelector('text') && topicElement.querySelector('text').textContent) ||
            (topicElement.querySelector('TEXT') && topicElement.querySelector('TEXT').textContent) || 'Topic';

        var node = { data: { text: text.trim() }, children: [] };

        var linkEl = topicElement.querySelector('Hyperlink') || topicElement.querySelector('ap\\:Hyperlink');
        if (linkEl) node.data.hyperlink = linkEl.getAttribute('Url') || linkEl.getAttribute('href');

        var noteEl = topicElement.querySelector('Notes') || topicElement.querySelector('ap\\:Notes');
        if (noteEl) node.data.note = noteEl.textContent.replace(/<[^>]*>?/gm, '').trim();

        var childTopics = topicElement.querySelectorAll(':scope > topic, :scope > TOPIC, :scope > node, :scope > NODE');
        node.children = Array.from(childTopics).map(convertMindManagerTopicToNode);
        return node;
    }

    // ---------------------------------------------------------
    // 4.5. DRAWDD CONVERTERS & ADVANCED MINDMAP CAPABILITIES
    // ---------------------------------------------------------

    function convertKityMinderToDrawDD(minderData) {
        const cells = [];
        const root = minderData.root;
        if (!root) {
            return {
                version: "1.0.0",
                type: "mindmap",
                nodes: [],
                edges: []
            };
        }

        // Separate root's children into Right and Left sides
        const rightChildren = [];
        const leftChildren = [];
        if (root.children) {
            root.children.forEach((child, index) => {
                if (index % 2 === 0) {
                    rightChildren.push(child);
                } else {
                    leftChildren.push(child);
                }
            });
        }

        const siblingSpacing = 60;
        const gap = 80;

        // Helper to assign side, level, width, and height to all nodes recursively
        function prepareNode(node, level, side) {
            node.id = node.data.id || 'node-' + Math.random().toString(36).substr(2, 9);
            node.level = level;
            node.side = side;
            
            const text = node.data.text || 'Node';
            node.width = level === 0 ? 160 : Math.max(100, Math.min(300, text.length * 8 + 35));
            node.height = level === 0 ? 60 : 40;

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    prepareNode(child, level + 1, side);
                });
            }
        }

        // Prepare root
        prepareNode(root, 0, "root");
        
        // Prepare children
        rightChildren.forEach(child => prepareNode(child, 1, "right"));
        leftChildren.forEach(child => prepareNode(child, 1, "left"));

        // Helper to recursively compute Y coordinates
        let currentY = 0;
        function computeY(node) {
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => computeY(child));
                const firstY = node.children[0].y;
                const lastY = node.children[node.children.length - 1].y;
                node.y = (firstY + lastY) / 2;
            } else {
                node.y = currentY;
                currentY += siblingSpacing;
            }
        }

        // Layout Right children
        currentY = 0;
        rightChildren.forEach(child => computeY(child));
        let rightCenterOffset = 0;
        if (rightChildren.length > 0) {
            const firstY = rightChildren[0].y;
            const lastY = rightChildren[rightChildren.length - 1].y;
            rightCenterOffset = (firstY + lastY) / 2;
        }

        // Layout Left children
        currentY = 0;
        leftChildren.forEach(child => computeY(child));
        let leftCenterOffset = 0;
        if (leftChildren.length > 0) {
            const firstY = leftChildren[0].y;
            const lastY = leftChildren[leftChildren.length - 1].y;
            leftCenterOffset = (firstY + lastY) / 2;
        }

        // Shift Y coordinates to center around 0
        function shiftY(node, offset) {
            node.y -= offset;
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => shiftY(child, offset));
            }
        }
        rightChildren.forEach(child => shiftY(child, rightCenterOffset));
        leftChildren.forEach(child => shiftY(child, leftCenterOffset));

        root.y = 0;

        // Position root and compile recursively
        const rootX = 2000;
        const rootY = 2000;

        root.absX = rootX;
        root.absY = rootY - root.height / 2;

        function computeAbsXAndCompile(node, parentNode = null) {
            if (node.level > 0) {
                if (node.side === "right") {
                    node.absX = parentNode.absX + parentNode.width + gap;
                } else {
                    node.absX = parentNode.absX - gap - node.width;
                }
                node.absY = rootY + node.y - node.height / 2;
            }

            const nodeText = node.data.text || 'Node';
            const textColor = node.level === 0 ? '#1e3a8a' : '#334155';
            const fontSize = node.level === 0 ? 14 : 12;

            const drawNode = {
                id: node.id,
                shape: 'rect',
                position: { x: node.absX, y: node.absY },
                size: { width: node.width, height: node.height },
                attrs: {
                    body: {
                        fill: node.level === 0 ? '#eff6ff' : '#ffffff',
                        stroke: node.level === 0 ? '#2563eb' : '#cbd5e1',
                        strokeWidth: 2,
                        rx: node.level === 0 ? 12 : 6,
                        ry: node.level === 0 ? 12 : 6,
                    },
                    label: {
                        text: nodeText,
                        fill: textColor,
                        fontSize: fontSize,
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        textWrap: {
                            text: nodeText,
                            width: -20,
                            height: -20,
                            ellipsis: false,
                            breakWord: true
                        }
                    }
                },
                visible: true,
                data: {
                    text: nodeText,
                    textColor: textColor,
                    isMindmap: true,
                    level: node.level
                },
                ports: {
                    groups: {
                        left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
                        right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
                        top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
                        bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
                    },
                    items: [
                        { group: 'left', id: 'left' },
                        { group: 'right', id: 'right' },
                        { group: 'top', id: 'top' },
                        { group: 'bottom', id: 'bottom' },
                    ],
                }
            };

            cells.push(drawNode);

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    computeAbsXAndCompile(child, node);

                    const sourcePort = node.level === 0 ? (child.side === "right" ? "right" : "left") : (node.side === "right" ? "right" : "left");
                    const targetPort = child.side === "right" ? "left" : "right";

                    cells.push({
                        id: 'edge-' + node.id + '-' + child.id,
                        shape: 'edge',
                        source: { cell: node.id, port: sourcePort },
                        target: { cell: child.id, port: targetPort },
                        attrs: {
                            line: {
                                stroke: '#64748b',
                                strokeWidth: 2,
                                targetMarker: null
                            }
                        },
                        router: { name: 'normal' },
                        connector: { name: 'smooth' }
                    });
                });
            }
        }

        computeAbsXAndCompile(root);

        const nodes = cells.filter(cell => cell.shape !== 'edge');
        const edges = cells.filter(cell => cell.shape === 'edge');

        const pageData = {
            cells: cells
        };
        const pageId = 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        return {
            id: fileId,
            name: (minderData.root && minderData.root.data && minderData.root.data.text) || "KityDD Mindmap",
            pages: [
                {
                    id: pageId,
                    name: "Page 1",
                    data: JSON.stringify(pageData)
                }
            ],
            // flat nodes/edges for legacy tests and backwards compatibility
            version: "1.0.0",
            type: "mindmap",
            nodes: nodes,
            edges: edges
        };
    }

    function convertDrawDDToKityMinder(drawddData) {
        let cells = [];
        if (drawddData) {
            if (Array.isArray(drawddData.pages) && drawddData.pages.length > 0) {
                const firstPage = drawddData.pages[0];
                if (firstPage && typeof firstPage.data === 'string') {
                    try {
                        const pageData = JSON.parse(firstPage.data);
                        if (Array.isArray(pageData.cells)) {
                            cells = pageData.cells;
                        } else if (Array.isArray(pageData.nodes) || Array.isArray(pageData.edges)) {
                            cells = [...(pageData.nodes || []), ...(pageData.edges || [])];
                        }
                    } catch (e) {
                        console.error('Failed to parse first page data:', e);
                    }
                }
            } else if (Array.isArray(drawddData.cells)) {
                cells = drawddData.cells;
            } else if (Array.isArray(drawddData.nodes) || Array.isArray(drawddData.edges)) {
                cells = [...(drawddData.nodes || []), ...(drawddData.edges || [])];
            }
        }

        cells = cells || [];
        const nodes = cells.filter(cell => cell.shape !== 'edge' && !cell.source && !cell.target);
        const edges = cells.filter(cell => cell.shape === 'edge' || (cell.source && cell.target));

        if (nodes.length === 0) {
            return {
                root: { data: { id: "root", text: "Central Topic" }, children: [] },
                template: "default",
                theme: "fresh-green",
                version: "1.4.50"
            };
        }

        // Build adjacency list
        const parentToChildren = {};
        const childToParent = {};
        nodes.forEach(node => {
            parentToChildren[node.id] = [];
        });

        edges.forEach(edge => {
            const sourceId = typeof edge.source === 'object' ? edge.source.cell : edge.source;
            const targetId = typeof edge.target === 'object' ? edge.target.cell : edge.target;
            if (sourceId && targetId && parentToChildren[sourceId]) {
                parentToChildren[sourceId].push(targetId);
                childToParent[targetId] = sourceId;
            }
        });

        // Find root node(s) - nodes with no parents
        const roots = nodes.filter(node => !childToParent[node.id]);
        let rootNode = roots[0];

        if (!rootNode) {
            let maxChildren = -1;
            nodes.forEach(node => {
                const numChildren = parentToChildren[node.id].length;
                if (numChildren > maxChildren) {
                    maxChildren = numChildren;
                    rootNode = node;
                }
            });
        }
        if (!rootNode) rootNode = nodes[0];

        // Recursive helper to build KityMinder tree with sorted layout-preserving children
        const visited = new Set();
        function buildTree(node) {
            visited.add(node.id);
            const text = node.data?.text || node.attrs?.label?.text || node.attrs?.text?.text || node.text || node.label || 'Topic';
            const minderNode = {
                data: {
                    id: node.id,
                    text: text,
                    created: Date.now()
                },
                children: []
            };

            const childrenIds = parentToChildren[node.id] || [];
            const childNodes = childrenIds
                .map(childId => nodes.find(n => n.id === childId))
                .filter(n => n && !visited.has(n.id));

            if (node.id === rootNode.id) {
                const rootX = rootNode.position?.x || 0;
                const rightSide = childNodes.filter(n => (n.position?.x || 0) >= rootX);
                const leftSide = childNodes.filter(n => (n.position?.x || 0) < rootX);

                // Sort right-side top-to-bottom (Y ascending)
                rightSide.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
                // Sort left-side top-to-bottom (Y ascending)
                leftSide.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

                // Combine right-side (first half) and left-side (second half)
                const sortedChildren = [...rightSide, ...leftSide];
                sortedChildren.forEach(child => {
                    minderNode.children.push(buildTree(child));
                });
            } else {
                // Non-root children sorted by Y ascending
                childNodes.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
                childNodes.forEach(child => {
                    minderNode.children.push(buildTree(child));
                });
            }

            return minderNode;
        }

        const rootTree = buildTree(rootNode);

        // Handle disconnected roots or unvisited nodes
        roots.forEach(r => {
            if (r.id !== rootNode.id && !visited.has(r.id)) {
                rootTree.children.push(buildTree(r));
            }
        });

        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                rootTree.children.push(buildTree(node));
            }
        });

        return {
            root: rootTree,
            template: "default",
            theme: "fresh-green",
            version: "1.4.50"
        };
    }

    let relationGroup = null;

    function renderCustomRelations() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;

        let relationGroup = null;
        minder.getConnectContainer().getShapes().forEach(shape => {
            if (shape.getId && shape.getId() === 'kitydd_relations') {
                relationGroup = shape;
            }
        });
        if (!relationGroup) {
            relationGroup = new kity.Group().setId('kitydd_relations');
            minder.getConnectContainer().addShape(relationGroup);
        }

        relationGroup.clear();

        const root = minder.getRoot();
        if (!root) return;

        let relations = root.getData('relations') || [];
        if (!Array.isArray(relations)) return;

        relations.forEach((rel) => {
            const fromNode = minder.getNodeById(rel.from);
            const toNode = minder.getNodeById(rel.to);

            if (!fromNode || !toNode) return;

            // Check visibility
            let isVisible = true;
            let p1 = fromNode.parent;
            while (p1) {
                if (p1.isCollapsed()) isVisible = false;
                p1 = p1.parent;
            }
            let p2 = toNode.parent;
            while (p2) {
                if (p2.isCollapsed()) isVisible = false;
                p2 = p2.parent;
            }
            if (!isVisible) return;

            const boxA = fromNode.getLayoutBox();
            const boxB = toNode.getLayoutBox();

            const start = new kity.Point(boxA.cx, boxA.cy);
            const end = new kity.Point(boxB.cx, boxB.cy);

            const strokeColor = rel.color || '#ef4444';
            const lineStyle = rel.style || 'dashed';

            // Quadratic Bezier Calculation: M start Q cp end
            const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            const cp = { x: mid.x + (rel.cp ? rel.cp.x : 0), y: mid.y + (rel.cp ? rel.cp.y : 0) };

            const path = new kity.Path();
            path.setPathData(['M', start.x, start.y, 'Q', cp.x, cp.y, end.x, end.y]);
            path.stroke(strokeColor, 1.5);
            if (lineStyle === 'dashed') {
                path.node.setAttribute('stroke-dasharray', '5,5');
            } else if (lineStyle === 'dotted') {
                path.node.setAttribute('stroke-dasharray', '2,3');
            } else {
                path.node.removeAttribute('stroke-dasharray');
            }
            relationGroup.addShape(path);

            // Arrowhead marker - Tangent direction at t=1 is from cp to end
            const arrow = new kity.Path();
            const angle = Math.atan2(end.y - cp.y, end.x - cp.x);
            const arrowSize = 8;
            const pLeft = new kity.Point(
                end.x - arrowSize * Math.cos(angle - Math.PI / 6),
                end.y - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            const pRight = new kity.Point(
                end.x - arrowSize * Math.cos(angle + Math.PI / 6),
                end.y - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            arrow.setPathData(['M', end.x, end.y, 'L', pLeft.x, pLeft.y, 'L', pRight.x, pRight.y, 'Z']);
            arrow.fill(strokeColor);
            relationGroup.addShape(arrow);

            // Compute midpoint of Bezier curve at t=0.5: B(0.5) = 0.25*start + 0.5*cp + 0.25*end
            const curveMidX = 0.25 * start.x + 0.5 * cp.x + 0.25 * end.x;
            const curveMidY = 0.25 * start.y + 0.5 * cp.y + 0.25 * end.y;

            const labelX = curveMidX + (rel.labelOffset ? rel.labelOffset.x : 0);
            const labelY = curveMidY + (rel.labelOffset ? rel.labelOffset.y : 0);

            const isSelected = minder.getSelectedNodes().some(n => n.getData('id') === rel.from || n.getData('id') === rel.to);

            // Draw interactive helper handles if selected
            if (isSelected) {
                // Projection line from mid to cp
                const projLine = new kity.Path();
                projLine.setPathData(['M', mid.x, mid.y, 'L', cp.x, cp.y]);
                projLine.stroke(strokeColor, 1);
                projLine.node.setAttribute('stroke-dasharray', '2,2');
                projLine.node.setAttribute('opacity', '0.5');
                relationGroup.addShape(projLine);

                // Control point drag handle
                const cpHandle = new kity.Circle(6, cp.x, cp.y);
                cpHandle.fill('#ffffff');
                cpHandle.stroke(strokeColor, 2);
                cpHandle.node.style.cursor = 'move';
                relationGroup.addShape(cpHandle);

                cpHandle.node.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    let startX = e.clientX;
                    let startY = e.clientY;
                    let initCpX = rel.cp ? rel.cp.x : 0;
                    let initCpY = rel.cp ? rel.cp.y : 0;
                    const zoom = minder.getPaper().getViewPort().zoom || 1;

                    function onMouseMove(moveEvent) {
                        const dx = (moveEvent.clientX - startX) / zoom;
                        const dy = (moveEvent.clientY - startY) / zoom;
                        rel.cp = {
                            x: initCpX + dx,
                            y: initCpY + dy
                        };
                        renderCustomRelations();
                    }

                    function onMouseUp() {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                        minder.fire('contentchange');
                    }

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                });
            }

            // Explanation label
            if (rel.text) {
                const textBg = new kity.Rect();
                const text = new kity.Text(rel.text);
                text.fill(strokeColor);
                text.setSize(10);
                text.setStyle({
                    fontFamily: 'Segoe UI, sans-serif',
                    fontSize: '11px',
                    fontWeight: 'bold'
                });
                if (text.setTextAnchor) text.setTextAnchor('middle');
                else text.node.setAttribute('text-anchor', 'middle');

                const textWidth = rel.text.length * 7 + 10;
                textBg.setSize(textWidth, 18);
                textBg.setPosition(labelX - textWidth / 2, labelY - 9);
                textBg.fill('#ffffff');
                textBg.stroke(strokeColor, 1);
                textBg.setRadius(3);

                text.setPosition(labelX, labelY + 4);

                relationGroup.addShape(textBg);
                relationGroup.addShape(text);

                if (isSelected) {
                    textBg.node.style.cursor = 'move';
                    text.node.style.cursor = 'move';

                    const dragHandler = function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        let startX = e.clientX;
                        let startY = e.clientY;
                        let initLabelX = rel.labelOffset ? rel.labelOffset.x : 0;
                        let initLabelY = rel.labelOffset ? rel.labelOffset.y : 0;
                        const zoom = minder.getPaper().getViewPort().zoom || 1;

                        function onMouseMove(moveEvent) {
                            const dx = (moveEvent.clientX - startX) / zoom;
                            const dy = (moveEvent.clientY - startY) / zoom;
                            rel.labelOffset = {
                                x: initLabelX + dx,
                                y: initLabelY + dy
                            };
                            renderCustomRelations();
                        }

                        function onMouseUp() {
                            window.removeEventListener('mousemove', onMouseMove);
                            window.removeEventListener('mouseup', onMouseUp);
                            minder.fire('contentchange');
                        }

                        window.addEventListener('mousemove', onMouseMove);
                        window.addEventListener('mouseup', onMouseUp);
                    };

                    textBg.node.addEventListener('mousedown', dragHandler);
                    text.node.addEventListener('mousedown', dragHandler);
                }
            }
        });
    }

    let boundaryGroup = null;

    function renderCustomBoundaries() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;

        let boundaryGroup = null;
        minder.getConnectContainer().getShapes().forEach(shape => {
            if (shape.getId && shape.getId() === 'kitydd_boundaries') {
                boundaryGroup = shape;
            }
        });
        if (!boundaryGroup) {
            boundaryGroup = new kity.Group().setId('kitydd_boundaries');
            minder.getConnectContainer().addShape(boundaryGroup);
        }

        boundaryGroup.clear();

        function hexToRgba(hex, alpha) {
            hex = hex.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        minder.getRoot().traverse(node => {
            const boundaries = node.getData('boundaries') || [];
            if (!Array.isArray(boundaries)) return;

            boundaries.forEach(boundary => {
                const memberNodes = boundary.nodes.map(id => minder.getNodeById(id)).filter(n => n);
                if (memberNodes.length === 0) return;

                // Check visibility
                let isVisible = true;
                memberNodes.forEach(mn => {
                    let p = mn.parent;
                    while (p) {
                        if (p.isCollapsed()) isVisible = false;
                        p = p.parent;
                    }
                });
                if (!isVisible) return;

                let minX = Infinity, minY = Infinity;
                let maxX = -Infinity, maxY = -Infinity;

                memberNodes.forEach(mn => {
                    const box = mn.getLayoutBox();
                    if (box.left < minX) minX = box.left;
                    if (box.top < minY) minY = box.top;
                    if (box.right > maxX) maxX = box.right;
                    if (box.bottom > maxY) maxY = box.bottom;
                });

                const side = boundary.side || 'right';
                const padding = 10;
                const x = minX - padding;
                const y = minY - padding;
                const w = (maxX - minX) + padding * 2;
                const h = (maxY - minY) + padding * 2;

                const baseColor = boundary.color || '#a78bfa';

                const bg = new kity.Rect(w, h, x, y);
                bg.fill(hexToRgba(baseColor, 0.08));
                bg.stroke(hexToRgba(baseColor, 0.4), 1.5);
                bg.setRadius(8);
                bg.node.setAttribute('stroke-dasharray', '4,4');
                boundaryGroup.addShape(bg);

                const bracketPath = new kity.Path();
                let textX = 0, textY = 0;
                let textAnchor = 'start';

                if (side === 'right') {
                    const bracketX = x + w;
                    const bracketYStart = y + 5;
                    const bracketYEnd = y + h - 5;
                    const bracketYMid = y + h / 2;

                    bracketPath.setPathData([
                        'M', bracketX, bracketYStart,
                        'Q', bracketX + 10, bracketYStart, bracketX + 10, bracketYStart + 15,
                        'L', bracketX + 10, bracketYMid - 10,
                        'Q', bracketX + 10, bracketYMid, bracketX + 20, bracketYMid,
                        'Q', bracketX + 10, bracketYMid, bracketX + 10, bracketYMid + 10,
                        'L', bracketX + 10, bracketYEnd - 15,
                        'Q', bracketX + 10, bracketYEnd, bracketX, bracketYEnd
                    ]);
                    textX = bracketX + 25;
                    textY = bracketYMid + 4;
                    textAnchor = 'start';
                } else if (side === 'left') {
                    const bracketX = x;
                    const bracketYStart = y + 5;
                    const bracketYEnd = y + h - 5;
                    const bracketYMid = y + h / 2;

                    bracketPath.setPathData([
                        'M', bracketX, bracketYStart,
                        'Q', bracketX - 10, bracketYStart, bracketX - 10, bracketYStart + 15,
                        'L', bracketX - 10, bracketYMid - 10,
                        'Q', bracketX - 10, bracketYMid, bracketX - 20, bracketYMid,
                        'Q', bracketX - 10, bracketYMid, bracketX - 10, bracketYMid + 10,
                        'L', bracketX - 10, bracketYEnd - 15,
                        'Q', bracketX - 10, bracketYEnd, bracketX, bracketYEnd
                    ]);
                    textX = bracketX - 25;
                    textY = bracketYMid + 4;
                    textAnchor = 'end';
                } else if (side === 'top') {
                    const bracketY = y;
                    const bracketXStart = x + 5;
                    const bracketXEnd = x + w - 5;
                    const bracketXMid = x + w / 2;

                    bracketPath.setPathData([
                        'M', bracketXStart, bracketY,
                        'Q', bracketXStart, bracketY - 10, bracketXStart + 15, bracketY - 10,
                        'L', bracketXMid - 10, bracketY - 10,
                        'Q', bracketXMid, bracketY - 10, bracketXMid, bracketY - 20,
                        'Q', bracketXMid, bracketY - 10, bracketXMid + 10, bracketY - 10,
                        'L', bracketXEnd - 15, bracketY - 10,
                        'Q', bracketXEnd, bracketY - 10, bracketXEnd, bracketY
                    ]);
                    textX = bracketXMid;
                    textY = bracketY - 25;
                    textAnchor = 'middle';
                } else if (side === 'bottom') {
                    const bracketY = y + h;
                    const bracketXStart = x + 5;
                    const bracketXEnd = x + w - 5;
                    const bracketXMid = x + w / 2;

                    bracketPath.setPathData([
                        'M', bracketXStart, bracketY,
                        'Q', bracketXStart, bracketY + 10, bracketXStart + 15, bracketY + 10,
                        'L', bracketXMid - 10, bracketY + 10,
                        'Q', bracketXMid, bracketY + 10, bracketXMid, bracketY + 20,
                        'Q', bracketXMid, bracketY + 10, bracketXMid + 10, bracketY + 10,
                        'L', bracketXEnd - 15, bracketY + 10,
                        'Q', bracketXEnd, bracketY + 10, bracketXEnd, bracketY
                    ]);
                    textX = bracketXMid;
                    textY = bracketY + 30;
                    textAnchor = 'middle';
                }

                bracketPath.stroke(baseColor, 2);
                boundaryGroup.addShape(bracketPath);

                if (boundary.text) {
                    const text = new kity.Text(boundary.text);
                    text.fill(baseColor);
                    text.setSize(11);
                    text.setStyle({
                        fontFamily: 'Segoe UI, sans-serif',
                        fontSize: '12px',
                        fontWeight: '600'
                    });
                    text.setPosition(textX, textY);
                    text.node.setAttribute('text-anchor', textAnchor);
                    boundaryGroup.addShape(text);
                }
            });
        });
    }

    function createIsolatedNode() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;
        const root = minder.getRoot();

        const newNode = minder.createNode(null, root);
        newNode.setData('text', 'Isolated Topic');
        newNode.setData('connect', 'none');
        newNode.setData('isIsolated', true);
        newNode.setData('id', 'isolated-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        newNode.setData('layout_default_offset', { x: 300, y: 150 });

        minder.refresh();
        minder.select(newNode, true);
        minder.fire('contentchange');
    }

    function addLinkBetweenSelectedNodes() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;
        const selectedNodes = minder.getSelectedNodes();

        if (selectedNodes.length !== 2) {
            alert('Please select exactly two nodes to link them.');
            return;
        }

        const fromNode = selectedNodes[0];
        const toNode = selectedNodes[1];

        const fromId = fromNode.getData('id') || fromNode.setData('id', 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        const toId = toNode.getData('id') || toNode.setData('id', 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));

        const root = minder.getRoot();
        const relations = root.getData('relations') || [];

        let existingIndex = relations.findIndex(r => (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId));
        let existingRel = existingIndex !== -1 ? relations[existingIndex] : null;

        if (existingRel) {
            // Edit existing
            $('#kityddPromptInput').val(existingRel.text || '');
            window.kityddPrompt(
                "Edit Node Link",
                "Enter explanation text (optional)",
                function (text, side, style, color) {
                    existingRel.text = text;
                    existingRel.style = style;
                    existingRel.color = color;
                    root.setData('relations', relations);
                    minder.fire('contentchange');
                    renderCustomRelations();
                },
                false,
                null,
                true,
                function () {
                    // Delete callback
                    relations.splice(existingIndex, 1);
                    root.setData('relations', relations);
                    minder.fire('contentchange');
                    renderCustomRelations();
                },
                true,
                existingRel.style || 'dashed',
                existingRel.color || '#ef4444',
                existingRel.text || ''
            );
        } else {
            // Create new
            window.kityddPrompt(
                "Link Nodes",
                "Enter explanation text (optional)",
                function (text, side, style, color) {
                    relations.push({
                        from: fromId,
                        to: toId,
                        text: text,
                        style: style,
                        color: color
                    });
                    root.setData('relations', relations);
                    minder.fire('contentchange');
                    renderCustomRelations();
                },
                false,
                null,
                false,
                null,
                true,
                'dashed',
                '#ef4444'
            );
        }
    }

    function createBoundaryForSelectedNodes() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;
        const selectedNodes = minder.getSelectedNodes();

        if (selectedNodes.length < 2) {
            alert('Please select at least two sibling nodes to create a boundary.');
            return;
        }

        const parent = selectedNodes[0].parent;
        const allSiblings = selectedNodes.every(node => node.parent === parent);

        if (!allSiblings) {
            alert('All selected nodes must have the same parent.');
            return;
        }

        const parentNode = parent;
        const boundaries = parentNode.getData('boundaries') || [];

        // Check if there is an existing boundary containing exactly these nodes
        const selectedIds = selectedNodes.map(node => node.getData('id') || node.setData('id', 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)));
        const existingIdx = boundaries.findIndex(b => {
            if (b.nodes.length !== selectedIds.length) return false;
            const bSet = new Set(b.nodes);
            return selectedIds.every(id => bSet.has(id));
        });

        if (existingIdx !== -1) {
            const existingBoundary = boundaries[existingIdx];
            $('#kityddPromptInput').val(existingBoundary.text || '');
            window.kityddPrompt(
                "Edit Summary Boundary",
                "Enter summary explanation text",
                function (text, side, style, color) {
                    existingBoundary.text = text;
                    existingBoundary.side = side;
                    existingBoundary.color = color;
                    parentNode.setData('boundaries', boundaries);
                    minder.fire('contentchange');
                    renderCustomBoundaries();
                },
                true,
                existingBoundary.side || 'right',
                true,
                function () {
                    // Delete boundary
                    boundaries.splice(existingIdx, 1);
                    parentNode.setData('boundaries', boundaries);
                    minder.fire('contentchange');
                    renderCustomBoundaries();
                    showToast("Boundary removed.");
                },
                true,
                'solid',
                existingBoundary.color || '#a78bfa',
                existingBoundary.text || ''
            );
        } else {
            window.kityddPrompt(
                "Summary Boundary",
                "Enter summary explanation text",
                function (text, side, style, color) {
                    boundaries.push({
                        nodes: selectedIds,
                        text: text,
                        side: side || 'right',
                        color: color || '#a78bfa'
                    });

                    parentNode.setData('boundaries', boundaries);
                    minder.fire('contentchange');
                    renderCustomBoundaries();
                },
                true,
                'right',
                false,
                null,
                true,
                'solid',
                '#a78bfa'
            );
        }
    }

    function showToast(message) {
        const $toast = $('#kityddToast');
        if ($toast.length) {
            $toast.text(message).addClass('show');
            setTimeout(() => $toast.removeClass('show'), 2000);
        }
    }

    function detachSelectedNode() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;
        const selectedNodes = minder.getSelectedNodes();
        if (selectedNodes.length !== 1) {
            alert('Please select exactly one node to detach.');
            return;
        }

        const node = selectedNodes[0];
        if (node.isRoot()) {
            alert('Cannot detach the central root node.');
            return;
        }

        if (node.getData('isIsolated')) {
            alert('Node is already isolated.');
            return;
        }

        const root = minder.getRoot();
        const currentParent = node.parent;

        if (currentParent !== root) {
            minder.moveNode(node, root);
        }

        // Stagger to prevent overlapping
        let maxOffsetIndex = 0;
        root.children.forEach(child => {
            if (child.getData('isIsolated')) {
                maxOffsetIndex++;
            }
        });
        const offsetX = 300;
        const offsetY = 100 + (maxOffsetIndex * 80);

        node.setData('connect', 'none');
        node.setData('isIsolated', true);
        node.setData('layout_default_offset', { x: offsetX, y: offsetY });

        minder.refresh();
        minder.fire('contentchange');
        showToast('Node detached into an isolated topic.');
    }

    function reattachSelectedNode() {
        if (!editor || !editor.minder) return;
        const minder = editor.minder;
        const selectedNodes = minder.getSelectedNodes();
        if (selectedNodes.length !== 1) {
            alert('Please select exactly one node to reattach.');
            return;
        }

        const node = selectedNodes[0];
        if (!node.getData('isIsolated')) {
            alert('Node is not isolated.');
            return;
        }

        node.setData('connect', null);
        node.setData('isIsolated', null);
        node.setData('layout_default_offset', null);

        minder.refresh();
        minder.fire('contentchange');
        showToast('Node reattached to the main tree.');
    }

    function setupCustomFeaturesHook() {
        if (!editor || !editor.minder) {
            setTimeout(setupCustomFeaturesHook, 500);
            return;
        }
        var minder = editor.minder;

        // Implement the missing getNodeById method on the minder instance
        if (!minder.getNodeById) {
            minder.getNodeById = function (id) {
                var found = null;
                minder.getRoot().traverse(function (node) {
                    if (node.getData('id') === id) {
                        found = node;
                    }
                });
                return found;
            };
        }

        // Intercept updateConnect to hide connection lines for isolated nodes and "No Connection" nodes flicker-free
        const originalUpdateConnect = minder.updateConnect;
        minder.updateConnect = function (node) {
            originalUpdateConnect.apply(this, arguments);
            const connection = node._connection;
            if (connection) {
                const connectStyle = node.getConnect();
                if (connectStyle === 'none' || node.getData('isIsolated')) {
                    connection.setVisible(false);
                }
            }
        };

        // Intercept the template command to clear the root node's custom layout and connect style
        minder.on('beforeExecCommand', function (e) {
            if (e.commandName === 'template') {
                const root = minder.getRoot();
                if (root) {
                    root.setData('layout', null);
                    root.setData('connect', null);
                }
            }
        });

        minder.on('layoutallfinish viewchange contentchange', function () {
            // Ensure all nodes in the tree have a unique ID in their data (essential for stable relations and boundaries)
            minder.getRoot().traverse(function (node) {
                if (!node.getData('id')) {
                    node.setData('id', 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
                }
            });

            // Clean up broken relations
            const root = minder.getRoot();
            if (root) {
                let relations = root.getData('relations') || [];
                const activeRelations = relations.filter(rel => {
                    return minder.getNodeById(rel.from) && minder.getNodeById(rel.to);
                });
                if (activeRelations.length !== relations.length) {
                    root.setData('relations', activeRelations);
                }

                root.traverse(node => {
                    let boundaries = node.getData('boundaries') || [];
                    const activeBoundaries = boundaries.filter(b => {
                        return b.nodes.every(id => minder.getNodeById(id));
                    });
                    if (activeBoundaries.length !== boundaries.length) {
                        node.setData('boundaries', activeBoundaries);
                    }
                });
            }

            renderCustomRelations();
            renderCustomBoundaries();
        });

        // Register connect type 'none' and 'line' just in case
        var connectProvider = kityminder.Connect || kityminder.connect;
        if (window.kityminder && connectProvider) {
            try {
                connectProvider.register("none", function (node, parent, connection) {
                    connection.setPathData([]);
                });
                connectProvider.register("line", function (node, parent, connection) {
                    connection.setPathData(["M", parent.getLayoutVertexOut(), "L", node.getLayoutVertexIn()]);
                });
            } catch (e) {}
        }

        // ---------------------------------------------------------
        // ADD NEW COMPETITIVE UI/UX FEATURES
        // ---------------------------------------------------------
        // 1. Zoom In
        $('#btnZoomIn').off('click').on('click', () => {
            minder.execCommand('zoomIn');
            showToast("🔍 Zoomed In");
        });

        // 2. Zoom Out
        $('#btnZoomOut').off('click').on('click', () => {
            minder.execCommand('zoomOut');
            showToast("🔍 Zoomed Out");
        });

        // 3. Zoom Fit (Camera)
        $('#btnZoomFit').off('click').on('click', () => {
            minder.execCommand('camera', minder.getRoot(), 200);
            showToast("📺 Zoomed to Fit Screen");
        });

        // 4. Zoom Actual (100%)
        $('#btnZoomActual').off('click').on('click', () => {
            minder.execCommand('zoom', 100);
            showToast("💯 Zoomed to 100%");
        });

        // 5. Zen Focus Mode Toggle
        $('#btnZenToggle').off('click').on('click', () => {
            $('body').toggleClass('zen-focus-active');
            const isZen = $('body').hasClass('zen-focus-active');
            showToast(isZen ? "🧘 Zen Focus Mode Enabled" : "👁️ Zen Focus Mode Disabled");
        });

        // 6. Copy Indented Text Outline
        function generateIndentedOutline(node, depth = 0) {
            const indent = "    ".repeat(depth);
            let text = node.data.text || 'Topic';
            text = text.replace(/[*_#`~\-]/g, '');
            let outline = indent + "- " + text + "\n";
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    outline += generateIndentedOutline(child, depth + 1);
                });
            }
            return outline;
        }

        $('#btnCopyOutline').off('click').on('click', () => {
            const root = minder.getRoot();
            if (!root) {
                showToast("Empty Mindmap");
                return;
            }
            const outlineText = generateIndentedOutline(root, 0);
            navigator.clipboard.writeText(outlineText).then(() => {
                showToast("📋 Outline Copied to Clipboard!");
            }).catch(err => {
                console.error("Clipboard copy failed:", err);
                showToast("Failed to copy outline.");
            });
        });

        // 7. Node Layout Select change wiring
        $('#diyNodeLayoutSelect').off('change').on('change', function () {
            const selectedNodes = minder.getSelectedNodes();
            if (selectedNodes.length === 0) return;

            const layoutVal = $(this).val() || null;
            selectedNodes.forEach(node => {
                node.setData('layout', layoutVal);
            });

            minder.refresh();
            minder.layout(200);
            minder.fire('contentchange');
            showToast("Branch layout updated.");
        });

        // 7.5 Connection Line Style Select change wiring
        $('#diyNodeConnectSelect').off('change').on('change', function () {
            const selectedNodes = minder.getSelectedNodes();
            if (selectedNodes.length === 0) return;

            const connectVal = $(this).val() || null;
            selectedNodes.forEach(node => {
                node.setData('connect', connectVal);
            });

            minder.refresh();
            minder.layout(200);
            minder.fire('contentchange');
            showToast("Branch connection style updated.");
        });

        // 8. Detach / Reattach actions wiring
        $('#btnDetachNode').off('click').on('click', detachSelectedNode);
        $('#btnReattachNode').off('click').on('click', reattachSelectedNode);

        // 9. Synchronize selection changes to update sidebar controls
        minder.on('selectionchange', function () {
            // Instantly re-render custom relations to update drag handles for selected nodes
            renderCustomRelations();

            const selectedNodes = minder.getSelectedNodes();
            if (selectedNodes.length === 1) {
                const node = selectedNodes[0];
                if (node.isRoot()) {
                    $('#btnDetachNode').hide();
                    $('#btnReattachNode').hide();
                    $('#diyNodeLayoutSelect').val('');
                    const connect = node.getData('connect') || '';
                    $('#diyNodeConnectSelect').val(connect);
                } else if (node.getData('isIsolated')) {
                    $('#btnDetachNode').hide();
                    $('#btnReattachNode').show();
                    $('#diyNodeLayoutSelect').val('');
                    const connect = node.getData('connect') || '';
                    $('#diyNodeConnectSelect').val(connect);
                } else {
                    $('#btnDetachNode').show();
                    $('#btnReattachNode').hide();
                    const layout = node.getData('layout') || '';
                    $('#diyNodeLayoutSelect').val(layout);
                    const connect = node.getData('connect') || '';
                    $('#diyNodeConnectSelect').val(connect);
                }
            } else {
                $('#btnDetachNode').hide();
                $('#btnReattachNode').hide();
                $('#diyNodeLayoutSelect').val('');
                $('#diyNodeConnectSelect').val('');
            }
        });
    }

    // ---------------------------------------------------------
    // 5. EDITOR INITIALIZATION & STABLE BOOTSTRAPPING
    // ---------------------------------------------------------
    function initKityDDEngine() {
        if (window.kityddEngineInitialized) return;
        if (editor && editor.minder) {
            window.kityddEngineInitialized = true;
            // Initialize with one empty session
            createNewSession();
            setupTextAlignHook();
            setupCustomFeaturesHook();
            refreshNavigator();

            // Track changes for current session
            editor.minder.on('contentchange', () => {
                const currentSession = sessions.find(s => s.id === activeSessionId);
                if (currentSession && !currentSession.isModified) {
                    currentSession.isModified = true;
                    renderTabs();
                    ipcRenderer.send('set-modified-status', true);
                }
            });

            // Set initial theme mode class
            const initialTheme = editor.minder.getTheme();
            const isDark = initialTheme.includes('dark') || initialTheme.includes('ocean') || initialTheme.includes('monochrome');
            $('body').toggleClass('dark-mode-active', isDark);

            editor.minder.on('themechange', function (e) {
                if (e && e.theme) {
                    const themeName = e.theme;
                    const isDark = themeName.includes('dark') || themeName.includes('ocean') || themeName.includes('monochrome');
                    $('body').toggleClass('dark-mode-active', isDark);
                }
            });
        }
    }

    window.onload = function () {
        initKityDDEngine();
        // Fallback polling to guarantee bootstrapping stability
        let pollCount = 0;
        const interval = setInterval(() => {
            if (window.kityddEngineInitialized) {
                clearInterval(interval);
            } else if (pollCount++ > 30) {
                clearInterval(interval);
                console.error("KityDD bootstrap timeout: editor components failed to mount.");
            } else {
                initKityDDEngine();
            }
        }, 150);

        $(".minder-editor").on('mousewheel DOMMouseScroll', function (event) {
            if (event.ctrlKey == true) {
                event.preventDefault();
                if (event.originalEvent.wheelDelta > 0) editor.minder.execCommand('zoomIn');
                else editor.minder.execCommand('zoomOut');
            }
        });
    }

    function refreshNavigator() {
        if (editor && editor.minder) {
            try {
                setTimeout(() => {
                    if (editor.minder.getRenderContainer()) {
                        editor.minder.fire('layout');
                        editor.minder.fire('viewchange');
                    }
                }, 800);
            } catch (e) { }
        }
    }

    // Sidebar hooks
    $('.diy-insert').on('click', function () {
        let type = $(this).data('type');
        ipcRenderer.emit('menu-command', null, 'insert-' + type);
    });

    $('.diy-export').on('click', function () {
        let type = $(this).data('type');
        ipcRenderer.emit('menu-command', null, 'export-' + type);
    });

    $('.diy-action').on('click', function () {
        let action = $(this).data('action');
        if (action === 'isolated') {
            createIsolatedNode();
        } else if (action === 'link-nodes') {
            addLinkBetweenSelectedNodes();
        } else if (action === 'boundary') {
            createBoundaryForSelectedNodes();
        }
    });

    $('.file-input-wrapper .diy-btn').on('click', function () {
        ipcRenderer.emit('menu-command', null, 'open');
    });

})();
