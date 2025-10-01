import { POSClient } from './components/POSClient';

// This page is intentionally sparse. 
// The complex state management and UI is handled in the POSClient component.
// This follows the pattern of using Server Components for layout and Client Components for interactivity.
export default function POSPage() {
  return <POSClient />;
}
