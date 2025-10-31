import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './routes'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App