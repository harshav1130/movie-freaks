import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// Safe Import for Cloudinary Storage
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const storagePkg = require('multer-storage-cloudinary');
const CloudinaryStorage = storagePkg.CloudinaryStorage || storagePkg.default || storagePkg;

dotenv.config(); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ==================================================
// 1. ROBUST CORS CONFIGURATION
// ==================================================
app.use(cors({
    origin: [
        "http://localhost:5173",                  
        "https://movie-freaks.vercel.app" // Ensure NO trailing slash here
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// 2. CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 3. STORAGE ENGINE
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        if (file.fieldname.includes('video') || file.fieldname.includes('trailer')) {
            return { folder: 'movie-freaks-videos', resource_type: 'video', allowed_formats: ['mp4', 'mkv', 'mov'] };
        } else {
            return { folder: 'movie-freaks-images', resource_type: 'image', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] };
        }
    },
});
const upload = multer({ storage: storage });

// 4. DATABASE CONNECTION
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ottProject_Final_v7';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// 5. SCHEMAS
const UserSchema = new mongoose.Schema({ email: {type:String, unique:true}, password: String, username: String, role: {type:String, default:'user'}, watchlist: {type:Array, default:[]}, continueWatching: {type:Array, default:[]} });
const User = mongoose.model('User', UserSchema);

const ContentSchema = new mongoose.Schema({ id: Number, title: String, description: String, rating: Number, image: String, videoUrl: String, trailerUrl: String, category: String, year: String, cast: String, genres: [String], views: { type: Number, default: 0 }, episodes: Array, seasons: [{ name: String, image: String, episodes: Array }] });
const MovieModel = mongoose.model('Movie', ContentSchema);
const SeriesModel = mongoose.model('Series', ContentSchema);
const AnimeModel = mongoose.model('Anime', ContentSchema);
const CarouselSchema = new mongoose.Schema({ id: Number, title: String, description: String, image: String, tag: String, videoUrl: String, category: String });
const CarouselModel = mongoose.model('Carousel', CarouselSchema);

// 6. SEEDING (Admin)
const seedDatabase = async () => {
    try {
        const adminExists = await User.findOne({ email: "admin@movie.com" });
        if (!adminExists) await User.create({ email: "admin@movie.com", password: "admin", username: "Admin Boss", role: "admin" });
    } catch (e) {}
};
seedDatabase();

// 7. API ROUTES
app.post('/api/admin/add', upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }, { name: 'trailerFile', maxCount: 1 }]), async (req, res) => {
    try {
        const data = req.body;
        data.id = Math.floor(Math.random() * 100000);
        if (req.files['imageFile']) data.image = req.files['imageFile'][0].path;
        if (req.files['videoFile']) data.videoUrl = req.files['videoFile'][0].path;
        if (req.files['trailerFile']) data.trailerUrl = req.files['trailerFile'][0].path; else data.trailerUrl = data.videoUrl;
        data.rating = parseFloat(data.rating);
        if (data.genres) { try { data.genres = JSON.parse(data.genres); } catch(e) { data.genres = []; } }
        if (data.featured === 'true') { await CarouselModel.create({ id: data.id, title: data.title, description: data.description, image: data.image, tag: "New Release", videoUrl: data.videoUrl, category: data.category }); }
        if (data.category !== 'movie') { data.seasons = [{ name: "Season 1", image: data.image, episodes: [{ title: "Episode 1", url: data.videoUrl, duration: "24m" }] }]; }
        if (data.category === 'movie') await MovieModel.create(data);
        else if (data.category === 'series') await SeriesModel.create(data);
        else if (data.category === 'anime') await AnimeModel.create(data);
        res.json({ message: "Upload Successful!" });
    } catch (e) { res.status(500).json({ error: "Upload Failed" }); }
});

app.post('/api/admin/add-episode', upload.single('videoFile'), async (req, res) => { try { const { contentId, seasonName, title, duration } = req.body; const videoUrl = req.file.path; const newEpisode = { title, duration, url: videoUrl }; let item = await SeriesModel.findOne({ id: contentId }) || await AnimeModel.findOne({ id: contentId }); if (!item) return res.status(404).json({ error: "Not found" }); const seasonIndex = item.seasons.findIndex(s => s.name === seasonName); if (seasonIndex > -1) { item.seasons[seasonIndex].episodes.push(newEpisode); } else { item.seasons.push({ name: seasonName, image: item.image, episodes: [newEpisode] }); } item.markModified('seasons'); await item.save(); res.json({ message: "Episode Added!", seasons: item.seasons }); } catch (e) { res.status(500).json({ error: "Failed" }); } });
app.post('/api/admin/carousel/add', upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }]), async (req, res) => { try { const data = req.body; data.id = Math.floor(Math.random() * 100000); if (req.files['imageFile']) data.image = req.files['imageFile'][0].path; if (req.files['videoFile']) data.videoUrl = req.files['videoFile'][0].path; await CarouselModel.create(data); res.json({ message: "Banner Added!" }); } catch (e) { res.status(500).json({ error: "Failed" }); } });
app.put('/api/admin/carousel/update/:id', upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }]), async (req, res) => { try { const { id } = req.params; const updates = req.body; if (req.files['imageFile']) updates.image = req.files['imageFile'][0].path; if (req.files['videoFile']) updates.videoUrl = req.files['videoFile'][0].path; await CarouselModel.findOneAndUpdate({ id: id }, updates); res.json({ message: "Banner Updated!" }); } catch (e) { res.status(500).json({ error: "Update Failed" }); } });
app.put('/api/admin/update/:id', upload.single('imageFile'), async (req, res) => { try { const { id } = req.params; const updates = req.body; if (req.file) updates.image = req.file.path; let updatedItem = await MovieModel.findOneAndUpdate({ id: id }, updates, { new: true }); if (!updatedItem) updatedItem = await SeriesModel.findOneAndUpdate({ id: id }, updates, { new: true }); if (!updatedItem) updatedItem = await AnimeModel.findOneAndUpdate({ id: id }, updates, { new: true }); res.json({ message: "Updated Successfully!", item: updatedItem }); } catch (e) { res.status(500).json({ error: "Update Failed" }); } });
app.post('/api/admin/update-season-poster', upload.single('seasonImageFile'), async (req, res) => { try { const { contentId, seasonName } = req.body; const imageUrl = req.file.path; let item = await SeriesModel.findOne({ id: contentId }) || await AnimeModel.findOne({ id: contentId }); const seasonIndex = item.seasons.findIndex(s => s.name === seasonName); if (seasonIndex > -1) { item.seasons[seasonIndex].image = imageUrl; item.markModified('seasons'); await item.save(); res.json({ message: "Poster Updated!" }); } } catch (e) { res.status(500).json({ error: "Failed" }); } });

// 👇 NEW: DIRECT ADD ROUTE (Accepts URLs from Frontend)
app.post('/api/admin/add-direct', async (req, res) => {
    try {
        const data = req.body;
        data.id = Math.floor(Math.random() * 100000);
        data.rating = parseFloat(data.rating);
        if (typeof data.genres === 'string') data.genres = JSON.parse(data.genres);
        
        if (data.featured === true) {
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

        res.json({ message: "Saved Successfully!" });
    } catch (e) { res.status(500).json({ error: "Save Failed" }); }
});

// 👇 NEW: DIRECT BANNER ADD ROUTE
app.post('/api/admin/carousel/add-direct', async (req, res) => {
    try {
        const data = req.body;
        data.id = Math.floor(Math.random() * 100000);
        await CarouselModel.create(data);
        res.json({ message: "Banner Saved!" });
    } catch (e) { res.status(500).json({ error: "Failed" }); }
});
app.post('/api/auth/login', async (req, res) => { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid credentials' }); res.json({ message: 'Success', user }); });
app.post('/api/auth/signup', async (req, res) => { const { email, password } = req.body; const newUser = new User({ email, password, username: email.split('@')[0] }); await newUser.save(); res.status(201).json({ message: 'Created', user: { email } }); });
app.get('/api/user/:email', async (req, res) => { const user = await User.findOne({ email: req.params.email }); res.json(user || {}); });
app.put('/api/user/update', async (req, res) => { await User.updateOne({email: req.body.email}, {username: req.body.newUsername, password: req.body.newPassword}); res.json({message:"Updated"}); });
app.post('/api/user/watchlist', async (req, res) => { const user = await User.findOne({email:req.body.email}); if(!user.watchlist.find(i=>i.id===req.body.item.id)){ user.watchlist.push(req.body.item); await user.save(); } res.json(user.watchlist); });
app.post('/api/user/watchlist/remove', async (req, res) => { const user = await User.findOne({email:req.body.email}); user.watchlist = user.watchlist.filter(i=>i.id!==req.body.item.id); await user.save(); res.json(user.watchlist); });
app.post('/api/user/history', async (req, res) => { const user = await User.findOne({email:req.body.email}); user.continueWatching=user.continueWatching.filter(i=>i.id!==req.body.item.id); user.continueWatching.unshift(req.body.item); await user.save(); res.json(user.continueWatching); });
app.post('/api/user/history/remove', async (req, res) => { const user = await User.findOne({email:req.body.email}); user.continueWatching=user.continueWatching.filter(i=>i.id!==req.body.item.id); await user.save(); res.json(user.continueWatching); });
app.get('/api/movies', async (req, res) => { res.json(await MovieModel.find()); });
app.get('/api/series', async (req, res) => { res.json(await SeriesModel.find()); });
app.get('/api/anime', async (req, res) => { res.json(await AnimeModel.find()); });
app.get('/api/carousel', async (req, res) => { res.json(await CarouselModel.find()); });
app.delete('/api/admin/delete/:id', async (req, res) => { await MovieModel.deleteOne({ id: req.params.id }); await SeriesModel.deleteOne({ id: req.params.id }); await AnimeModel.deleteOne({ id: req.params.id }); res.json({ message: "Deleted" }); });
app.post('/api/admin/carousel/add-direct', async (req, res) => {
    try {
        const data = req.body;
        data.id = Math.floor(Math.random() * 100000);
        
        await CarouselModel.create(data);
        res.json({ message: "Banner Added!" });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Failed to save banner" }); 
    }
});

// 👇 NEW: DIRECT CAROUSEL UPDATE
app.put('/api/admin/carousel/update-direct/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await CarouselModel.findOneAndUpdate({ id: id }, updates);
        res.json({ message: "Banner Updated!" });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Failed to update banner" }); 
    }
});
app.delete('/api/admin/carousel/delete/:id', async (req, res) => { await CarouselModel.deleteOne({ id: req.params.id }); res.json({ message: "Deleted" }); });
app.post('/api/content/view/:id', async (req, res) => { try { const { id } = req.params; let item = await MovieModel.findOne({ id }) || await SeriesModel.findOne({ id }) || await AnimeModel.findOne({ id }); if (item) { item.views = (item.views || 0) + 1; await item.save(); res.json({ views: item.views }); } } catch (e) { res.status(500).json({ error: "Error" }); } });
app.get('/api/admin/analytics', async (req, res) => {
    try {
        const movies = await MovieModel.find();
        const series = await SeriesModel.find();
        const anime = await AnimeModel.find();
        
        const all = [...movies, ...series, ...anime];

        // Sort by views (descending). If 'views' is missing, treat it as 0.
        const top5 = all
            .map(item => ({
                ...item.toObject(), 
                views: item.views || 0 
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
        
        res.json(top5);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});
// 👇 INCREASE TIMEOUT LIMITS FOR UPLOADS
const server = app.listen(PORT, () => console.log(`🚀 Cloud Server running on http://localhost:${PORT}`));
server.keepAliveTimeout = 120000; // 2 Minutes
server.headersTimeout = 120000;   // 2 Minutes