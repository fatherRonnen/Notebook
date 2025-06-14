import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container } from '@mui/material';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import NoteEditor from './components/notes/NoteEditor';
import NoteView from './components/notes/NoteView';
import NotFound from './components/pages/NotFound';
import { loadUser } from './features/auth/authSlice';
import PrivateRoute from './components/routing/PrivateRoute';

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <Header />
      <Container className="container" sx={{ py: 4, minHeight: 'calc(100vh - 128px)' }}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
          
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/notes/new" element={<PrivateRoute><NoteEditor /></PrivateRoute>} />
          <Route path="/notes/:id" element={<PrivateRoute><NoteView /></PrivateRoute>} />
          <Route path="/notes/:id/edit" element={<PrivateRoute><NoteEditor /></PrivateRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </>
  );
};

export default App;