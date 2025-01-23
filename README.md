# 图片批量压缩工具

一个简单易用的在线图片压缩工具，帮助用户快速压缩图片文件大小。

## 功能特点

- 支持批量上传图片（最多10张）
- 支持拖拽上传
- 实时预览压缩效果
- 显示压缩前后文件大小对比
- 自动打包下载压缩后的图片

## 技术栈

- 前端：HTML5, CSS3, JavaScript
- 后端：Python Flask
- 图片处理：Pillow

## 本地开发

1. 克隆项目：
```bash
git clone [你的仓库地址]
cd 图片压缩工具
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 运行项目：
```bash
python app.py
```

4. 访问：
```
http://localhost:5000
```

## 部署说明

### 方式一：使用 PythonAnywhere

1. 注册 PythonAnywhere 账号
2. 创建 Web 应用
3. 上传项目文件
4. 安装依赖：
```bash
pip install -r requirements.txt
```
5. 配置 WSGI 文件，将入口指向 app.py

### 方式二：使用 Vercel

1. Fork 本项目到 GitHub
2. 注册 Vercel 账号
3. 导入 GitHub 项目
4. 选择 Python 框架
5. 部署完成后即可访问

### 方式三：使用云服务器

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 安装和配置 Nginx：
```bash
# Ubuntu/Debian
sudo apt-get install nginx

# 配置 Nginx
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. 使用 Gunicorn 运行：
```bash
gunicorn -w 4 -b 127.0.0.1:5000 app:app
```

## 注意事项

1. 生产环境部署时请修改 app.py 中的配置：
   - 关闭调试模式
   - 配置正确的 host 和 port
   - 添加错误处理
   - 配置日志

2. 建议配置 SSL 证书，使用 HTTPS 访问

3. 根据需求调整上传文件大小限制

## 许可证

MIT License 