// 缓存名称和版本
const CACHE_NAME = 'trading-scorecard-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装Service Worker，缓存初始资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        // 跳过等待，直接激活
        return self.skipWaiting();
      })
  );
});

// 激活Service Worker，清理旧缓存
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(function() {
      // 立即获取控制权
      return self.clients.claim();
    })
  );
});

// 拦截网络请求，优先从缓存中获取资源
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有匹配的资源，返回缓存的资源
        if (response) {
          return response;
        }
        
        // 否则，发起网络请求
        return fetch(event.request)
          .then(function(response) {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            
            // 将新的响应添加到缓存中
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(function(error) {
            console.error('Fetch failed:', error);
            // 如果是HTML请求失败，返回离线页面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// 监听消息，支持手动刷新缓存
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});