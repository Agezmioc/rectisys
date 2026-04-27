import './App.css'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { ContextProvider } from './context/Context'

function App() {

  return (
    <>
      <ContextProvider>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </ContextProvider>
    </>
  )
}

export default App