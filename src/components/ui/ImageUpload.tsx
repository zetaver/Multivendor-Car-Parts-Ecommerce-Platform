import React, { useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { API_URL } from '../../config';
// Define the props type
interface ImageUploadProps {
    maxImages?: number;
    onImagesChange: (images: File[], uploadedImages?: UploadedImage[]) => void;
    minImages?: number; // New prop for minimum required images
}

// Add interface for tracking uploaded images
interface UploadedImage {
    file: File;
    url?: string;
    filename?: string;
    uploaded: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
    maxImages = 5, 
    minImages = 3, 
    onImagesChange 
}) => {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [rotations, setRotations] = useState<{ [key: number]: number }>({});
    const [uploadErrors, setUploadErrors] = useState<{[key: string]: string}>({});

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addImages(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addImages(e.target.files);
        }
    };

    const addImages = (files: FileList) => {
        setError(null);
        setUploadErrors({});
        
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (validFiles.length === 0) {
            setError("Only image files are allowed.");
            return;
        }

        if (images.length + validFiles.length > maxImages) {
            setError(`You can upload up to ${maxImages} images.`);
            return;
        }

        setLoading(true);
        
        // Create UploadedImage objects
        const newImages = validFiles.map(file => ({
            file,
            uploaded: false
        }));

        // Upload each image to the server
        const uploadPromises = newImages.map(async (img, index) => {
            try {
                const formData = new FormData();
                formData.append('file', img.file);
                
                // Get auth token if needed for uploads
                const authToken = localStorage.getItem('accessToken');
                
                const response = await fetch(`${API_URL}/api/media/upload`, {
                    method: 'POST',
                    headers: authToken ? {
                        'Authorization': `Bearer ${authToken}`
                    } : undefined,
                    body: formData,
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
                    throw new Error(errorData.message || `Failed to upload image: ${response.statusText}`);
                }
                
                const data = await response.json();
                return {
                    ...img,
                    url: data.url,
                    filename: data.filename,
                    uploaded: true
                };
            } catch (error) {
                console.error('Error uploading image:', error);
                setUploadErrors(prev => ({
                    ...prev,
                    [index]: error instanceof Error ? error.message : 'Failed to upload image'
                }));
                return img;
            }
        });
        
        Promise.all(uploadPromises).then(uploadedImages => {
            setImages(prev => {
                const updatedImages = [...prev, ...uploadedImages].slice(0, maxImages);
                // Pass both the File objects and the uploaded image objects to the parent component
                onImagesChange(updatedImages.map(img => img.file), updatedImages);
                return updatedImages;
            });
            
            const failedUploads = uploadedImages.filter(img => !img.uploaded).length;
            if (failedUploads > 0) {
                setError(`${failedUploads} image${failedUploads > 1 ? 's' : ''} failed to upload. Please try again.`);
            } else if (uploadedImages.length > 0) {
                setError(null); // Clear any previous errors on successful upload
            }
            
            setLoading(false);
        });
    };

    const removeImage = async (index: number) => {
        const imageToRemove = images[index];
        
        // If the image was uploaded to the server, delete it
        if (imageToRemove.uploaded && imageToRemove.filename) {
            try {
                const response = await fetch(`${API_URL}/api/media/delete/${imageToRemove.filename}`, {
                    method: 'DELETE',
                });
                
                if (!response.ok) {
                    console.error('Failed to delete image from server');
                }
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }
        
        // Remove from local state
        setImages(prev => {
            const updatedImages = prev.filter((_, i) => i !== index);
            onImagesChange(updatedImages.map(img => img.file), updatedImages);
            return updatedImages;
        });
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        const items = Array.from(images);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setImages(items);
        onImagesChange(items.map(img => img.file), items);
    };

    const handleRotate = (index: number) => {
        setRotations(prev => ({
            ...prev,
            [index]: ((prev[index] || 0) + 90) % 360
        }));
    };

    return (
        <div className="w-full pt-4">
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            {Object.keys(uploadErrors).length > 0 && (
                <div className="text-red-500 text-sm mb-2">
                    Some images failed to upload. Please try again.
                </div>
            )}
            {loading && (
                <div className="flex items-center justify-center mb-2">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Uploading images...</span>
                </div>
            )}
            {images.length === 0 ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="bg-gray-200 hover:bg-gray-300 transition w-full rounded-lg flex flex-col items-center justify-center h-[124px] cursor-pointer"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <h2 className="text-gray-700 font-bold">Add Photos</h2>
                    <p className="text-sm text-gray-600">Minimum {minImages} images required</p>
                </div>
            ) : (
                <div className="space-y-4 px-1">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="images" direction="horizontal">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-3 gap-2 md:grid-cols-5">
                                    {images.map((image, index) => (
                                        <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`relative aspect-square bg-white h-[134px] w-[124px] rounded-lg overflow-hidden border-2 ${!image.uploaded ? 'border-red-400' : 'border-gray-400'}`}
                                                >
                                                    <img
                                                        src={URL.createObjectURL(image.file)}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        style={{ transform: `rotate(${rotations[index] || 0}deg)` }}
                                                    />
                                                    <button 
                                                        onClick={() => removeImage(index)} 
                                                        className="absolute top-2 right-2 bg-white p-1 rounded-full"
                                                    >
                                                        <X className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button 
                                                        className="absolute bottom-2 right-2" 
                                                        onClick={() => handleRotate(index)}
                                                    >
                                                        🔄
                                                    </button>
                                                    {!image.uploaded && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 text-center">
                                                            Upload failed
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {images.length < maxImages && (
                                        <div 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="aspect-square bg-gray-200 h-[134px] w-[124px] rounded-lg flex items-center justify-center cursor-pointer"
                                        >
                                            +
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    {images.length < minImages && (
                        <p className="text-red-500 text-sm">Please upload at least {minImages} images</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
