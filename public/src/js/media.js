// variables for native device features
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerDiv = document.querySelector('#pick-image');

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
}

// functionality to capture a picture from the camera
captureButton.addEventListener( 'click' , event => {
    canvasElement.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureButton.style.display = 'none';

    const context = canvasElement.getContext('2d');
    context.drawImage( videoPlayer, 0, 0 , canvas.width, videoPlayer.videoHeight / ( videoPlayer.videoWidth / canvas.width) );
    videoPlayer.srcObject.getVideoTracks().forEach( track => track.stop());
})

/* hide media elements */
function closeMedia(){
    imagePickerDiv.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    videoPlayer.srcObject.getVideoTracks().forEach( track => track.stop());
}