import Home from './Home'
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignupPage from "./pages/Signup";
import Client from "./pages/Clients";
import ErrorBoundary from './components/ErrorBoundary';
function App() {


  return (
    <>
  <ErrorBoundary>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
         <Route path="/clients" element={<Client />} />
      </Routes>
</ErrorBoundary>
    </>



  )
}

export default App
