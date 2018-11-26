var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
const unRegisterSwButton = document.querySelector('#unregister-sw-button');

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
unRegisterSwButton.addEventListener('click', unregisterSW);

function openCreatePostModal() {
  createPostArea.style.display = 'block';
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

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

// function for ondemand caching
function onSaveButtonClicked(event){
  console.log( 'clicked' );
  if ('caches' in window){
    caches.open('user-requested').then( cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/src/images/sf-boat.jpg');
    });
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("'+data.image+'")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color='blue';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.tittle;
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

function jsonToArray(data){
  var dataArray = [];
  for (var key in data){
    dataArray.push(data[key])
  }
  return dataArray;
}

// STRATEGY: CACHE THEN NETWORK - Part 1
const url = 'https://pwagram-5109b.firebaseio.com/post.json'; // 'https://httpbin.org/get';
var networkDataReceived = false;

//fetch the url, which will return a promise with json response
fetch(url)
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
if ('caches' in window)
  {
    //look for the request in the cache, and return a promise with json response
    caches.match(url)
    .then(respon => {
      if (respon ){
        return respon.json();
      }
    })
    //handdle the promise with the response(data) if it has not been recived from the network yet
    .then(data => {
      console.log('From Cache: ', data);
      if ( !networkDataReceived){
        updateUI(jsonToArray(data));;
        }
    });
  }
