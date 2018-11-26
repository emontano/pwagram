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
var dbPromise = idb.open('posts-store', 1, db => {
    if(!db.objectStoreNames.contains('posts')){
        db.createObjectStore('posts', {keyPath: 'id'});
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
        var tx = transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.delete(id);
        return tx.complete;
    //handdle the promise here so, we don't have to return it
    }).then( () => {
        console.log ( 'Item deleted! : ' + id);
    })
}