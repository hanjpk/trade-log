// app/page.tsx
import { SignedIn, SignedOut } from '@clerk/nextjs'; // No need for SignInButton here
import Image from 'next/image';
import { TradeLogDataTable } from './trades/data-table';

export default function Home() {
  return (
    <>
      {/* Show this content if the user IS signed in */}
      
        <div className="items-center justify-items-center min-h-screen p-8">
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            <TradeLogDataTable/>
          </main>
        </div>
      
    </>
  );
}