document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const imageList = document.getElementById('imageList');
    const selectedCount = document.getElementById('selectedCount');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('clearBtn');
    const progressArea = document.getElementById('progressArea');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultArea = document.getElementById('resultArea');
    const resultList = document.getElementById('resultList');
    const totalOriginalSize = document.getElementById('totalOriginalSize');
    const totalCompressedSize = document.getElementById('totalCompressedSize');
    const totalSaved = document.getElementById('totalSaved');
    const finalSaved = document.getElementById('finalSaved');
    const compressionRate = document.getElementById('compressionRate');
    const downloadBtn = document.getElementById('downloadBtn');

    let selectedFiles = [];
    let compressedBlob = null;

    // 格式化文件大小
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 处理拖放
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // 处理点击上传
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    // 处理文件选择
    function handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (selectedFiles.length + imageFiles.length > 10) {
            alert('最多只能选择10张图片');
            return;
        }

        selectedFiles = [...selectedFiles, ...imageFiles];
        updatePreview();
        updateStats();
    }

    // 更新预览区域
    function updatePreview() {
        imageList.innerHTML = '';
        selectedCount.textContent = selectedFiles.length;

        selectedFiles.forEach((file, index) => {
            const preview = document.createElement('div');
            preview.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            
            const info = document.createElement('div');
            info.className = 'file-info';
            info.textContent = `${file.name} (${formatSize(file.size)})`;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '删除';
            removeBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                updatePreview();
                updateStats();
            };
            
            preview.appendChild(img);
            preview.appendChild(info);
            preview.appendChild(removeBtn);
            imageList.appendChild(preview);
        });

        previewArea.style.display = selectedFiles.length > 0 ? 'block' : 'none';
        compressBtn.disabled = selectedFiles.length === 0;
    }

    // 更新统计信息
    function updateStats() {
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        const estimatedCompressedSize = Math.round(totalSize * 0.7); // 假设压缩率为30%
        const estimatedSaved = totalSize - estimatedCompressedSize;

        totalOriginalSize.textContent = formatSize(totalSize);
        totalCompressedSize.textContent = formatSize(estimatedCompressedSize);
        totalSaved.textContent = formatSize(estimatedSaved);
    }

    // 清除选择
    clearBtn.addEventListener('click', () => {
        selectedFiles = [];
        updatePreview();
        updateStats();
        resultArea.style.display = 'none';
    });

    // 压缩图片
    compressBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        progressArea.style.display = 'block';
        resultArea.style.display = 'none';
        progressBar.style.width = '0%';
        progressText.textContent = '正在压缩...';

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images[]', file);
        });

        try {
            const response = await fetch('/compress', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '压缩失败');
            }

            // 获取压缩结果
            const compressionResults = JSON.parse(response.headers.get('X-Compression-Results'));
            
            // 显示结果列表
            resultList.innerHTML = '';
            compressionResults.results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `
                    <div class="filename">${result.filename}</div>
                    <div class="size">原始：${formatSize(result.originalSize)}</div>
                    <div class="size">压缩后：${formatSize(result.compressedSize)}</div>
                    <div class="saved">节省：${formatSize(result.savedSize)} (${result.compressionRate}%)</div>
                `;
                resultList.appendChild(item);
            });

            // 更新总体统计
            finalSaved.textContent = formatSize(compressionResults.totalSaved);
            compressionRate.textContent = compressionResults.totalCompressionRate;

            // 保存压缩后的文件
            compressedBlob = await response.blob();
            
            // 显示结果区域
            resultArea.style.display = 'block';
            progressBar.style.width = '100%';
            progressText.textContent = '压缩完成！';
            
            setTimeout(() => {
                progressArea.style.display = 'none';
            }, 2000);

        } catch (error) {
            progressText.textContent = error.message;
            progressBar.style.width = '0%';
            
            setTimeout(() => {
                progressArea.style.display = 'none';
            }, 3000);
        }
    });

    // 下载压缩后的文件
    downloadBtn.addEventListener('click', () => {
        if (!compressedBlob) return;
        
        const url = window.URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed_images.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}); 