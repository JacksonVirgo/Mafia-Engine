import React from 'react';
import ReactDOM from 'react-dom';
import './css/global.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom";

import Login from './pages/Login';
import VoteCount from './pages/VoteCount'
import RegisterVC from './pages/RegisterVC';
function Pages() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path='/mafiascum/votecount' element={<VoteCount />} />
        <Route path='/mafiascum/votecount/register' element={<RegisterVC />} />
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>)
}

ReactDOM.render(
  <React.StrictMode>
    <Pages />
  </React.StrictMode>
  , document.getElementById('root')
);
