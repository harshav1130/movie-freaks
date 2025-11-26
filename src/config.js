// Toggle this to TRUE when deploying, FALSE when testing locally
const IS_PRODUCTION = true; 

export const API_URL = IS_PRODUCTION 
    ? "https://movie-freaks.onrender.com" // We will get this URL in Phase 4
    : "http://localhost:3001";