import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConverterPage } from './pages/ConverterPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConverterPage />
      <ToastContainer position="bottom-right" />
    </QueryClientProvider>
  );
}
