import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { client } from './lib/appwrite'

// Ping Appwrite backend to verify setup
client.ping()
  .then(() => console.log('✅ Appwrite connection successful!'))
  .catch((error) => console.error('❌ Appwrite connection failed:', error));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
