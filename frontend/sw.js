const CACHE_NAME = 'profisio-cache-v1';

// Arquivos mínimos para a tela de erro / load rápido
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/auth/login.html',
  '/pages/auth/recuperar.html',
  '/pages/intro/primeira_pagina.html',
  '/pages/paciente/home.html',
  '/pages/paciente/treinos.html',
  '/pages/adm/home_adm.html',
  '/style/intro/primeira_pagina.css',
  '/style/global.css',
  '/script/components.js',
  '/script/authGuard.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/manifest.json'
];

// Instalação do Service Worker e Caching inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Usa return cache.addAll(urlsToCache); num cenário de cache agressivo.
        // Aqui usamos uma abordagem tolerante
        return Promise.allSettled(
            urlsToCache.map(url => cache.add(url).catch(err => console.warn(`Falha no cache de ${url}:`, err)))
        );
      })
  );
  self.skipWaiting();
});

// Limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Rede (Network First, falling back to cache)
self.addEventListener('fetch', event => {
  // Ignora chamadas de API (Backend) para nunca causar problemas de dados velhos
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
