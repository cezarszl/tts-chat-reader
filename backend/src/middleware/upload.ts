import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'
import { UPLOADS_DIR } from '../config/paths'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/webm', 'video/quicktime']

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, UPLOADS_DIR)
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const extFromName = path.extname(file.originalname)
        const ext = extFromName || ({
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/quicktime': '.mov',
        } as Record<string, string>)[file.mimetype] || ''
        cb(null, `${uuidv4()}${ext}`)
    },
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only image and video files are allowed'))
    }
}



const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
})

export default upload
