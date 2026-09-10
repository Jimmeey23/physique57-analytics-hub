import type React from 'react';
import { Calendar, BarChart3, TrendingUp, UserCheck, Users } from 'lucide-react';

type TableOption = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
};

export const RETENTION_TABLE_OPTIONS: TableOption[] = [
  {
    key: 'monthonmonthbytype',
    label: 'By Client Type',
    shortLabel: 'Client Type',
    description: 'Retention, revenue, visits, and conversion performance by client cohort.',
    icon: Users,
  },
  {
    key: 'monthonmonth',
    label: 'Month on Month',
    shortLabel: 'MoM',
    description: 'Monthly client movement across all reporting months. Studio and client filters apply; the date range is ignored.',
    icon: Calendar,
  },
  {
    key: 'yearonyear',
    label: 'Year on Year',
    shortLabel: 'YoY',
    description: 'Year comparison across all reporting months. Studio and client filters apply; the date range is ignored.',
    icon: TrendingUp,
  },
  {
    key: 'hostedclasses',
    label: 'Hosted Classes',
    shortLabel: 'Hosted',
    description: 'Signature partnership sessions, guest behavior, and conversion signals.',
    icon: Users,
  },
  {
    key: 'memberships',
    label: 'Memberships',
    shortLabel: 'Memberships',
    description: 'Membership usage, access package preference, and revenue concentration.',
    icon: BarChart3,
  },
  {
    key: 'teacherperformance',
    label: 'Teacher Performance',
    shortLabel: 'Teachers',
    description: 'Instructor-led retention, first visit conversion, and client consistency.',
    icon: UserCheck,
  },
  {
    key: 'newclientpurchases',
    label: 'New Client Purchases',
    shortLabel: 'New Purchases',
    description: 'Newcomer purchase behavior, package entry points, and follow-up priorities.',
    icon: Users,
  },
];

export const isRetentionTable = (value: string | null): value is string =>
  RETENTION_TABLE_OPTIONS.some((option) => option.key === value);

