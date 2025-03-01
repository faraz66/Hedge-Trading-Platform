import { ChakraProvider, CSSReset } from '@chakra-ui/react'
import { BrowserRouter as Router } from 'react-router-dom'
import Layout from './components/Layout'
import AppRoutes from './routes'

export default function App() {
  return (
    <ChakraProvider>
      <CSSReset />
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </ChakraProvider>
  )
} 