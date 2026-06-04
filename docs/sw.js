const CACHE='mmll-v1',URLS=['./index.html','./manifest.webmanifest','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.2/dist/umd/supabase.min.js']
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)))})
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})
