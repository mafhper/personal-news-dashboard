
import React from 'react';
import { Clock } from './Clock';


interface HeaderProps {
    onManageFeedsClick: () => void;
    onRefreshClick: () => void;
    selectedCategory: string;
    onCategorySelect: (category: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onOpenSettings: () => void;
}

const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.331.83 2.295 2.296a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.942 1.543-.83 3.331-2.296 2.295a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.942-3.331-.83-2.295-2.296a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.942-1.543.83-3.331 2.296-2.295a1.724 1.724 0 002.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const MenuIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.5 7.5 0 0112.248 4.852 1 1 0 11-1.952.494A5.503 5.503 0 005.5 9.512V7a1 1 0 112 0v3a1 1 0 01-1 1H3a1 1 0 110-2h1.101A7.501 7.501 0 014 2zM15.101 15H17a1 1 0 110 2h-3a1 1 0 01-1-1v-3a1 1 0 112 0v1.512a5.503 5.503 0 00-9.748-2.356 1 1 0 11-1.952-.494A7.5 7.5 0 0114.5 11.899V10a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
);

const ArrowLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const ArrowRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onManageFeedsClick, onRefreshClick, selectedCategory, onCategorySelect, currentPage, totalPages, onPageChange, onOpenSettings }) => {
    const navItems = ['All', 'Tech', 'Reviews', 'Science', 'Entertainment', 'AI'];

    return (
        <header className="border-b border-gray-700 sticky top-0 bg-[rgb(var(--color-background))] z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-3xl font-black tracking-tighter" style={{fontStyle: 'italic'}}>MyFeed</h1>
                        <nav className="hidden lg:flex items-center space-x-6">
                            {navItems.map(item => (
                                <button 
                                    key={item} 
                                    onClick={() => onCategorySelect(item)}
                                    className={`text-sm font-medium transition-colors ${selectedCategory === item ? 'text-[rgb(var(--color-accent))]' : 'text-gray-300 hover:text-white'}`}>
                                    {item}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                         <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="p-1.5 bg-gray-700 text-white rounded-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ArrowLeftIcon />
                            </button>
                            {totalPages > 0 && <span className="text-sm text-gray-400 font-mono">{currentPage + 1} / {totalPages}</span>}
                            <button 
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="p-1.5 bg-gray-700 text-white rounded-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ArrowRightIcon />
                            </button>
                        </div>
                        <button 
                            onClick={onRefreshClick}
                            className="hidden sm:flex items-center space-x-2 bg-gray-700 text-white px-3 py-1.5 text-sm font-bold rounded-sm hover:bg-gray-600 transition-colors">
                            <RefreshIcon />
                        </button>
                        <button 
                            onClick={onManageFeedsClick}
                            className="hidden sm:inline-block bg-[rgb(var(--color-accent))] text-white px-4 py-1.5 text-sm font-bold rounded-sm hover:bg-[rgb(var(--color-accent-dark))] transition-colors">
                            MANAGE FEEDS
                        </button>
                        <div className="hidden sm:block text-gray-400">
                           <Clock />
                        </div>
                        <button 
                            onClick={onOpenSettings}
                            className="p-1.5 bg-gray-700 text-white rounded-sm hover:bg-gray-600 transition-colors"
                            title="Settings"
                        >
                            <SettingsIcon />
                        </button>
                        <button className="lg:hidden text-gray-300 hover:text-white">
                            <MenuIcon />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
