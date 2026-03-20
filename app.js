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
        this.lineWidthInput = document.getElementById('lineWidth');
        this.lineWidthValue = document.getElementById('lineWidthValue');
        this.blockSizeInput = document.getElementById('blockSize');
        this.blockSizeValue = document.getElementById('blockSizeValue');

        // Action buttons
        this.undoBtn = document.getElementById('undoBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Status
        this.statusText = document.getElementById('statusText');
        this.imageSize = document.getElementById('imageSize');

        // Text toolbar elements
        this.textToolbar = document.getElementById('textToolbar');
        this.fontFamilySelect = document.getElementById('fontFamily');
        this.fontSizeInput = document.getElementById('textFontSize');
        this.boldBtn = document.getElementById('boldBtn');
        this.italicBtn = document.getElementById('italicBtn');
        this.underlineBtn = document.getElementById('underlineBtn');
        this.alignLeftBtn = document.getElementById('alignLeftBtn');
        this.alignCenterBtn = document.getElementById('alignCenterBtn');
        this.alignRightBtn = document.getElementById('alignRightBtn');

        // Drawing state
        this.currentTool = 'select';
        this.currentColor = '#ff0000';
        this.lineWidth = 3;
        this.blockSize = 15;
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
        this.selectedTextId = null;
        this.isDraggingText = false;
        this.textDragMoved = false;
        this._textWasSelected = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.textIdCounter = 0;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updatePresetColorActive();
        this.updateTextToolbarUI();
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

        this.lineWidthInput.addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value);
            this.lineWidthValue.textContent = `${this.lineWidth}px`;
        });

        this.blockSizeInput.addEventListener('input', (e) => {
            this.blockSize = parseInt(e.target.value);
            this.blockSizeValue.textContent = `${this.blockSize}px`;
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
                this.selectedTextId = null;
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
        this.dismissTextOverlay();
        this.selectedTextId = null;
        this.renderTextLayer();
        this.currentTool = tool;
        this.toolButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        this.selection = null;
        this.clearOverlay();
        // Show/hide text toolbar
        this.textToolbar.classList.toggle('visible', tool === 'text');
        this.updateStatus(`도구: ${this.getToolName(tool)}`);
    }

    getToolName(tool) {
        const names = {
            select: '선택', rectangle: '사각형', arrow: '화살표',
            mosaic: '모자이크', erase: '삭제',
            leftclick: '좌클릭 아이콘', rightclick: '우클릭 아이콘', text: '텍스트'
        };
        return names[tool] || tool;
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
            const hit = this.getTextObjectAt(coords.x, coords.y);
            if (hit) {
                this._textWasSelected = (hit.id === this.selectedTextId);
                this.selectedTextId = hit.id;
                this.isDraggingText = true;
                this.textDragMoved = false;
                this.dragOffsetX = coords.x - hit.x;
                this.dragOffsetY = coords.y - hit.y;
                this.syncToolbarToObj(hit);
                this.renderTextLayer();
            } else {
                this.selectedTextId = null;
                this.renderTextLayer();
                this.showTextOverlay(coords.x, coords.y, e.clientX, e.clientY);
            }
            return;
        }

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

        if (!this.isDrawing) return;
        const coords = this.getCanvasCoords(e);
        const width = coords.x - this.startX;
        const height = coords.y - this.startY;

        switch (this.currentTool) {
            case 'select':
            case 'mosaic':
            case 'erase':
                this.clearOverlay();
                this.drawSelectionPreview(this.startX, this.startY, width, height);
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

        if (!this.isDrawing) return;
        this.isDrawing = false;
        const coords = this.getCanvasCoords(e);
        const width = coords.x - this.startX;
        const height = coords.y - this.startY;

        switch (this.currentTool) {
            case 'select':
                this.clearOverlay();
                this.selection = {
                    x: Math.min(this.startX, coords.x),
                    y: Math.min(this.startY, coords.y),
                    width: Math.abs(width),
                    height: Math.abs(height)
                };
                this.drawSelectionPreview(this.startX, this.startY, width, height);
                this.updateStatus('영역 선택됨 - DELETE 키로 삭제 또는 모자이크 도구 사용');
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

    drawRectangle(x, y, width, height) {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeRect(x, y, width, height);
    }

    drawArrow(fromX, fromY, toX, toY) {
        const headLen = 15 + this.lineWidth * 2;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLen * Math.cos(angle - Math.PI / 6),
            toY - headLen * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            toX - headLen * Math.cos(angle + Math.PI / 6),
            toY - headLen * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
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
            textObjects: JSON.parse(JSON.stringify(this.textObjects))
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.updateStatus('실행 취소됨');
        };
        img.src = prev.canvas;
        this.textObjects = JSON.parse(JSON.stringify(prev.textObjects));
        this.selectedTextId = null;
        this.renderTextLayer();
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

        // 현재 합성 이미지를 새 크기로 그리기
        const composite = this.getCompositeCanvas();
        this.canvas.width = newW;
        this.canvas.height = newH;
        this.overlayCanvas.width = newW;
        this.overlayCanvas.height = newH;
        this.textCanvas.width = newW;
        this.textCanvas.height = newH;
        this.ctx.drawImage(composite, 0, 0, newW, newH);

        // 텍스트 오브젝트 좌표/크기도 비율에 맞게 조정
        this.textObjects = this.textObjects.map(obj => ({
            ...obj,
            x: obj.x * scaleX,
            y: obj.y * scaleY,
            fontSize: Math.round(obj.fontSize * Math.min(scaleX, scaleY))
        }));

        this.saveState();
        this.imageSize.textContent = `${newW} x ${newH}`;
        this.updateOutputSizeLabel();
        this.renderTextLayer();
        this.closeResizeModal();
        this.showToast(`${newW} x ${newH} 으로 리사이즈됨`);
        this.updateStatus(`이미지 리사이즈: ${newW} x ${newH}`);
    }

    // ---------- Zoom ----------

    applyZoom() {
        this.canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
        this.zoomLevelLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
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
            this.updateStatus('전체 선택됨 - Ctrl+C / Cmd+C로 복사');
        }
        if (e.key === 'Delete' && this.selection && this.hasImage) {
            e.preventDefault();
            this.deleteSelection();
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

    renderTextLayer() {
        const ctx = this.textCtx;
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        for (const obj of this.textObjects) {
            this._renderTextToCtx(ctx, obj, obj.id === this.selectedTextId);
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

    deleteSelection() {
        if (!this.selection) { this.showToast('선택된 영역이 없습니다'); return; }
        const { x, y, width, height } = this.selection;
        if (width < 2 || height < 2) { this.showToast('선택 영역이 너무 작습니다'); return; }
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x, y, width, height);
        this.saveState();
        this.selection = null;
        this.clearOverlay();
        this.updateStatus('선택 영역 삭제됨');
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
