const WebSocket = require('ws');
require('dotenv').config(); // 引入 dotenv

// 設定伺服器端口
const port = 8080;

// 允許連線的 hostname 清單
const allowedHostnames = new Set(process.env.ALLOWED_HOSTNAMES.split(','));

// 創建 WebSocket 伺服器
const wss = new WebSocket.Server({
  port,
  verifyClient: (info, done) => {
    // 獲取客戶端的 hostname
    const hostname = info.req.headers.origin;

    // 檢查客戶端的 hostname 是否在允許的清單中
    if (allowedHostnames.has(hostname)) {
      done(true);
    } else {
      done(false, 403, 'Forbidden');
    }
  }
});

// 使用 Map 來存儲 _ga ID 與 WebSocket 連接的對應關係
const webConnections = new Map();

// WebSocket 連接事件
wss.on('connection', (ws, req) => {
  // 從 URL 查詢參數中獲取 _ga ID
  const gaId = new URLSearchParams(req.url.split('?')[1]).get('gaId');

  // 判斷是否為查看在線人數的連線
  if (gaId === 'viewer') {
    handleViewerConnection(ws);
    return;
  }

  // 如果 gaId 為 null，關閉連線
  if (gaId === null) {
    ws.close();
    return;
  }

  // 將_ga ID 與 WebSocket 連接關聯起來
  webConnections.set(gaId, ws);

  // 發送在線使用者計數給所有客戶端
  broadcastOnlineUserCount();

  // WebSocket 關閉事件
  ws.on('close', () => {
    // 從 Map 中移除 _ga ID 對應的 WebSocket 連接
    webConnections.delete(gaId);

    // 發送在線使用者計數給所有客戶端
    broadcastOnlineUserCount();
  });
});

// 廣播在線使用者計數給所有客戶端
function broadcastOnlineUserCount() {
  const message = {
    type: 'online_users',
    count: webConnections.size
  };

  // 向所有已連接的客戶端發送消息
  webConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// 處理查看在線人數的連線
function handleViewerConnection(ws) {
  // 發送目前的在線人數給查看在線人數的連線
  const message = {
    type: 'online_users',
    count: webConnections.size
  };

  ws.send(JSON.stringify(message));

  // 關閉查看在線人數的連線
  ws.close();
}

// 開始伺服器監聽
wss.on('listening', () => {
  console.log(`Server is running on port ${port}`);
});
