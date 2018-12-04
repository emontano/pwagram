var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
//unregister SW button
const unRegisterSwButton = document.querySelector('#unregister-sw-button');

// variables for background sync elements
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
//set event listener for unregister  SW  button
unRegisterSwButton.addEventListener('click', unregisterSW);


/*  Function to open the post creation pop*/
function openCreatePostModal() {
  //UP AND DOWN animation, SCROLL UP 
  createPostArea.style.transform = 'translateY(0)';

  //call function to inizialize native devices
  initializeMedia();

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });
    deferredPrompt = null;
  }
}

/* Function to close the post creation pop*/
function closeCreatePostModal() {
  //UP AND DOWN animation, SCROLL DOWN(as define in css file)
  createPostArea.style.transform = 'translateY(100vh)';
  closeMedia();
}

/*  function for ondemand caching */
function onSaveButtonClicked(event){
  console.log( 'clicked' );
  if ('caches' in window){
    caches.open('user-requested').then( cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/src/images/sf-boat.jpg');
    });
  }
}

/* Function to create a dynamic card on demand */
function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("'+data.image+'")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.classList.add('my-created-css-class');
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color='blue';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  //for ondemand caching
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener( 'click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data){
  //clear cards
  while (sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
  //create new cards for every post  
  for (var post of data){
    createCard(post);
  }
}

// STRATEGY: CACHE THEN NETWORK - Part 1
// 'https://httpbin.org/get';
var networkDataReceived = false;

//fetch the url, which will return a promise with json response
fetch(POSTS_DB_URL)
  .then(rest => {
    return rest.json();
  })
  //handle the promise with the network response(data) and create the card
  .then(data => {
    networkDataReceived = true;
    console.log('From Web: ', data);
    updateUI(jsonToArray(data));
  });

//verify the the Browser supports cache
if ('indexedDB' in window)
  {
    readAllData(POSTS_OBJ_STORE).then ( data => {
    if ( !networkDataReceived){
        console.log('From Cache: ', data);
        updateUI(jsonToArray(data));;
        }
    });
  }

  /* Function to send data to back-end
     Serves as Fallback in case browser does not support ServiceWorker or Background Sync
     */
  function sendData(){
    console.log('Using Fallback method to sync data');
    syncData ( FB_POSTS_API_URL, buildJsonPost(new Date().toISOString(), titleInput.value, locationInput.value, IMAGE_URL))
    .then ( res => {
      console.log ('Sent data: ' , res);
      updateUI();
    })
  }


// set event listerner for form submition && register a background job withing the ServiceWorker
form.addEventListener('submit', event => { 
  event.preventDefault();
  if ( titleInput.value.trim() === '' || locationInput.value.trim() === ''){
      alert ('Please enter valid data!');
      return;
  }
  //close the pop up
  closeCreatePostModal();

  //verify if background syncronization is supported in the browser
  if ( 'serviceWorker' in navigator && 'SyncManager' in window){
    navigator.serviceWorker.ready
      .then( sw => {
          var post = buildJsonPost(new Date().toISOString(), titleInput.value, locationInput.value, IMAGE_URL);
        
          //write the data to indexedDB ( data intermidiary) and if successfull register the backgroud job
          writeData (SYNC_POSTS_OBJ_STORE, post)
          .then ( () => {
              console.log( 'Post written to ' , SYNC_POSTS_OBJ_STORE);
              //register a sync withing the SW
              return sw.sync.register(SW_SYNC_REGIST);
          })
          .then( () => {
              console.log('Background job register in SW');
              const snackbarContainer = document.querySelector('#confirmation-toast');
              const data = { message: 'Your Post was saved for syncing'};
              snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch ( err => {
            console.log(err);
          })
      });
  }
  else{
    //Fallback in case browser does not support ServiceWorker or Background Sync
    sendData();
  }
});
