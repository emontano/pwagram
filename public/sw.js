
const CACHE_STATIC_NAME = 'static-v10';
const CACHE_DYNAMIC_NAME = 'dynamic-v3';
const APP_SHELL_FILES=[
    '/',
    '/index.html',
    '/favicon.ico',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];
const DYNAMIC_CACHE_MAX_SIZE = 16;

self.addEventListener('install',function(event){
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
           .then(cache => {
              console.log('[Service Worker] Precaching App Shell');
              cache.addAll(APP_SHELL_FILES);
            })
       )
   });

//comment

self.addEventListener('activate',function(event){
    console.log('[Service Worker] Activating Service Worker ...', event);

    //clean storage static cache
    event.waitUntil(caches.keys()
      .then(keyList => {
        console.log('[Service Worker] Key List:', keyList);
        return Promise.all( keyList.map(key => {
            if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME){
                console.log('[Service Worker] Removing old cache', key);
                return caches.delete(key);
            }
        }));    
      })
    );

    return self.clients.claim();
});

//STRATEGY: Cache with Network Fallback (With dynamic caching) - STARTING OPTION
/* self.addEventListener('fetch',function(event){
    //console.log('[Service Worker] Fetching something ....', event);
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if(response){
                return response;
              }
            else{
                return fetch(event.request)
                  .then(res => {
                      return caches.open(CACHE_DYNAMIC_NAME)
                        .then(cache => {
                            cache.put(event.request.url, res.clone());
                            return res;
                        })
                  })
                  .catch(err => {
                      //offline fallback page
                      return caches.open(CACHE_STATIC_NAME).then(cache => cache.match('/offline.html'))
                  });
            }
        })
    );
});
 */

//STRAGEY: Cache Only
/* self.addEventListener('fetch',function(event){
    //console.log('[Service Worker] Fetching something ....', event);
    event.respondWith( caches.match( event.request ));
    }); */


//STRATEGY: Network Only
/* self.addEventListener('fetch',function(event){
    //console.log('[Service Worker] Fetching something ....', event);
    event.respondWith( fetch( event.request ));
    }); */

//STRATEGY: Network with Cache Fallback
/* self.addEventListener('fetch',function(event){
    //console.log('[Service Worker] Fetching something ....', event);
    event.respondWith( 
        fetch( event.request )
        .catch(err => {
            return caches.match(event.request);
          })
        );
    }); */

//CACHE THEN NETWORK part2 (Fetch from network and write to cache, that's it):  
//should only work for the feeds url -> 'https://httpbin.org/get'
self.addEventListener('fetch',function(event){
    const url ='https://pwagram-5109b.firebaseio.com/post.json';    

    //if request url matches the feeds request
    if (event.request.url.indexOf(url) > -1)
        {
        event.respondWith(
            //fetch the request from network
             fetch (event.request)
            .then( res => {
                console.log('ServiceWorker: Non-APPSHELL NETWORK ROUTETING Response for url -> ' + url);
                // place the request in the dynamic cache
                return caches.open(CACHE_DYNAMIC_NAME)
                .then( cache => {
                    trimCache(CACHE_DYNAMIC_NAME,DYNAMIC_CACHE_MAX_SIZE);
                    cache.put(event.request, res.clone());
                    return res;
                    });
            })   
          )
        }
    //STRATEGY CACHE ONLY, only for appshell files (static cache file)
    else if (isInArray(event.request.url) ) {
       console.log("ServiceWorker: APPSHELL CACHE response: For -> "+ event.request.url);
       event.respondWith( caches.match(event.request) );
       }
    // STRATEGY: CACHE THEN NETWORK +  DYNAMIC CACHE, with Offline support, For all other urls
    //keep using the old strategy ; cache , network with offline fallback    
    else{
        event.respondWith(
            //looks for request in the cache
            caches.match(event.request)
            .then(respon => {
                //if found in cache, respond from cache
                if(respon)
                    {
                    console.log("ServiceWorker: Non-APPSHELL CACHE response for -> " + event.request.url);
                    return respon;
                    }
                // go to the network to get the request, and place it in the cache
                else{
                    //fetch request from network, and return response
                    return fetch(event.request)
                      .then(res => {
                          return caches.open(CACHE_DYNAMIC_NAME)
                            .then(cache => {
                                console.log("ServiceWorker: Non-APPSHELL NETWORK response for -> " + event.request.url);
                                //write request to cache
                                trimCache(CACHE_DYNAMIC_NAME,DYNAMIC_CACHE_MAX_SIZE);
                                cache.put(event.request, res.clone());
                                return res;
                            })
                      })
                      // if there is an error during request fetch from network, show offline page
                      .catch(err => {
                          //offline fallback page
                           return caches.open(CACHE_STATIC_NAME)
                          .then(cache => {
                              if (event.request.headers.get('accept').includes('text/html')){
                                  console.log("ServiceWorker: Non-APPSHELL ROUTING CACHE response for -> " + event.request.url);
                                  return cache.match('/offline.html');
                              }
                          })
                      });
                }
            })
        );
    }
    
});

//VERIFYS IF A URL IS IN THE APPSHELL FILES ARRAY
function isInArray(url){
    var cachePath;

    if( url.indexOf(self.origin) === 0){
        console.log('Domain: ' + self.origin + ' ; Matched  Url: ' + url);
        cachePath = url.substring(self.origin.length);
        }
    else{
        cachePath = url;
        console.log('No Match For: ' + url );
    }
    return APP_SHELL_FILES.indexOf(cachePath) > -1; 
}

//TRIMS THE A CACHE AND REMOVES ELEMENTS UNTIL MAXURLS IS MET
function trimCache(cacheName, maxUrls){
    caches.open(cacheName)
        .then( cache => {
            return cache.keys()
            .then( keys => {
                if(keys.length > maxUrls){
                    //console.log('DELETING URL: ' + keys[0] );
                    cache.delete(keys[0]);
                    trimCache(cacheName, maxUrls);
                }
            })
        })
}