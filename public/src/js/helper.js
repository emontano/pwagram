const FB_DB_URL = 'https://pwagram-5109b.firebaseio.com/';
const POSTS_DB_URL = FB_DB_URL + 'posts.json';
const SUBSCRIPTIONS_DB_URL = FB_DB_URL + 'subscriptions.json';
const FB_POSTS_API_URL = 'https://us-central1-pwagram-5109b.cloudfunctions.net/storePostData';
const IMAGE_URL =  'https://firebasestorage.googleapis.com/v0/b/pwagram-5109b.appspot.com/o/sf-boat.jpg?alt=media&token=e2230fe5-9bc1-479e-a5c9-f34ca5c13ae7'; 'https://firebasestorage.googleapis.com/v0/b/pwagram-5109b.appspot.com/o/sf-boat.jpg?alt=media&token=e2230fe5-9bc1-479e-a5c9-f34ca5c13ae7';
const VAPID_PUB_KEY = 'BPQe7fQRzOBjNB18MWRJ6k3iDZtYYbJvorbA4hi9jva8fYtZeHJgdG3A_GHShf5j_4xS9Xnd1q2cmV8Kh-SWGiw';

const INDEXDB_STORE = 'posts-store';
const POSTS_OBJ_STORE = 'posts';
const SYNC_POSTS_OBJ_STORE = 'sync-posts';
const SW_SYNC_REGIST =  'sync-new-posts';


//convert a json response into an data array
function jsonToArray(data){
    var dataArray = [];
    for (var key in data){
      dataArray.push(data[key])
    }
    return dataArray;
  }

//VERIFYS IF A URL IS IN THE APPSHELL FILES ARRAY
function isInArray(url){
    var cachePath;

    if( url.indexOf(self.origin) === 0){
        //console.log('Domain: ' + self.origin + ' ; Matched  Url: ' + url);
        cachePath = url.substring(self.origin.length);
        }
    else{
        cachePath = url;
        //console.log('No Match For: ' + url );
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


//indexdb creation
var dbPromise = idb.open(INDEXDB_STORE, 1, db => {
    //ObjectStore for temporal background sync jobs posts
    if(!db.objectStoreNames.contains(SYNC_POSTS_OBJ_STORE)){
        db.createObjectStore(SYNC_POSTS_OBJ_STORE, {keyPath: 'id'});
    }
    //ObjectStore for cache posts
    if(!db.objectStoreNames.contains(POSTS_OBJ_STORE)){
        db.createObjectStore(POSTS_OBJ_STORE, {keyPath: 'id'});
    }
})

//Write data to indexdb
function writeData(st, data){
    return dbPromise.then ( db => {
        var tx = db.transaction(st, 'readwrite');
        var store =  tx.objectStore( st);
        store.put( data );
        return tx.complete;
    });
}

//Read data from indexdb
function readAllData(st){
    return dbPromise.then ( db => {
        var tx = db.transaction(st, 'readonly');
        var store =  tx.objectStore( st);
        return store.getAll();
    });
}


//Write data to indexdb
function clearAllData(st){
    return dbPromise.then ( db => {
        var tx = db.transaction(st, 'readwrite');
        var store =  tx.objectStore( st);
        store.clear( );
        return tx.complete;
    });
}

//delete single item from indexedDB
function deleteDataItem(st, id){
    dbPromise.then( db => {
        var tx = db.transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.delete(id);
        return tx.complete;
    //handdle the promise here so, we don't have to return it
    }).then( () => {
        console.log ( 'Item deleted! : ' + id);
    })
}

/******************  Background Sync funtions */
function syncData(url, postData){
    return fetch(url, { method:'POST', body : postData });
}

function buildPostFormData(_id,_title, _loc, _image){
    var postFormData = new FormData();
    postFormData.append('id', _id);
    postFormData.append('title', _title);
    postFormData.append('location',_loc);
    postFormData.append('file', _image, _id + '.png');
    return postFormData;
}

/* convert base64 string to Array*/
function urlBase64ToUint8Array( base64String){
    var padding = '='.repeat(( 4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace( /\-/g, '+').replace( /_/g, '/');
    
    var rowData = window.atob(base64);
    var outputArrary = new Uint8Array( rowData.length );

    for ( var i = 0; i < rowData.length; i++){
        outputArrary [i] = rowData.charCodeAt(i);
    }
    return outputArrary;
}