import React from 'react';
import type { OverviewAdapterProps } from '../types';
import { buildOverviewModuleContent } from '../moduleBuilders';
import { OverviewModuleView } from '../OverviewModuleView';

const LateCancellationsOverviewAdapter: React.FC<OverviewAdapterProps> = ({ data }) => (
  <OverviewModuleView module={buildOverviewModuleContent('late-cancellations', data)} />
);

export default LateCancellationsOverviewAdapter;
