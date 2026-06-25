import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Control from '@/pages/Control'
import ScrollToTop from '@/components/ScrollToTop'

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Control />} />
        <Route path="/showcase" element={<Home />} />
        <Route path="*" element={<Control />} />
      </Routes>
    </Router>
  )
}
