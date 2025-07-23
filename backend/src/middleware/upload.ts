import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'

// Allowed file extensions and MIME types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/webm', 'video/quicktime']

/**
 * Storage configuration for Multer
 * - Files are stored in 'uploads/' folder
 * - Each file gets a unique name (UUID + extension)
 */

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, 'uploads/')
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = path.extname(file.originalname)
        cb(null, `${uuidv4()}${ext}`)
    },
})

/**
 * Filter to allow only supported image/video MIME types
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only image and video files are allowed'))
    }
}

/**
 * Exported Multer instance
 */

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // Optional: 15MB max file size
    },
})

export default upload
