/**
 * Project Card Component - displays a single project with photos
 */
import { Image, Edit, Trash2, ChevronDown, ChevronUp, Upload, Plus, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function ProjectCard({
    project,
    isExpanded,
    isAdmin,
    isEditor,
    onToggle,
    onEdit,
    onDelete,
    onUploadPhoto,
    onDeletePhoto,
    onReorderPhoto,
    onToggleVisibility,
}) {
    const photoCount = (project.photos?.length || 0) + (project.beforePhoto ? 1 : 0) + (project.afterPhoto ? 1 : 0);
    const hasNoPhotos = !project.beforePhoto && !project.afterPhoto && (!project.photos || project.photos.length === 0);
    const thumbnail = project.beforePhoto || project.afterPhoto || project.photos?.[0];

    return (
        <div className={`bg-gray-800 rounded-xl border overflow-hidden transition-colors ${project.visible === false ? 'border-gray-600 opacity-60' : 'border-gray-700'
            }`}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750"
                onClick={onToggle}
            >
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {thumbnail ? (
                            <img src={thumbnail.url} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                            <Image className="w-6 h-6 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold">{project.title}</h3>
                            {project.visible === false && (
                                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                                    Hidden
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm">
                            {project.location || 'No location'} • {photoCount} photos
                        </p>
                        {isAdmin && project.createdBy && (
                            <p className="text-gray-500 text-xs mt-0.5">by {project.createdBy}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {hasNoPhotos && (
                        <span className="text-amber-500 text-sm mr-2 animate-pulse">
                            Click to add photos →
                        </span>
                    )}
                    {isAdmin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(project.visible === false); }}
                            className={`p-2 rounded-lg transition-colors ${project.visible === false
                                    ? 'text-gray-500 hover:text-amber-400 hover:bg-gray-700'
                                    : 'text-green-400 hover:text-gray-400 hover:bg-gray-700'
                                }`}
                            title={project.visible === false ? 'Hidden — click to show' : 'Visible — click to hide'}
                        >
                            {project.visible === false
                                ? <EyeOff className="w-5 h-5" />
                                : <Eye className="w-5 h-5" />
                            }
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                    )}
                    {(isAdmin || isEditor) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-gray-700 p-4">
                    {/* Before/After Section */}
                    <div className="mb-6">
                        <h4 className="text-white font-medium mb-3">Before & After</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <PhotoSlot
                                label="Before"
                                photo={project.beforePhoto}
                                onUpload={() => onUploadPhoto('before')}
                                onDelete={() => onDeletePhoto(project.beforePhoto)}
                            />
                            <PhotoSlot
                                label="After"
                                photo={project.afterPhoto}
                                onUpload={() => onUploadPhoto('after')}
                                onDelete={() => onDeletePhoto(project.afterPhoto)}
                            />
                        </div>
                    </div>

                    {/* Gallery Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-medium">Gallery Photos</h4>
                            <button
                                onClick={() => onUploadPhoto('gallery')}
                                className="flex items-center text-sm text-red-500 hover:text-red-400 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Photos
                            </button>
                        </div>

                        {project.photos?.length > 0 ? (
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                {project.photos.map((photo, index) => (
                                    <GalleryPhoto
                                        key={photo.id}
                                        photo={photo}
                                        index={index}
                                        totalCount={project.photos.length}
                                        onDelete={() => onDeletePhoto(photo)}
                                        onMoveLeft={() => onReorderPhoto(index, 'left')}
                                        onMoveRight={() => onReorderPhoto(index, 'right')}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">
                                No gallery photos yet. Click "Add Photos" to upload.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component: Photo upload slot (Before/After)
function PhotoSlot({ label, photo, onUpload, onDelete }) {
    return (
        <div>
            <p className="text-gray-400 text-sm mb-2">{label}</p>
            {photo ? (
                <div className="relative group">
                    <img src={photo.url} alt={label} className="w-full h-32 object-cover rounded-lg" />
                    <button
                        onClick={onDelete}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={onUpload}
                    className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-400 transition-colors"
                >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-sm">Upload {label}</span>
                </button>
            )}
        </div>
    );
}

// Sub-component: Gallery photo with reorder controls
function GalleryPhoto({ photo, index, totalCount, onDelete, onMoveLeft, onMoveRight }) {
    const isFirst = index === 0;
    const isLast = index === totalCount - 1;

    return (
        <div className="relative group">
            <div className="absolute top-1 left-1 z-10 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {index + 1}
            </div>

            <img
                src={photo.url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-red-500 transition-all"
            />

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                <button
                    onClick={onMoveLeft}
                    disabled={isFirst}
                    className={`p-1.5 rounded-full transition-colors ${isFirst ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                    title="Move left"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                    onClick={onDelete}
                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors"
                    title="Delete"
                >
                    <X className="w-4 h-4" />
                </button>

                <button
                    onClick={onMoveRight}
                    disabled={isLast}
                    className={`p-1.5 rounded-full transition-colors ${isLast ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                    title="Move right"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
