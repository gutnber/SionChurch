import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Activities from './pages/Activities';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import BibleQA from './pages/BibleQA';
import Contact from './pages/Contact';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Dashboard from './pages/admin/Dashboard';
import Overview from './pages/admin/Overview';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import CreateAdmin from './pages/CreateAdmin';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import NewsEditor from './pages/admin/NewsEditor';
import EventsManager from './pages/admin/EventsManager';
import EventEditor from './pages/admin/EventEditor';
import ActivitiesManager from './pages/admin/ActivitiesManager';
import Calendar from './pages/Calendar';
import Gallery from './pages/Gallery';
import AlbumDetail from './pages/AlbumDetail';
import GalleryManager from './pages/admin/GalleryManager';
import AlbumEditor from './pages/admin/AlbumEditor';
import HomeEditor from './pages/admin/HomeEditor';
import { useAuthStore } from './store/authStore';

function App() {
  const { getUser } = useAuthStore();

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="activities" element={<Activities />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="news" element={<News />} />
        <Route path="news/:id" element={<NewsDetail />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="gallery/:id" element={<AlbumDetail />} />
        <Route path="bible-qa" element={<BibleQA />} />
        <Route path="contact" element={<Contact />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="create-admin" element={<CreateAdmin />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<Dashboard />}>
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="news" element={<NewsEditor />} />
          <Route path="news/edit/:id" element={<NewsEditor />} />
          <Route path="events" element={<EventsManager />} />
          <Route path="events/new" element={<EventEditor />} />
          <Route path="events/edit/:id" element={<EventEditor />} />
          <Route path="activities" element={<ActivitiesManager />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="gallery/new" element={<AlbumEditor />} />
          <Route path="gallery/edit/:id" element={<AlbumEditor />} />
          <Route path="home" element={<HomeEditor />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;