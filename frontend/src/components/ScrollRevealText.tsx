import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  delay?: number;
  stagger?: number;
  wordClassName?: string;
}

export const ScrollRevealText: React.FC<ScrollRevealTextProps> = ({
  text,
  className = '',
  tag = 'h2',
  delay = 0.1,
  stagger = 0.04,
  wordClassName = ''
}) => {
  // Split by line breaks, then split lines into words
  const lines = text.split('\n');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: {
      y: '115%',
      opacity: 0
    },
    visible: {
      y: '0%',
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Custom ease out expo
      }
    }
  };

  const Tag = tag;

  return (
    <Tag className={className}>
      <motion.span
        className="inline-block w-full"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
      >
        {lines.map((line, lineIdx) => (
          <span key={lineIdx} className="block overflow-hidden leading-[1.12]">
            {line.split(' ').map((word, wordIdx) => (
              <span
                key={wordIdx}
                className="inline-block overflow-hidden align-bottom pb-[0.08em] mr-[0.25em]"
              >
                <motion.span
                  variants={wordVariants}
                  className={`inline-block will-change-transform ${wordClassName}`}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
};
