(function () {
    const { ipcRenderer } = require('electron');

    // Remove old inline DIY components since we are using Native Menus 
    // and full KityMinder UI elements.
    $('.diy').remove();

    // ---------------------------------------------------------
    // 1. ELECTRON NATIVE MENU HOOKS
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

    ipcRenderer.on('menu-command', async (event, command) => {
        if (!editor || !editor.minder) return;

        switch (command) {
            case 'new':
                editor.minder.importData('json', JSON.stringify({
                    "root": { "data": { "id": "root", "created": Date.now(), "text": "Central Topic" }, "children": [] },
                    "template": "default", "theme": "fresh-green", "version": "1.4.50"
                }));
                break;
            case 'open':
                const openResult = await ipcRenderer.invoke('open-file-dialog');
                if (openResult) {
                    let ext = openResult.extension;
                    if (ext === 'xmind') {
                        importXMindFromBase64(openResult.content);
                    } else if (ext === 'mmap' || ext === 'mm') {
                        importFreeMindContent(openResult.content);
                    } else if (ext === 'md' || ext === 'markdown') {
                        editor.minder.importData('markdown', openResult.content);
                    } else if (ext === 'json' || ext === 'km') {
                        try {
                            let jsonData = JSON.parse(openResult.content);
                            if (jsonData.root) {
                                editor.minder.importData('json', JSON.stringify(jsonData));
                            } else {
                                editor.minder.importData('json', JSON.stringify({ root: jsonData, template: 'default', theme: 'fresh-green', version: '1.4.50' }));
                            }
                        } catch (err) {
                            editor.minder.importData('json', openResult.content);
                        }
                    } else {
                        editor.minder.importData(ext, openResult.content);
                    }
                }
                break;
            case 'save':
            case 'save-as':
            case 'export-json':
            case 'export-md':
            case 'export-png':
            case 'export-svg':
                let type = command.replace('export-', '');
                if (command === 'save' || command === 'save-as') { type = 'json'; }
                let exportType = type === 'md' ? 'markdown' : type;

                editor.minder.exportData(exportType).then(async function (content) {
                    await ipcRenderer.invoke('save-file-dialog', {
                        data: content,
                        isBinary: type === 'png' || type === 'pdf',
                        options: { defaultPath: 'mindmap.' + type, filters: [{ name: exportType.toUpperCase(), extensions: [type] }] }
                    });
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
                let cmd = command;
                editor.minder.execCommand(cmd);
                break;
        }
    });

    // ---------------------------------------------------------
    // 2. HTML5 IMPORT / EXPORT / INSERT (With XMind Blob Support)
    // ---------------------------------------------------------

    // Handle Insert from Sidebar
    $('.diy-insert').on('click', function (event) {
        let type = $(this).data('type');
        ipcRenderer.emit('menu-command', null, 'insert-' + type);
    });

    // Handle Export
    $('.diy-export').on('click', function (event) {
        let type = $(this).data('type');
        ipcRenderer.emit('menu-command', null, 'export-' + type);
    });

    // Make the Import button trigger the native open dialog directly
    $('.file-input-wrapper .diy-btn').on('click', function () {
        ipcRenderer.emit('menu-command', null, 'open');
    });

    // ---------------------------------------------------------
    // Custom XMind & MindManager Importers
    // ---------------------------------------------------------

    function importXMindFromBase64(base64Content) {
        if (typeof JSZip === 'undefined') {
            alert('JSZip library not loaded.');
            return;
        }

        JSZip.loadAsync(base64Content, { base64: true }).then(function (zip) {
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
            editor.minder.importData('json', JSON.stringify({ root: mindmapData, template: 'default', theme: 'fresh-green', version: '1.4.50' }));
        }).catch(function (error) {
            alert('Failed to import XMind file: ' + error.message);
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
            $('#fileImport').val('');
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
    // 3. TEXT CENTERING (Ported from MarkDD)
    // ---------------------------------------------------------
    var textCenteringEnabled = true;

    $(document).on('keydown', function (e) {
        // Ctrl+Shift+C to toggle text centering
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
            e.preventDefault();
            textCenteringEnabled = !textCenteringEnabled;
            applyTextCenteringToAllNodes();
            showCenteringToast(textCenteringEnabled ? 'Text Centering: ON' : 'Text Centering: OFF');
        }
    });

    function showCenteringToast(message) {
        var existingToast = document.getElementById('centering-toast');
        if (existingToast) existingToast.remove();

        var toast = document.createElement('div');
        toast.id = 'centering-toast';
        toast.textContent = message;
        toast.style.cssText = 'position: fixed; top: 60px; left: 50%; transform: translateX(-50%); ' +
            'background: rgba(0,0,0,0.8); color: white; padding: 8px 16px; border-radius: 4px; ' +
            'font-size: 13px; z-index: 10000; transition: opacity 0.3s;';
        document.body.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () { toast.remove(); }, 300);
        }, 1500);
    }

    function applyTextCenteringToAllNodes() {
        if (!editor || !editor.minder) return;
        try {
            var paper = document.querySelector('.minder-editor svg') || document.querySelector('svg.kity-paper');
            if (!paper) return;

            var textGroups = paper.querySelectorAll('g[id^="node_text"]');
            textGroups.forEach(function (textGroup) {
                var textElements = textGroup.querySelectorAll('text');
                if (textElements.length > 1) {
                    centerTextElements(textElements, textCenteringEnabled);
                }
            });
        } catch (e) { }
    }

    function centerTextElements(textElements, shouldCenter) {
        if (!textElements || textElements.length === 0) return;
        var maxWidth = 0;
        textElements.forEach(function (textEl) {
            try {
                var bbox = textEl.getBBox();
                if (bbox.width > maxWidth) maxWidth = bbox.width;
            } catch (e) { }
        });

        textElements.forEach(function (textEl) {
            try {
                if (shouldCenter) {
                    textEl.setAttribute('x', maxWidth / 2);
                    textEl.setAttribute('text-anchor', 'middle');
                } else {
                    textEl.setAttribute('x', '0');
                    textEl.setAttribute('text-anchor', 'start');
                }
            } catch (e) { }
        });
    }

    function setupTextCenteringHook() {
        if (!editor || !editor.minder) {
            setTimeout(setupTextCenteringHook, 500);
            return;
        }

        // Debounce timer to fix slowness
        let centeringTimeout = null;
        editor.minder.on('contentchange layoutfinish noderender', function () {
            if (textCenteringEnabled) {
                if (centeringTimeout) clearTimeout(centeringTimeout);
                centeringTimeout = setTimeout(applyTextCenteringToAllNodes, 250);
            }
        });
        setTimeout(applyTextCenteringToAllNodes, 200);
    }

    // ---------------------------------------------------------
    // 4. FREEMIND IMPORT (Ported from MarkDD)
    // ---------------------------------------------------------
    function importFreeMindContent(content) {
        try {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(content, 'text/xml');
            let parseError = xmlDoc.querySelector('parsererror');
            if (parseError) throw new Error('Invalid XML format');

            let kityMinderData = convertFreeMindToKityMinder(xmlDoc);
            editor.minder.importJson(kityMinderData);
        } catch (error) {
            alert('Failed to import FreeMind file: ' + error.message);
        }
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


    // ---------------------------------------------------------
    // 5. EDITOR INITIALIZATION
    // ---------------------------------------------------------
    window.onload = function () {
        let init_data_json = {
            "root": {
                "data": { "id": "cmhllt94xb40", "created": 1661683403686, "text": "Central Topic" },
                "children": [
                    { "data": { "id": "cybyhdvw3qg0", "created": 1704984272746, "text": "Topic1" }, "children": [] },
                    { "data": { "id": "cybyhfxtzd40", "created": 1704984277217, "text": "Topic2" }, "children": [] }
                ]
            },
            "template": "default", "theme": "fresh-green", "version": "1.4.50"
        };

        if (editor && editor.minder) {
            editor.minder.importData('json', JSON.stringify(init_data_json)).then(function (data) {
                setupTextCenteringHook();
                refreshNavigator();
            });
        }

        // Ctrl+Scroll Zoom
        $(".minder-editor").on('mousewheel DOMMouseScroll', function (event) {
            if (event.ctrlKey == true) {
                event.preventDefault();
                if (event.originalEvent.wheelDelta > 0) editor.minder.execCommand('zoomIn');
                else editor.minder.execCommand('zoomOut');
            }
        });
    }

    // Attempt to safely invoke ViewChange to kick the Navigator mini-window into rendering
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

})();
