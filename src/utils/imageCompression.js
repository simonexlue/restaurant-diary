export async function compressImageFile(file, options = {}) {
    if (!file) {
        throw new Error("Image file is required.");
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image.");
    }

    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        outputType = "image/jpeg",
    } = options;

    const imageBitmap = await createImageBitmap(file);

    let { width, height } = imageBitmap;

    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const scale = Math.min(widthRatio, heightRatio, 1);

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Failed to create canvas context.");
    }

    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

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

    return new File([blob], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
    });
}   