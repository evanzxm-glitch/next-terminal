# Next Terminal 1.3.9

这是基于 [dushixiang/next-terminal v1.3.9](https://github.com/dushixiang/next-terminal/tree/v1.3.9)
修改的部署版本。

主要变化：

- Web、REST API、静态资源和 WebSocket 统一使用 `/next-terminal` 前缀。
- 通过 `http://服务器IP:8080/next-terminal/` 访问。
- 根路径 `/` 和未加前缀的 API 返回 HTTP 404。
- Next Terminal 和 guacd 保持为两个独立容器。
- **移除"保持登录"功能**：登录 Token 仅存储在 `sessionStorage` 中，关闭浏览器后自动失效，需重新登录。
- **修复新标签页 Token 丢失问题**：RDP/SSH 接入、会话监控、会话回放等通过新标签页打开的功能，会自动在 URL 中传递 Token 并在页面加载后写入 `sessionStorage`，确保跨标签页认证正常。

## 会话登录说明

本版本对登录和认证机制做了以下调整：

1. **移除"保持登录"选项**：登录页面不再显示"保持登录"复选框，所有登录请求均使用非持久化 Token（后端有效期 2 小时）。
2. **Token 存储在 `sessionStorage`**：关闭浏览器标签页或窗口后，Token 自动清除，下次访问需要重新登录。
3. **跨标签页 Token 传递**：通过资产管理接入 RDP/SSH、在线会话监控、离线会话回放等功能时，系统会自动在 URL 中附带 Token 参数，新标签页加载后自动提取并存入 `sessionStorage`，随后从 URL 中移除（避免 Token 暴露在地址栏中）。

## 快速部署

```bash
git clone https://github.com/evanzxm-glitch/next-terminal.git
cd next-terminal
docker compose -f docker-compose.subpath.yml build
docker compose -f docker-compose.subpath.yml up -d
```

访问：

```text
http://服务器IP:8080/next-terminal/
```

默认账号和密码：

```text
admin / admin
```

首次登录后请立即修改密码。

## 容器镜像

```text
ghcr.io/evanzxm-glitch/next-terminal:1.3.9-subpath
ghcr.io/evanzxm-glitch/next-terminal-guacd:1.4.0
```

`guacd` 使用 Apache Guacamole 1.4.0 历史版本并固定镜像 digest。其 4822
端口仅在 Compose 内部网络使用，不对宿主机开放。

## 文档

- [Docker 容器部署说明](docs/docker-deployment.zh-CN.md)
- [子路径修改设计](docs/superpowers/specs/2026-06-14-subpath-deployment-design.md)
- [会话登录设计](docs/superpowers/specs/2026-06-15-session-only-login-design.md)

## 协议支持

- 原生 Web SSH 不依赖 guacd。
- RDP、VNC、Telnet 和 Guacamole 模式 SSH 依赖 guacd。
- 两个容器共享录屏与网盘数据目录。

## 构建

```bash
docker compose -f docker-compose.subpath.yml build
docker compose -f docker-compose.subpath.yml up -d
```

## License

本项目继承上游 [AGPL-3.0](LICENSE) 许可证及相关使用限制。
