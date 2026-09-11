import React from 'react';
import { useSalesData } from '@/hooks/useSalesData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { parseDate } from '@/utils/dateUtils';
import { NewClientData, SalesData } from '@/types/dashboard';
import { P57Badge } from '@/components/ui/P57Badge';
import { conversionRate as calcConversionRate, retentionRate as calcRetentionRate } from '@/utils/retentionRates';
import { isNewClient } from '@/utils/clientRetention';
import { downloadCsvArray } from '@/utils/csvExport';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Filter,
  FileSpreadsheet,
  ListChecks,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';

type DrillDownModalType = 'month' | 'year' | 'class' | 'membership' | 'metric' | 'ranking';
type QuickFilterKey = 'all' | 'eligible' | 'converted' | 'retained' | 'excluded' | 'highValue' | 'newOnly' | 'hosted';
type ModalTabKey = 'overview' | 'clients' | 'transactions' | 'methodology';

export type DrillDownDataPayload = {
  clients?: NewClientData[];
  relatedClients?: NewClientData[];
  metricType?: string;
  month?: string | number;
  year?: number;
  rowType?: string;
  rowKey?: string;
  type?: string;
  data?: unknown;
  [key: string]: unknown;
};

interface ClientConversionDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DrillDownDataPayload | NewClientData[] | null;
  type: DrillDownModalType;
}

type ClientRecord = {
  client: NewClientData;
  transactions: SalesData[];
  transactionCount: number;
  totalMatchedRevenue: number;
  memberships: string[];
  orderedMembershipPurchases: string;
  firstPurchaseItem: string;
  firstPurchaseDate: string;
  secondVisitDate: string;
  recordedVisits: number;
  cohortIncluded: boolean;
  cohortReason: string;
  conversionIncluded: boolean;
  conversionReason: string;
  retentionIncluded: boolean;
  retentionReason: string;
};

const safeText = (value: unknown, fallback = 'Unknown') => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};

const parseLooseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseDate(value);
  if (parsed) return parsed;
  const jsDate = new Date(value);
  return Number.isNaN(jsDate.getTime()) ? null : jsDate;
};

const uniqBy = <T,>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getClientKey = (client: NewClientData) => {
  const memberId = safeText(client.memberId, '').toLowerCase();
  const email = safeText(client.email, '').toLowerCase();
  return `${memberId}__${email}__${safeText(client.firstVisitDate, '')}`;
};

const getClientKeys = (client: NewClientData) => ({
  memberId: safeText(client.memberId, '').toLowerCase(),
  email: safeText(client.email, '').toLowerCase(),
});

const getChronologicalTransactions = (transactions: SalesData[]) => (
  [...transactions].sort((a, b) => (parseLooseDate(a.paymentDate)?.getTime() || 0) - (parseLooseDate(b.paymentDate)?.getTime() || 0))
);

const getFirstPurchaseItem = (client: NewClientData, transactions: SalesData[]) => {
  const firstTransaction = getChronologicalTransactions(transactions)[0];
  const firstMembershipFromSheet = safeText(client.membershipsBoughtPostTrial, '')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);

  return safeText(
    client.firstPurchaseItem || firstTransaction?.membershipType || firstTransaction?.paymentItem || firstMembershipFromSheet,
    'Not captured'
  );
};

const getFirstPurchaseDate = (client: NewClientData, transactions: SalesData[]) => {
  const firstTransaction = getChronologicalTransactions(transactions)[0];
  return safeText(client.firstPurchase || firstTransaction?.paymentDate, 'Not captured');
};

const getSecondVisitDate = (client: NewClientData) => {
  const recordedVisits = client.noOfVisits || client.classNo || 0;
  return recordedVisits > 1 ? 'Exact date not captured in source' : 'Not available';
};

const buildMembershipList = (client: NewClientData, transactions: SalesData[]) => {
  const values = [
    client.membershipUsed,
    ...safeText(client.membershipsBoughtPostTrial, '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    ...transactions.flatMap((transaction) => [transaction.membershipType, transaction.paymentItem]),
  ]
    .map((value) => safeText(value, ''))
    .filter(Boolean);

  return uniqBy(values, (value) => value.toLowerCase()).slice(0, 10);
};

const getCohortReason = (client: NewClientData) => {
  const label = safeText(client.isNew, 'Blank');
  if (isNewClient(client)) {
    return {
      included: true,
      reason: `Included in the conversion cohort because isNew is recorded as “${label}”.`,
    };
  }

  return {
    included: false,
    reason: `Excluded from the conversion cohort because isNew is “${label}”, not a new-client value.`,
  };
};

const getConversionReason = (client: NewClientData, transactionCount: number) => {
  const isConvertedStatus = safeText(client.conversionStatus, '').trim() === 'Converted';

  if (isConvertedStatus && !isNewClient(client)) {
    return {
      included: false,
      reason: `Marked “Converted” in the source, but kept out of the conversion numerator because isNew is “${safeText(client.isNew, 'Blank')}” and this client is not in the denominator.`,
    };
  }

  if (isConvertedStatus) {
    if (client.firstPurchase) {
      return {
        included: true,
        reason: `Included as converted because the source marks this client “Converted” and the first purchase is ${client.firstPurchase}.`,
      };
    }

    return {
      included: true,
      reason: 'Included as converted because the source conversionStatus is “Converted”.',
    };
  }

  if (!isNewClient(client)) {
    return {
      included: false,
      reason: 'Excluded from conversion performance because this client is outside the new-client denominator.',
    };
  }

  if (transactionCount > 0 || client.purchaseCountPostTrial > 0 || client.firstPurchase) {
    return {
      included: false,
      reason: `Not counted as converted because conversionStatus is “${safeText(client.conversionStatus, 'Blank')}” even though post-trial purchase signals exist.`,
    };
  }

  return {
    included: false,
    reason: 'Not counted as converted because no post-trial purchase signal was matched for this client.',
  };
};

const getRetentionReason = (client: NewClientData) => {
  const isRetainedStatus = safeText(client.retentionStatus, '').trim() === 'Retained';

  if (isRetainedStatus && !isNewClient(client)) {
    return {
      included: false,
      reason: `Marked “Retained” in the source, but kept out of the retained numerator because isNew is “${safeText(client.isNew, 'Blank')}” and this client is not in the denominator.`,
    };
  }

  if (isRetainedStatus) {
    return {
      included: true,
      reason: 'Included in retained results because this client is in the new-client cohort and retentionStatus is “Retained”.',
    };
  }

  if (safeText(client.conversionStatus, '').trim() !== 'Converted') {
    return {
      included: false,
      reason: 'Excluded from retained results because the client never reached converted status.',
    };
  }

  return {
    included: false,
    reason: `Excluded from retained results because retentionStatus is “${safeText(client.retentionStatus, 'Blank')}”.`,
  };
};

const getScopeBadges = (payload: DrillDownDataPayload | null, type: DrillDownModalType) => {
  const badges: string[] = [];

  if (type === 'month' && payload?.month) badges.push(`Month: ${payload.month}`);
  if (type === 'year' && payload?.year) badges.push(`Year: ${payload.year}`);
  if (payload?.rowKey) badges.push(`Segment: ${String(payload.rowKey).replace(/_/g, ' ')}`);
  if (payload?.rowType) badges.push(`Grouping: ${String(payload.rowType).replace(/_/g, ' ')}`);
  if (payload?.metricType) badges.push(`Metric: ${String(payload.metricType).replace(/_/g, ' ')}`);
  if (payload?.type && type !== 'month') badges.push(`Type: ${payload.type}`);

  if (badges.length === 0) badges.push(`${safeText(type, 'Detail')} drill-down`);
  return badges;
};

const buildDistribution = (items: string[]) => {
  const distribution = items.reduce<Record<string, number>>((acc, item) => {
    const key = safeText(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
};

const isHostedEntity = (value?: string | null) => {
  const normalized = safeText(value, '').toLowerCase();
  return ['host', 'hosted', 'p57', 'birthday', 'rugby', 'lrs'].some((token) => normalized.includes(token));
};

const paymentTone = (status: string): 'green' | 'amber' | 'red' | 'slate' => {
  const normalized = status.toLowerCase();
  if (/paid|success|complete|approved/.test(normalized)) return 'green';
  if (/pend|partial|process/.test(normalized)) return 'amber';
  if (/fail|cancel|refund|void|decline/.test(normalized)) return 'red';
  return 'slate';
};

const toolbarButtonClass =
  'rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50';

export const ClientConversionDrillDownModalV3: React.FC<ClientConversionDrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type,
}) => {
  const { data: salesData = [] } = useSalesData();
  const [quickFilter, setQuickFilter] = React.useState<QuickFilterKey>('all');
  const [activeTab, setActiveTab] = React.useState<ModalTabKey>('clients');
  const [search, setSearch] = React.useState('');
  const [expandedClientKeys, setExpandedClientKeys] = React.useState<string[]>([]);

  const payload = data && !Array.isArray(data) ? data : null;
  const hasData = Boolean(data);

  const clients = React.useMemo<NewClientData[]>(() => {
    if (!hasData) return [];
    if (type === 'ranking' && payload?.relatedClients && Array.isArray(payload.relatedClients)) return payload.relatedClients;
    if (payload?.clients && Array.isArray(payload.clients)) return payload.clients;
    if (Array.isArray(data)) return data;
    return [];
  }, [data, hasData, payload, type]);

  const salesIndex = React.useMemo(() => {
    const byMemberId = new Map<string, SalesData[]>();
    const byEmail = new Map<string, SalesData[]>();

    salesData.forEach((transaction) => {
      const memberId = safeText(transaction.memberId, '').toLowerCase();
      const email = safeText(transaction.customerEmail, '').toLowerCase();

      if (memberId) {
        const bucket = byMemberId.get(memberId) || [];
        bucket.push(transaction);
        byMemberId.set(memberId, bucket);
      }

      if (email) {
        const bucket = byEmail.get(email) || [];
        bucket.push(transaction);
        byEmail.set(email, bucket);
      }
    });

    return { byMemberId, byEmail };
  }, [salesData]);

  const clientRecords = React.useMemo<ClientRecord[]>(() => {
    return clients.map((client) => {
      const keys = getClientKeys(client);
      const transactions = uniqBy(
        [
          ...(keys.memberId ? salesIndex.byMemberId.get(keys.memberId) || [] : []),
          ...(keys.email ? salesIndex.byEmail.get(keys.email) || [] : []),
        ],
        (transaction) => [
          safeText(transaction.paymentTransactionId, ''),
          safeText(transaction.transactionId, ''),
          safeText(transaction.saleItemId, ''),
          safeText(transaction.saleReference, ''),
          safeText(transaction.paymentDate, ''),
          safeText(transaction.paymentItem, ''),
        ].join('__')
      ).sort((a, b) => (parseLooseDate(b.paymentDate)?.getTime() || 0) - (parseLooseDate(a.paymentDate)?.getTime() || 0));

      const cohort = getCohortReason(client);
      const conversion = getConversionReason(client, transactions.length);
      const retention = getRetentionReason(client);

      return {
        client,
        transactions,
        transactionCount: transactions.length,
        totalMatchedRevenue: transactions.reduce((sum, transaction) => sum + (transaction.paymentValue || 0), 0),
        memberships: buildMembershipList(client, transactions),
        orderedMembershipPurchases: safeText(client.membershipsBoughtPostTrial, 'Not captured'),
        firstPurchaseItem: getFirstPurchaseItem(client, transactions),
        firstPurchaseDate: getFirstPurchaseDate(client, transactions),
        secondVisitDate: getSecondVisitDate(client),
        recordedVisits: client.noOfVisits || client.classNo || 0,
        cohortIncluded: cohort.included,
        cohortReason: cohort.reason,
        conversionIncluded: conversion.included,
        conversionReason: conversion.reason,
        retentionIncluded: retention.included,
        retentionReason: retention.reason,
      };
    });
  }, [clients, salesIndex]);

  const summary = React.useMemo(() => {
    const totalMembers = clientRecords.length;
    const cohortIncluded = clientRecords.filter((record) => record.cohortIncluded).length;
    const convertedMembers = clientRecords.filter((record) => record.conversionIncluded).length;
    const retainedMembers = clientRecords.filter((record) => record.retentionIncluded).length;
    const totalLTV = clientRecords.reduce((sum, record) => sum + (record.client.ltv || 0), 0);
    const matchedRevenue = clientRecords.reduce((sum, record) => sum + record.totalMatchedRevenue, 0);
    const matchedTransactions = clientRecords.reduce((sum, record) => sum + record.transactionCount, 0);
    const conversionSpans = clientRecords.map((record) => record.client.conversionSpan || 0).filter((value) => value > 0);

    return {
      totalMembers,
      cohortIncluded,
      convertedMembers,
      retainedMembers,
      totalLTV,
      matchedRevenue,
      matchedTransactions,
      avgLTV: totalMembers > 0 ? totalLTV / totalMembers : 0,
      conversionRate: calcConversionRate(convertedMembers, cohortIncluded),
      retentionRate: calcRetentionRate(retainedMembers, cohortIncluded),
      avgConversionSpan: conversionSpans.length > 0 ? conversionSpans.reduce((sum, value) => sum + value, 0) / conversionSpans.length : 0,
    };
  }, [clientRecords]);

  const displayedRecords = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return clientRecords.filter((record) => {
      const haystack = [
        `${record.client.firstName} ${record.client.lastName}`,
        record.client.email,
        record.client.memberId,
        record.client.isNew,
        record.client.membershipUsed,
        record.client.membershipsBoughtPostTrial,
        record.client.firstVisitLocation,
        record.client.homeLocation,
        record.client.trainerName,
        ...record.memberships,
      ]
        .join(' ')
        .toLowerCase();

      if (term && !haystack.includes(term)) return false;

      switch (quickFilter) {
        case 'eligible':
          return record.cohortIncluded;
        case 'converted':
          return record.conversionIncluded;
        case 'retained':
          return record.retentionIncluded;
        case 'excluded':
          return !record.cohortIncluded;
        case 'highValue':
          return (record.client.ltv || 0) >= (summary.avgLTV || 0);
        case 'newOnly':
          return isNewClient(record.client);
        case 'hosted':
          return isHostedEntity(record.client.firstVisitEntityName);
        default:
          return true;
      }
    });
  }, [clientRecords, quickFilter, search, summary.avgLTV]);

  const displayedTransactions = React.useMemo(() => {
    return displayedRecords
      .flatMap((record) =>
        record.transactions.map((transaction) => ({
          transaction,
          clientLabel: `${record.client.firstName} ${record.client.lastName}`.trim() || record.client.email || record.client.memberId,
          clientType: safeText(record.client.isNew),
        }))
      )
      .sort((a, b) => (parseLooseDate(b.transaction.paymentDate)?.getTime() || 0) - (parseLooseDate(a.transaction.paymentDate)?.getTime() || 0));
  }, [displayedRecords]);

  const transactionSummary = React.useMemo(() => {
    const gross = displayedTransactions.reduce((sum, item) => sum + (item.transaction.paymentValue || 0), 0);
    const clientsWith = new Set(displayedTransactions.map((item) => item.clientLabel)).size;
    const statusMix = buildDistribution(displayedTransactions.map((item) => safeText(item.transaction.paymentStatus, 'Unknown')));
    const methodMix = buildDistribution(displayedTransactions.map((item) => safeText(item.transaction.paymentMethod, 'Unknown')));
    const dates = displayedTransactions
      .map((item) => parseLooseDate(item.transaction.paymentDate)?.getTime())
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

    return {
      count: displayedTransactions.length,
      gross,
      avg: displayedTransactions.length > 0 ? gross / displayedTransactions.length : 0,
      clientsWith,
      statusMix,
      methodMix,
      firstDate: dates.length > 0 ? new Date(Math.min(...dates)).toLocaleDateString('en-IN') : '—',
      lastDate: dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString('en-IN') : '—',
    };
  }, [displayedTransactions]);

  const scopeBadges = React.useMemo(() => getScopeBadges(payload, type), [payload, type]);
  const topMemberships = React.useMemo(() => buildDistribution(displayedRecords.flatMap((record) => record.memberships)), [displayedRecords]);
  const topLocations = React.useMemo(() => buildDistribution(displayedRecords.map((record) => record.client.firstVisitLocation || record.client.homeLocation || 'Unknown')), [displayedRecords]);
  const topTrainers = React.useMemo(() => buildDistribution(displayedRecords.map((record) => record.client.trainerName || 'Unknown')), [displayedRecords]);
  const topEntities = React.useMemo(() => buildDistribution(displayedRecords.map((record) => record.client.firstVisitEntityName || 'Unknown')), [displayedRecords]);
  const conversionStatusMix = React.useMemo(() => buildDistribution(displayedRecords.map((record) => safeText(record.client.conversionStatus, 'Blank'))), [displayedRecords]);
  const retentionStatusMix = React.useMemo(() => buildDistribution(displayedRecords.map((record) => safeText(record.client.retentionStatus, 'Blank'))), [displayedRecords]);

  const filteredSummary = React.useMemo(() => {
    const totalMembers = displayedRecords.length;
    const cohortIncluded = displayedRecords.filter((record) => record.cohortIncluded).length;
    const convertedMembers = displayedRecords.filter((record) => record.conversionIncluded).length;
    const retainedMembers = displayedRecords.filter((record) => record.retentionIncluded).length;
    const totalLTV = displayedRecords.reduce((sum, record) => sum + (record.client.ltv || 0), 0);
    const matchedTransactions = displayedRecords.reduce((sum, record) => sum + record.transactionCount, 0);
    const matchedRevenue = displayedRecords.reduce((sum, record) => sum + record.totalMatchedRevenue, 0);
    const withTransactions = displayedRecords.filter((record) => record.transactionCount > 0).length;
    const spans = displayedRecords.map((record) => record.client.conversionSpan || 0).filter((value) => value > 0).sort((a, b) => a - b);
    const visits = displayedRecords.map((record) => record.recordedVisits || 0);

    return {
      totalMembers,
      cohortIncluded,
      convertedMembers,
      retainedMembers,
      totalLTV,
      matchedTransactions,
      matchedRevenue,
      withTransactions,
      avgLTV: totalMembers > 0 ? totalLTV / totalMembers : 0,
      conversionRate: calcConversionRate(convertedMembers, cohortIncluded),
      retentionRate: calcRetentionRate(retainedMembers, cohortIncluded),
      convertedNotRetained: displayedRecords.filter((record) => record.conversionIncluded && !record.retentionIncluded).length,
      retainedNotConverted: displayedRecords.filter((record) => record.retentionIncluded && !record.conversionIncluded).length,
      avgSpan: spans.length > 0 ? spans.reduce((sum, value) => sum + value, 0) / spans.length : 0,
      medianSpan: spans.length > 0 ? spans[Math.floor(spans.length / 2)] : 0,
      avgVisits: visits.length > 0 ? visits.reduce((sum, value) => sum + value, 0) / visits.length : 0,
      singleVisit: displayedRecords.filter((record) => (record.recordedVisits || 0) <= 1).length,
    };
  }, [displayedRecords]);

  const suggestions = React.useMemo(() => {
    const notes: string[] = [];
    const excludedCount = clientRecords.filter((record) => !record.cohortIncluded).length;
    const missingTransactionMatches = clientRecords.filter((record) => record.conversionIncluded && record.transactionCount === 0).length;
    const blankMemberships = clientRecords.filter((record) => record.memberships.length === 0).length;

    if (excludedCount > 0) {
      notes.push(`${formatNumber(excludedCount)} client(s) are outside the conversion denominator because the isNew label is not clearly marked as a new-client value.`);
    }
    if (missingTransactionMatches > 0) {
      notes.push(`${formatNumber(missingTransactionMatches)} converted client(s) do not have matched transaction evidence in the sales dataset, so the join between retention and sales could be tightened.`);
    }
    if (blankMemberships > 0) {
      notes.push(`${formatNumber(blankMemberships)} client(s) have no clear membership trail, which makes product-level interpretation weaker than it should be.`);
    }
    if (notes.length === 0) {
      notes.push('This slice is relatively clean. The next best improvement would be storing a dedicated source conversion reason so the modal can explain outcomes without inference.');
    }

    return notes;
  }, [clientRecords]);

  const toggleExpandedClient = (key: string) => {
    setExpandedClientKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('clients');
      setExpandedClientKeys([]);
    }
  }, [isOpen]);

  const copyEmails = React.useCallback(() => {
    const emails = uniqBy(
      displayedRecords.map((record) => safeText(record.client.email, '')).filter(Boolean),
      (email) => email.toLowerCase()
    );
    if (emails.length === 0) return;
    navigator.clipboard.writeText(emails.join(', '));
  }, [displayedRecords]);

  const exportClients = React.useCallback(() => {
    downloadCsvArray(`${title.replace(/\s+/g, '-').toLowerCase()}-clients.csv`,
      [
        'Client Name',
        'Email',
        'Member ID',
        'First Visit Date',
        'Membership Used',
        'Payment Method',
        'Entity Name',
        'First Purchase Made',
        'No. of Purchases',
        'First Purchase Date',
        'Total LTV',
        'Memberships Purchased',
        'Conversion Span',
        'Conversion Status',
        'No. of Visits',
        'Retention Status',
        'Visits Post Trial',
        'Second Visit Date',
        'Visit Location',
        'Home Location',
        'Trainer',
        'Matched Transactions',
        'Matched Revenue',
        'Cohort Status',
        'Cohort Reason',
        'Conversion Reason',
        'Retention Reason',
      ],
      displayedRecords.map((record) => [
        `${record.client.firstName} ${record.client.lastName}`.trim(),
        record.client.email || '',
        record.client.memberId || '',
        record.client.firstVisitDate || '',
        record.client.membershipUsed || '',
        record.client.paymentMethod || '',
        record.client.firstVisitEntityName || '',
        record.firstPurchaseItem,
        record.client.purchaseCountPostTrial || 0,
        record.firstPurchaseDate,
        record.client.ltv || 0,
        record.orderedMembershipPurchases,
        record.client.conversionSpan || 0,
        record.client.conversionStatus || '',
        record.recordedVisits,
        record.client.retentionStatus || '',
        record.client.visitsPostTrial || 0,
        record.secondVisitDate,
        record.client.firstVisitLocation || '',
        record.client.homeLocation || '',
        record.client.trainerName || '',
        record.transactionCount,
        record.totalMatchedRevenue,
        record.cohortIncluded ? 'Included' : 'Excluded',
        record.cohortReason,
        record.conversionReason,
        record.retentionReason,
      ])
    );
  }, [displayedRecords, title]);

  const exportTransactions = React.useCallback(() => {
    downloadCsvArray(`${title.replace(/\s+/g, '-').toLowerCase()}-transactions.csv`,
      [
        'Client',
        'Client Type',
        'Payment Date',
        'Item',
        'Membership',
        'Payment Method',
        'Location',
        'Sold By',
        'Payment Status',
        'Transaction Value',
      ],
      displayedTransactions.map(({ transaction, clientLabel, clientType }) => [
        clientLabel,
        clientType,
        transaction.paymentDate || '',
        transaction.paymentItem || '',
        transaction.membershipType || '',
        transaction.paymentMethod || '',
        transaction.calculatedLocation || '',
        transaction.soldBy || '',
        transaction.paymentStatus || '',
        transaction.paymentValue || 0,
      ])
    );
  }, [displayedTransactions, title]);

  const exportSummary = React.useCallback(() => {
    downloadCsvArray(`${title.replace(/\s+/g, '-').toLowerCase()}-summary.csv`,
      ['Metric', 'Value'],
      [
        ['Clients in slice', summary.totalMembers],
        ['Clients displayed', displayedRecords.length],
        ['Conversion cohort', summary.cohortIncluded],
        ['Converted', summary.convertedMembers],
        ['Retained', summary.retainedMembers],
        ['Conversion rate', `${summary.conversionRate.toFixed(1)}%`],
        ['Retention rate', `${summary.retentionRate.toFixed(1)}%`],
        ['Average LTV', formatCurrency(summary.avgLTV)],
        ['Total LTV', formatCurrency(summary.totalLTV)],
        ['Matched transactions', summary.matchedTransactions],
        ['Matched revenue', formatCurrency(summary.matchedRevenue)],
      ]
    );
  }, [displayedRecords.length, summary, title]);

  const exportCurrentTab = React.useCallback(() => {
    if (activeTab === 'clients') {
      exportClients();
      return;
    }
    if (activeTab === 'transactions') {
      exportTransactions();
      return;
    }
    exportSummary();
  }, [activeTab, exportClients, exportSummary, exportTransactions]);

  if (!hasData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[96vh] max-h-[96vh] w-[98vw] max-w-[98vw] sm:max-w-[98vw] xl:w-[96vw] xl:max-w-[1800px] xl:sm:max-w-[1800px] overflow-hidden border-0 bg-transparent p-0 shadow-none">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/60">
          <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 text-slate-900 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm">
                    <BarChart3 className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Retention drill-down
                    </div>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl lg:text-[26px]">{title}</DialogTitle>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      A cleaner, more structured drill-down with direct client fields, clear supporting logic, and export-ready transaction evidence.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scopeBadges.map((badge) => (
                    <span key={badge} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">{badge}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50" onClick={exportCurrentTab}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export current view
                </Button>
                <Button size="sm" className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50" onClick={copyEmails}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy emails
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
            <div className="mb-5 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Clients in slice', value: formatNumber(summary.totalMembers), helper: `${formatNumber(displayedRecords.length)} shown`, icon: Users },
                { label: 'Conversion cohort', value: formatNumber(summary.cohortIncluded), helper: `${formatNumber(summary.totalMembers - summary.cohortIncluded)} excluded`, icon: Target },
                { label: 'Converted', value: formatNumber(summary.convertedMembers), helper: `${summary.conversionRate.toFixed(1)}% of eligible`, icon: TrendingUp },
                { label: 'Retained', value: formatNumber(summary.retainedMembers), helper: `${summary.retentionRate.toFixed(1)}% of eligible`, icon: ListChecks },
                { label: 'Matched transactions', value: formatNumber(summary.matchedTransactions), helper: formatCurrency(summary.matchedRevenue), icon: ShoppingBag },
                { label: 'Average LTV', value: formatCurrency(summary.avgLTV), helper: summary.avgConversionSpan > 0 ? `${summary.avgConversionSpan.toFixed(1)} avg conv days` : 'No conversion span data', icon: CreditCard },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-3 sm:px-4">
                    <div className="flex min-h-[30px] items-start gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 break-words leading-snug">{card.label}</span>
                    </div>
                    <div className="mt-1.5 truncate text-xl font-semibold leading-none tracking-tight text-slate-950 sm:text-2xl" title={String(card.value)}>{card.value}</div>
                    <div className="mt-1.5 truncate text-xs text-slate-500" title={String(card.helper)}>{card.helper}</div>
                  </div>
                );
              })}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ModalTabKey)} className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:grid-cols-4">
                {[
                  ['overview', 'Overview'],
                  ['clients', 'Client table'],
                  ['transactions', 'Transactions'],
                  ['methodology', 'Methodology'],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-10 rounded-xl text-xs sm:text-sm data-[state=active]:bg-slate-950 data-[state=active]:bg-none data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-none dark:data-[state=active]:text-slate-950"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Sparkles className="h-5 w-5 text-slate-700" />
                        Better organised segment summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <ShoppingBag className="h-4 w-4 text-slate-700" />
                          Membership mix
                        </div>
                        <div className="space-y-2">
                          {topMemberships.length > 0 ? topMemberships.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700">{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          )) : <p className="text-sm text-slate-500">No membership data available.</p>}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <MapPin className="h-4 w-4 text-slate-700" />
                          Top locations
                        </div>
                        <div className="space-y-2">
                          {topLocations.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700">{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <UserRound className="h-4 w-4 text-slate-700" />
                          Trainer touchpoints
                        </div>
                        <div className="space-y-2">
                          {topTrainers.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700">{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Calendar className="h-4 w-4 text-slate-700" />
                          First-visit entity
                        </div>
                        <div className="space-y-2">
                          {topEntities.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700" title={label}>{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Target className="h-4 w-4 text-slate-700" />
                          Conversion status mix
                        </div>
                        <div className="space-y-2">
                          {conversionStatusMix.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700" title={label}>{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <ListChecks className="h-4 w-4 text-slate-700" />
                          Retention status mix
                        </div>
                        <div className="space-y-2">
                          {retentionStatusMix.map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-slate-700" title={label}>{label}</span>
                              <span className="text-xs font-medium text-slate-500">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Filter className="h-5 w-5 text-slate-700" />
                        Inclusion logic at a glance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        New-client eligibility is driven by <code className="rounded bg-white px-1 py-0.5 text-xs">isNew</code>. Converted and retained counts follow the explicit source statuses, and each client row shows the reason for being included or excluded. Every figure on this tab reflects the {quickFilter === 'all' && !search.trim() ? 'full drill-down slice' : 'currently filtered client set'}.
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Clients in scope', value: filteredSummary.totalMembers, base: filteredSummary.totalMembers, tone: 'bg-slate-900' },
                          { label: 'Eligible cohort (isNew)', value: filteredSummary.cohortIncluded, base: filteredSummary.totalMembers, tone: 'bg-sky-600' },
                          { label: 'Converted', value: filteredSummary.convertedMembers, base: filteredSummary.cohortIncluded, tone: 'bg-emerald-600' },
                          { label: 'Retained', value: filteredSummary.retainedMembers, base: filteredSummary.cohortIncluded, tone: 'bg-indigo-600' },
                        ].map((step) => {
                          const pct = step.base > 0 ? (step.value / step.base) * 100 : 0;
                          return (
                            <div key={step.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="min-w-0 truncate text-slate-700">{step.label}</span>
                                <span className="shrink-0 font-semibold text-slate-900">{formatNumber(step.value)} <span className="text-xs font-medium text-slate-500">({pct.toFixed(1)}%)</span></span>
                              </div>
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${step.tone}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <div className="text-xl font-semibold text-amber-700">{formatNumber(filteredSummary.totalMembers - filteredSummary.cohortIncluded)}</div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-700">Excluded from denominator</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xl font-semibold text-slate-900">{formatNumber(filteredSummary.matchedTransactions)}</div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Matched transactions · {formatCurrency(filteredSummary.matchedRevenue)}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xl font-semibold text-slate-900">{filteredSummary.avgSpan > 0 ? `${filteredSummary.avgSpan.toFixed(1)}d` : '—'}</div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Avg conversion span · median {filteredSummary.medianSpan > 0 ? `${filteredSummary.medianSpan}d` : '—'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xl font-semibold text-slate-900">{filteredSummary.avgVisits.toFixed(1)}</div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Avg visits · {formatNumber(filteredSummary.singleVisit)} single-visit</div>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{formatNumber(filteredSummary.convertedNotRetained)}</span> converted but not retained
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{formatNumber(filteredSummary.retainedNotConverted)}</span> retained without converted status
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{formatNumber(filteredSummary.withTransactions)}</span> clients with matched sales evidence
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{formatCurrency(filteredSummary.totalLTV)}</span> total LTV · {formatCurrency(filteredSummary.avgLTV)} avg
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="text-lg text-slate-900">Suggestions to improve data clarity</CardTitle>
                      <Button size="sm" variant="outline" className={toolbarButtonClass} onClick={exportSummary}>
                        <Download className="mr-2 h-4 w-4" />
                        Export summary
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {suggestion}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="mt-6 space-y-5">
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-2">
                        <CardTitle className="text-lg text-slate-900">Client details in tabular form</CardTitle>
                          <p className="text-sm text-slate-500">Key client, purchase, visit, and retention fields are surfaced directly in columns. Expand a row for reasoning support and transaction evidence.</p>
                        </div>
                        <div className="text-sm text-slate-500 xl:text-right">
                          Showing <span className="font-semibold text-slate-900">{formatNumber(displayedRecords.length)}</span> clients • <span className="font-semibold text-slate-900">{formatNumber(displayedTransactions.length)}</span> matched transactions • {quickFilter === 'all' ? 'All visible clients' : quickFilter}
                        </div>
                      </div>
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px_auto]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {([
                              ['all', 'All'],
                              ['newOnly', 'New'],
                              ['hosted', 'Hosted'],
                              ['eligible', 'Eligible'],
                              ['converted', 'Converted'],
                              ['retained', 'Retained'],
                              ['excluded', 'Excluded'],
                              ['highValue', 'High Value'],
                            ] as Array<[QuickFilterKey, string]>).map(([value, label]) => (
                              <Button
                                key={value}
                                size="sm"
                                variant={quickFilter === value ? 'default' : 'outline'}
                                onClick={() => setQuickFilter(value)}
                                className={quickFilter === value ? 'rounded-xl border border-slate-900 bg-slate-950 text-white hover:bg-slate-900' : toolbarButtonClass}
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="relative min-w-0">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search client, membership, trainer, location"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        </div>
                        </div>
                        <div className="flex items-end justify-start xl:justify-end">
                        <Button size="sm" variant="outline" className={toolbarButtonClass} onClick={exportClients}>
                          <Download className="mr-2 h-4 w-4" />
                          Export clients
                        </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                    <div className="max-h-[58vh] overflow-auto min-[900px]:max-h-[62vh]">
                      <Table>
                        <TableHeader className="sticky top-0 z-20 bg-[#f6f7f9]">
                          <TableRow>
                            <TableHead className="w-[60px] text-center bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">View</TableHead>
                            <TableHead className="min-w-[220px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Client name</TableHead>
                            <TableHead className="min-w-[220px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Email</TableHead>
                            <TableHead className="min-w-[130px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">First visit</TableHead>
                            <TableHead className="min-w-[160px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Membership used</TableHead>
                            <TableHead className="min-w-[140px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Payment method</TableHead>
                            <TableHead className="min-w-[180px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Entity name</TableHead>
                            <TableHead className="min-w-[180px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">First purchase made</TableHead>
                            <TableHead className="text-center bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Purchases</TableHead>
                            <TableHead className="min-w-[130px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">First purchase date</TableHead>
                            <TableHead className="text-right bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Total LTV</TableHead>
                            <TableHead className="min-w-[220px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Memberships purchased</TableHead>
                            <TableHead className="text-center bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Conv span</TableHead>
                            <TableHead className="min-w-[130px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Conversion status</TableHead>
                            <TableHead className="text-center bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">No. of visits</TableHead>
                            <TableHead className="min-w-[130px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Retention status</TableHead>
                            <TableHead className="text-center bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Visits post trial</TableHead>
                            <TableHead className="min-w-[170px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Second visit date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedRecords.map((record) => {
                            const client = record.client;
                            const clientKey = getClientKey(client);
                            const expanded = expandedClientKeys.includes(clientKey);
                            return (
                              <React.Fragment key={clientKey}>
                                <TableRow className="border-b border-slate-100 bg-white align-top odd:bg-white even:bg-slate-50/45 hover:bg-slate-50">
                                  <TableCell className="text-center align-top">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900"
                                      onClick={() => toggleExpandedClient(clientKey)}
                                    >
                                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-2">
                                      <div className="font-semibold text-slate-900">{client.firstName} {client.lastName}</div>
                                      <div className="space-y-0.5 text-xs text-slate-500">
                                        <div>ID {safeText(client.memberId, 'n/a')}</div>
                                        <div>{record.cohortIncluded ? 'Eligible for cohort' : 'Excluded from cohort'}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm text-slate-700">{safeText(client.email, 'No email')}</div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1 text-sm text-slate-700">
                                      <div>{safeText(client.firstVisitDate, 'Unknown')}</div>
                                      <div className="text-xs text-slate-500">{safeText(client.firstVisitLocation, 'No visit location')}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top text-sm text-slate-700">{safeText(client.membershipUsed, 'Not captured')}</TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm text-slate-700">{safeText(client.paymentMethod, 'Not captured')}</div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="space-y-1 text-sm text-slate-700">
                                      <div>{safeText(client.firstVisitEntityName, 'Unknown')}</div>
                                      {isHostedEntity(client.firstVisitEntityName) && (
                                        <div className="text-xs text-slate-500">Hosted source</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <div className="text-sm text-slate-700">{record.firstPurchaseItem}</div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{formatNumber(client.purchaseCountPostTrial || 0)}</TableCell>
                                  <TableCell className="align-top"><div className="text-sm text-slate-700">{record.firstPurchaseDate}</div></TableCell>
                                  <TableCell className="align-top text-right font-semibold text-slate-900">{formatCurrency(client.ltv || 0)}</TableCell>
                                  <TableCell className="align-top">
                                    <div className="max-w-[220px] whitespace-normal text-sm leading-5 text-slate-700">{record.orderedMembershipPurchases}</div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{client.conversionSpan > 0 ? `${client.conversionSpan} days` : 'N/A'}</TableCell>
                                  <TableCell className="align-top">
                                    <P57Badge tone={record.conversionIncluded ? 'green' : 'slate'}>
                                      {safeText(client.conversionStatus, record.conversionIncluded ? 'Converted' : 'Not converted')}
                                    </P57Badge>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {record.conversionIncluded ? 'Included in conversion results' : 'Not counted in conversion results'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{formatNumber(record.recordedVisits)}</TableCell>
                                  <TableCell className="align-top">
                                    <P57Badge tone={record.retentionIncluded ? 'green' : 'slate'}>
                                      {safeText(client.retentionStatus, record.retentionIncluded ? 'Retained' : 'Not retained')}
                                    </P57Badge>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {record.retentionIncluded ? 'Included in retention results' : 'Not counted in retention results'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top text-center font-medium text-slate-800">{formatNumber(client.visitsPostTrial || 0)}</TableCell>
                                  <TableCell className="align-top"><div className="max-w-[170px] whitespace-normal text-sm leading-5 text-slate-700">{record.secondVisitDate}</div></TableCell>
                                </TableRow>
                                {expanded && (
                                  <TableRow className="bg-slate-100/70 hover:bg-slate-100/70">
                                    <TableCell colSpan={18} className="px-5 py-4">
                                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                        <div className="grid gap-0 xl:grid-cols-[1.15fr_1fr_1.15fr]">
                                        <div className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
                                          <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client context</div>
                                            <div className="text-xs text-slate-500">{formatNumber(record.transactionCount)} matched txn</div>
                                          </div>
                                          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                            <div>First visit <span className="font-medium text-slate-900">{safeText(client.firstVisitDate, 'Unknown')}</span></div>
                                            <div>First purchase date <span className="font-medium text-slate-900">{record.firstPurchaseDate}</span></div>
                                            <div>First purchase made <span className="font-medium text-slate-900">{record.firstPurchaseItem}</span></div>
                                            <div>Membership used <span className="font-medium text-slate-900">{safeText(client.membershipUsed, 'Not captured')}</span></div>
                                            <div>Visit location <span className="font-medium text-slate-900">{safeText(client.firstVisitLocation)}</span></div>
                                            <div>Home location <span className="font-medium text-slate-900">{safeText(client.homeLocation)}</span></div>
                                            <div>Trial entity <span className="font-medium text-slate-900">{safeText(client.firstVisitEntityName)}</span></div>
                                            <div>Trainer <span className="font-medium text-slate-900">{safeText(client.trainerName)}</span></div>
                                            <div>Payment method <span className="font-medium text-slate-900">{safeText(client.paymentMethod)}</span></div>
                                            <div>Recorded visits <span className="font-medium text-slate-900">{formatNumber(record.recordedVisits)}</span></div>
                                            <div>Visits post trial <span className="font-medium text-slate-900">{formatNumber(client.visitsPostTrial || 0)}</span></div>
                                            <div>Purchases post trial <span className="font-medium text-slate-900">{formatNumber(client.purchaseCountPostTrial || 0)}</span></div>
                                            <div>Memberships purchased <span className="font-medium text-slate-900">{record.orderedMembershipPurchases}</span></div>
                                            <div>Conversion span <span className="font-medium text-slate-900">{client.conversionSpan > 0 ? `${client.conversionSpan} days` : 'N/A'}</span></div>
                                            <div>Second visit date <span className="font-medium text-slate-900">{record.secondVisitDate}</span></div>
                                          </div>
                                        </div>

                                        <div className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
                                          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason support</div>
                                          <div className="space-y-3 text-sm text-slate-700">
                                            <div>
                                              <div className="font-medium text-slate-900">Cohort</div>
                                              <div className="mt-1 text-slate-600">{record.cohortReason}</div>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3">
                                              <div className="font-medium text-slate-900">Conversion</div>
                                              <div className="mt-1 text-slate-600">{record.conversionReason}</div>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3">
                                              <div className="font-medium text-slate-900">Retention</div>
                                              <div className="mt-1 text-slate-600">{record.retentionReason}</div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="p-4">
                                          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Transaction evidence</div>
                                          {record.transactions.length > 0 ? (
                                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                              <Table>
                                                <TableHeader className="sticky top-0 z-20 bg-[#f6f7f9]">
                                                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Date</TableHead>
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Item</TableHead>
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Method</TableHead>
                                                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Location</TableHead>
                                                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600">Value</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {record.transactions.slice(0, 4).map((transaction) => (
                                                    <TableRow key={[transaction.paymentTransactionId, transaction.saleItemId, transaction.paymentDate].join('__')}>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.paymentDate, 'Unknown')}</TableCell>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.membershipType || transaction.paymentItem)}</TableCell>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.paymentMethod)}</TableCell>
                                                      <TableCell className="text-xs text-slate-700">{safeText(transaction.calculatedLocation)}</TableCell>
                                                      <TableCell className="text-right text-xs font-semibold text-slate-900">{formatCurrency(transaction.paymentValue || 0)}</TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                              {record.transactions.length > 4 && (
                                                <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                  Showing the first 4 matched transactions here. Use the Transactions tab for the full evidence list.
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                              No matched sales transactions were found for this client. The sheet-level retention record is still shown, but the evidence trail is incomplete.
                                            </div>
                                          )}
                                        </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {displayedRecords.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={18} className="py-12 text-center text-sm text-slate-500">
                                No clients match the current filter. Try another filter or search term.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg text-slate-900">Matched transaction evidence</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">
                          Sales rows joined to the {formatNumber(displayedRecords.length)} client(s) currently shown, matched on member ID or email. Range {transactionSummary.firstDate} → {transactionSummary.lastDate}.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className={toolbarButtonClass} onClick={exportTransactions}>
                        <Download className="mr-2 h-4 w-4" />
                        Export transactions
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 sm:grid-cols-3 lg:grid-cols-5">
                      {[
                        { label: 'Transactions', value: formatNumber(transactionSummary.count) },
                        { label: 'Gross value', value: formatCurrency(transactionSummary.gross) },
                        { label: 'Average value', value: formatCurrency(transactionSummary.avg) },
                        { label: 'Clients with evidence', value: `${formatNumber(transactionSummary.clientsWith)} / ${formatNumber(displayedRecords.length)}` },
                        { label: 'Top method', value: transactionSummary.methodMix[0] ? `${transactionSummary.methodMix[0][0]} (${formatNumber(transactionSummary.methodMix[0][1])})` : '—' },
                      ].map((tile) => (
                        <div key={tile.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{tile.label}</div>
                          <div className="mt-1 truncate text-base font-semibold text-slate-900" title={String(tile.value)}>{tile.value}</div>
                        </div>
                      ))}
                    </div>
                    {transactionSummary.statusMix.length > 0 && (
                      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">
                        {transactionSummary.statusMix.map(([label, count]) => (
                          <P57Badge key={label} tone={paymentTone(label)}>{label} · {formatNumber(count)}</P57Badge>
                        ))}
                      </div>
                    )}
                    <div className="max-h-[58vh] overflow-auto min-[900px]:max-h-[62vh]">
                      <Table>
                        <TableHeader className="sticky top-0 z-20 bg-[#f6f7f9]">
                          <TableRow>
                            <TableHead className="min-w-[200px] bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Client</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Type</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Payment date</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Item</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Membership</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Method</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Location</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Sold by</TableHead>
                            <TableHead className="bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Status</TableHead>
                            <TableHead className="text-right bg-[#f6f7f9] text-xs font-semibold uppercase tracking-wide text-slate-700">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedTransactions.length > 0 ? displayedTransactions.map(({ transaction, clientLabel, clientType }) => (
                            <TableRow key={[clientLabel, transaction.paymentTransactionId, transaction.saleItemId, transaction.paymentDate].join('__')} className="border-b border-slate-100 hover:bg-slate-50">
                              <TableCell className="text-sm font-medium text-slate-900">{clientLabel}</TableCell>
                              <TableCell className="text-sm text-slate-700">{clientType}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentDate, 'Unknown')}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentItem)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.membershipType)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.paymentMethod)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.calculatedLocation)}</TableCell>
                              <TableCell className="text-sm text-slate-700">{safeText(transaction.soldBy)}</TableCell>
                              <TableCell><P57Badge tone={paymentTone(safeText(transaction.paymentStatus, ''))}>{safeText(transaction.paymentStatus)}</P57Badge></TableCell>
                              <TableCell className="text-right text-sm font-semibold text-slate-900">{formatCurrency(transaction.paymentValue || 0)}</TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                                No matched transactions are available for the currently filtered clients.
                              </TableCell>
                            </TableRow>
                          )}
                          {displayedTransactions.length > 0 && (
                            <TableRow className="sticky bottom-0 z-10 border-t border-slate-200 bg-slate-900 hover:bg-slate-900">
                              <TableCell className="text-sm font-semibold text-white">Total</TableCell>
                              <TableCell colSpan={8} className="text-sm text-slate-300">{formatNumber(transactionSummary.count)} transactions · {formatNumber(transactionSummary.clientsWith)} clients</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-white">{formatCurrency(transactionSummary.gross)}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="methodology" className="mt-6 space-y-4 lg:space-y-6">
                <div className="grid gap-4 lg:gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg text-slate-900">How this drill-down decides inclusion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 text-sm text-slate-700 sm:p-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="font-semibold text-slate-900">Conversion denominator</div>
                          <div className="text-xs font-semibold text-slate-500">{formatNumber(filteredSummary.cohortIncluded)} of {formatNumber(filteredSummary.totalMembers)} shown</div>
                        </div>
                        <p className="mt-1">A client is included only when <code className="rounded bg-white px-1 py-0.5 text-xs">isNew</code> marks them as a new client. Everyone else stays visible with an explicit exclusion reason and never enters a numerator.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="font-semibold text-slate-900">Conversion numerator</div>
                          <div className="text-xs font-semibold text-slate-500">{formatNumber(filteredSummary.convertedMembers)} → {filteredSummary.conversionRate.toFixed(1)}%</div>
                        </div>
                        <p className="mt-1">Counted as converted when the client is in the cohort <em>and</em> <code className="rounded bg-white px-1 py-0.5 text-xs">conversionStatus</code> is exactly “Converted”. Transaction matches are supporting evidence, not a replacement for the source flag.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="font-semibold text-slate-900">Retention numerator</div>
                          <div className="text-xs font-semibold text-slate-500">{formatNumber(filteredSummary.retainedMembers)} → {filteredSummary.retentionRate.toFixed(1)}%</div>
                        </div>
                        <p className="mt-1">Counted as retained when the client is in the cohort and <code className="rounded bg-white px-1 py-0.5 text-xs">retentionStatus</code> is exactly “Retained”. A converted status is not required, so {formatNumber(filteredSummary.retainedNotConverted)} retained client(s) here never reached “Converted”.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">Transaction matching</div>
                        <p className="mt-1">Sales rows join to clients on lowercase member ID first, then customer email, and duplicates are removed by transaction ID, sale item, date and item. {formatNumber(filteredSummary.withTransactions)} of {formatNumber(filteredSummary.totalMembers)} shown client(s) have at least one matched row ({formatNumber(filteredSummary.matchedTransactions)} rows, {formatCurrency(filteredSummary.matchedRevenue)}).</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">Scope of this drill-down</div>
                        <p className="mt-1">{scopeBadges.join(' · ')}. Filters and search on the Client table tab re-scope the Overview, Transactions and Methodology figures; the header tiles always describe the full slice of {formatNumber(summary.totalMembers)} client(s).</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg text-slate-900">Recommended data improvements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 text-sm text-slate-700 sm:p-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">1. Normalize isNew values</div>
                        <p className="mt-1">Use one controlled set of labels for new-client status so exclusions are clearly intentional.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">2. Add an explicit source conversion reason</div>
                        <p className="mt-1">A dedicated field such as “converted via membership / package / unknown” would make this drill-down more precise.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="font-semibold text-slate-900">3. Keep a stable member key across datasets</div>
                        <p className="mt-1">Consistent IDs between retention and sales would improve transaction evidence matching and reduce unexplained gaps.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 font-semibold text-slate-900">What this slice looks like today</div>
                        <ul className="list-disc space-y-1 pl-5 text-slate-600">
                          {suggestions.map((suggestion) => (
                            <li key={suggestion}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientConversionDrillDownModalV3;
