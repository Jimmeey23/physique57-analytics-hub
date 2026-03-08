import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const SalesAnalyticsOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView module={buildOverviewModuleContent('sales-analytics', data)} />
);

export default SalesAnalyticsOverviewAdapter;
