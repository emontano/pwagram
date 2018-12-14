importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js');
importScripts('/js/idb.js');
importScripts('/js/helper.js');

const MATERIAL_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css';

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  //PRECACHING (APP-SHELL FILES)
  workbox.precaching.precacheAndRoute([]);

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


