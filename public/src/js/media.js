// variables for native device features
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerDiv = document.querySelector('#pick-image');
var picture;
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
var fetchedLocation  = {lat:0, lng:0};
var sawAlert = false;

/* Location feature listeners */
locationBtn.addEventListener( 'click', event => {
    locationBtn.style.display = 'none';
    locationLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition( gotCurrentPosition, errorGettingPosition, {enableHighAccuracy: true, timeout: 8000});

    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
});

function gotCurrentPosition(position){
    fetchedLocation = { lat: position.coords.latitude, lng: position.coords.longitude};
    locationInput.value = 'In Morelia';
    document.querySelector('#manual-location').classList.add('is-focused');
};

function errorGettingPosition(error){
    console.log( error );
    if (!sawAlert){
        alert ( 'Couldn\'t fetch location, please enter manually!' );
        sawAlert = true;
    }
};

function initializeLocation(){
    if ( !( 'geolocation' in navigator)) {
        locationBtn.style.display = 'none';
    }
};


/*function to start camera streaming and capute */
function initializeMedia(){
    console.log( 'INICIALIZING MEDIA CAPTURE');
    if ( !('mediaDevices' in navigator) ){
        navigator.mediaDevices = {};
    }

    // for old browser set this polyfill for ( getUserMedia )
    if ( !('getUserMedia' in navigator.mediaDevices ) ){
        console.log( 'USING POLYFILL');
        navigator.mediaDevices.getUserMedia = constrains => {
            const getUserMedia = navigator.webKitGetUserMedia || navigator.mozGetUserMedia;
            
            if (!getUserMedia) {
                return Promise.reject( new Error ( 'getUserMedia is not implemented!' ) );
            }

            return new Promise ( (resolve, reject) => {
                getUserMedia ( navigator, constrains, resolve, reject);
            });
        }
    }

    //request access to video device(returns a stream), ither by polyfill or by native api
    navigator.mediaDevices.getUserMedia( {video:true})
    .then( stream => {
        //set the video stream to our video element
        videoPlayer.srcObject = stream ;
        //display the video element
        videoPlayer.style.display = 'block';
    })
    .catch ( error => {
        console.log( 'Video capture Error: ', error);
        imagePickerDiv.style.display = 'block';
    })
};

// functionality to capture a picture from the camera
captureButton.addEventListener( 'click' , event => {
    canvasElement.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureButton.style.display = 'none';

    const context = canvasElement.getContext('2d');
    context.drawImage( videoPlayer, 0, 0 , canvas.width, videoPlayer.videoHeight / ( videoPlayer.videoWidth / canvas.width) );
    videoPlayer.srcObject.getVideoTracks().forEach( track => track.stop());

    //convert canvas capture to blob (file)
    picture = dataURItoBlob ( canvasElement.toDataURL() );
});

//fallback for camera capture 
imagePicker.addEventListener( 'change', event => {
    picture = event.target.files[0];
});

/* hide media elements */
function closeMedia(){
    imagePickerDiv.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    captureButton.style.display+ 'inline';
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    
    //stop camera 
    if ( videoPlayer.srcObject){
        videoPlayer.srcObject.getVideoTracks().forEach( track => track.stop());
    }

    setTimeout(() => {
        createPostArea.style.transform = 'translateY(100vh)';
    }, 2);
    
    
};

//convert canvas image to blob (file)
function dataURItoBlob( dataURI ){
    const byteString = atob( dataURI.split ( ',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer( byteString.length );
    const ia = new Uint8Array (ab );
    for ( var i = 0; i < byteString.length; i++){
        ia[i] = byteString.charCodeAt (i);
    }

    var blob = new Blob( [ab], { type: mimeString});
    return blob;
}