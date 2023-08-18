const WebSocket = require('ws');
require('dotenv').config(); // 引入 dotenv

// 設定伺服器端口
const port = process.env.PORT || 8080;

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
// 同時也存儲主機名與 WebSocket 連接的對應關係
const webConnections = new Map();

// 使用 Map 來存儲主機名到對應的 gaId 集合
const hostnameToGaIds = new Map();

// WebSocket 連接事件
wss.on('connection', (ws, req) => {
  // 從 URL 查詢參數中獲取 gaId 與 requestType
  const queryParameters = new URLSearchParams(req.url.split('?')[1]);
  const gaId = queryParameters.get('gaId');
  const requestType = queryParameters.get('type');

  // 獲取客戶端的 hostname
  const hostname = req.headers.origin;

  if (requestType === 'all_online_users') {
    // 將 requestType 與 WebSocket 連接關聯起來
    webConnections.set(ws, {
      type: requestType,
    });
  } else {
    // 如果 gaId 為 null 或 hostname 不在允許的清單中，關閉連線
    if (gaId === null || !isHostnameAllowed(hostname)) {
      ws.close();
      return;
    }

    // 將 gaId 與 WebSocket 連接關聯起來
    webConnections.set(ws, {
      gaId: gaId,
      hostname: hostname
    });

    // 將 gaId 與主機名關聯起來
    associateGaIdWithHostname(gaId, hostname);
  }

  // 發送在線使用者計數給所有客戶端
  broadcastOnlineUserCount();

  // WebSocket 關閉事件
  ws.on('close', () => {
    const connectionInfo = webConnections.get(ws);
    if (connectionInfo) {
      // 從 Map 中移除 gaId 對應的 WebSocket 連接
      webConnections.delete(ws);

      // 從主機名對應的 gaId 集合中移除 gaId
      disassociateGaIdWithHostname(connectionInfo.gaId, connectionInfo.hostname);

      // 發送在線使用者計數給所有客戶端
      broadcastOnlineUserCount();
    }
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
  webConnections.forEach((connectionInfo, ws) => {
    if (connectionInfo.type === 'all_online_users') {
      let tempMessage = {
        type: 'all_online_users',
        counts: message.counts,
      };
      ws.send(JSON.stringify(tempMessage));
    } else {
      const hostname = connectionInfo.hostname;
      let tempMessage = {
        type: message.type,
      };
      tempMessage.count = hostnameToGaIds.get(hostname).size;
      ws.send(JSON.stringify(tempMessage));
    }
  });
}

// 開始伺服器監聽
wss.on('listening', () => {
  console.log(`Server is running on port ${port}`);
});
