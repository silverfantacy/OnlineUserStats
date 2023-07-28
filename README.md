# 在線人數統計前端使用說明

這個前端程式用於顯示伺服器端的在線人數統計，並使用 Google Analytics 的 `_ga` cookie 來識別不同的使用者。

## 使用方法

1. 將以下前端程式碼保存成 `index.html` 檔案：

```html
<!DOCTYPE html>
<html>
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
    const deviceId = getGAID();

    // 連接到 WebSocket 伺服器，將裝置 ID 作為查詢參數傳遞
    const socket = new WebSocket(`wss://your_websocket_server:8080?deviceId=${deviceId}`);

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

2. 在 `index.html` 中將以下部分替換為實際的 WebSocket 伺服器位址：

```
wss://your_websocket_server:8080
```

請將 `your_websocket_server` 替換為實際的 WebSocket 伺服器位址，包括協議 (例如：`wss` 或 `ws`) 和埠號 (例如：`8080`)。

3. 將 `index.html` 部署到你的網站或伺服器。

4. 使用 Google Analytics 追蹤網站流量。確保在你的網站中設置了 Google Analytics 並在每個使用者訪問時將 `_ga` cookie 設置在使用者的瀏覽器中。

5. 當使用者訪問你的網站時，`index.html` 中的 JavaScript 程式碼將會自動從 `_ga` cookie 中獲取裝置 ID，然後將其傳遞給 WebSocket 伺服器。

6. WebSocket 伺服器將根據裝置 ID 記錄不同裝置的在線人數並向前端傳遞在線人數資訊。

7. 前端程式碼將在 `index.html` 中更新顯示目前的在線人數。

## 備註

- 這個前端程式碼需要和伺服器端的 `server.js` 配合使用，請確保已經在伺服器上部署了 `server.js`。

- 確保在瀏覽器中啟用了 JavaScript，因為這個程式使用 JavaScript 來連接 WebSocket 和解析 `_ga` cookie。

- 在使用 Google Analytics 的 `_ga` cookie 時，請遵守相關的法規和隱私政策。