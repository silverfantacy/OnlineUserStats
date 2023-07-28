const WebSocket = require('ws');

// 設定伺服器端口
const port = 8080;

// 創建 WebSocket 伺服器
const wss = new WebSocket.Server({ port });

// 使用 Map 來存儲裝置 ID 與 WebSocket 連接的對應關係
const deviceConnections = new Map();

// WebSocket 連接事件
wss.on('connection', (ws, req) => {
  // 從 URL 查詢參數中獲取裝置 ID
  const deviceId = new URLSearchParams(req.url.split('?')[1]).get('deviceId');

  // 如果 deviceId 為 null，不進行與裝置 ID 相關的處理
  if (deviceId !== null) {
    // 將裝置 ID 與 WebSocket 連接關聯起來
    deviceConnections.set(deviceId, ws);

    // 發送在線使用者計數給所有客戶端
    broadcastOnlineUserCount();

    // WebSocket 關閉事件
    ws.on('close', () => {
      // 從 Map 中移除裝置 ID 對應的 WebSocket 連接
      deviceConnections.delete(deviceId);

      // 發送在線使用者計數給所有客戶端
      broadcastOnlineUserCount();
    });
  } else {
    // 發送在線使用者計數給所有客戶端（不使用裝置 ID）
    broadcastOnlineUserCount();
  }
});

// 广播在線使用者計數給所有客戶端
function broadcastOnlineUserCount() {
  const message = {
    type: 'online_users',
    count: deviceConnections.size
  };

  // 向所有已連接的客戶端發送消息
  deviceConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// 開始伺服器監聽
wss.on('listening', () => {
  console.log(`Server is running on port ${port}`);
});
