import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

export default function Header() {

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/notebooks" className="flex items-center">
              <h1 className="text-2xl font-bold text-black dark:text-white">
                Vox
                <span className="font-black text-gray-400 dark:text-gray-500">
                  AI
                </span>
              </h1>
            </Link>
          </div>
          <UserButton />
        </div>
      </div>
    </header>
  );
} 