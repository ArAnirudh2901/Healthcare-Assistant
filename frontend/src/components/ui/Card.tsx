import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'glass' | 'outline';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  style,
  padding = 'medium',
  variant = 'default',
  hoverable = false,
}) => {
  const classNames = [
    styles.card,
    styles[padding],
    styles[variant],
    hoverable ? styles.hoverable : '',
    className
  ].join(' ').trim();

  return (
    <div className={classNames} style={style}>
      {children}
    </div>
  );
};
