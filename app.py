from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io
import os
import zipfile

app = Flask(__name__, 
    template_folder='templates',  # 设置模板文件夹路径
    static_folder='static'        # 设置静态文件夹路径
)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compress', methods=['POST'])
def compress():
    try:
        # 获取上传的图片列表
        if 'images[]' not in request.files:
            return {'error': '没有上传图片'}, 400
        
        files = request.files.getlist('images[]')
        if not files or len(files) == 0:
            return {'error': '没有选择图片'}, 400
            
        if len(files) > 10:
            return {'error': '一次最多只能上传10张图片'}, 400

        # 创建一个内存中的ZIP文件
        memory_zip = io.BytesIO()
        compression_results = []
        total_original_size = 0
        total_compressed_size = 0

        with zipfile.ZipFile(memory_zip, 'w') as zf:
            for i, file in enumerate(files):
                if file.filename == '':
                    continue
                    
                try:
                    # 读取原始文件大小
                    file.seek(0, os.SEEK_END)
                    original_size = file.tell()
                    file.seek(0)
                    total_original_size += original_size

                    # 读取图片
                    img = Image.open(file.stream)
                    
                    # 转换为RGB模式（如果是RGBA）
                    if img.mode == 'RGBA':
                        img = img.convert('RGB')
                        
                    # 创建一个字节流来保存压缩后的图片
                    output = io.BytesIO()
                    
                    # 保存图片，使用JPEG格式和85%的质量
                    img.save(output, format='JPEG', quality=85, optimize=True)
                    output.seek(0)
                    
                    # 获取压缩后的大小
                    compressed_size = len(output.getvalue())
                    total_compressed_size += compressed_size
                    
                    # 将压缩后的图片添加到ZIP文件中
                    filename = f'compressed_{i+1}.jpg'
                    zf.writestr(filename, output.getvalue())
                    
                    # 记录压缩结果
                    compression_results.append({
                        'filename': file.filename,
                        'originalSize': original_size,
                        'compressedSize': compressed_size,
                        'savedSize': original_size - compressed_size,
                        'compressionRate': round((1 - compressed_size/original_size) * 100, 1)
                    })
                    
                except Exception as e:
                    print(f"处理图片 {file.filename} 时出错: {str(e)}")
                    continue

        memory_zip.seek(0)
        
        # 计算总体压缩率
        total_compression_rate = round((1 - total_compressed_size/total_original_size) * 100, 1) if total_original_size > 0 else 0
        
        # 返回压缩结果和ZIP文件
        response = send_file(
            memory_zip,
            mimetype='application/zip',
            as_attachment=True,
            download_name='compressed_images.zip'
        )
        
        # 添加压缩结果到响应头
        response.headers['X-Compression-Results'] = str({
            'results': compression_results,
            'totalOriginalSize': total_original_size,
            'totalCompressedSize': total_compressed_size,
            'totalSaved': total_original_size - total_compressed_size,
            'totalCompressionRate': total_compression_rate
        })
        
        return response
        
    except Exception as e:
        print(f"压缩过程中出错: {str(e)}")
        return {'error': f'压缩失败: {str(e)}'}, 500

if __name__ == '__main__':
    try:
        print("正在启动服务器...")
        app.run(debug=True, host='127.0.0.1', port=5000)
    except Exception as e:
        print(f"启动失败: {str(e)}") 