import { MdOutlineAddPhotoAlternate } from "react-icons/md";

export default function PhotoUploader({
    photoFile,
    photoPreviewUrl,
    isDragActive,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    onChooseFileClick,
    onRemove,
    fileInputRef,
}) {
    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
            />

            <div
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${isDragActive
                    ? "border-[rgb(203,84,51)] bg-[rgb(253,246,244)]"
                    : "border-stone-300 bg-[rgb(248,245,242)]"
                    }`}
            >
                {!photoPreviewUrl ? (
                    <div className="flex flex-col items-center gap-3">
                        <MdOutlineAddPhotoAlternate size={32} className="text-[rgb(203,84,51)]" />
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-stone-700">
                                Drag and drop an image here
                            </p>
                            <p className="text-xs text-[rgb(137,122,114)]">
                                PNG, JPG, WEBP, etc.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onChooseFileClick}
                            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:cursor-pointer"
                        >
                            Choose File
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <img
                            src={photoPreviewUrl}
                            alt="Dish preview"
                            className="max-h-64 w-full rounded-lg object-cover"
                        />

                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm text-stone-800">
                                    {photoFile?.name}
                                </p>
                                <p className="text-xs text-[rgb(137,122,114)]">
                                    {photoFile ? `${Math.round(photoFile.size / 1024)} KB` : ""}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onChooseFileClick}
                                    className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:cursor-pointer"
                                >
                                    Change
                                </button>
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:cursor-pointer"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}