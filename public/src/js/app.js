var deferredPrompt;
const enableNotificationButtons = document.querySelectorAll( ' .enable-notifications');


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

/* FUNCTIONS FOR NOTIFICATION REQUEST */

if ( 'Notification' in window){
    for ( var button of enableNotificationButtons){
        button.style.display = 'inline-block';
        button.addEventListener( 'click', askForNotificationPermission);
    }
}

function askForNotificationPermission(){
    Notification.requestPermission( result => {
        console.log('User choice', result);
        if (result !== 'granted' ) {
            console.log ( 'No notification permission granted');
        }
        else{
            //hide notifications buttons
            displaySwNotification();
        }
    });
}

function displaySwNotification(){
    if ( 'serviceWorker' in navigator){
        const options = { 
            body: 'You have successfully subscrided to our Notification service!',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US', //BCP 47
            vibrate: [100,50,200],
            badge: 'src/images/icons/app-icon-96x96.png',
            tag: 'pwaGram-SW--notification',
            renotify: true,
            actions: [
                { action: 'Confirm', title: 'Ok', icon: '/src/images/icons/app-icon-96x96.png' },
                { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png'}
            ]
        };

        navigator.serviceWorker.ready
        .then( swreg => {
            swreg.showNotification( 'PwaGram SW Subscription', options );
        });
    }
}

