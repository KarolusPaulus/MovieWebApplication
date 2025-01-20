import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AllGroups } from './pages/allGroups';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/home';
import SignIn from './pages/signIn';
import SignUp from './pages/signUp';
import UserProvider from './context/UserProvider';
import MoviePage from './pages/moviePage';
import Showtimes from './pages/showtimes';
import MyProfile  from './pages/userProfile';
import ProtectedRoute from './components/ProtectedRoute';
import { CreateGroup } from './pages/createGroup';
import { GroupPage } from './pages/groupPage';
import { AddUsers} from './pages/addUsers';
import { Unauthorized } from './pages/unauthorized';
import FavoritesPage from './pages/favoritesPage';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

const AnimatedRoutes = () => {
  const location = useLocation(); // Tracks the current route

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/moviepage/:movieId" element={<MoviePage />} />
        <Route path="/showtimes" element={<Showtimes />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/favorites/:email" element={<FavoritesPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/allgroups" element={<AllGroups />} />
          <Route path="/creategroup" element={<CreateGroup />} />
          <Route path="/userprofile" element={<MyProfile />} />
          <Route path="/grouppage/:groupId" element={<GroupPage />} />
          <Route path="/addusers" element={<AddUsers />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <UserProvider>
        <AnimatedRoutes />
      </UserProvider>
    </Router>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
