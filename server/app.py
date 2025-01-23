from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import io
import os
import logging

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../static')
# 修改 CORS 配置，允许所有来源和方法
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"]
    }
})

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/compress', methods=['POST', 'OPTIONS'])
def compress_image():
    # 处理 OPTIONS 请求
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        logger.info("接收到压缩请求")
        logger.info(f"请求头: {request.headers}")
        
        if 'image' not in request.files:
            logger.error("没有找到上传的文件")
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['image']
        if not file.filename:
            logger.error("文件名为空")
            return jsonify({'error': '无效的文件'}), 400

        logger.info(f"接收到文件: {file.filename}")
        
        # 读取原始图片
        img = Image.open(file)
        logger.info(f"图片格式: {img.format}, 大小: {img.size}")
        
        # 准备输出
        output = io.BytesIO()
        
        # 保存原始大小
        file.seek(0)
        original_size = len(file.read())
        
        # 压缩图片
        try:
            if img.format == 'PNG':
                logger.info("使用PNG格式压缩")
                img.save(output, format='PNG', optimize=True)
            else:
                logger.info("使用JPEG格式压缩")
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])
                    img = background
                img.save(output, format='JPEG', quality=85, optimize=True)
            
            output.seek(0)
            compressed_size = len(output.getvalue())
            logger.info(f"压缩前大小: {original_size}, 压缩后大小: {compressed_size}")
            
            # 修改响应头
            response = send_file(
                output,
                mimetype=f'image/{img.format.lower()}',
                as_attachment=False,
                download_name=f"compressed_{file.filename}"
            )
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
            
        except Exception as e:
            logger.error(f"图片压缩失败: {str(e)}")
            return jsonify({'error': f'图片压缩失败: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f"处理请求失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        logger.info("启动服务器...")
        # 修改为 0.0.0.0 以允许所有连接
        app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
    except Exception as e:
        logger.error(f"服务器启动失败: {str(e)}") 