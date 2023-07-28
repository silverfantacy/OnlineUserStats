const express = require('express');
const app = express();
const WebSocket = require('ws');

// 設定伺服器端口
const port = 3000;

// 設置靜態資源資料夾
app.use(express.static('public'));

// 創建 WebSocket 伺服器
const wss = new WebSocket.Server({ port: 8080 });

// 在線使用者計數
let onlineUsers = 0;

// WebSocket 連接事件
wss.on('connection', (ws) => {
  // 新的客戶端連接，增加在線使用者計數
  onlineUsers++;
  console.log('New client connected. Online users:', onlineUsers);

  // 發送在線使用者計數給所有客戶端
  broadcastOnlineUserCount();

  // WebSocket 關閉事件
  ws.on('close', () => {
    // 客戶端斷開連接，減少在線使用者計數
    onlineUsers--;
    console.log('Client disconnected. Online users:', onlineUsers);

    // 發送在線使用者計數給所有客戶端
    broadcastOnlineUserCount();
  });
});

// 广播在線使用者計數給所有客戶端
function broadcastOnlineUserCount() {
  const message = {
    type: 'online_users',
    count: onlineUsers
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 建立一個 API 端點用於取得在線人數
app.get('/api/onlineUsers', (req, res) => {
  res.json({ count: onlineUsers });
});

// 開始伺服器監聽
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
