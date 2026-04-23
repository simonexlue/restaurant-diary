export async function compressImageFile(file, options = {}) {
    if (!file) {
        throw new Error("Image file is required.");
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image.");
    }

    // default compression settings
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        outputType = "image/jpeg", //force jpeg; jpeg gives much smaller file sizes with minimal visible quality loss
    } = options;

    const imageBitmap = await createImageBitmap(file); //convets raw file into image object the browser can draw

    let { width, height } = imageBitmap; //OG dimensions

    // calculate scaling
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const scale = Math.min(widthRatio, heightRatio, 1);

    // new dimensions
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    // new drawing canvas with new sizing
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Failed to create canvas context.");
    }

    // draws the original image onto the canvas to scale
    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    //converts canvas to a file-like binary object
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (result) => {
                if (!result) {
                    reject(new Error("Failed to compress image."));
                    return;
                }

                resolve(result);
            },
            outputType,
            quality
        );
    });

    const originalName = file.name || "image";
    const baseName = originalName.includes(".")
        ? originalName.slice(0, originalName.lastIndexOf("."))
        : originalName;

    const extension = outputType === "image/png" ? "png" : "jpg";

    // wraps compressed blob into file object
    return new File([blob], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
    });
}   