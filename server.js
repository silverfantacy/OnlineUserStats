const WebSocket = require('ws');
require('dotenv').config(); // 引入 dotenv

// 設定伺服器端口
const port = 8080;

// 創建 WebSocket 伺服器
const wss = new WebSocket.Server({
  port,
  verifyClient: (info, done) => {
    // 獲取客戶端的 hostname
    const hostname = info.req.headers.origin;

    // 檢查客戶端的 hostname 是否在允許的清單中
    if (isHostnameAllowed(hostname)) {
      done(true);
    } else {
      done(false, 403, 'Forbidden');
    }
  }
});

// 使用 Map 來存儲 gaId 到 WebSocket 連接的對應關係
const webConnections = new Map();

// 使用 Map 來存儲主機名到對應的 gaId 集合
const hostnameToGaIds = new Map();

// WebSocket 連接事件
wss.on('connection', (ws, req) => {
  // 從 URL 查詢參數中獲取 _ga ID
  const gaId = new URLSearchParams(req.url.split('?')[1]).get('gaId');

  // 獲取客戶端的 hostname
  const hostname = req.headers.origin;

  // 如果 gaId 為 null 或 hostname 不在允許的清單中，關閉連線
  if (gaId === null || !isHostnameAllowed(hostname)) {
    ws.close();
    return;
  }

  // 將 gaId 與 WebSocket 連接關聯起來
  webConnections.set(gaId, ws);

  // 將 gaId 與主機名關聯起來
  associateGaIdWithHostname(gaId, hostname);

  // 發送在線使用者計數給所有客戶端
  broadcastOnlineUserCount();

  // WebSocket 關閉事件
  ws.on('close', () => {
    // 從 Map 中移除 gaId 對應的 WebSocket 連接
    webConnections.delete(gaId);

    // 從主機名對應的 gaId 集合中移除 gaId
    disassociateGaIdWithHostname(gaId, hostname);

    // 發送在線使用者計數給所有客戶端
    broadcastOnlineUserCount();
  });
});

// 檢查 hostname 是否在允許的清單中
function isHostnameAllowed(hostname) {
  const allowedHostnames = new Set(process.env.ALLOWED_HOSTNAMES.split(','));
  return allowedHostnames.has(hostname);
}

// 將 gaId 與主機名關聯起來
function associateGaIdWithHostname(gaId, hostname) {
  if (!hostnameToGaIds.has(hostname)) {
    hostnameToGaIds.set(hostname, new Set());
  }
  hostnameToGaIds.get(hostname).add(gaId);
}

// 從主機名對應的 gaId 集合中移除 gaId
function disassociateGaIdWithHostname(gaId, hostname) {
  if (hostnameToGaIds.has(hostname)) {
    const gaIds = hostnameToGaIds.get(hostname);
    gaIds.delete(gaId);
    if (gaIds.size === 0) {
      hostnameToGaIds.delete(hostname);
    }
  }
}

// 廣播在線使用者計數給所有客戶端
function broadcastOnlineUserCount() {
  const message = {
    type: 'online_users',
    counts: {}
  };

  // 统计不同 hostname 下的在线人数
  hostnameToGaIds.forEach((gaIds, hostname) => {
    message.counts[hostname] = gaIds.size;
  });

  // 向所有已連接的客戶端發送消息
  webConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// 開始伺服器監聽
wss.on('listening', () => {
  console.log(`Server is running on port ${port}`);
});
