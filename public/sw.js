importScripts('/src/js/idb.js');
importScripts('/src/js/helper.js');

const DYNAMIC_CACHE_MAX_SIZE = 16;
const CACHE_STATIC_NAME = 'static-v18';
const CACHE_DYNAMIC_NAME = 'dynamic-v3';
const APP_SHELL_FILES=[
    '/',
    '/index.html',
    '/favicon.ico',
    '/offline.html',
    '/src/js/helper.js',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/idb.js',
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

//SERVICE WORKER INSTALLATION 
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

//SERVICE WORKER ACTIVATION
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


//CACHE THEN NETWORK part2 (Fetch from network and write to indexdb (dinamic content), that's it):  
//should only work for the url -> 'https://pwagram-5109b.firebaseio.com/post'
self.addEventListener('fetch',function(event){
    const url ='https://pwagram-5109b.firebaseio.com/post';    

    //if request url matches the feeds request
    if (event.request.url.indexOf(url) > -1)
        {
        //fetch the request from network
        event.respondWith( fetch (event.request)
            .then( res => {
                console.log('SW: NON-APPSHELL NETWORK ROUTING -> ' + url);
                const cloneRes = res.clone();

                //clear indexedDb data before writing new data
                clearAllData('posts').then ( () => {
                    //if clear transaction was successfull we extract data from the response, to continue
                    return cloneRes.json();
                   })
                  .then ( data => {
                    //Store response data in indexedDB (Dynamic content) 
                    for (var key in data){
                        writeData('posts', data[key]);
                    }
                });
            return res;
            })   
          );
        }
    //STRATEGY CACHE ONLY, only for appshell files (static cache file)
    else if (isInArray(event.request.url) ) {
       //console.log("SW: APPSHELL CACHE -> "+ event.request.url);
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
                    console.log("SW: NON-APPSHELL CACHE -> " + event.request.url);
                    return respon;
                    }
                // go to the network to get the request, and place it in the cache
                else{
                    //fetch request from network, and return response
                    return fetch(event.request)
                      .then(res => {
                          return caches.open(CACHE_DYNAMIC_NAME)
                            .then(cache => {
                                console.log("SW: NON-APPSHELL NETWORK -> " + event.request.url);
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
                                  console.log("SW: NON-APPSHELL ROUTING CACHE -> " + event.request.url);
                                  return cache.match('/offline.html');
                              }
                          })
                      });
                }
            })
        );
    }
    
});

/* BACKGROUND SYNCRONICATION */

self.addEventListener ('sync', event => {
    console.log('[SW] => Background Syncing', event);
    if( event.tag === 'sync-new-posts'){
        console.log( '[SW] => Syncing new Posts' );
        event.waitUntil(
            //read all the data in indexedDB regarding pending posts, waiting to be syncronized
            readAllData( 'sync-posts')
            .then ( data => {
                //loop through all the pending posts stored in indexedDB
                for ( var dt of data){
                    // send item stored to backed server
                    syncData ( firebaseDbUrl, buildJsonPost(dt.id, dt.title, dt.location, dt.image))
                    .then (resp => {
                        console.log( 'Sent data => ', resp);
                        if ( resp.ok ){
                            // if sent successfully then delete the item from indexedDB
                            deleteDataItem( 'sync-posts', dt.id);
                        }
                    })
                    .catch( err => {
                        console.log ( 'Error while sending stored data', err);
                    })
                }
            })
        )
    }
})





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