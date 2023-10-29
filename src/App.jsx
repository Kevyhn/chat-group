import {useState} from 'react'
import {AuthProvider} from './context/authContext'
import {HashRouter, Routes, Route, Link, Outlet} from 'react-router-dom'
import Main from './components/Main'
import Login from './components/Login'
import Register from './components/Register'
import {ProtectedRoute} from './components/ProtectedRoute'
import './App.css'

function App() {

  return (
    <div className="App">
      <AuthProvider>
        <HashRouter>                    
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Main/>
              </ProtectedRoute>              
            }/>            
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
          </Routes>                       
        </HashRouter>       
      </AuthProvider>
    </div>
  )
}

export default App
