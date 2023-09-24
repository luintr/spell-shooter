export let imagesArr: any[] = [];
export let bubbleimage: any;

let loadcount = 0;
let loadtotal = 0;
export let preloaded = false;

export function loadImages(imagefiles: any): any[] {
    loadcount = 0;
    loadtotal = imagefiles.length;
    preloaded = false;

    const loadedimages: any[] = [];

    for (let i = 0; i < imagefiles.length; i++) {
        const image = new Image();

        image.onload = function () {
            loadcount++;
            if (loadcount === loadtotal) {
                preloaded = true;
            }
        };

        image.src = imagefiles[i];

        loadedimages[i] = image;
    }

    let images = loadedimages; // Assign loaded images to the shared variable
    bubbleimage = bubbleimage || images[0]; // Assign the first image as bubbleimage if not set

    // Return an array of images
    return loadedimages;
}
