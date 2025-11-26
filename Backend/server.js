import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const storagePkg = require('multer-storage-cloudinary');
const CloudinaryStorage = storagePkg.CloudinaryStorage || storagePkg.default || storagePkg;

// 1. LOAD ENV & DEBUG
dotenv.config(); 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 2. CONFIGURE CORS (Allow Frontend)
app.use(cors({
    origin: '*', // Allow connections from anywhere (Fixes Network Errors)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 3. TEST CLOUDINARY CONNECTION (CRITICAL STEP)
console.log("------------------------------------------------");
console.log("🔍 DIAGNOSTIC CHECK:");
console.log("cloud_name:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Loaded" : "❌ MISSING");
console.log("api_key:", process.env.CLOUDINARY_API_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("api_secret:", process.env.CLOUDINARY_API_SECRET ? "✅ Loaded" : "❌ MISSING");
console.log("------------------------------------------------");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 4. STORAGE ENGINE
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        try {
            if (file.fieldname.includes('video') || file.fieldname.includes('trailer')) {
                return {
                    folder: 'movie-freaks-videos',
                    resource_type: 'video',
                    allowed_formats: ['mp4', 'mkv', 'mov']
                };
            } else {
                return {
                    folder: 'movie-freaks-images',
                    resource_type: 'image',
                    allowed_formats: ['jpg', 'png', 'jpeg']
                };
            }
        } catch (err) {
            console.error("Storage Error:", err);
            throw err;
        }
    },
});

const upload = multer({ storage: storage });

// 5. DATABASE CONNECTION
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ottProject_Final_v7';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// 6. SCHEMAS (Same as before)
const UserSchema = new mongoose.Schema({ email: { type: String, required: true, unique: true }, password: String, username: String, role: { type: String, default: 'user' }, watchlist: { type: Array, default: [] }, continueWatching: { type: Array, default: [] } });
const User = mongoose.model('User', UserSchema);
const ContentSchema = new mongoose.Schema({ id: Number, title: String, description: String, rating: Number, image: String, videoUrl: String, trailerUrl: String, category: String, year: String, cast: String, genres: [String], views: { type: Number, default: 0 }, episodes: Array, seasons: [{ name: String, image: String, episodes: Array }] });
const MovieModel = mongoose.model('Movie', ContentSchema);
const SeriesModel = mongoose.model('Series', ContentSchema);
const AnimeModel = mongoose.model('Anime', ContentSchema);
const CarouselSchema = new mongoose.Schema({ id: Number, title: String, description: String, image: String, tag: String, videoUrl: String, category: String });
const CarouselModel = mongoose.model('Carousel', CarouselSchema);

// 7. ROUTES

// ADMIN: Add Content (With detailed logging)
app.post('/api/admin/add', 
    upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }, { name: 'trailerFile', maxCount: 1 }]), 
    async (req, res) => {
    try {
        console.log("📥 Receiving Upload Request...");
        const data = req.body;
        data.id = Math.floor(Math.random() * 100000);
        
        if (req.files['imageFile']) {
            console.log("✅ Image Uploaded:", req.files['imageFile'][0].path);
            data.image = req.files['imageFile'][0].path;
        }
        if (req.files['videoFile']) {
            console.log("✅ Video Uploaded:", req.files['videoFile'][0].path);
            data.videoUrl = req.files['videoFile'][0].path;
        }
        if (req.files['trailerFile']) data.trailerUrl = req.files['trailerFile'][0].path;
        else data.trailerUrl = data.videoUrl;

        data.rating = parseFloat(data.rating);
        if (data.genres) { try { data.genres = JSON.parse(data.genres); } catch(e) { data.genres = []; } }

        if (data.featured === 'true') {
            await CarouselModel.create({
                id: data.id, title: data.title, description: data.description,
                image: data.image, tag: "New Release", videoUrl: data.videoUrl, category: data.category
            });
        }

        if (data.category !== 'movie') {
            data.seasons = [{ name: "Season 1", image: data.image, episodes: [{ title: "Episode 1", url: data.videoUrl, duration: "24m" }] }];
        }

        if (data.category === 'movie') await MovieModel.create(data);
        else if (data.category === 'series') await SeriesModel.create(data);
        else if (data.category === 'anime') await AnimeModel.create(data);

        console.log("🎉 Database Updated Successfully");
        res.json({ message: "Upload Successful!" });
    } catch (e) { 
        console.error("❌ SERVER CRASH DURING UPLOAD:", e);
        res.status(500).json({ error: "Server Error: " + e.message }); 
    }
});

// (Other routes kept simple for brevity)
app.get('/api/movies', async (req, res) => { res.json(await MovieModel.find()); });
app.get('/api/series', async (req, res) => { res.json(await SeriesModel.find()); });
app.get('/api/anime', async (req, res) => { res.json(await AnimeModel.find()); });
app.get('/api/carousel', async (req, res) => { res.json(await CarouselModel.find()); });
app.post('/api/auth/login', async (req, res) => { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid credentials' }); res.json({ message: 'Success', user }); });
app.get('/api/user/:email', async (req, res) => { const user = await User.findOne({ email: req.params.email }); res.json(user || {}); });

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));