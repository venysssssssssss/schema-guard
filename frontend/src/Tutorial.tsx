import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialProps {
  steps: TutorialStep[];
  onClose: () => void;
  onComplete: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ steps, onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  const step = steps[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll to element if needed
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      if (!isVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [step.targetId]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!targetRect) return null;

  // Calculate overlay positions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Tooltip positioning
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
    width: '320px',
    maxWidth: '90vw',
  };

  const gap = 16;
  
  // Default to bottom if not specified or if fits
  // Simple positioning logic
  let top = targetRect.bottom + gap;
  let left = targetRect.left;

  // Adjust if going off screen
  if (left + 320 > windowWidth) {
    left = windowWidth - 340; 
  }
  if (left < 20) left = 20;

  // Check if bottom has space, else go top
  if (top + 200 > windowHeight) {
    top = targetRect.top - gap - 200; // Approximate height of tooltip
  }

  tooltipStyle.top = `${top}px`;
  tooltipStyle.left = `${left}px`;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" aria-live="polite">
      {/* Mask Layers - Create the "Hole" */}
      {/* Top */}
      <div 
        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
        style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
      />
      {/* Bottom */}
      <div 
        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
        style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
      />
      {/* Left */}
      <div 
        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
        style={{ top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height }}
      />
      {/* Right */}
      <div 
        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
        style={{ top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }}
      />

      {/* Highlight Border */}
      <div 
        className="absolute border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] rounded transition-all duration-300 ease-in-out pointer-events-none"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* Tooltip Card */}
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in border border-gray-100"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {step.title}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close tutorial"
          >
            ✕
          </button>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed">
          {step.content}
        </p>

        <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <button 
                onClick={handlePrev}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
              {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
