
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScheduledReport, useScheduledReports } from "@/hooks/useScheduledReports";
import { Trash2Icon, CalendarIcon, PlusIcon, FileTextIcon, ClockIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScheduledReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_SECTIONS = [
  { id: 'executive', label: 'Executive Summary' },
  { id: 'sales', label: 'Sales Analytics' },
  { id: 'sessions', label: 'Sessions & Attendance' },
  { id: 'trainers', label: 'Trainer Performance' },
  { id: 'leads', label: 'Funnel & Leads' },
  { id: 'retention', label: 'Client Retention' }
];

export const ScheduledReportsModal: React.FC<ScheduledReportsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { reports, addReport, deleteReport, updateReport } = useScheduledReports();
  const [isAdding, setIsAdding] = React.useState(false);
  const [newReport, setNewReport] = React.useState<Omit<ScheduledReport, 'id'>>({
    name: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    enabled: true,
    sections: ['executive']
  });

  const handleAdd = () => {
    if (!newReport.name) return;
    addReport(newReport);
    setIsAdding(false);
    setNewReport({
      name: '',
      frequency: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      enabled: true,
      sections: ['executive']
    });
  };

  const toggleSection = (sectionId: string) => {
    const sections = newReport.sections.includes(sectionId)
      ? newReport.sections.filter(s => s !== sectionId)
      : [...newReport.sections, sectionId];
    setNewReport({ ...newReport, sections });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-blue-600" />
            Scheduled Reports
          </DialogTitle>
          <DialogDescription>
            Configure automated reports to be generated periodically. Reports are generated based on browser activity.
          </DialogDescription>
        </DialogHeader>

        {isAdding ? (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="e.g., Weekly Operations Summary"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={newReport.frequency}
                  onValueChange={(v: any) => setNewReport({ ...newReport, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{newReport.frequency === 'weekly' ? 'Day of Week' : 'Day of Month'}</Label>
                {newReport.frequency === 'weekly' ? (
                  <Select
                    value={String(newReport.dayOfWeek)}
                    onValueChange={(v) => setNewReport({ ...newReport, dayOfWeek: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={newReport.dayOfMonth}
                    onChange={(e) => setNewReport({ ...newReport, dayOfMonth: parseInt(e.target.value) })}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Sections to Include</Label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_SECTIONS.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <Checkbox
                      id={`section-${section.id}`}
                      checked={newReport.sections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <label
                      htmlFor={`section-${section.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">Create Schedule</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Schedules</h3>
              <Button size="sm" onClick={() => setIsAdding(true)} className="gap-2">
                <PlusIcon className="w-4 h-4" />
                Add New
              </Button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No scheduled reports yet</p>
                <p className="text-slate-400 text-xs mt-1">Create a schedule to automate your reporting</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="overflow-hidden border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">{report.name}</h4>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-100">
                              {report.frequency}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {report.frequency === 'weekly' 
                                ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][report.dayOfWeek || 0]
                                : `Day ${report.dayOfMonth} of month`
                              }
                            </div>
                            <div className="flex items-center gap-1">
                              <FileTextIcon className="w-3 h-3" />
                              {report.sections.length} sections
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={report.enabled}
                            onCheckedChange={(enabled) => updateReport(report.id, { enabled })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                            onClick={() => deleteReport(report.id)}
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
