var deferredPrompt;
const enableNotificationButtons = document.querySelectorAll('.enable-notifications');

//Use pollyfills for older browsers(Use of Promises and fetch)
if(!Window.Promise){
    Window.Promise = Promise;
}

//Register a Service Worker
if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registered!' ))
        .catch(err => console.log(err));
    });  
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

/* FUNCTIONS FOR NOTIFICATION REQUEST */

/* Function to add notification permission buttons and a listenter for clicks */
if ( 'Notification' in window && 'serviceWorker' in navigator){
    for ( var button of enableNotificationButtons){
        button.style.display = 'inline-block';
        button.addEventListener( 'click', askForNotificationPermission);
    }
}

/* Function that shows the popup asking for permission to show notifications (part of the app) */
function askForNotificationPermission(){
    Notification.requestPermission( result => {
        console.log('User choice', result);
        //permision was rejected
        if (result !== 'granted' ) {
            console.log ( 'Notification permission Not granted');
        }
        else{
            //permission was granted
            //hide notifications buttons
            configurePushSub();
        }
    });
}

/* Funcion that creates a notification subscription and then 
** sends the Notification subscription to server, along with the public key
*/
function configurePushSub(){
    if( !('serviceWorker' in navigator)){
        return;
    }
    
    var registration;

    navigator.serviceWorker.ready
    .then( swreg => {
        registration = swreg;
        return swreg.pushManager.getSubscription();
    })
    .then ( sub => {
        if ( sub !== null ){
            //we have a subcription   
        }
        else{
            //create a new subscription and returns as promise
            return registration.pushManager.subscribe( {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array( VAPID_PUB_KEY )
            });
        }
    })
    .then( newSub => { //we want to pass that subscription to our backend server
        return fetch(SUBSCRIPTIONS_DB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify ( newSub )
        })
    })
    .then( res => {
        if ( res.ok){
            //display a notification to the system via the serviceworker
            displaySwNotification();
        }
    })
    .catch( err => {
        console.log( 'Notification Subscription error:' ,error)
    });
}


/* Function that allows a ServiceWorker to send notifications to the system */
function displaySwNotification(){
    if ( 'serviceWorker' in navigator){
        //const  data = { title: 'New!', content: 'Something new happened', openUrl: '/'};

        const options = { 
            body: 'You have successfully subscrided to our Notification service!',
            icon: '/images/icons/app-icon-96x96.png',
            image: '/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US', //BCP 47
            vibrate: [100,50,200],
            badge: '/images/icons/app-icon-96x96.png',
            tag: 'pwaGram-SW--notification',
            renotify: true,
            actions: [
                { action: 'Confirm', title: 'Ok', icon: '/images/icons/app-icon-96x96.png' },
                { action: 'Cancel', title: 'Cancel', icon: '/images/icons/app-icon-96x96.png'}
            ]
            //data : { url: data.openUrl}
        };

        navigator.serviceWorker.ready
        .then( swreg => {
            swreg.showNotification( 'PwaGram Successfully Subscribed', options );
        });
    }
}