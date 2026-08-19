// Painter App - Main JavaScript

class PainterApp {
    constructor() {
        // Canvas elements
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.textCanvas = document.getElementById('textCanvas');
        this.textCtx = this.textCanvas.getContext('2d');
        this.placeholder = document.getElementById('placeholder');

        // Toolbar
        this.toolButtons = document.querySelectorAll('.tool-btn');
        this.colorPicker = document.getElementById('colorPicker');
        this.presetColors = document.querySelectorAll('.color-preset');
        this.lineWidthValue = document.getElementById('lineWidthValue');
        this.thicknessButtons = document.querySelectorAll('.thickness-btn');
        this.blockSizeInput = document.getElementById('blockSize');
        this.blockSizeValue = document.getElementById('blockSizeValue');
        this.arrowStyleSelect = document.getElementById('arrowStyle');

        // Action buttons
        this.undoBtn = document.getElementById('undoBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Selection action bar
        this.selectionActions = document.getElementById('selectionActions');
        this.selMoveBtn = document.getElementById('selMoveBtn');
        this.selCutBtn = document.getElementById('selCutBtn');
        this.selEraseBtn = document.getElementById('selEraseBtn');

        // Status
        this.statusText = document.getElementById('statusText');
        this.imageSize = document.getElementById('imageSize');

        // Text toolbar elements
        this.textToolbar = document.getElementById('textToolbar');
        this.textToolBtn = document.getElementById('textToolBtn');
        this.textPanelIndicator = document.getElementById('textPanelIndicator');
        this.contextOptions = document.querySelectorAll('.context-option');
        this.fontFamilySelect = document.getElementById('fontFamily');
        this.fontSizeInput = document.getElementById('textFontSize');
        this.boldBtn = document.getElementById('boldBtn');
        this.italicBtn = document.getElementById('italicBtn');
        this.underlineBtn = document.getElementById('underlineBtn');
        this.alignLeftBtn = document.getElementById('alignLeftBtn');
        this.alignCenterBtn = document.getElementById('alignCenterBtn');
        this.alignRightBtn = document.getElementById('alignRightBtn');
        this.markerSizeInput = document.getElementById('markerSizeInput');
        this.markerSizeValue = document.getElementById('markerSizeValue');
        this.markerDescriptionInput = document.getElementById('markerDescriptionInput');
        this.createMarkersBtn = document.getElementById('createMarkersBtn');
        this.copyMarkerTemplateBtn = document.getElementById('copyMarkerTemplateBtn');
        this.insertMarkerTemplateBtn = document.getElementById('insertMarkerTemplateBtn');
        this.markerList = document.getElementById('markerList');

        // Drawing state
        this.currentTool = 'select';
        this.currentColor = '#ff0000';
        this.lineWidth = 5;
        this.blockSize = 15;
        this.arrowStyle = 'plain';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.hasImage = false;
        this.baseImage = null;

        // History
        this.history = [];
        this.maxHistory = 20;

        // Selection
        this.selection = null;

        // Selection move (이동 도구) / band cut (잘라내기 도구)
        this.isMovingSelection = false;
        this.moveFloatCanvas = null;
        this.moveBaseState = null;
        this.moveOriginX = 0;
        this.moveOriginY = 0;
        this.moveGrabDX = 0;
        this.moveGrabDY = 0;
        this.moveDragged = false;

        // Text formatting defaults
        this.textFontFamily = 'Pretendard';
        this.textFontSize = 24;
        this.textBold = false;
        this.textItalic = false;
        this.textUnderline = false;
        this.textAlign = 'left';

        // Zoom
        this.zoomLevel = 1.0;
        this.canvasWrapper = document.querySelector('.canvas-wrapper');
        this.zoomLevelLabel = document.getElementById('zoomLevelLabel');

        // Resize modal
        this.resizeModal = document.getElementById('resizeModal');
        this.resizeWidthInput = document.getElementById('resizeWidth');
        this.resizeHeightInput = document.getElementById('resizeHeight');
        this.aspectLockBtn = document.getElementById('aspectLockBtn');
        this.resizeInfo = document.getElementById('resizeInfo');
        this.aspectLocked = true;

        // Output preset: "format:scale:quality"
        this.outputPreset = 'jpeg:1:0.75';
        this.outputSizeLabel = document.getElementById('outputSizeLabel');

        // Text object system
        this.textOverlay = null;
        this.textObjects = [];
        this.markerObjects = [];
        this.selectedTextId = null;
        this.selectedMarkerId = null;
        this.isDraggingText = false;
        this.isDraggingMarker = false;
        this.textDragMoved = false;
        this.markerDragMoved = false;
        this._textWasSelected = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.textIdCounter = 0;
        this.markerIdCounter = 0;
        this.markerSize = 28;
        this.textToolbarExpanded = true;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updatePresetColorActive();
        this.updateTextToolbarUI();
        this.updateContextualToolbar();
    }

    bindEvents() {
        document.addEventListener('paste', (e) => this.handlePaste(e));

        this.toolButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        this.colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            this.updatePresetColorActive();
        });

        this.presetColors.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.dataset.color;
                this.colorPicker.value = btn.dataset.color;
                this.updatePresetColorActive();
            });
        });

        this.thicknessButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.lineWidth = parseInt(btn.dataset.width);
                this.lineWidthValue.textContent = `${this.lineWidth}px`;
                this.thicknessButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        this.blockSizeInput.addEventListener('input', (e) => {
            this.blockSize = parseInt(e.target.value);
            this.blockSizeValue.textContent = `${this.blockSize}px`;
        });

        this.arrowStyleSelect.addEventListener('change', (e) => {
            this.arrowStyle = e.target.value;
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

        // Action buttons
        this.undoBtn.addEventListener('click', () => this.undo());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.downloadBtn.addEventListener('click', () => this.download());

        // Resize modal
        document.getElementById('resizeBtn').addEventListener('click', () => this.openResizeModal());
        document.getElementById('resizeCancelBtn').addEventListener('click', () => this.closeResizeModal());
        document.getElementById('resizeConfirmBtn').addEventListener('click', () => this.applyResize());
        this.resizeModal.addEventListener('click', (e) => { if (e.target === this.resizeModal) this.closeResizeModal(); });

        this.aspectLockBtn.addEventListener('click', () => {
            this.aspectLocked = !this.aspectLocked;
            this.aspectLockBtn.classList.toggle('active', this.aspectLocked);
            this.aspectLockBtn.textContent = this.aspectLocked ? '🔒 비율 고정' : '🔓 비율 해제';
        });

        this.resizeWidthInput.addEventListener('input', () => {
            if (this.aspectLocked && this.hasImage) {
                const ratio = this.canvas.height / this.canvas.width;
                this.resizeHeightInput.value = Math.round(this.resizeWidthInput.value * ratio);
            }
            this.updateResizeInfo();
        });

        this.resizeHeightInput.addEventListener('input', () => {
            if (this.aspectLocked && this.hasImage) {
                const ratio = this.canvas.width / this.canvas.height;
                this.resizeWidthInput.value = Math.round(this.resizeHeightInput.value * ratio);
            }
            this.updateResizeInfo();
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const scale = parseFloat(btn.dataset.scale);
                this.resizeWidthInput.value = Math.round(this.canvas.width * scale);
                this.resizeHeightInput.value = Math.round(this.canvas.height * scale);
                this.updateResizeInfo();
            });
        });

        // Output preset
        document.getElementById('outputPreset').addEventListener('change', (e) => {
            this.outputPreset = e.target.value;
            this.updateOutputSizeLabel();
        });

        // Zoom buttons
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomResetBtn').addEventListener('click', () => this.zoomReset());

        // Wheel zoom (Ctrl/Cmd + scroll)
        document.querySelector('.canvas-container').addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) this.zoomIn();
                else this.zoomOut();
            }
        }, { passive: false });

        // 선택 영역 실행 바
        this.selMoveBtn.addEventListener('click', () => {
            if (!this.selection) return;
            this.selectTool('move');
            this.updateStatus('선택 영역 안쪽을 드래그하면 그대로 옮겨집니다');
            this.showToast('선택 영역 안쪽을 드래그하세요');
        });
        this.selCutBtn.addEventListener('click', () => this.cutBandFromSelection());
        this.selCutBtn.addEventListener('mouseenter', () => this.previewCutBand(true));
        this.selCutBtn.addEventListener('mouseleave', () => this.previewCutBand(false));
        this.selEraseBtn.addEventListener('click', () => this.deleteSelection());
        window.addEventListener('resize', () => this.positionSelectionActions());
        document.querySelector('.canvas-container').addEventListener('scroll', () => this.positionSelectionActions());

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // --- Text toolbar events ---
        this.fontFamilySelect.addEventListener('change', (e) => {
            this.textFontFamily = e.target.value;
            e.target.style.fontFamily = `"${this.textFontFamily}", sans-serif`;
            this.applyToolbarToSelectedText();
        });

        this.fontSizeInput.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            if (val >= 8 && val <= 200) {
                this.textFontSize = val;
                this.applyToolbarToSelectedText();
            }
        });
        // Also apply on Enter key inside size input
        this.fontSizeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.target.blur(); }
            e.stopPropagation();
        });

        this.boldBtn.addEventListener('click', () => {
            this.textBold = !this.textBold;
            this.boldBtn.classList.toggle('active', this.textBold);
            this.applyToolbarToSelectedText();
        });

        this.italicBtn.addEventListener('click', () => {
            this.textItalic = !this.textItalic;
            this.italicBtn.classList.toggle('active', this.textItalic);
            this.applyToolbarToSelectedText();
        });

        this.underlineBtn.addEventListener('click', () => {
            this.textUnderline = !this.textUnderline;
            this.underlineBtn.classList.toggle('active', this.textUnderline);
            this.applyToolbarToSelectedText();
        });

        this.alignLeftBtn.addEventListener('click', () => this.setTextAlign('left'));
        this.alignCenterBtn.addEventListener('click', () => this.setTextAlign('center'));
        this.alignRightBtn.addEventListener('click', () => this.setTextAlign('right'));

        this.markerSizeInput.addEventListener('input', (e) => {
            this.markerSize = parseInt(e.target.value) || 28;
            this.markerSizeValue.textContent = `${this.markerSize}px`;
            this.renderTextLayer();
            this.renderMarkerList();
        });
        this.markerSizeInput.addEventListener('change', () => {
            if (this.hasImage) this.saveState();
        });
        this.createMarkersBtn.addEventListener('click', () => this.createMarkersFromDescription());
        this.copyMarkerTemplateBtn.addEventListener('click', () => this.copyMarkerNumberTemplate());
        this.insertMarkerTemplateBtn.addEventListener('click', () => this.insertMarkerNumberTemplate());
        this.markerDescriptionInput.addEventListener('keydown', (e) => e.stopPropagation());
        this.markerDescriptionInput.addEventListener('paste', (e) => e.stopPropagation());
    }

    // ---------- Tool management ----------

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                this.loadImage(file);
                e.preventDefault();
                break;
            }
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.baseImage = img;
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.overlayCanvas.width = img.width;
                this.overlayCanvas.height = img.height;
                this.textCanvas.width = img.width;
                this.textCanvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                this.hasImage = true;
                this.textObjects = [];
                this.markerObjects = [];
                this.selectedTextId = null;
                this.selectedMarkerId = null;
                this.markerIdCounter = 0;
                this.renderMarkerList();
                this.placeholder.classList.add('hidden');
                this.canvas.style.display = 'block';
                this.overlayCanvas.style.display = 'block';
                this.textCanvas.style.display = 'block';
                this.saveState();
                this.updateStatus('이미지 로드됨');
                const sizeMB = (file.size / 1024 / 1024).toFixed(1);
                this.imageSize.textContent = `${img.width} x ${img.height} · 원본 ${sizeMB}MB`;
                this.updateOutputSizeLabel();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    selectTool(tool) {
        if (tool === 'text' && this.currentTool === 'text') {
            this.dismissTextOverlay();
            this.setTextToolbarExpanded(!this.textToolbarExpanded);
            this.updateStatus(this.textToolbarExpanded ? '텍스트 서식 펼침' : '텍스트 서식 접힘');
            return;
        }

        const prevTool = this.currentTool;
        this.dismissTextOverlay();
        this.selectedTextId = null;
        this.selectedMarkerId = null;
        this.renderTextLayer();
        this.renderMarkerList();
        this.currentTool = tool;
        this.toolButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        // 선택 계열 도구끼리 전환할 때는 선택 영역을 유지 (선택 -> 이동 / 잘라내기 연결)
        const selectionTools = ['select', 'move', 'cutband'];
        if (this.selection && selectionTools.includes(tool) && selectionTools.includes(prevTool)) {
            const sel = this.selection;
            this.clearOverlay();
            this.drawSelectionPreview(sel.x, sel.y, sel.width, sel.height);
            this.showSelectionActions();
        } else {
            this.selection = null;
            this.clearOverlay();
            this.hideSelectionActions();
        }
        this.canvas.style.cursor = this.getToolCursor(tool);
        if (tool === 'text') this.textToolbarExpanded = true;
        this.updateContextualToolbar();
        this.updateStatus(`도구: ${this.getToolName(tool)}`);
    }

    updateContextualToolbar() {
        this.contextOptions.forEach(group => {
            const tools = (group.dataset.tools || '').split(/\s+/);
            group.classList.toggle('visible', tools.includes(this.currentTool));
        });
        const showTextToolbar = this.currentTool === 'text' && this.textToolbarExpanded;
        this.textToolbar.classList.toggle('visible', showTextToolbar);
        this.textToolbar.setAttribute('aria-hidden', String(!showTextToolbar));
        this.textToolBtn.setAttribute('aria-expanded', String(showTextToolbar));
        this.textPanelIndicator.textContent = showTextToolbar ? '⌃' : '⌄';
    }

    setTextToolbarExpanded(expanded) {
        this.textToolbarExpanded = expanded;
        this.updateContextualToolbar();
    }

    getToolName(tool) {
        const names = {
            select: '선택', rectangle: '사각형', arrow: '화살표',
            mosaic: '모자이크', erase: '삭제',
            move: '이동', cutband: '잘라내기',
            leftclick: '좌클릭 아이콘', rightclick: '우클릭 아이콘', text: '텍스트'
        };
        return names[tool] || tool;
    }

    getToolCursor(tool) {
        if (tool === 'cutband') return 'row-resize';
        if (tool === 'move') return 'move';
        return 'crosshair';
    }

    updatePresetColorActive() {
        this.presetColors.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.currentColor);
        });
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    // ---------- Mouse event handlers ----------

    handleMouseDown(e) {
        if (!this.hasImage) return;
        const coords = this.getCanvasCoords(e);

        if (this.currentTool === 'leftclick') {
            this.drawMouseIcon(coords.x, coords.y, 'left');
            this.saveState();
            this.updateStatus('좌클릭 아이콘 추가됨');
            return;
        }
        if (this.currentTool === 'rightclick') {
            this.drawMouseIcon(coords.x, coords.y, 'right');
            this.saveState();
            this.updateStatus('우클릭 아이콘 추가됨');
            return;
        }
        if (this.currentTool === 'text') {
            const markerHit = this.getMarkerObjectAt(coords.x, coords.y);
            if (markerHit) {
                this.selectedTextId = null;
                this.selectedMarkerId = markerHit.id;
                this.isDraggingMarker = true;
                this.markerDragMoved = false;
                this.dragOffsetX = coords.x - markerHit.x;
                this.dragOffsetY = coords.y - markerHit.y;
                this.renderTextLayer();
                this.renderMarkerList();
                return;
            }

            const hit = this.getTextObjectAt(coords.x, coords.y);
            if (hit) {
                this._textWasSelected = (hit.id === this.selectedTextId);
                this.selectedTextId = hit.id;
                this.selectedMarkerId = null;
                this.isDraggingText = true;
                this.textDragMoved = false;
                this.dragOffsetX = coords.x - hit.x;
                this.dragOffsetY = coords.y - hit.y;
                this.syncToolbarToObj(hit);
                this.renderTextLayer();
                this.renderMarkerList();
            } else {
                this.selectedTextId = null;
                this.selectedMarkerId = null;
                this.renderTextLayer();
                this.renderMarkerList();
                this.showTextOverlay(coords.x, coords.y, e.clientX, e.clientY);
            }
            return;
        }

        if (this.currentTool === 'move' && this.isInsideSelection(coords.x, coords.y)) {
            if (this.beginSelectionMove(coords)) return;
        }

        this.hideSelectionActions();
        this.isDrawing = true;
        this.startX = coords.x;
        this.startY = coords.y;
        this.tempState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    handleMouseMove(e) {
        if (!this.hasImage) return;

        if (this.isDraggingText && this.currentTool === 'text') {
            const coords = this.getCanvasCoords(e);
            const obj = this.textObjects.find(o => o.id === this.selectedTextId);
            if (obj) {
                obj.x = coords.x - this.dragOffsetX;
                obj.y = coords.y - this.dragOffsetY;
                this.textDragMoved = true;
                this.renderTextLayer();
            }
            return;
        }

        if (this.isDraggingMarker && this.currentTool === 'text') {
            const coords = this.getCanvasCoords(e);
            const obj = this.markerObjects.find(o => o.id === this.selectedMarkerId);
            if (obj) {
                obj.x = coords.x - this.dragOffsetX;
                obj.y = coords.y - this.dragOffsetY;
                this.markerDragMoved = true;
                this.renderTextLayer();
            }
            return;
        }

        if (this.isMovingSelection) {
            this.updateSelectionMove(this.getCanvasCoords(e));
            return;
        }

        if (this.currentTool === 'move' && !this.isDrawing) {
            const hover = this.getCanvasCoords(e);
            this.canvas.style.cursor = this.isInsideSelection(hover.x, hover.y) ? 'move' : 'crosshair';
        }

        if (!this.isDrawing) return;
        const coords = this.getCanvasCoords(e);
        const width = coords.x - this.startX;
        const height = coords.y - this.startY;

        switch (this.currentTool) {
            case 'select':
            case 'move':
            case 'mosaic':
            case 'erase':
                this.clearOverlay();
                this.drawSelectionPreview(this.startX, this.startY, width, height);
                break;
            case 'cutband':
                this.clearOverlay();
                this.drawBandPreview(this.startY, coords.y);
                break;
            case 'rectangle':
                this.ctx.putImageData(this.tempState, 0, 0);
                this.drawRectangle(this.startX, this.startY, width, height);
                break;
            case 'arrow':
                this.ctx.putImageData(this.tempState, 0, 0);
                this.drawArrow(this.startX, this.startY, coords.x, coords.y);
                break;
        }
    }

    handleMouseUp(e) {
        if (!this.hasImage) return;

        if (this.isDraggingText && this.currentTool === 'text') {
            this.isDraggingText = false;
            if (this.textDragMoved) {
                this.saveState();
                this.updateStatus('텍스트 이동됨');
            } else if (this._textWasSelected) {
                const obj = this.textObjects.find(o => o.id === this.selectedTextId);
                if (obj) this.showTextEditOverlay(obj, e.clientX, e.clientY);
            }
            this._textWasSelected = false;
            return;
        }

        if (this.isDraggingMarker && this.currentTool === 'text') {
            this.isDraggingMarker = false;
            if (this.markerDragMoved) {
                this.saveState();
                this.updateStatus('번호 마커를 이동했습니다');
            }
            this.markerDragMoved = false;
            this.renderMarkerList();
            return;
        }

        if (this.isMovingSelection) {
            this.finishSelectionMove();
            return;
        }

        if (!this.isDrawing) return;
        this.isDrawing = false;
        const coords = this.getCanvasCoords(e);
        const width = coords.x - this.startX;
        const height = coords.y - this.startY;

        switch (this.currentTool) {
            case 'select':
            case 'move':
                this.clearOverlay();
                this.selection = {
                    x: Math.min(this.startX, coords.x),
                    y: Math.min(this.startY, coords.y),
                    width: Math.abs(width),
                    height: Math.abs(height)
                };
                this.drawSelectionPreview(this.startX, this.startY, width, height);
                this.showSelectionActions();
                this.updateStatus(this.currentTool === 'move'
                    ? '영역 선택됨 - 안쪽을 드래그해 이동하거나 아래 버튼으로 실행하세요'
                    : '영역 선택됨 - 버튼으로 실행하거나 DELETE(지우기) / SHIFT+DELETE(위로 당기기)');
                break;
            case 'cutband':
                this.clearOverlay();
                this.cutBand(Math.min(this.startY, coords.y), Math.abs(height));
                break;
            case 'rectangle':
                this.ctx.putImageData(this.tempState, 0, 0);
                this.drawRectangle(this.startX, this.startY, width, height);
                this.saveState();
                break;
            case 'arrow':
                this.ctx.putImageData(this.tempState, 0, 0);
                this.drawArrow(this.startX, this.startY, coords.x, coords.y);
                this.saveState();
                break;
            case 'mosaic':
                this.clearOverlay();
                this.ctx.putImageData(this.tempState, 0, 0);
                this.applyMosaic(this.startX, this.startY, width, height);
                this.saveState();
                break;
            case 'erase':
                this.clearOverlay();
                this.ctx.putImageData(this.tempState, 0, 0);
                this.applyErase(this.startX, this.startY, width, height);
                this.saveState();
                break;
        }
    }

    handleMouseLeave(e) {
        if (this.isDraggingText) {
            this.isDraggingText = false;
            if (this.textDragMoved) {
                this.saveState();
                this.updateStatus('텍스트 이동됨');
            }
            this._textWasSelected = false;
            return;
        }
        if (this.isDraggingMarker) {
            this.isDraggingMarker = false;
            if (this.markerDragMoved) {
                this.saveState();
                this.updateStatus('번호 마커를 이동했습니다');
            }
            this.markerDragMoved = false;
            this.renderMarkerList();
            return;
        }
        this.handleMouseUp(e);
    }

    // ---------- Drawing helpers ----------

    clearOverlay() {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }

    drawSelectionPreview(x, y, width, height) {
        this.overlayCtx.strokeStyle = '#e94560';
        this.overlayCtx.lineWidth = 2;
        this.overlayCtx.setLineDash([5, 5]);
        this.overlayCtx.strokeRect(x, y, width, height);
        this.overlayCtx.setLineDash([]);
        this.overlayCtx.fillStyle = 'rgba(233, 69, 96, 0.1)';
        this.overlayCtx.fillRect(x, y, width, height);
    }

    drawBandPreview(y1, y2) {
        const top = Math.min(y1, y2);
        const h = Math.abs(y2 - y1);
        const w = this.overlayCanvas.width;
        this.overlayCtx.fillStyle = 'rgba(233, 69, 96, 0.22)';
        this.overlayCtx.fillRect(0, top, w, h);
        this.overlayCtx.strokeStyle = '#e94560';
        this.overlayCtx.lineWidth = 2;
        this.overlayCtx.setLineDash([6, 4]);
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(0, top);
        this.overlayCtx.lineTo(w, top);
        this.overlayCtx.moveTo(0, top + h);
        this.overlayCtx.lineTo(w, top + h);
        this.overlayCtx.stroke();
        this.overlayCtx.setLineDash([]);
        this.overlayCtx.fillStyle = '#e94560';
        this.overlayCtx.font = 'bold 14px sans-serif';
        const labelY = top > 20 ? top - 6 : top + h + 18;
        this.overlayCtx.fillText(`${Math.round(h)}px 잘라내고 위로 당기기`, 8, labelY);
    }

    drawRectangle(x, y, width, height) {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeRect(x, y, width, height);
    }

    // angle: 화살촉 벌어진 각(반각, rad) / notch: 뒷면을 촉 쪽으로 파내는 비율(0=평평) / filled: 채움 여부
    getArrowHeadStyle(style) {
        const presets = {
            plain: { angle: 26 * Math.PI / 180, notch: 0, filled: true, lenBase: 14, lenFactor: 2.0 },
            notch: { angle: 28 * Math.PI / 180, notch: 0.4, filled: true, lenBase: 14, lenFactor: 1.8 },
            sharp: { angle: 16 * Math.PI / 180, notch: 0, filled: true, lenBase: 16, lenFactor: 2.2 },
            open: { angle: 22 * Math.PI / 180, notch: 0, filled: false, lenBase: 14, lenFactor: 1.6 },
            wide: { angle: 34 * Math.PI / 180, notch: 0, filled: true, lenBase: 13, lenFactor: 2.0 }
        };
        return presets[style] || presets.plain;
    }

    drawArrow(fromX, fromY, toX, toY) {
        const { angle: a, notch, filled, lenBase, lenFactor } = this.getArrowHeadStyle(this.arrowStyle);
        const headLen = lenBase + this.lineWidth * lenFactor;
        const dir = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 화살촉 뒷면(또는 노치 꼭짓점)까지만 선을 그려 두꺼운 선이 촉 밖으로 삐져나오지 않게 함
        const backAxial = headLen * Math.cos(a);
        const shaftInset = filled ? backAxial * (1 - notch) : 0;
        const shaftEndX = toX - shaftInset * Math.cos(dir);
        const shaftEndY = toY - shaftInset * Math.sin(dir);

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(shaftEndX, shaftEndY);
        this.ctx.stroke();

        const backLeftX = toX - headLen * Math.cos(dir - a);
        const backLeftY = toY - headLen * Math.sin(dir - a);
        const backRightX = toX - headLen * Math.cos(dir + a);
        const backRightY = toY - headLen * Math.sin(dir + a);

        this.ctx.beginPath();
        this.ctx.moveTo(backLeftX, backLeftY);
        this.ctx.lineTo(toX, toY);
        this.ctx.lineTo(backRightX, backRightY);

        if (filled) {
            const notchAxial = backAxial * (1 - notch);
            const notchX = toX - notchAxial * Math.cos(dir);
            const notchY = toY - notchAxial * Math.sin(dir);
            this.ctx.lineTo(notchX, notchY);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    applyMosaic(x, y, width, height) {
        const startX = Math.floor(Math.min(x, x + width));
        const startY = Math.floor(Math.min(y, y + height));
        const w = Math.floor(Math.abs(width));
        const h = Math.floor(Math.abs(height));
        if (w < 2 || h < 2) return;

        const clampedX = Math.max(0, startX);
        const clampedY = Math.max(0, startY);
        const clampedW = Math.min(w - (clampedX - startX), this.canvas.width - clampedX);
        const clampedH = Math.min(h - (clampedY - startY), this.canvas.height - clampedY);
        if (clampedW <= 0 || clampedH <= 0) return;

        const imageData = this.ctx.getImageData(clampedX, clampedY, clampedW, clampedH);
        const data = imageData.data;
        const blockSize = this.blockSize;
        const stride = imageData.width;

        for (let by = 0; by < clampedH; by += blockSize) {
            for (let bx = 0; bx < clampedW; bx += blockSize) {
                let r = 0, g = 0, b = 0, count = 0;
                for (let py = by; py < by + blockSize && py < clampedH; py++) {
                    for (let px = bx; px < bx + blockSize && px < clampedW; px++) {
                        const i = (py * stride + px) * 4;
                        r += data[i]; g += data[i + 1]; b += data[i + 2];
                        count++;
                    }
                }
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                for (let py = by; py < by + blockSize && py < clampedH; py++) {
                    for (let px = bx; px < bx + blockSize && px < clampedW; px++) {
                        const i = (py * stride + px) * 4;
                        data[i] = r; data[i + 1] = g; data[i + 2] = b;
                    }
                }
            }
        }
        this.ctx.putImageData(imageData, clampedX, clampedY);
        this.updateStatus('모자이크 적용됨');
    }

    applyErase(x, y, width, height) {
        const startX = Math.min(x, x + width);
        const startY = Math.min(y, y + height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(startX, startY, Math.abs(width), Math.abs(height));
        this.updateStatus('영역 삭제됨');
    }

    // ---------- History ----------

    saveState() {
        this.history.push({
            canvas: this.canvas.toDataURL(),
            textObjects: JSON.parse(JSON.stringify(this.textObjects)),
            markerObjects: JSON.parse(JSON.stringify(this.markerObjects)),
            markerSize: this.markerSize
        });
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    undo() {
        if (this.history.length <= 1) {
            this.showToast('더 이상 취소할 수 없습니다');
            return;
        }
        this.history.pop();
        const prev = this.history[this.history.length - 1];
        const img = new Image();
        img.onload = () => {
            // 잘라내기 / 리사이즈로 크기가 달라졌다면 캔버스 크기부터 되돌린다
            if (img.width !== this.canvas.width || img.height !== this.canvas.height) {
                this.setCanvasSize(img.width, img.height);
                this.imageSize.textContent = `${img.width} x ${img.height}`;
                this.updateOutputSizeLabel();
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.renderTextLayer();
            this.updateStatus('실행 취소됨');
        };
        img.src = prev.canvas;
        this.textObjects = JSON.parse(JSON.stringify(prev.textObjects || []));
        this.markerObjects = JSON.parse(JSON.stringify(prev.markerObjects || []));
        this.markerSize = prev.markerSize || 28;
        this.markerSizeInput.value = this.markerSize;
        this.markerSizeValue.textContent = `${this.markerSize}px`;
        this.markerIdCounter = this.markerObjects.reduce((max, marker) => Math.max(max, marker.id), 0);
        this.selectedTextId = null;
        this.selectedMarkerId = null;
        this.renderTextLayer();
        this.renderMarkerList();
    }

    // ---------- Output ----------

    getCompositeCanvas(scale = 1) {
        const w = Math.round(this.canvas.width * scale);
        const h = Math.round(this.canvas.height * scale);
        const temp = document.createElement('canvas');
        temp.width = w;
        temp.height = h;
        const ctx = temp.getContext('2d');
        ctx.drawImage(this.canvas, 0, 0, w, h);
        for (const obj of this.textObjects) {
            const scaled = Object.assign({}, obj, { x: obj.x * scale, y: obj.y * scale, fontSize: obj.fontSize * scale });
            this._renderTextToCtx(ctx, scaled, false);
        }
        for (const marker of this.markerObjects) {
            const scaled = Object.assign({}, marker, { x: marker.x * scale, y: marker.y * scale });
            this._renderMarkerToCtx(ctx, scaled, this.markerSize * scale, false);
        }
        return temp;
    }

    parseOutputPreset() {
        const [fmt, scaleStr, qualityStr] = this.outputPreset.split(':');
        return {
            format: fmt,
            scale: parseFloat(scaleStr),
            quality: qualityStr ? parseFloat(qualityStr) : 1
        };
    }

    updateOutputSizeLabel() {
        if (!this.hasImage) { this.outputSizeLabel.textContent = '-'; return; }
        const { format, scale, quality } = this.parseOutputPreset();
        const canvas = this.getCompositeCanvas(scale);
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
        const mb = (bytes / 1024 / 1024).toFixed(1);
        this.outputSizeLabel.textContent = `≈${mb}MB`;
    }

    async copyToClipboard() {
        if (!this.hasImage) { this.showToast('복사할 이미지가 없습니다'); return; }
        try {
            const { format, scale, quality } = this.parseOutputPreset();
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const blob = await new Promise(resolve =>
                this.getCompositeCanvas(scale).toBlob(resolve, mimeType, quality)
            );
            // 클립보드는 image/png 타입으로 등록해야 Notion 등에서 붙여넣기 가능
            const clipMime = 'image/png';
            let finalBlob = blob;
            if (mimeType !== 'image/png') {
                // JPEG blob을 PNG로 재변환하여 클립보드에 복사
                finalBlob = await new Promise(resolve => {
                    const url = URL.createObjectURL(blob);
                    const img = new Image();
                    img.onload = () => {
                        const c = document.createElement('canvas');
                        c.width = img.width; c.height = img.height;
                        c.getContext('2d').drawImage(img, 0, 0);
                        URL.revokeObjectURL(url);
                        c.toBlob(resolve, 'image/png');
                    };
                    img.src = url;
                });
            }
            await navigator.clipboard.write([new ClipboardItem({ [clipMime]: finalBlob })]);
            const mb = (finalBlob.size / 1024 / 1024).toFixed(1);
            this.showToast(`클립보드에 복사됨 (${mb}MB)`);
            this.updateStatus('이미지가 클립보드에 복사됨');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('복사 실패 - 브라우저 권한을 확인하세요');
        }
    }

    download() {
        if (!this.hasImage) { this.showToast('다운로드할 이미지가 없습니다'); return; }
        const { format, scale, quality } = this.parseOutputPreset();
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const ext = format === 'png' ? 'png' : 'jpg';
        const link = document.createElement('a');
        link.download = `edited-image-${Date.now()}.${ext}`;
        link.href = this.getCompositeCanvas(scale).toDataURL(mimeType, quality);
        link.click();
        this.showToast('이미지 다운로드됨');
        this.updateStatus('이미지 다운로드됨');
    }

    // ---------- Keyboard ----------

    // ---------- Resize ----------

    openResizeModal() {
        if (!this.hasImage) { this.showToast('이미지를 먼저 붙여넣으세요'); return; }
        this.resizeWidthInput.value = this.canvas.width;
        this.resizeHeightInput.value = this.canvas.height;
        this.updateResizeInfo();
        this.resizeModal.classList.add('open');
    }

    closeResizeModal() {
        this.resizeModal.classList.remove('open');
    }

    updateResizeInfo() {
        const w = parseInt(this.resizeWidthInput.value) || 0;
        const h = parseInt(this.resizeHeightInput.value) || 0;
        if (!w || !h) { this.resizeInfo.textContent = ''; return; }
        const origW = this.canvas.width, origH = this.canvas.height;
        const pct = Math.round((w / origW) * 100);
        this.resizeInfo.textContent = `${origW} x ${origH} → ${w} x ${h} (${pct}%)`;
    }

    applyResize() {
        const newW = parseInt(this.resizeWidthInput.value);
        const newH = parseInt(this.resizeHeightInput.value);
        if (!newW || !newH || newW < 1 || newH < 1) { this.showToast('올바른 크기를 입력하세요'); return; }

        const scaleX = newW / this.canvas.width;
        const scaleY = newH / this.canvas.height;

        // Resize the base canvas only; text and marker overlays remain editable objects.
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = this.canvas.width;
        baseCanvas.height = this.canvas.height;
        baseCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
        this.canvas.width = newW;
        this.canvas.height = newH;
        this.overlayCanvas.width = newW;
        this.overlayCanvas.height = newH;
        this.textCanvas.width = newW;
        this.textCanvas.height = newH;
        this.ctx.drawImage(baseCanvas, 0, 0, newW, newH);

        // 텍스트 오브젝트 좌표/크기도 비율에 맞게 조정
        this.textObjects = this.textObjects.map(obj => ({
            ...obj,
            x: obj.x * scaleX,
            y: obj.y * scaleY,
            fontSize: Math.round(obj.fontSize * Math.min(scaleX, scaleY))
        }));
        this.markerObjects = this.markerObjects.map(obj => ({
            ...obj,
            x: obj.x * scaleX,
            y: obj.y * scaleY
        }));
        this.markerSize = Math.max(18, Math.min(64, Math.round(this.markerSize * Math.min(scaleX, scaleY))));
        this.markerSizeInput.value = this.markerSize;
        this.markerSizeValue.textContent = `${this.markerSize}px`;

        this.saveState();
        this.imageSize.textContent = `${newW} x ${newH}`;
        this.updateOutputSizeLabel();
        this.renderTextLayer();
        this.renderMarkerList();
        this.closeResizeModal();
        this.showToast(`${newW} x ${newH} 으로 리사이즈됨`);
        this.updateStatus(`이미지 리사이즈: ${newW} x ${newH}`);
    }

    // ---------- Zoom ----------

    applyZoom() {
        this.canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
        this.zoomLevelLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        this.positionSelectionActions();
    }

    zoomIn() {
        this.zoomLevel = Math.min(5.0, parseFloat((this.zoomLevel + 0.1).toFixed(1)));
        this.applyZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.1, parseFloat((this.zoomLevel - 0.1).toFixed(1)));
        this.applyZoom();
    }

    zoomReset() {
        this.zoomLevel = 1.0;
        this.applyZoom();
    }

    handleKeyboard(e) {
        if (this.textOverlay) return;

        // Delete selected text
        if (e.key === 'Delete' && this.currentTool === 'text' && this.selectedTextId !== null) {
            e.preventDefault();
            this.textObjects = this.textObjects.filter(o => o.id !== this.selectedTextId);
            this.selectedTextId = null;
            this.renderTextLayer();
            this.saveState();
            this.updateStatus('텍스트 삭제됨');
            return;
        }
        if (e.key === 'Delete' && this.currentTool === 'text' && this.selectedMarkerId !== null) {
            e.preventDefault();
            this.markerObjects = this.markerObjects.filter(o => o.id !== this.selectedMarkerId);
            this.selectedMarkerId = null;
            this.renderTextLayer();
            this.renderMarkerList();
            this.saveState();
            this.updateStatus('번호 마커를 삭제했습니다');
            return;
        }

        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key === 'z') { e.preventDefault(); this.undo(); }
        if (isMod && e.key === 'c' && this.hasImage) { e.preventDefault(); this.copyToClipboard(); }
        if (isMod && e.key === 's') { e.preventDefault(); this.download(); }
        if (isMod && e.key === '=' ) { e.preventDefault(); this.zoomIn(); }
        if (isMod && e.key === '-' ) { e.preventDefault(); this.zoomOut(); }
        if (isMod && e.key === '0' ) { e.preventDefault(); this.zoomReset(); }
        if (isMod && e.key === 'a' && this.hasImage) {
            e.preventDefault();
            this.selection = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
            this.clearOverlay();
            this.drawSelectionPreview(0, 0, this.canvas.width, this.canvas.height);
            this.showSelectionActions();
            this.updateStatus('전체 선택됨 - Ctrl+C / Cmd+C로 복사');
        }
        if (e.key === 'Escape' && this.selection) {
            e.preventDefault();
            this.selection = null;
            this.clearOverlay();
            this.hideSelectionActions();
            this.updateStatus('선택 해제됨');
            return;
        }
        if (e.key === 'Delete' && this.selection && this.hasImage) {
            e.preventDefault();
            if (e.shiftKey) this.cutBandFromSelection();
            else if (e.altKey) this.cutRegionFromSelection();
            else this.deleteSelection();
        }
    }

    // ---------- Mouse icon ----------

    drawMouseIcon(cx, cy, side) {
        const ctx = this.ctx;
        const W = 22, H = 36;
        const x = cx - W / 2;
        const y = cy - H / 2;
        const r = 8;
        const btnLineY = y + H * 0.38;
        const midX = x + W / 2;

        ctx.save();

        // Outline
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + W - r, y);
        ctx.arcTo(x + W, y, x + W, y + r, r);
        ctx.lineTo(x + W, y + H - r);
        ctx.arcTo(x + W, y + H, x + W - r, y + H, r);
        ctx.lineTo(x + r, y + H);
        ctx.arcTo(x, y + H, x, y + H - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Highlighted button
        ctx.beginPath();
        if (side === 'right') {
            ctx.moveTo(midX, y + 1);
            ctx.lineTo(x + W - r, y + 1);
            ctx.arcTo(x + W - 1, y + 1, x + W - 1, y + r, r - 1);
            ctx.lineTo(x + W - 1, btnLineY);
            ctx.lineTo(midX, btnLineY);
        } else {
            ctx.moveTo(x + 1, y + r);
            ctx.arcTo(x + 1, y + 1, x + r, y + 1, r - 1);
            ctx.lineTo(midX, y + 1);
            ctx.lineTo(midX, btnLineY);
            ctx.lineTo(x + 1, btnLineY);
        }
        ctx.closePath();
        ctx.fillStyle = this.currentColor;
        ctx.fill();

        // Dividers
        ctx.beginPath();
        ctx.moveTo(x + 1, btnLineY);
        ctx.lineTo(x + W - 1, btnLineY);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midX, y + 1);
        ctx.lineTo(midX, btnLineY - 1);
        ctx.stroke();

        // Scroll wheel
        const wheelY = btnLineY + (H - H * 0.38) * 0.25;
        const wheelH = (H - H * 0.38) * 0.35;
        ctx.beginPath();
        ctx.roundRect(midX - 2, wheelY, 4, wheelH, 2);
        ctx.fillStyle = '#888888';
        ctx.fill();

        ctx.restore();
    }

    // ---------- Text object system ----------

    _buildFontStr(obj) {
        const style = obj.italic ? 'italic ' : '';
        const weight = obj.bold ? 'bold ' : '';
        return `${style}${weight}${obj.fontSize}px "${obj.fontFamily}", sans-serif`;
    }

    getTextObjectAt(x, y) {
        for (let i = this.textObjects.length - 1; i >= 0; i--) {
            const obj = this.textObjects[i];
            this.textCtx.font = this._buildFontStr(obj);
            const w = this.textCtx.measureText(obj.text).width;
            const h = obj.fontSize;
            let boxX;
            if (obj.align === 'center') boxX = obj.x - w / 2;
            else if (obj.align === 'right') boxX = obj.x - w;
            else boxX = obj.x;
            const pad = 6;
            if (x >= boxX - pad && x <= boxX + w + pad &&
                y >= obj.y - pad && y <= obj.y + h + pad) {
                return obj;
            }
        }
        return null;
    }

    getMarkerObjectAt(x, y) {
        const radius = this.markerSize / 2;
        for (let i = this.markerObjects.length - 1; i >= 0; i--) {
            const obj = this.markerObjects[i];
            const dx = x - obj.x;
            const dy = y - obj.y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius + 4) {
                return obj;
            }
        }
        return null;
    }

    renderTextLayer() {
        const ctx = this.textCtx;
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        for (const obj of this.textObjects) {
            this._renderTextToCtx(ctx, obj, obj.id === this.selectedTextId);
        }
        for (const marker of this.markerObjects) {
            this._renderMarkerToCtx(ctx, marker, this.markerSize, marker.id === this.selectedMarkerId);
        }
    }

    _renderMarkerToCtx(ctx, marker, size, selected) {
        const radius = size / 2;
        const fontSize = Math.max(10, Math.round(size * (marker.number >= 100 ? 0.36 : marker.number >= 10 ? 0.42 : 0.48)));
        ctx.save();
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#e94560';
        ctx.fill();
        ctx.lineWidth = Math.max(2, size * 0.08);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        if (selected) {
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#4da3ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.font = `700 ${fontSize}px "Pretendard", "Noto Sans KR", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(marker.number), marker.x, marker.y + 0.5);
        ctx.restore();
    }

    createMarkersFromDescription() {
        if (!this.hasImage) {
            this.showToast('이미지를 먼저 붙여넣어 주세요');
            return;
        }
        const lines = this.markerDescriptionInput.value
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
        if (!lines.length) {
            this.showToast('설명을 한 줄 이상 입력해 주세요');
            return;
        }

        const startX = Math.min(40, Math.max(24, this.canvas.width * 0.08));
        const startY = Math.min(40, Math.max(24, this.canvas.height * 0.08));
        const step = Math.max(this.markerSize + 18, 50);
        const nextNumber = this.markerObjects.reduce((max, marker) => Math.max(max, marker.number), 0) + 1;
        const newMarkers = lines.map((description, index) => ({
            id: ++this.markerIdCounter,
            number: nextNumber + index,
            x: startX,
            y: Math.min(this.canvas.height - this.markerSize / 2, startY + index * step),
            description
        }));

        this.markerObjects.push(...newMarkers);
        this.selectedTextId = null;
        this.selectedMarkerId = newMarkers[0].id;
        this.markerDescriptionInput.value = this.getMarkerNumberTemplate(newMarkers);
        this.renderTextLayer();
        this.renderMarkerList();
        this.saveState();
        this.updateStatus('설명 번호 마커를 생성했습니다');
    }

    getMarkerNumberTemplate(markers = this.markerObjects) {
        return markers
            .slice()
            .sort((a, b) => a.number - b.number)
            .map(marker => `${this.formatMarkerNumber(marker.number)} `)
            .join('\n');
    }

    formatMarkerNumber(number) {
        const circledNumbers = ['❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'];
        return circledNumbers[number - 1] || `${number}.`;
    }

    async copyMarkerNumberTemplate() {
        const template = this.getMarkerNumberTemplate();
        if (!template) {
            this.showToast('복사할 번호 마커가 없습니다');
            return;
        }

        try {
            await navigator.clipboard.writeText(template);
        } catch (err) {
            const copyArea = document.createElement('textarea');
            copyArea.value = template;
            copyArea.style.position = 'fixed';
            copyArea.style.left = '-9999px';
            document.body.appendChild(copyArea);
            copyArea.select();
            document.execCommand('copy');
            copyArea.remove();
        }
        this.showToast('번호 목록이 복사되었습니다');
        this.updateStatus('번호 목록을 클립보드에 복사했습니다');
    }

    insertMarkerNumberTemplate() {
        const template = this.getMarkerNumberTemplate();
        if (!template) {
            this.showToast('삽입할 번호 마커가 없습니다');
            return;
        }

        const current = this.markerDescriptionInput.value.trimEnd();
        this.markerDescriptionInput.value = current ? `${current}\n${template}` : template;
        this.markerDescriptionInput.focus();
        this.markerDescriptionInput.selectionStart = this.markerDescriptionInput.value.length;
        this.markerDescriptionInput.selectionEnd = this.markerDescriptionInput.value.length;
        this.updateStatus('설명 입력칸에 번호 목록을 삽입했습니다');
    }

    renderMarkerList() {
        if (!this.markerList) return;
        this.markerList.innerHTML = '';
        if (!this.markerObjects.length) {
            return;
        }

        for (const marker of this.markerObjects) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'marker-list-item';
            item.classList.toggle('active', marker.id === this.selectedMarkerId);
            item.innerHTML = `<span>${this.formatMarkerNumber(marker.number)}</span><em></em>`;
            item.querySelector('em').textContent = marker.description;
            item.addEventListener('click', () => {
                this.selectedTextId = null;
                this.selectedMarkerId = marker.id;
                this.renderTextLayer();
                this.renderMarkerList();
            });
            this.markerList.appendChild(item);
        }
    }

    _renderTextToCtx(ctx, obj, selected) {
        ctx.save();
        ctx.font = this._buildFontStr(obj);
        ctx.fillStyle = obj.color;
        ctx.textBaseline = 'top';
        ctx.textAlign = obj.align;
        ctx.fillText(obj.text, obj.x, obj.y);

        // Underline
        if (obj.underline) {
            const w = ctx.measureText(obj.text).width;
            const lineY = obj.y + obj.fontSize * 1.1;
            let lineX;
            if (obj.align === 'center') lineX = obj.x - w / 2;
            else if (obj.align === 'right') lineX = obj.x - w;
            else lineX = obj.x;
            ctx.beginPath();
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX + w, lineY);
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = Math.max(1, obj.fontSize / 18);
            ctx.stroke();
        }

        // Selection box
        if (selected) {
            ctx.textAlign = obj.align;
            const w = ctx.measureText(obj.text).width;
            let boxX;
            if (obj.align === 'center') boxX = obj.x - w / 2;
            else if (obj.align === 'right') boxX = obj.x - w;
            else boxX = obj.x;
            const pad = 5;
            ctx.strokeStyle = '#e94560';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(boxX - pad, obj.y - pad, w + pad * 2, obj.fontSize + pad * 2);
            ctx.setLineDash([]);
        }
        ctx.restore();
    }

    // ---------- Text toolbar state ----------

    syncToolbarToObj(obj) {
        this.textFontFamily = obj.fontFamily;
        this.textFontSize = obj.fontSize;
        this.textBold = obj.bold;
        this.textItalic = obj.italic;
        this.textUnderline = obj.underline;
        this.textAlign = obj.align;
        this.updateTextToolbarUI();
    }

    updateTextToolbarUI() {
        this.fontFamilySelect.value = this.textFontFamily;
        this.fontFamilySelect.style.fontFamily = `"${this.textFontFamily}", sans-serif`;
        this.fontSizeInput.value = this.textFontSize;
        this.boldBtn.classList.toggle('active', this.textBold);
        this.italicBtn.classList.toggle('active', this.textItalic);
        this.underlineBtn.classList.toggle('active', this.textUnderline);
        this.alignLeftBtn.classList.toggle('active', this.textAlign === 'left');
        this.alignCenterBtn.classList.toggle('active', this.textAlign === 'center');
        this.alignRightBtn.classList.toggle('active', this.textAlign === 'right');
        this.markerSizeInput.value = this.markerSize;
        this.markerSizeValue.textContent = `${this.markerSize}px`;
    }

    setTextAlign(align) {
        this.textAlign = align;
        this.updateTextToolbarUI();
        this.applyToolbarToSelectedText();
    }

    // Apply current toolbar state to the selected text object (live preview)
    applyToolbarToSelectedText() {
        if (this.selectedTextId === null || this.textOverlay) return;
        const obj = this.textObjects.find(o => o.id === this.selectedTextId);
        if (!obj) return;
        obj.fontFamily = this.textFontFamily;
        obj.fontSize = this.textFontSize;
        obj.bold = this.textBold;
        obj.italic = this.textItalic;
        obj.underline = this.textUnderline;
        obj.align = this.textAlign;
        this.renderTextLayer();
        this.saveState();
    }

    // ---------- Text input overlays ----------

    _buildOverlayPopup(wrapper, clientX, clientY) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'text-input-overlay';
        let left = clientX - wrapperRect.left + 8;
        let top = clientY - wrapperRect.top + 8;
        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
        wrapper.appendChild(overlay);
        this.textOverlay = overlay;

        requestAnimationFrame(() => {
            const oRect = overlay.getBoundingClientRect();
            if (oRect.right > window.innerWidth - 8) {
                overlay.style.left = (clientX - wrapperRect.left - oRect.width - 8) + 'px';
            }
            if (oRect.bottom > window.innerHeight - 8) {
                overlay.style.top = (clientY - wrapperRect.top - oRect.height - 8) + 'px';
            }
        });
        return overlay;
    }

    showTextOverlay(canvasX, canvasY, clientX, clientY) {
        this.dismissTextOverlay();
        const wrapper = document.querySelector('.canvas-wrapper');
        const overlay = this._buildOverlayPopup(wrapper, clientX, clientY);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '텍스트 입력...';

        const actions = document.createElement('div');
        actions.className = 'text-overlay-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '취소';
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-btn';
        confirmBtn.textContent = '확인';
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        overlay.appendChild(input);
        overlay.appendChild(actions);

        const confirm = () => {
            const text = input.value.trim();
            if (text) {
                const obj = {
                    id: ++this.textIdCounter,
                    text,
                    x: canvasX,
                    y: canvasY,
                    color: this.currentColor,
                    fontFamily: this.textFontFamily,
                    fontSize: this.textFontSize,
                    bold: this.textBold,
                    italic: this.textItalic,
                    underline: this.textUnderline,
                    align: this.textAlign
                };
                this.textObjects.push(obj);
                this.selectedTextId = obj.id;
                this.renderTextLayer();
                this.saveState();
                this.updateStatus('텍스트 추가됨 — 드래그로 이동, 다시 클릭으로 수정, Delete로 삭제');
                this.setTextToolbarExpanded(false);
            }
            this.dismissTextOverlay();
        };

        confirmBtn.addEventListener('click', confirm);
        cancelBtn.addEventListener('click', () => this.dismissTextOverlay());
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') this.dismissTextOverlay();
        });
        input.focus();
    }

    showTextEditOverlay(obj, clientX, clientY) {
        this.dismissTextOverlay();
        // Sync toolbar to this text's settings
        this.syncToolbarToObj(obj);

        const wrapper = document.querySelector('.canvas-wrapper');
        const overlay = this._buildOverlayPopup(wrapper, clientX, clientY);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = obj.text;

        const actions = document.createElement('div');
        actions.className = 'text-overlay-actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'cancel-btn';
        deleteBtn.textContent = '삭제';
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-btn';
        confirmBtn.textContent = '확인';
        actions.appendChild(deleteBtn);
        actions.appendChild(confirmBtn);
        overlay.appendChild(input);
        overlay.appendChild(actions);

        input.select();

        const confirm = () => {
            const text = input.value.trim();
            if (text) {
                obj.text = text;
                obj.fontFamily = this.textFontFamily;
                obj.fontSize = this.textFontSize;
                obj.bold = this.textBold;
                obj.italic = this.textItalic;
                obj.underline = this.textUnderline;
                obj.align = this.textAlign;
                obj.color = this.currentColor;
                this.renderTextLayer();
                this.saveState();
                this.updateStatus('텍스트 수정됨');
            } else {
                // Empty → delete
                this.textObjects = this.textObjects.filter(o => o.id !== obj.id);
                this.selectedTextId = null;
                this.renderTextLayer();
                this.saveState();
                this.updateStatus('텍스트 삭제됨');
            }
            this.dismissTextOverlay();
        };

        const deleteObj = () => {
            this.textObjects = this.textObjects.filter(o => o.id !== obj.id);
            this.selectedTextId = null;
            this.renderTextLayer();
            this.saveState();
            this.updateStatus('텍스트 삭제됨');
            this.dismissTextOverlay();
        };

        confirmBtn.addEventListener('click', confirm);
        deleteBtn.addEventListener('click', deleteObj);
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') this.dismissTextOverlay();
        });
        input.focus();
    }

    dismissTextOverlay() {
        if (this.textOverlay) {
            this.textOverlay.remove();
            this.textOverlay = null;
        }
    }

    // ---------- Misc ----------

    setCanvasSize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.overlayCanvas.width = w;
        this.overlayCanvas.height = h;
        this.textCanvas.width = w;
        this.textCanvas.height = h;
    }

    isInsideSelection(x, y) {
        const sel = this.selection;
        if (!sel || sel.width < 2 || sel.height < 2) return false;
        return x >= sel.x && x <= sel.x + sel.width && y >= sel.y && y <= sel.y + sel.height;
    }

    // ---------- 선택 영역 이동 ----------

    beginSelectionMove(coords) {
        const sel = this.selection;
        const x = Math.round(sel.x);
        const y = Math.round(sel.y);
        const w = Math.round(sel.width);
        const h = Math.round(sel.height);
        if (w < 2 || h < 2) return false;

        const float = document.createElement('canvas');
        float.width = w;
        float.height = h;
        float.getContext('2d').drawImage(this.canvas, x, y, w, h, 0, 0, w, h);

        // 원래 자리를 흰색으로 비운 상태를 기준 화면으로 저장하고, 그 위에 잘라낸 조각을 얹는다
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x, y, w, h);
        this.moveBaseState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(float, x, y);

        this.moveFloatCanvas = float;
        this.moveOriginX = x;
        this.moveOriginY = y;
        this.moveGrabDX = coords.x - x;
        this.moveGrabDY = coords.y - y;
        this.moveDragged = false;
        this.isMovingSelection = true;
        this.hideSelectionActions();
        this.selection = { x, y, width: w, height: h };
        this.clearOverlay();
        this.drawSelectionPreview(x, y, w, h);
        return true;
    }

    updateSelectionMove(coords) {
        if (!this.isMovingSelection) return;
        const { width, height } = this.selection;
        const nx = Math.round(coords.x - this.moveGrabDX);
        const ny = Math.round(coords.y - this.moveGrabDY);
        this.ctx.putImageData(this.moveBaseState, 0, 0);
        this.ctx.drawImage(this.moveFloatCanvas, nx, ny);
        this.selection = { x: nx, y: ny, width, height };
        this.clearOverlay();
        this.drawSelectionPreview(nx, ny, width, height);
        const dx = nx - this.moveOriginX;
        const dy = ny - this.moveOriginY;
        if (dx !== 0 || dy !== 0) this.moveDragged = true;
        this.updateStatus(`이동 중: ${dx > 0 ? '+' : ''}${dx}, ${dy > 0 ? '+' : ''}${dy} px`);
    }

    finishSelectionMove() {
        this.isMovingSelection = false;
        this.moveFloatCanvas = null;
        this.moveBaseState = null;
        const dx = Math.round(this.selection.x) - this.moveOriginX;
        const dy = Math.round(this.selection.y) - this.moveOriginY;
        if (this.moveDragged) {
            this.saveState();
            this.updateStatus(`선택 영역 이동됨 (${dx > 0 ? '+' : ''}${dx}, ${dy > 0 ? '+' : ''}${dy})`);
            this.showToast('선택 영역을 이동했습니다');
        } else {
            this.updateStatus('선택 영역 안쪽을 드래그하면 이동합니다');
        }
        this.showSelectionActions();
        this.moveDragged = false;
    }

    // ---------- 선택 영역 실행 바 ----------

    showSelectionActions() {
        if (!this.hasImage || !this.selection) { this.hideSelectionActions(); return; }
        if (this.selection.width < 2 || this.selection.height < 2) { this.hideSelectionActions(); return; }
        this.selectionActions.hidden = false;
        this.positionSelectionActions();
    }

    hideSelectionActions() {
        this.selectionActions.hidden = true;
    }

    positionSelectionActions() {
        if (this.selectionActions.hidden || !this.selection) return;
        const rect = this.canvas.getBoundingClientRect();
        const sx = rect.width / this.canvas.width;
        const sy = rect.height / this.canvas.height;
        const barW = this.selectionActions.offsetWidth;
        const barH = this.selectionActions.offsetHeight;
        const margin = 8;

        let left = rect.left + this.selection.x * sx;
        left = Math.max(margin, Math.min(left, window.innerWidth - barW - margin));

        // 기본은 선택 영역 아래, 공간이 없으면 위쪽으로
        let top = rect.top + (this.selection.y + this.selection.height) * sy + margin;
        if (top + barH > window.innerHeight - margin) {
            top = rect.top + this.selection.y * sy - barH - margin;
        }
        top = Math.max(margin, Math.min(top, window.innerHeight - barH - margin));

        this.selectionActions.style.left = `${Math.round(left)}px`;
        this.selectionActions.style.top = `${Math.round(top)}px`;
    }

    previewCutBand(on) {
        if (!this.selection) return;
        const sel = this.selection;
        this.clearOverlay();
        if (on) this.drawBandPreview(sel.y, sel.y + sel.height);
        else this.drawSelectionPreview(sel.x, sel.y, sel.width, sel.height);
    }

    // ---------- 선택 폭 당기기 (선택한 폭 안에서만 잘라냄 · Alt+Delete 전용) ----------

    cutRegionFromSelection() {
        if (!this.selection) { this.showToast('선택된 영역이 없습니다'); return; }
        const sel = this.selection;
        this.cutRegion(sel.x, sel.y, sel.width, sel.height);
    }

    cutRegion(rx, ry, rw, rh) {
        if (!this.hasImage) { this.showToast('이미지를 먼저 붙여넣으세요'); return; }
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const x = Math.max(0, Math.round(rx));
        const y = Math.max(0, Math.round(ry));
        const w = Math.min(Math.round(rw), cw - x);
        const h = Math.min(Math.round(rh), ch - y);
        if (w < 2 || h < 2) { this.showToast('선택 영역이 너무 작습니다'); return; }

        const src = document.createElement('canvas');
        src.width = cw;
        src.height = ch;
        src.getContext('2d').drawImage(this.canvas, 0, 0);

        // 선택한 열 범위 안에서만, 잘라낼 구간 아래 내용을 위로 당긴다
        const belowH = ch - (y + h);
        if (belowH > 0) {
            this.ctx.clearRect(x, y, w, belowH);
            this.ctx.drawImage(src, x, y + h, w, belowH, x, y, w, belowH);
        }
        // 위로 당긴 만큼 그 열의 맨 아래는 흰색으로 채운다 (캔버스 높이는 그대로)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x, ch - h, w, h);

        // 같은 열 범위에 있던 텍스트 / 마커도 함께 위로 당긴다
        const shiftUp = (obj) => {
            if (obj.x < x || obj.x > x + w) return obj;
            if (obj.y >= y + h) return { ...obj, y: obj.y - h };
            if (obj.y > y) return { ...obj, y };
            return obj;
        };
        this.textObjects = this.textObjects.map(shiftUp);
        this.markerObjects = this.markerObjects.map(shiftUp);

        this.selection = null;
        this.clearOverlay();
        this.hideSelectionActions();
        this.renderTextLayer();
        this.renderMarkerList();
        this.saveState();
        this.updateOutputSizeLabel();
        this.updateStatus(`선택 폭(${w}px) 안에서 ${h}px 잘라내고 아래를 위로 당김`);
        this.showToast(`선택 폭 안에서 ${h}px 당김`);
    }

    // ---------- 가로줄 잘라내기 (아래 내용을 위로 당김) ----------

    cutBandFromSelection() {
        if (!this.selection) { this.showToast('선택된 영역이 없습니다'); return; }
        this.cutBand(this.selection.y, this.selection.height);
    }

    cutBand(topY, cutHeight) {
        if (!this.hasImage) { this.showToast('이미지를 먼저 붙여넣으세요'); return; }
        const w = this.canvas.width;
        const h = this.canvas.height;
        const top = Math.max(0, Math.round(topY));
        const cutH = Math.min(Math.round(cutHeight), h - top);
        if (cutH < 2) { this.showToast('잘라낼 높이가 너무 작습니다'); return; }
        const newH = h - cutH;
        if (newH < 1) { this.showToast('이미지 전체를 잘라낼 수는 없습니다'); return; }

        const src = document.createElement('canvas');
        src.width = w;
        src.height = h;
        src.getContext('2d').drawImage(this.canvas, 0, 0);

        this.setCanvasSize(w, newH);
        if (top > 0) this.ctx.drawImage(src, 0, 0, w, top, 0, 0, w, top);
        const belowH = h - (top + cutH);
        if (belowH > 0) this.ctx.drawImage(src, 0, top + cutH, w, belowH, 0, top, w, belowH);

        // 잘라낸 줄 아래에 있던 텍스트 / 마커도 같은 높이만큼 위로 당긴다
        const shiftUp = (obj) => {
            if (obj.y >= top + cutH) return { ...obj, y: obj.y - cutH };
            if (obj.y > top) return { ...obj, y: top };
            return obj;
        };
        this.textObjects = this.textObjects.map(shiftUp);
        this.markerObjects = this.markerObjects.map(shiftUp);

        this.selection = null;
        this.clearOverlay();
        this.hideSelectionActions();
        this.renderTextLayer();
        this.renderMarkerList();
        this.saveState();
        this.imageSize.textContent = `${w} x ${newH}`;
        this.updateOutputSizeLabel();
        this.updateStatus(`${cutH}px 잘라내고 아래 내용을 위로 당김`);
        this.showToast(`${cutH}px 잘라냄 · 높이 ${h} → ${newH}`);
    }

    deleteSelection() {
        if (!this.selection) { this.showToast('선택된 영역이 없습니다'); return; }
        const { x, y, width, height } = this.selection;
        if (width < 2 || height < 2) { this.showToast('선택 영역이 너무 작습니다'); return; }
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x, y, width, height);
        this.saveState();
        this.selection = null;
        this.clearOverlay();
        this.hideSelectionActions();
        this.updateStatus('선택 영역 삭제됨 (흰색) - SHIFT+DELETE는 위로 당기기');
        this.showToast('선택 영역이 삭제되었습니다');
    }

    updateStatus(text) {
        this.statusText.textContent = text;
    }

    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new PainterApp();
});
