# Docker 容器部署说明

## 架构

部署包含两个独立容器：

| 容器 | 功能 | 对外端口 |
| --- | --- | --- |
| `next-terminal-subpath` | Web、REST API、WebSocket、数据库 | `8080` |
| `next-terminal-guacd` | RDP、VNC、Telnet、Guacamole SSH | 无 |

Next Terminal 通过 Compose 内部网络访问 `guacd:4822`。不要将 4822
映射到宿主机。

两个容器必须挂载相同的数据目录，因为录屏和网盘路径需要在两个容器中保持一致：

```text
/usr/local/next-terminal/data
```

## 环境要求

- Linux x86-64 主机
- Docker Engine 24 或更高版本
- Docker Compose v2
- 至少 2 GB 可用内存
- 放行需要访问的宿主机端口，默认是 TCP 8080

历史版 guacd 1.4.0 镜像仅发布 `linux/amd64`，因此完整双容器部署需要
x86-64 主机。

## 使用 GHCR 镜像部署

```bash
git clone https://github.com/evanzxm-glitch/next-terminal.git
cd next-terminal
docker compose -f docker-compose.subpath.yml pull
docker compose -f docker-compose.subpath.yml up -d
```

查看状态：

```bash
docker compose -f docker-compose.subpath.yml ps
docker compose -f docker-compose.subpath.yml logs -f
```

访问：

```text
http://服务器IP:8080/next-terminal/
```

以下地址应返回 404：

```text
http://服务器IP:8080/
http://服务器IP:8080/login
```

默认账号密码是 `admin/admin`。首次登录后应立即修改密码。

## 自定义端口与数据目录

默认数据保存在仓库的 `./data`。生产环境建议使用绝对路径：

```bash
export NEXT_TERMINAL_DATA_DIR=/opt/next-terminal-data
export NEXT_TERMINAL_PORT=8080
mkdir -p "$NEXT_TERMINAL_DATA_DIR"
docker compose -f docker-compose.subpath.yml up -d
```

也可以创建 `.env`：

```dotenv
NEXT_TERMINAL_DATA_DIR=/opt/next-terminal-data
NEXT_TERMINAL_PORT=8080
```

## 从源码构建

```bash
git clone https://github.com/evanzxm-glitch/next-terminal.git
cd next-terminal
docker compose -f docker-compose.subpath.yml build
docker compose -f docker-compose.subpath.yml up -d
```

应用镜像会依次完成：

1. 安装前端锁定依赖并生成 `/next-terminal/` 静态资源。
2. 将静态资源嵌入 Go 二进制。
3. 生成不依赖 glibc 的 Linux 静态程序。

guacd 镜像基于 Apache Guacamole 1.4.0，并加入中文字体和 Menlo 等宽字体。

## 验证

```bash
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/next-terminal/
docker exec next-terminal-subpath \
  sh -c 'nc -zvw3 guacd 4822'
```

预期结果：

- `/` 返回 404。
- `/next-terminal/` 返回 200。
- 应用容器可以连接 `guacd:4822`。

## 更新

```bash
docker compose -f docker-compose.subpath.yml pull
docker compose -f docker-compose.subpath.yml up -d
```

数据保存在挂载目录中，重建容器不会删除 SQLite 数据、录屏或网盘文件。
更新前仍建议备份整个数据目录。

## 停止与删除容器

停止：

```bash
docker compose -f docker-compose.subpath.yml stop
```

删除容器和网络但保留数据：

```bash
docker compose -f docker-compose.subpath.yml down
```

除非确定不再需要数据，否则不要删除 `NEXT_TERMINAL_DATA_DIR`。

## 常见问题

### Web SSH 是否必须运行 guacd？

原生 Web SSH 不需要 guacd。但 RDP、VNC、Telnet 和 Guacamole 模式 SSH
需要 guacd。建议始终使用完整双容器部署。

### 为什么 4822 没有宿主机端口？

只有 Next Terminal 后台需要访问 guacd。Compose 内部 DNS 和网络已经满足
通信需求，对外开放 4822 会增加不必要的攻击面。

### 页面可打开但 API 或 WebSocket 失败

确认浏览器访问的是 `/next-terminal/`，且反向代理没有删除该前缀。REST API
和 WebSocket 也必须保留 `/next-terminal`。
