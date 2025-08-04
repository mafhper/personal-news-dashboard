/**
 * Header.tsx
 *
 * Componente de cabeçalho responsivo para o Personal News Dashboard.
 * Gerencia a navegação principal, pesquisa, filtros de categoria e controles de usuário.
 * Implementa design responsivo com menu hambúrguer para dispositivos móveis.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { SearchBar, SearchFilters } from "./SearchBar";
import { HeaderWeatherWidget } from "./HeaderWeatherWidget";
import { PaginationControls } from "./PaginationControls";
import { Article, FeedCategory } from "../types";
import { useFavorites } from "../hooks/useFavorites";

interface HeaderProps {
  onManageFeedsClick: () => void;
  onRefreshClick: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onOpenSettings: () => void;
  // Search-related props
  articles: Article[];
  onSearch: (query: string, filters: SearchFilters) => void;
  onSearchResultsChange?: (results: Article[]) => void;
  // Favorites
  onOpenFavorites: () => void;
  // Categories
  categories: FeedCategory[];
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const HomeIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.331.83 2.295 2.296a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.942 1.543-.83 3.331-2.296 2.295a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.942-3.331-.83-2.295-2.296a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.942-1.543.83-3.331 2.296-2.295a1.724 1.724 0 002.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const MenuIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const HeartIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  onManageFeedsClick,
  onRefreshClick,
  selectedCategory,
  onCategorySelect,
  onOpenSettings,
  articles,
  onSearch,
  onSearchResultsChange,
  onOpenFavorites,
  categories,
  currentPage = 0,
  totalPages = 1,
  onPageChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { getFavoritesCount } = useFavorites();

  // Detectar scroll para aplicar efeitos visuais no header fixo
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Header Fixo - Primeira linha sempre visível */}
      <header
        className={`fixed top-0 left-0 right-0 bg-[rgb(var(--color-background))] z-30 transition-shadow ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Primeira linha - Widget do tempo + Categorias + Paginação + Settings */}
          <div className="flex justify-between items-center h-16">
            {/* Esquerda - Widget do tempo + Categorias */}
            <div className="flex items-center space-x-2 sm:space-x-4 xl:space-x-8 flex-1 min-w-0">
              <div className="hidden sm:block flex-shrink-0">
                <HeaderWeatherWidget />
              </div>

              {/* Home Icon */}
              <button
                onClick={() => window.location.reload()}
                aria-label="Voltar à página inicial"
                className="hidden xl:flex p-2 text-gray-300 hover:text-white transition-colors touch-target flex-shrink-0"
                style={{ minWidth: "40px", minHeight: "40px" }}
                title="Página Inicial"
              >
                <HomeIcon />
              </button>

              {/* Categorias - Desktop (1200px+) */}
              <nav
                id="navigation"
                className="hidden xl:flex items-center space-x-4 2xl:space-x-6 flex-1 min-w-0"
                role="navigation"
                aria-label="Category navigation"
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategorySelect(category.id)}
                    className={`text-xs xl:text-sm font-medium transition-colors flex items-center space-x-1 touch-target whitespace-nowrap ${
                      selectedCategory === category.id
                        ? "text-[rgb(var(--color-accent))]"
                        : "text-gray-300 hover:text-white"
                    }`}
                    style={{
                      minHeight: "44px",
                      padding: "6px 8px xl:8px 12px",
                    }}
                    aria-current={
                      selectedCategory === category.id ? "page" : undefined
                    }
                    aria-label={`Filter articles by ${category.name} category`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </nav>

              {/* Categorias - Tablet/Medium (768px - 1199px) - Dropdown compacto */}
              <div className="hidden md:block xl:hidden flex-shrink-0">
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => onCategorySelect(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 min-w-[120px]"
                    aria-label="Selecionar categoria"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Direita - Paginação + Refresh + Gerenciar Feeds + Settings + Mobile Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 xl:space-x-4 flex-shrink-0">
              {/* Paginação - Desktop e Tablet */}
              <div className="hidden md:block">
                {onPageChange && totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    compact={true}
                  />
                )}
              </div>

              {/* Refresh button - Primeira linha */}
              <button
                onClick={onRefreshClick}
                className="hidden md:block p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors touch-target flex-shrink-0"
                style={{ minWidth: "36px", minHeight: "36px" }}
                aria-label="Atualizar artigos"
                title="Atualizar"
              >
                <RefreshIcon />
              </button>

              {/* Manage feeds button - Responsivo */}
              <button
                onClick={onManageFeedsClick}
                className="hidden md:flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 bg-[rgb(var(--color-accent))] text-white rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors touch-target text-xs font-medium flex-shrink-0"
                style={{ minHeight: "36px" }}
                aria-label="Gerenciar feeds RSS"
                title="Gerenciar Feeds"
              >
                {/* Ícone sempre visível */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {/* Texto apenas em telas maiores */}
                <span className="hidden lg:inline whitespace-nowrap">
                  GERENCIAR FEED
                </span>
                <span className="lg:hidden">FEEDS</span>
              </button>

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-300 hover:text-white transition-colors touch-target flex-shrink-0"
                style={{ minWidth: "40px", minHeight: "40px" }}
                aria-label="Abrir configurações"
                title="Configurações"
              >
                <SettingsIcon />
              </button>

              {/* Mobile menu button - Apenas para telas pequenas */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-300 hover:text-white touch-target flex-shrink-0"
                  style={{
                    minWidth: "44px",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={
                    mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
                  }
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  {mobileMenuOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <MenuIcon />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Segunda linha - Aparece apenas no scroll */}
      {isScrolled && (
        <div className="fixed top-16 left-0 right-0 bg-[rgb(var(--color-background))] border-t border-gray-700/50 z-20 transition-all duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              <div className="flex items-center justify-between">
                {/* Esquerda - Mobile Categories */}
                <div className="lg:hidden">
                  <select
                    value={selectedCategory}
                    onChange={(e) => onCategorySelect(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Centro - Busca Centralizada */}
                <div className="flex-1 flex justify-center mx-4">
                  <div className="w-full max-w-md">
                    <SearchBar
                      articles={articles}
                      onSearch={onSearch}
                      onResultsChange={onSearchResultsChange}
                      placeholder="Buscar artigos... (Ctrl+K)"
                      showFilters={true}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Direita - Favoritos + Mobile Pagination */}
                <div className="flex items-center space-x-2">
                  {/* Favorites button - Apenas na segunda linha */}
                  <div className="hidden sm:flex items-center space-x-2">
                    <button
                      onClick={onOpenFavorites}
                      className="relative p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors touch-target"
                      style={{ minWidth: "40px", minHeight: "40px" }}
                      aria-label={`Abrir favoritos (${getFavoritesCount()})`}
                      title="Favoritos"
                    >
                      <HeartIcon />
                      {getFavoritesCount() > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {getFavoritesCount() > 99
                            ? "99+"
                            : getFavoritesCount()}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Mobile Pagination */}
                  <div className="sm:hidden">
                    {onPageChange && totalPages > 1 && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        compact={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Espaçador para compensar o header fixo */}
      <div className="h-20"></div>

      {/* Mobile menu - collapsible navigation for smaller screens */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed top-16 left-0 right-0 border-t border-gray-700 bg-gray-800 shadow-lg z-20"
        >
          <div className="px-4 py-3 space-y-4">
            {/* Mobile category navigation */}
            <nav
              className="mobile-nav flex flex-col space-y-2"
              role="navigation"
              aria-label="Mobile category navigation"
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategorySelect(category.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-sm font-medium transition-colors flex items-center space-x-2 p-3 rounded-md touch-target ${
                    selectedCategory === category.id
                      ? "bg-[rgb(var(--color-accent))] text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  aria-current={
                    selectedCategory === category.id ? "page" : undefined
                  }
                  aria-label={`Filter articles by ${category.name} category`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </button>
              ))}
            </nav>

            {/* Mobile action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onRefreshClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 bg-gray-700 text-white p-3 text-sm font-bold rounded-md hover:bg-gray-600 transition-colors"
                aria-label="Refresh articles"
              >
                <RefreshIcon />
                <span>Atualizar</span>
              </button>
              <button
                onClick={() => {
                  onManageFeedsClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 bg-[rgb(var(--color-accent))] text-white p-3 text-sm font-bold rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors"
                aria-label="Manage RSS feeds"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Gerenciar Feeds</span>
              </button>
            </div>

            {/* Mobile Pagination - Apenas para telas muito pequenas */}
            <div className="sm:hidden">
              {onPageChange && totalPages > 1 && (
                <div className="pt-2 border-t border-gray-700">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      onPageChange(page);
                      setMobileMenuOpen(false);
                    }}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
