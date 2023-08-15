# 在線人數統計前端使用說明

這個前端程式用於顯示伺服器端的在線人數統計，並使用 Google Analytics 的 `_ga` cookie 來識別不同的使用者。

## 使用方式

1. 在你的前端 HTML 文件中，添加以下程式碼以建立 WebSocket 連線並接收在線使用者計數：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <title>在線人數統計</title>
</head>
<body>
  <h1>在線人數: <span id="onlineUsers">Loading...</span></h1>

  <script>
    // 函數來解析 Google Analytics 的 _ga cookie 值，獲取裝置 ID
    function getGAID() {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.indexOf('_ga=') === 0) {
          const gaID = cookie.substring('_ga='.length);
          return gaID;
        }
      }
      return null;
    }

    // 從 Google Analytics 的 _ga cookie 中獲取裝置 ID
    const gaID = getGAID();

    // 連接到 WebSocket 伺服器，將裝置 ID 作為查詢參數傳遞
    const socket = new WebSocket(`wss://your_websocket_server?gaId=${gaID}`);

    // type=all_online_users 用來查看所有資料 
    // const socket = new WebSocket(`wss://your_websocket_server?type=all_online_users`);

    // WebSocket 連接開啟事件
    socket.onopen = () => {
      console.log('WebSocket connection opened.');
    };

    // WebSocket 連接關閉事件
    socket.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    // WebSocket 接收訊息事件
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'online_users') {
        document.getElementById('onlineUsers').innerText = data.count;
      }
    };
  </script>
</body>
</html>
```

2. 請確保將上面程式碼中的 `your_websocket_server` 替換成你的 WebSocket 伺服器的域名或 IP 地址。

## 注意事項

- 請確保在你的網站中使用了 Google Analytics，並且 `_ga` cookie 可供存取。
- 請根據你的需求調整程式碼中的 WebSocket 伺服器位址。
- 這個範例僅用於演示如何使用 WebSocket 連接到伺服器以獲取在線人數統計，實際使用時請依據你的需求進行修改。