import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; // 👈 IMPORT TOAST
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { API_URL } from './config';

// Components
import IntroScreen from './components/IntroScreen';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import ContentRow from './components/ContentRow';
import DetailsPage from './components/DetailsPage';
import AdminPage from './components/AdminPage';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  
  // User State
  const [user, setUser] = useState(() => {
      const savedUser = localStorage.getItem('mf_user');
      return savedUser ? JSON.parse(savedUser) : null;
  });

  const [myList, setMyList] = useState(user?.watchlist || []);
  const [history, setHistory] = useState(user?.continueWatching || []);

  // Content State
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [anime, setAnime] = useState([]);
  
  // Search & Loading
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // UI State
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setShowIntro(false);
      fetchAllContent();
      fetchUserData(); 
    }
  }, [user?.email]);

  const fetchUserData = async () => {
      if (!user?.email) return;
      try {
          const res = await fetch(`${API_URL}/api/user/${user.email}`);
          const data = await res.json();
          if (res.ok) {
              setMyList(data.watchlist);
              setHistory(data.continueWatching);
              const updatedUser = { ...user, ...data };
              localStorage.setItem('mf_user', JSON.stringify(updatedUser));
              if (user.role !== data.role) setUser(updatedUser);
          }
      } catch (e) { console.error("Failed to sync user data"); }
  };

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      const resMovies = await fetch(`${API_URL}/api/movies`);
      setMovies(await resMovies.json());
      const resSeries = await fetch(`${API_URL}/api/series`);
      setSeries(await resSeries.json());
      const resAnime = await fetch(`${API_URL}/api/anime`);
      setAnime(await resAnime.json());
      setTimeout(() => setLoading(false), 800); 
    } catch (err) { console.error(err); setLoading(false); }
  };

  const filterContent = (contentList) => {
    if (!searchTerm) return contentList;
    return contentList.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleCardClick = (item) => {
      navigate('/details', { state: { item } });
  };

  const handleHeroPlay = (item) => {
      handlePlayVideo(item);
      navigate('/details', { state: { item, autoPlay: true } });
  };

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password}) });
        const data = await res.json();
        if(res.ok) { 
            localStorage.setItem('mf_user', JSON.stringify(data.user)); 
            setUser(data.user); 
            setMyList(data.user.watchlist);
            setHistory(data.user.continueWatching); 
            setShowSignIn(false); 
            toast.success(`Welcome back, ${data.user.username}!`); // 👈 TOAST
        } else { toast.error(data.message); }
    } catch(e) { toast.error("Network Error"); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/api/auth/signup`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password}) });
        if(res.ok) { 
            toast.success("Account created! Logging in..."); // 👈 TOAST
            handleLogin(e); 
            setShowSignUp(false); 
        } else { toast.error("Signup failed"); }
    } catch(e) { toast.error("Network Error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('mf_user');
    setUser(null);
    setShowIntro(true);
    setMyList([]);
    setHistory([]);
    setSearchTerm('');
    toast.info("Logged out successfully"); // 👈 TOAST
    navigate('/');
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/api/user/update`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: user.email, newUsername, newPassword }) });
          const data = await res.json();
          if (res.ok) {
              toast.success("Profile Updated!"); // 👈 TOAST
              const updatedUser = { ...user, username: data.username };
              setUser(updatedUser);
              localStorage.setItem('mf_user', JSON.stringify(updatedUser));
              setShowSettings(false);
          }
      } catch(e) { toast.error("Update failed"); }
  };

  const addToWatchlist = async (item) => {
      if (!myList.find(i => i.id === item.id)) {
          const newList = [...myList, item];
          setMyList(newList);
          toast.success("Added to My List"); // 👈 TOAST
          await fetch(`${API_URL}/api/user/watchlist`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: user.email, item }) });
      } else {
          toast.info("Already in My List");
      }
  };

  const removeFromWatchlist = async (item) => {
    const newList = myList.filter(i => i.id !== item.id);
    setMyList(newList);
    toast.info("Removed from My List"); // 👈 TOAST
    try {
        await fetch(`${API_URL}/api/user/watchlist/remove`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: user.email, item }) });
        const updatedUser = { ...user, watchlist: newList };
        localStorage.setItem('mf_user', JSON.stringify(updatedUser));
    } catch (error) { console.error("Failed to remove"); }
  };

  const removeFromHistory = async (item) => {
    const newHistory = history.filter(i => i.id !== item.id);
    setHistory(newHistory);
    toast.info("Removed from History"); // 👈 TOAST
    try {
        await fetch(`${API_URL}/api/user/history/remove`, { 
            method: 'POST', headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ email: user.email, item }) 
        });
        const updatedUser = { ...user, continueWatching: newHistory };
        localStorage.setItem('mf_user', JSON.stringify(updatedUser));
    } catch (error) { console.error("Failed to remove history item"); }
  };

  const handlePlayVideo = async (item) => { 
      const newHistory = [item, ...history.filter(i => i.id !== item.id)]; 
      setHistory(newHistory); 
      await fetch(`${API_URL}/api/user/history`, { 
          method: 'POST', headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({ email: user.email, item }) 
      }); 
  };

  const allContent = [...movies, ...series, ...anime];

  // --- RENDER: LANDING PAGE ---
  if (showIntro && !user) return <IntroScreen onComplete={() => setShowIntro(false)} />;
  if (!user) return ( 
      <div className="landing-content">
        <ToastContainer position="top-center" theme="dark" /> {/* 👈 Added Toast here too */}
        <header className="landing-header"><div className="logo">Movie Freaks</div><button className="btn btn-red" onClick={() => setShowSignIn(true)}>Sign In</button></header>
        <section className="hero-landing"><div className="hero-content-landing"><h1>Unlimited movies, TV shows, and more.</h1><h2>Watch anywhere. Cancel anytime.</h2><p>Ready to watch? Enter your email to create or restart your membership.</p><div className="email-form"><input type="email" placeholder="Email address" onChange={(e) => setEmail(e.target.value)} /><button className="btn btn-red btn-large" onClick={() => setShowSignUp(true)}>Get Started &gt;</button></div></div></section>
        <footer className="landing-footer"><p>Questions? Call 1-800-MOVIE-FREAKS</p><div className="footer-links"><a href="#">FAQ</a><a href="#">Help Center</a><a href="#">Terms of Use</a><a href="#">Privacy</a></div></footer>
        {showSignIn && (<div className="overlay"><div className="form-container"><button className="close-btn" onClick={() => setShowSignIn(false)}>&times;</button><h2>Sign In</h2><form onSubmit={handleLogin}><div className="form-group"><input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required /></div><div className="form-group"><input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required /></div><button type="submit" className="btn btn-red btn-full-width">Sign In</button><div className="form-help"><p className="signup-link">New here? <a href="#" onClick={(e) => { e.preventDefault(); setShowSignIn(false); setShowSignUp(true); }}>Sign up now</a>.</p></div></form></div></div>)}
        {showSignUp && (<div className="overlay"><div className="form-container"><button className="close-btn" onClick={() => setShowSignUp(false)}>&times;</button><h2>Sign Up</h2><form onSubmit={handleSignup}><div className="form-group"><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></div><div className="form-group"><input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required /></div><button type="submit" className="btn btn-red btn-full-width">Sign Up</button><p className="signup-link">Have an account? <a href="#" onClick={(e) => { e.preventDefault(); setShowSignUp(false); setShowSignIn(true); }}>Sign in</a>.</p></form></div></div>)}
      </div>
  );

  // --- MAIN APP ---
  return (
    <div id="app-content" style={{ opacity: 1, width: '100%' }}>
      <ToastContainer position="top-center" autoClose={3000} theme="dark" />
      <Routes>
          <Route path="/" element={
            <>
              <Navbar user={user} onLogout={handleLogout} onOpenSettings={() => setShowSettings(true)} searchData={allContent} onResultClick={handleCardClick} />
              <main>
                {!searchTerm && <HeroCarousel onPlay={handleHeroPlay} onDetails={handleCardClick} />}
                
                {filterContent(history).length > 0 && (
                    <ContentRow 
                        id="history"
                        title={`Continue Watching for ${user.username}`} 
                        data={filterContent(history)} 
                        type="History"
                        loading={loading} 
                        onCardClick={handleCardClick}
                        onRemove={removeFromHistory} 
                    />
                )}
                
                <div id="mylist">{filterContent(myList).length > 0 && <ContentRow id="mylist" title="My List" data={filterContent(myList)} type="MyList" loading={loading} onCardClick={handleCardClick} onRemove={removeFromWatchlist} />}</div>

                <ContentRow id="movies" title="Trending Movies" data={filterContent(movies)} type="Movie" loading={loading} onCardClick={handleCardClick} />
                <ContentRow id="series" title="Must-Watch Web Series" data={filterContent(series)} type="Series" loading={loading} onCardClick={handleCardClick} />
                <ContentRow id="anime" title="New Anime Episodes" data={filterContent(anime)} type="Anime" loading={loading} onCardClick={handleCardClick} />
              </main>
              <footer className="app-footer"><p>&copy; 2025 Movie Freaks. All rights reserved.</p></footer>
              
              {showSettings && (
                  <div className="overlay" style={{zIndex: 3000}}>
                      <div className="form-container">
                          <button className="close-btn" onClick={() => setShowSettings(false)}>&times;</button>
                          <h2>Profile Settings</h2>
                          <form onSubmit={handleUpdateProfile}>
                              <div className="form-group"><label>Change Username</label><input type="text" placeholder={user.username} onChange={e => setNewUsername(e.target.value)} style={{marginTop:'5px'}} /></div>
                              <div className="form-group"><label>Change Password</label><input type="password" placeholder="New Password" onChange={e => setNewPassword(e.target.value)} style={{marginTop:'5px'}} /></div>
                              <button type="submit" className="btn btn-red btn-full-width">Save Changes</button>
                          </form>
                      </div>
                  </div>
              )}
            </>
          } />
          
          <Route path="/details" element={<DetailsPage myList={myList} onAddToList={addToWatchlist} onRemoveFromList={removeFromWatchlist} onPlay={handlePlayVideo} />} />
          
          <Route path="/admin" element={
             user?.role === 'admin' ? <AdminPage /> : <div style={{color:'white', textAlign:'center', marginTop:'100px'}}><h1>Access Denied</h1><p>You are not an admin.</p></div>
          } />

      </Routes>
    </div>
  );
};

export default App;