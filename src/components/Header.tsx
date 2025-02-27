import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

export default function Header() {
  // const location = useLocation();
  // const isNotebooksPage = location.pathname === '/notebooks';

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* {!isNotebooksPage && (
              <Link 
                to="/notebooks" 
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Notebooks
              </Link>
            )} */}
          </div>
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