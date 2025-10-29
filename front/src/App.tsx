import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import routes from './routes'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App