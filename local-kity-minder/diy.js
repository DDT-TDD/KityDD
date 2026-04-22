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
    // 1. SESSION MANAGEMENT
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
    window.kityddPrompt = function (title, placeholder, callback) {
        $('#kityddPromptLabel').text(title);
        $('#kityddPromptInput').attr('placeholder', placeholder).val('');

        $('#kityddPromptConfirm').off('click').on('click', function () {
            let val = $('#kityddPromptInput').val();
            $('#kityddPromptModal').modal('hide');
            if (val && callback) callback(val);
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
                    } else if (rExt === 'json' || rExt === 'km') {
                        try {
                            let jsonData = JSON.parse(recentResult.content);
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
                        } else if (ext === 'json' || ext === 'km') {
                            try {
                                let jsonData = JSON.parse(openResult.content);
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
                    const content = await editor.minder.exportData('json');
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
            case 'export-md':
            case 'export-png':
            case 'export-svg':
                let type = command.replace('export-', '');
                if (command === 'save' || command === 'save-as') { type = 'json'; }
                let exportType = type === 'md' ? 'markdown' : type;

                editor.minder.exportData(exportType).then(async function (content) {
                    const defaultName = currentSession.name.includes('.') ? currentSession.name.split('.')[0] : currentSession.name;
                    const resultPath = await ipcRenderer.invoke('save-file-dialog', {
                        data: content,
                        isBinary: type === 'png',
                        options: { defaultPath: defaultName + '.' + type, filters: [{ name: exportType.toUpperCase(), extensions: [type] }] }
                    });

                    if (resultPath && (command === 'save' || command === 'save-as')) {
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
    // 5. EDITOR INITIALIZATION
    // ---------------------------------------------------------
    window.onload = function () {
        if (editor && editor.minder) {
            // Initialize with one empty session
            createNewSession();
            setupTextAlignHook();
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
        }

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

    $('.file-input-wrapper .diy-btn').on('click', function () {
        ipcRenderer.emit('menu-command', null, 'open');
    });

})();
