var deferredPrompt;


//Use pollyfills for older browsers(Use of Promises and fetch)
if(!Window.Promise){
    Window.Promise = Promise;
}

//Register a Service Worker
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker registered!' ))
    .catch(err => console.log(err));
}

// prevent chrome from showing the Install banner at default configurations
window.addEventListener('beforeinstallprompt', function(){
    console.log('beforeinstallprompt fired' );
    event.preventDefault();
    deferredPrompt = event;
    return false;
});

//Un register a Service Worker
function unregisterSW(){
    if ('serviceWorker' in navigator){
       navigator.serviceWorker.getRegistrations().then(registrations => {
       for (var registration of registrations){
            console.log('Removing ServiceWorker: ' + registration );
            registration.unregister();
        }
       }) 
    }
}
