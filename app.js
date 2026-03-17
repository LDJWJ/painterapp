// Painter App - Main JavaScript

class PainterApp {
    constructor() {
        // Canvas elements
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.placeholder = document.getElementById('placeholder');

        // Tool buttons
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

        // Status elements
        this.statusText = document.getElementById('statusText');
        this.imageSize = document.getElementById('imageSize');

        // State
        this.currentTool = 'select';
        this.currentColor = '#ff0000';
        this.lineWidth = 3;
        this.blockSize = 15;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.hasImage = false;
        this.baseImage = null;

        // History for undo
        this.history = [];
        this.maxHistory = 20;

        // Selection state
        this.selection = null;

        // Text tool state
        this.textOverlay = null;
        this.pendingTextX = 0;
        this.pendingTextY = 0;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updatePresetColorActive();
    }

    bindEvents() {
        // Paste event
        document.addEventListener('paste', (e) => this.handlePaste(e));

        // Tool selection
        this.toolButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        // Color picker
        this.colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            this.updatePresetColorActive();
        });

        // Preset colors
        this.presetColors.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.dataset.color;
                this.colorPicker.value = btn.dataset.color;
                this.updatePresetColorActive();
            });
        });

        // Line width
        this.lineWidthInput.addEventListener('input', (e) => {
            this.lineWidth = parseInt(e.target.value);
            this.lineWidthValue.textContent = `${this.lineWidth}px`;
        });

        // Block size
        this.blockSizeInput.addEventListener('input', (e) => {
            this.blockSize = parseInt(e.target.value);
            this.blockSizeValue.textContent = `${this.blockSize}px`;
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Action buttons
        this.undoBtn.addEventListener('click', () => this.undo());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.downloadBtn.addEventListener('click', () => this.download());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

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
                this.ctx.drawImage(img, 0, 0);
                this.hasImage = true;
                this.placeholder.classList.add('hidden');
                this.canvas.style.display = 'block';
                this.overlayCanvas.style.display = 'block';
                this.saveState();
                this.updateStatus('이미지 로드됨');
                this.imageSize.textContent = `${img.width} x ${img.height}`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    selectTool(tool) {
        this.dismissTextOverlay();
        this.currentTool = tool;
        this.toolButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        this.selection = null;
        this.clearOverlay();
        this.updateStatus(`도구: ${this.getToolName(tool)}`);
    }

    getToolName(tool) {
        const names = {
            select: '선택',
            rectangle: '사각형',
            arrow: '화살표',
            mosaic: '모자이크',
            erase: '삭제',
            rightclick: '우클릭 아이콘',
            text: '텍스트'
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

    handleMouseDown(e) {
        if (!this.hasImage) return;

        const coords = this.getCanvasCoords(e);

        if (this.currentTool === 'rightclick') {
            this.drawRightClickIcon(coords.x, coords.y);
            this.saveState();
            this.updateStatus('우클릭 아이콘 추가됨');
            return;
        }
        if (this.currentTool === 'text') {
            this.showTextOverlay(coords.x, coords.y, e.clientX, e.clientY);
            return;
        }

        this.isDrawing = true;
        this.startX = coords.x;
        this.startY = coords.y;

        // Save state before drawing
        this.tempState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    handleMouseMove(e) {
        if (!this.isDrawing || !this.hasImage) return;

        const coords = this.getCanvasCoords(e);
        const width = coords.x - this.startX;
        const height = coords.y - this.startY;

        switch (this.currentTool) {
            case 'select':
            case 'mosaic':
            case 'erase':
                // 선택 미리보기는 오버레이 캔버스에만 그림
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
        if (!this.isDrawing || !this.hasImage) return;

        this.isDrawing = false;
        const coords = this.getCanvasCoords(e);
        const width = coords.x - this.startX;
        const height = coords.y - this.startY;

        switch (this.currentTool) {
            case 'select':
                // 선택 영역은 오버레이에 유지 (메인 캔버스 건드리지 않음)
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

    clearOverlay() {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }

    drawSelectionPreview(x, y, width, height) {
        // 오버레이 캔버스에 그려서 메인 캔버스 이미지 데이터를 오염시키지 않음
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

        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // Draw arrowhead
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

        // Clamp to canvas boundaries
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

                // Calculate average color for block
                for (let py = by; py < by + blockSize && py < clampedH; py++) {
                    for (let px = bx; px < bx + blockSize && px < clampedW; px++) {
                        const i = (py * stride + px) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }

                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);

                // Apply average color to block
                for (let py = by; py < by + blockSize && py < clampedH; py++) {
                    for (let px = bx; px < bx + blockSize && px < clampedW; px++) {
                        const i = (py * stride + px) * 4;
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
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
        const w = Math.abs(width);
        const h = Math.abs(height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(startX, startY, w, h);
        this.updateStatus('영역 삭제됨');
    }

    saveState() {
        const state = this.canvas.toDataURL();
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length <= 1) {
            this.showToast('더 이상 취소할 수 없습니다');
            return;
        }

        this.history.pop(); // Remove current state
        const prevState = this.history[this.history.length - 1];

        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.updateStatus('실행 취소됨');
        };
        img.src = prevState;
    }

    async copyToClipboard() {
        if (!this.hasImage) {
            this.showToast('복사할 이미지가 없습니다');
            return;
        }

        try {
            const blob = await new Promise(resolve =>
                this.canvas.toBlob(resolve, 'image/png')
            );

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            this.showToast('클립보드에 복사됨');
            this.updateStatus('이미지가 클립보드에 복사됨');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('복사 실패 - 브라우저 권한을 확인하세요');
        }
    }

    download() {
        if (!this.hasImage) {
            this.showToast('다운로드할 이미지가 없습니다');
            return;
        }

        const link = document.createElement('a');
        link.download = `edited-image-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();

        this.showToast('이미지 다운로드됨');
        this.updateStatus('이미지 다운로드됨');
    }

    handleKeyboard(e) {
        if (this.textOverlay) return;

        // Ctrl+Z: Undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            this.undo();
        }

        // Ctrl+A: Select all (for copy)
        if (e.ctrlKey && e.key === 'a' && this.hasImage) {
            e.preventDefault();
            this.selection = {
                x: 0,
                y: 0,
                width: this.canvas.width,
                height: this.canvas.height
            };
            this.updateStatus('전체 선택됨 - Ctrl+C로 복사');
        }

        // Ctrl+C: Copy
        if (e.ctrlKey && e.key === 'c' && this.hasImage) {
            e.preventDefault();
            this.copyToClipboard();
        }

        // Ctrl+S: Download
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.download();
        }

        // Delete: 선택 영역 삭제
        if (e.key === 'Delete' && this.selection && this.hasImage) {
            e.preventDefault();
            this.deleteSelection();
        }
    }

    drawRightClickIcon(cx, cy) {
        const ctx = this.ctx;
        const W = 22, H = 36;
        const x = cx - W / 2;
        const y = cy - H / 2;
        const r = 8; // corner radius
        const btnLineY = y + H * 0.38;
        const midX = x + W / 2;

        ctx.save();

        // Mouse outline (rounded rect)
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

        // Right button fill (highlight)
        ctx.beginPath();
        ctx.moveTo(midX, y + 1);
        ctx.lineTo(x + W - r, y + 1);
        ctx.arcTo(x + W - 1, y + 1, x + W - 1, y + r, r - 1);
        ctx.lineTo(x + W - 1, btnLineY);
        ctx.lineTo(midX, btnLineY);
        ctx.closePath();
        ctx.fillStyle = this.currentColor;
        ctx.fill();

        // Horizontal divider line (button/body)
        ctx.beginPath();
        ctx.moveTo(x + 1, btnLineY);
        ctx.lineTo(x + W - 1, btnLineY);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Vertical center line (left/right button)
        ctx.beginPath();
        ctx.moveTo(midX, y + 1);
        ctx.lineTo(midX, btnLineY - 1);
        ctx.stroke();

        // Scroll wheel
        const wheelX = midX - 2;
        const wheelY = btnLineY + (H - H * 0.38) * 0.25;
        const wheelH = (H - H * 0.38) * 0.35;
        ctx.beginPath();
        ctx.roundRect(wheelX, wheelY, 4, wheelH, 2);
        ctx.fillStyle = '#888888';
        ctx.fill();

        ctx.restore();
    }

    showTextOverlay(canvasX, canvasY, clientX, clientY) {
        this.dismissTextOverlay();
        this.pendingTextX = canvasX;
        this.pendingTextY = canvasY;

        const wrapper = document.querySelector('.canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();

        const overlay = document.createElement('div');
        overlay.className = 'text-input-overlay';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '텍스트 입력...';

        const actions = document.createElement('div');
        actions.className = 'text-overlay-actions';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-btn';
        confirmBtn.textContent = '확인';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '취소';

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        overlay.appendChild(input);
        overlay.appendChild(actions);
        wrapper.appendChild(overlay);
        this.textOverlay = overlay;

        // Position overlay relative to canvas-wrapper
        let left = clientX - wrapperRect.left + 8;
        let top = clientY - wrapperRect.top + 8;
        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';

        // After render, correct if out of bounds
        requestAnimationFrame(() => {
            const oRect = overlay.getBoundingClientRect();
            if (oRect.right > window.innerWidth - 8) {
                left = clientX - wrapperRect.left - oRect.width - 8;
                overlay.style.left = left + 'px';
            }
            if (oRect.bottom > window.innerHeight - 8) {
                top = clientY - wrapperRect.top - oRect.height - 8;
                overlay.style.top = top + 'px';
            }
        });

        const confirm = () => {
            const text = input.value.trim();
            if (text) {
                this.drawText(text, this.pendingTextX, this.pendingTextY);
                this.saveState();
                this.updateStatus('텍스트 추가됨');
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

    dismissTextOverlay() {
        if (this.textOverlay) {
            this.textOverlay.remove();
            this.textOverlay = null;
        }
    }

    drawText(text, x, y) {
        const ctx = this.ctx;
        const fontSize = 8 + this.lineWidth * 5;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = this.currentColor;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    }

    deleteSelection() {
        if (!this.selection) {
            this.showToast('선택된 영역이 없습니다');
            return;
        }

        const { x, y, width, height } = this.selection;
        if (width < 2 || height < 2) {
            this.showToast('선택 영역이 너무 작습니다');
            return;
        }

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
