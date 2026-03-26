const CACHE_NAME = 'profisio-cache-v2';

// Arquivos mínimos para a tela de erro / load rápido
const urlsToCache = [
  '/inicio',
  '/login',
  '/recuperar-senha',
  '/meus-status',
  '/meus-treinos',
  '/admin',
  '/style/intro/primeira_pagina.css',
  '/style/auth/login.css',
  '/style/paciente/home_paciente.css',
  '/script/auth/login.js',
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
    fetch(event.request).catch(async () => {
      const match = await caches.match(event.request);
      if (match) return match;

      // Se for uma navegação de página, retorna o login como fallback (ou offline page)
      if (event.request.mode === 'navigate') {
        return caches.match('/login');
      }

      // Para outros recursos (css/js/img), se não tem no cache e falhou a rede, 
      // retornamos uma resposta de erro real para o browser entender em vez de undefined.
      return new Response('Recurso indisponível (Offline)', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
      });
    })
  );
});
