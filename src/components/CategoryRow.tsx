import React, { useRef, useState } from 'react';
import { AudioSeries } from '../types';
import { SeriesCard } from './SeriesCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryRowProps {
  title: string;
  seriesList: AudioSeries[];
  subtitle?: string;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ title, seriesList, subtitle }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { clientWidth } = scrollContainerRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!seriesList || seriesList.length === 0) return null;

  return (
    <div className="relative py-4 md:py-6 group/row">
      {/* Category Header */}
      <div className="px-4 md:px-12 mb-2 md:mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight hover:text-neutral-200 transition-colors inline-flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-emerald-400 opacity-0 group-hover/row:opacity-100 transition-opacity">
              Explorar tudo &gt;
            </span>
          </h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all rounded-r"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Horizontal Scroll Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 py-2 scroll-smooth"
        >
          {seriesList.map((series) => (
            <SeriesCard key={series.id} series={series} className="flex-none w-40 sm:w-56 md:w-64 lg:w-72" />
          ))}
        </div>

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all rounded-l"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
};
