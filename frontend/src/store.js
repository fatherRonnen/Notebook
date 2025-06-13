import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import noteReducer from './features/notes/noteSlice';
import aiReducer from './features/ai/aiSlice';
import alertReducer from './features/alert/alertSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: noteReducer,
    ai: aiReducer,
    alert: alertReducer,
  },
});

export default store;