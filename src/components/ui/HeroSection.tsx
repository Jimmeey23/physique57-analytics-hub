import React from 'react';
import { Home, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHero } from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  badgeIcon: LucideIcon;
  gradient: string;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  backgroundElements?: React.ReactNode;
}

/**
 * Legacy hero — unified over PageHero. Props preserved for compatibility.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  description,
  badgeText,
  badgeIcon: BadgeIcon,
  stats = [],
}) => {
  const navigate = useNavigate();

  return (
    <PageHero
      eyebrow={badgeText}
      icon={BadgeIcon}
      title={title}
      description={description}
      stats={stats}
      actions={
        <Button
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
      }
    />
  );
};

export default HeroSection;
