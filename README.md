# 日常有数

个人饮食、训练、身体与日常手账，发布在 GitHub Pages。React + Vite；无需网站账号。

个人记录以 AES-256-GCM 加密后随站点发布。专属链接的 `#k=` 片段提供浏览器端解密访问码，不随 HTTP 请求发送。请保管自己的专属链接。

聊天更新的发布数据可跨设备读取。网页手动编辑使用当前设备的加密 localStorage，不会自动提交到 GitHub；可导出备份。日期采用北京时间。食物与运动消耗估算会保留假设和区间。

## 维护

本地 `private/journal.json` 是原始记录，`private/access-key.txt` 是访问码；两者均被 Git 忽略，禁止提交。修改原始记录时复用稳定的条目 ID，保留原始描述和不确定性。

1. `npm run seal` 更新 `public/data/journal.enc.json`，并做精确解密回读。
2. `npm run build` 检查 TypeScript 并构建站点。
3. 提交公开源码和加密记录，推送 `main`。GitHub Actions 发布 `dist`。
4. 验证 Pages 部署和解密后的记录。

若记录涉及器械标称配重，保留原始数字、单位与滑轮信息；不将不同器械数字直接加总。未提供的体重、食物、时间和组数不补造。
