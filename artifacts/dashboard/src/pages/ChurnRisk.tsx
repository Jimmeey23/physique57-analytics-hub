import React, { useState, useMemo } from 'react';
import { useCheckinsData } from '@/hooks/useCheckinsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useSalesData } from '@/hooks/useSalesData';
import { useChurnRiskScore, ChurnRiskMember } from '@/hooks/useChurnRiskScore';
import { DashboardMotionHero } from '@/components/ui/DashboardMotionHero';
import { Footer } from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Search, Download, AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

const ChurnRisk: React.FC = () => {
  const { data: checkins, loading: checkinsLoading } = useCheckinsData();
  const { data: expirations, loading: expirationsLoading } = useExpirationsData();
  const { data: sales, loading: salesLoading } = useSalesData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const churnRiskMembers = useChurnRiskScore(checkins, expirations, sales);

  const filteredMembers = useMemo(() => {
    return churnRiskMembers.filter(m => {
      const matchesSearch = 
        m.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = riskFilter === 'all' || m.riskLevel === riskFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [churnRiskMembers, searchTerm, riskFilter]);

  const metrics = useMemo(() => {
    const atRisk = churnRiskMembers.filter(m => m.riskScore >= 50);
    const critical = churnRiskMembers.filter(m => m.riskLevel === 'critical');
    const high = churnRiskMembers.filter(m => m.riskLevel === 'high');
    const revenueAtRisk = atRisk.reduce((sum, m) => sum + m.totalRevenue, 0);

    return {
      totalAtRisk: atRisk.length,
      critical: critical.length,
      high: high.length,
      revenueAtRisk
    };
  }, [churnRiskMembers]);

  const heroMetrics = [
    { label: 'At Risk', value: formatNumber(metrics.totalAtRisk) },
    { label: 'Critical', value: formatNumber(metrics.critical) },
    { label: 'High', value: formatNumber(metrics.high) },
    { label: 'Revenue @ Risk', value: formatCurrency(metrics.revenueAtRisk) }
  ];

  const exportAtRiskList = () => {
    const atRisk = churnRiskMembers.filter(m => m.riskScore >= 50);
    const headers = ['Member', 'Email', 'Last Visit', 'Days Since Visit', 'Expiry Date', 'Days to Expiry', 'Total Visits', 'Revenue', 'Risk Score', 'Risk Level'];
    const csvContent = [
      headers.join(','),
      ...atRisk.map(m => [
        `"${m.memberName}"`,
        `"${m.email}"`,
        m.lastVisitDate || 'N/A',
        m.daysSinceVisit || 0,
        m.expiryDate || 'N/A',
        m.daysToExpiry || 0,
        m.totalVisits,
        m.totalRevenue,
        m.riskScore,
        m.riskLevel
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `p57_at_risk_members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBadge = (level: ChurnRiskMember['riskLevel']) => {
    switch (level) {
      case 'critical': return <Badge variant="destructive" className="capitalize">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600 capitalize">High</Badge>;
      case 'medium': return <Badge className="bg-amber-400 hover:bg-amber-500 text-amber-950 capitalize">Medium</Badge>;
      case 'low': return <Badge className="bg-emerald-500 hover:bg-emerald-600 capitalize">Low</Badge>;
      default: return <Badge variant="outline" className="capitalize">{level}</Badge>;
    }
  };

  const isLoading = checkinsLoading || expirationsLoading || salesLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardMotionHero 
        title="Churn Risk Center" 
        subtitle="Identify and retain at-risk members before they leave"
        metrics={heroMetrics}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-none shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle size={64} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total At-Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{formatNumber(metrics.totalAtRisk)}</p>
              <p className="text-xs text-slate-400 mt-1">Score ≥ 50</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert size={64} className="text-destructive" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{formatNumber(metrics.critical)}</p>
              <p className="text-xs text-slate-400 mt-1">Score ≥ 75</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldQuestion size={64} className="text-orange-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-500">{formatNumber(metrics.high)}</p>
              <p className="text-xs text-slate-400 mt-1">Score 50-74</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
              <ShieldCheck size={64} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue at Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(metrics.revenueAtRisk)}</p>
              <p className="text-xs text-slate-400 mt-1">LTV of at-risk members</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-none shadow-sm mb-8">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow max-w-2xl">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search members by name or email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs value={riskFilter} onValueChange={setRiskFilter} className="hidden lg:block">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="high">High</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="low">Low</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={exportAtRiskList}
              disabled={metrics.totalAtRisk === 0}
            >
              <Download size={18} />
              Export At-Risk List
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-20 text-center text-slate-400">Loading risk assessment data...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-20 text-center text-slate-400">No members match your search or filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-slate-500 font-medium">
                      <th className="text-left p-4">Member</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-center p-4">Last Visit</th>
                      <th className="text-center p-4">Expiry</th>
                      <th className="text-center p-4">Visits</th>
                      <th className="text-right p-4">Revenue</th>
                      <th className="text-center p-4">Risk Score</th>
                      <th className="text-center p-4">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => (
                      <tr key={m.memberId} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium">{m.memberName}</td>
                        <td className="p-4 text-slate-500">{m.email}</td>
                        <td className="p-4 text-center">
                          <p>{m.lastVisitDate || 'Never'}</p>
                          {m.daysSinceVisit !== null && (
                            <p className="text-[10px] text-slate-400">{m.daysSinceVisit} days ago</p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <p>{m.expiryDate || 'N/A'}</p>
                          {m.daysToExpiry !== null && (
                            <p className={`text-[10px] ${m.daysToExpiry < 0 ? 'text-destructive font-bold' : 'text-slate-400'}`}>
                              {m.daysToExpiry < 0 ? 'Expired' : `${m.daysToExpiry} days left`}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center font-semibold">{m.totalVisits}</td>
                        <td className="p-4 text-right font-semibold text-primary">{formatCurrency(m.totalRevenue)}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${
                              m.riskScore >= 75 ? 'text-destructive' : 
                              m.riskScore >= 50 ? 'text-orange-500' : 'text-slate-700'
                            }`}>
                              {m.riskScore}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  m.riskScore >= 75 ? 'bg-destructive' : 
                                  m.riskScore >= 50 ? 'bg-orange-500' : 
                                  m.riskScore >= 25 ? 'bg-amber-400' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${m.riskScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {getRiskBadge(m.riskLevel)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ChurnRisk;

