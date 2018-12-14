importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js');
importScripts('/js/idb.js');
importScripts('/js/helper.js');

const MATERIAL_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css';

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  //PRECACHING (APP-SHELL FILES)
  workbox.precaching.precacheAndRoute([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "f3d19e1269fad49e96be6db847076123"
  },
  {
    "url": "manifest.json",
    "revision": "d65ae1b9e348ac40cc8eea0b8d25bab2"
  },
  {
    "url": "pages/404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "pages/help/index.html",
    "revision": "fa4ad690b3fc71445ba4f3c2c7223af0"
  },
  {
    "url": "pages/offline.html",
    "revision": "70cf4948a18b4d7d4b3c57a3c461ff95"
  },
  {
    "url": "images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "images/icons/app-icon-144x144.png",
    "revision": "83011e228238e66949f0aa0f28f128ef"
  },
  {
    "url": "images/icons/app-icon-192x192.png",
    "revision": "f927cb7f94b4104142dd6e65dcb600c1"
  },
  {
    "url": "images/icons/app-icon-256x256.png",
    "revision": "86c18ed2761e15cd082afb9a86f9093d"
  },
  {
    "url": "images/icons/app-icon-384x384.png",
    "revision": "fbb29bd136322381cc69165fd094ac41"
  },
  {
    "url": "images/icons/app-icon-48x48.png",
    "revision": "45eb5bd6e938c31cb371481b4719eb14"
  },
  {
    "url": "images/icons/app-icon-512x512.png",
    "revision": "d42d62ccce4170072b28e4ae03a8d8d6"
  },
  {
    "url": "images/icons/app-icon-96x96.png",
    "revision": "56420472b13ab9ea107f3b6046b0a824"
  },
  {
    "url": "images/icons/apple-icon-114x114.png",
    "revision": "74061872747d33e4e9f202bdefef8f03"
  },
  {
    "url": "images/icons/apple-icon-120x120.png",
    "revision": "abd1cfb1a51ebe8cddbb9ada65cde578"
  },
  {
    "url": "images/icons/apple-icon-144x144.png",
    "revision": "b4b4f7ced5a981dcd18cb2dc9c2b215a"
  },
  {
    "url": "images/icons/apple-icon-152x152.png",
    "revision": "841f96b69f9f74931d925afb3f64a9c2"
  },
  {
    "url": "images/icons/apple-icon-180x180.png",
    "revision": "2e5e6e6f2685236ab6b0c59b0faebab5"
  },
  {
    "url": "images/icons/apple-icon-57x57.png",
    "revision": "cc93af251fd66d09b099e90bfc0427a8"
  },
  {
    "url": "images/icons/apple-icon-60x60.png",
    "revision": "18b745d372987b94d72febb4d7b3fd70"
  },
  {
    "url": "images/icons/apple-icon-72x72.png",
    "revision": "b650bbe358908a2b217a0087011266b5"
  },
  {
    "url": "images/icons/apple-icon-76x76.png",
    "revision": "bf10706510089815f7bacee1f438291c"
  },
  {
    "url": "js/app.js",
    "revision": "fe3a20ec2e1bf0b4895b7f43fb1d70d6"
  },
  {
    "url": "js/feed.js",
    "revision": "398e39b521f231a9f94b6ad87e3aa84a"
  },
  {
    "url": "js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "js/helper.js",
    "revision": "1eaeb6e727f0504c6654a02f7ba8ac11"
  },
  {
    "url": "js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "js/material.min.js",
    "revision": "bcbe633b4e6987ce203cd2740280cd49"
  },
  {
    "url": "js/media.js",
    "revision": "d581e1146a2f8e69f744830e50eda7ad"
  },
  {
    "url": "js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "css/app.css",
    "revision": "1fc574bc7fb654bd6a0a5e6492215051"
  },
  {
    "url": "css/feed.css",
    "revision": "30876618ebbec6e3334ae88f770776f1"
  },
  {
    "url": "css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  }
]);

  console.log('Workbox Fisnish precaching'); 

  //CUSTOM ROUTING CACHE FOR FONTS
  workbox.routing.registerRoute( /.*(?:fonts\.)(googleapis|gstatic)\.com.*$/, workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts', plugins: [ new workbox.expiration.Plugin({maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 *30} ) ] 
    })
  );

  //CUSTOM ROUTING CACHE FOR CDN FILE
  workbox.routing.registerRoute( MATERIAL_CDN, workbox.strategies.staleWhileRevalidate({
    cacheName: 'CDN-material', plugins: [ new workbox.expiration.Plugin({maxEntries: 50} ) ] 
    })
  );

  //CUSTOM ROUTING CACHE FOR POST IMAGES, using a custum cache handler
  const postImagesHandler = workbox.strategies.staleWhileRevalidate({
    cacheName: 'post-images', plugins: [ new workbox.expiration.Plugin({maxEntries: 50} ) ] 
  });

  workbox.routing.registerRoute( /.*(?:firebasestorage\.googleapis)\.com.*$/, args =>{
    return postImagesHandler.handle(args);
  });


  //CUSTOM ROUTING CACHING HANDLER, (some sort of staleWhileRevalidate, using the old fashion way)
  workbox.routing.registerRoute(POSTS_DB_URL, args => {
    console.log('Workbox Custom Routing -> ', POSTS_DB_URL );
    return fetch(args.event.request)
      .then ( res => {
        const cloneRes = res.clone();

        //clear indexedDb data before writing new data
        clearAllData(POSTS_OBJ_STORE).then ( () => {
            //if clear transaction was successfull we extract data from the response, to continue
            return cloneRes.json();
            })
          .then ( data => {
            //Store response data in indexedDB (Dynamic content) 
            for (var key in data){
                writeData(POSTS_OBJ_STORE, data[key]);
            }
        });
        return res;

      });
  });


  /* Routing cache for help html pages, with a cache first strategy, 
    and fallback in case page doesnot exist, or no network available
  
    The Workbox cacheFirst handler handles no-connectivity differently than networkFirst: 
    instead of passing an empty response to the .then, it rejects and goes to the next .catch
  */
 const helpHandler = workbox.strategies.cacheFirst ( { 
    cacheName : 'help-cache',
    plugins: [ new workbox.expiration.Plugin( { maxEntries : 10} ) ]
  });

  workbox.routing.registerRoute( /.*\/help/, args => {
      console.log('Workbox Html Routing');
      return helpHandler.handle(args)
      .then( response => {
          if ( response.status === 404 ) {
              return caches.match('pages/404.html');
          }
          return response;
      })
      .catch(err => {
          return caches.match('pages/offline.html');
      });
  } );


  /* routing cache for generic html pages, with a cache first strategy, 
      and fallback in case page doesnot exist, or no network available
  
  const genericHandler = workbox.strategies.cacheFirst ( { 
    cacheName : 'generic-cache',
    plugins: [ new workbox.expiration.Plugin( { maxEntries : 50} ) ]
  });

  workbox.routing.registerRoute( routeData => { return (routeData.event.request.headers.get('accept').includes('text/html')) }, args => {
    console.log('Workbox Generic Routing');
    return genericHandler.handle(args)
    .then( response => {
      if ( response.status === 404 ) {
          return caches.match('404.html');
        }
      return response;

      })
    .catch(err => {
          return caches.match('offline.html');
      });
    });
  */
} 
else {
  console.log(`Boo! Workbox didn't load 😬`);
}

/* BACKGROUND SYNCRONICATION */

self.addEventListener ('sync', event => {
  //debugger;
  console.log('[SW] => Background Syncing', event);
  if( event.tag === SW_SYNC_REGIST){
      console.log( '[SW] => Syncing new Posts' );
      event.waitUntil(
          //read all the data in indexedDB regarding pending posts, waiting to be syncronized
          readAllData( SYNC_POSTS_OBJ_STORE )
          .then ( data => {
              //loop through all the pending posts stored in indexedDB
              for ( var dt of data){
                  // send item stored to backed server
                  syncData ( FB_POSTS_API_URL, buildPostFormData(dt.id, dt.title, dt.location, dt.rawLocation, dt.picture))
                  .then (resp => {
                      console.log( 'Sent data => ', resp);
                      if ( resp.ok ){
                          resp.json()
                          .then( respData => {
                              // if sent successfully then delete the item from indexedDB
                              deleteDataItem( SYNC_POSTS_OBJ_STORE, respData.id);
                          })
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

/* FUNCTIONS FOR NOTIFICATION REQUEST */
// Listens for the user interaction with our notifications
self.addEventListener ( 'notificationclick', event => {
  var notification = event.notification;
  var action = event.action;

  //verify the type of action selected
  console.log( notification);
  if ( action === 'Confirm' ){
      console.log( action, ' was chosen');
  }
  else{
      console.log( 'Opening new tab: ' , action );
      gotoLink( event, notification.data.url);
  }
  notification.close();
});

//user close the notification request but did not grant or deny permission
self.addEventListener ( 'nofificationclose' , event => {
  console.log( 'Notification was closed', event);
});

// listen for push notifications from the server, then send a notification to the system
self.addEventListener( 'push', event => {
  console.log( 'Push Notification received', event);

  var data = { title: 'New!', content: 'Something new happened', openUrl: '/'};

  if( event.data ){
      data = JSON.parse( event.data.text() );
  }

  const options = {
      body: data.content,
      icon: '/images/icons/app-icon-96x96.png',
      image: '/images/sf-boat.jpg',
      badge: '/images/icons/app-icon-96x96.png', 
      tag: 'pwaGram-notification',
      actions: [
          { action: 'Confirm', title: 'Ok', icon: '/images/icons/app-icon-96x96.png' },
          { action: 'Cancel', title: 'Cancel', icon: '/images/icons/app-icon-96x96.png'}
      ],
      data : { url: data.openUrl}
  };

  event.waitUntil(
      //send a notification to the system(upon receiving a push from server) via the serviceworker
      self.registration.showNotification( data.title, options)
  );
});


/* Function to open a browser page by the serviceworker */
function gotoLink(event, url){
  event.waitUntil(
      clients.matchAll()
      .then( clis => {
          var client = clis.find( c => {
              return c.visibilityState === 'visible';
          });

          if( client !== undefined ){
              client.navigate ( url );
              client.focus();
          }
          else{
              clients.openWindow ( url );
          }
      })
  )
};


