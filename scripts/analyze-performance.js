#!/usr/bin/env node

/**
 * Performance Migration Helper Script
 * 
 * This script helps automate parts of the performance optimization migration
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../src/components/dashboard');

// Components that should be memoized
const HIGH_PRIORITY_COMPONENTS = [
  'MonthOnMonthTableNew.tsx',
  'EnhancedYearOnYearTableNew.tsx',
  'ProductPerformanceTableNew.tsx',
  'CategoryPerformanceTableNew.tsx',
  'SoldByMonthOnMonthTableNew.tsx',
  'PaymentMethodMonthOnMonthTableNew.tsx',
  'SalesAnalyticsSection.tsx',
  'SalesMetricCardsGrid.tsx',
  'SalesInteractiveCharts.tsx',
  'SalesAnimatedMetricCards.tsx',
  'ModernTableWrapper.tsx',
  'DataTable.tsx',
  'MetricCard.tsx',
  'InteractiveChart.tsx',
];

function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const analysis = {
    path: filePath,
    name: path.basename(filePath),
    hasReactMemo: content.includes('React.memo'),
    hasUseMemo: content.includes('useMemo'),
    hasUseCallback: content.includes('useCallback'),
    useState: (content.match(/useState/g) || []).length,
    useEffect: (content.match(/useEffect/g) || []).length,
    expensiveOperations: detectExpensiveOperations(content),
  };
  
  return analysis;
}

function detectExpensiveOperations(content) {
  const operations = [];
  
  // Detect filtering operations
  if (content.includes('.filter(')) {
    operations.push('array filtering');
  }
  
  // Detect mapping operations
  if (content.includes('.map(')) {
    operations.push('array mapping');
  }
  
  // Detect reduce operations
  if (content.includes('.reduce(')) {
    operations.push('array reduce');
  }
  
  // Detect sorting operations
  if (content.includes('.sort(')) {
    operations.push('array sorting');
  }
  
  // Detect date parsing
  if (content.includes('new Date') || content.includes('parseDate')) {
    operations.push('date parsing');
  }
  
  return operations;
}

function scanDirectory(dir) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results.push(...scanDirectory(filePath));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(analyzeComponent(filePath));
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
  }
  
  return results;
}

function generateReport() {
  console.log('🔍 Analyzing dashboard components...\n');
  
  const analyses = scanDirectory(DASHBOARD_DIR);
  
  const needsMemo = analyses.filter(a => !a.hasReactMemo && HIGH_PRIORITY_COMPONENTS.includes(a.name));
  const needsUseMemo = analyses.filter(a => !a.hasUseMemo && a.expensiveOperations.length > 0);
  const needsUseCallback = analyses.filter(a => !a.hasUseCallback && (a.useState > 0 || a.useEffect > 0));
  
  console.log('📊 Performance Optimization Report\n');
  console.log('='.repeat(60));
  console.log(`Total components analyzed: ${analyses.length}`);
  console.log(`Components needing React.memo: ${needsMemo.length}`);
  console.log(`Components needing useMemo: ${needsUseMemo.length}`);
  console.log(`Components needing useCallback: ${needsUseCallback.length}`);
  console.log('='.repeat(60));
  
  if (needsMemo.length > 0) {
    console.log('\n🎯 HIGH PRIORITY - Add React.memo:\n');
    needsMemo.forEach(a => {
      console.log(`  ❌ ${a.name}`);
      console.log(`     Path: ${a.path}`);
      console.log(`     State hooks: ${a.useState}, Effect hooks: ${a.useEffect}`);
    });
  }
  
  if (needsUseMemo.length > 0) {
    console.log('\n⚡ MEDIUM PRIORITY - Add useMemo:\n');
    needsUseMemo.slice(0, 10).forEach(a => {
      console.log(`  ⚠️  ${a.name}`);
      console.log(`     Expensive operations: ${a.expensiveOperations.join(', ')}`);
    });
    if (needsUseMemo.length > 10) {
      console.log(`  ... and ${needsUseMemo.length - 10} more`);
    }
  }
  
  if (needsUseCallback.length > 0) {
    console.log('\n🔄 Add useCallback for event handlers:\n');
    needsUseCallback.slice(0, 10).forEach(a => {
      console.log(`  ⚠️  ${a.name}`);
      console.log(`     State hooks: ${a.useState}, Effect hooks: ${a.useEffect}`);
    });
    if (needsUseCallback.length > 10) {
      console.log(`  ... and ${needsUseCallback.length - 10} more`);
    }
  }
  
  console.log('\n📝 Recommendations:\n');
  console.log('1. Start with HIGH PRIORITY components (most re-renders)');
  console.log('2. Add useMemo for expensive data transformations');
  console.log('3. Add useCallback for event handlers passed as props');
  console.log('4. Use React DevTools Profiler to measure impact');
  console.log('\n✨ Run this script again after changes to track progress!\n');
}

generateReport();
