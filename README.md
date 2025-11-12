# AITraveler 镜像使用指南

## 镜像地址
- 仓库：`crpi-a4bi1pmbfm25tg2s.cn-hangzhou.personal.cr.aliyuncs.com/xuzhiwangzhe/aitravel`
- 标签：`latest`

## 环境准备
- 已安装 Docker（桌面版或 CLI）
- 可访问阿里云个人镜像仓库的网络权限与账号

## 拉取镜像
- 运行：
  - `docker pull crpi-a4bi1pmbfm25tg2s.cn-hangzhou.personal.cr.aliyuncs.com/xuzhiwangzhe/aitravel:latest`

## 运行容器（本机 3000 端口）
- 请创建.env文件，并填写对应内容
- 运行：
  - `docker run --rm -p 3000:3000 --env-file .env crpi-a4bi1pmbfm25tg2s.cn-hangzhou.personal.cr.aliyuncs.com/xuzhiwangzhe/aitravel:latest`
- 访问：
  - 前端：`http://localhost:3000`
  - 后端接口：`http://localhost:3000/api/*`

## 更新镜像
- 拉取新版本：
  - `docker pull crpi-a4bi1pmbfm25tg2s.cn-hangzhou.personal.cr.aliyuncs.com/xuzhiwangzhe/aitravel:<新的版本号>`
- 停止旧容器并使用新版本号重新运行

## 常见问题
- 端口占用：如 `3000` 已被占用，修改 `-p <本机端口>:3000`
- 无法访问：检查 `--env-file .env` 是否配置完整，以及本机防火墙规则