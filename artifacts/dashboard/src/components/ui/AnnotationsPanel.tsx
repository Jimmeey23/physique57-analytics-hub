
import * as React from "react";
import { Annotation, useAnnotations } from "@/hooks/useAnnotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2Icon, PlusIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export const AnnotationsPanel: React.FC = () => {
  const { annotations, addAnnotation, deleteAnnotation } = useAnnotations();
  const [newAnn, setNewAnn] = React.useState<Omit<Annotation, 'id' | 'createdAt'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    label: '',
    color: 'blue',
    notes: ''
  });

  const handleAdd = () => {
    if (!newAnn.label || !newAnn.date) return;
    addAnnotation(newAnn);
    setNewAnn({
      date: format(new Date(), 'yyyy-MM-dd'),
      label: '',
      color: 'blue',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <PlusIcon className="w-5 h-5 text-blue-500" />
            Add Annotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ann-date">Date</Label>
              <Input
                id="ann-date"
                type="date"
                value={newAnn.date}
                onChange={(e) => setNewAnn({ ...newAnn, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-color">Color</Label>
              <Select 
                value={newAnn.color} 
                onValueChange={(v: any) => setNewAnn({ ...newAnn, color: v })}
              >
                <SelectTrigger id="ann-color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue (Info)</SelectItem>
                  <SelectItem value="green">Green (Positive)</SelectItem>
                  <SelectItem value="amber">Amber (Warning)</SelectItem>
                  <SelectItem value="red">Red (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="ann-label">Event Label</Label>
              <Input
                id="ann-label"
                placeholder="e.g., Summer Promotion Launch"
                value={newAnn.label}
                onChange={(e) => setNewAnn({ ...newAnn, label: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="ann-notes">Notes (Optional)</Label>
              <Input
                id="ann-notes"
                placeholder="Additional details..."
                value={newAnn.notes}
                onChange={(e) => setNewAnn({ ...newAnn, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <Button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Add Annotation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Recent Annotations</h3>
        {annotations.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">No annotations added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...annotations].sort((a, b) => b.date.localeCompare(a.date)).map((ann) => (
              <Card key={ann.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: getColor(ann.color) }}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900">{ann.label}</h4>
                      {ann.notes && <p className="text-xs text-slate-500 mt-1">{ann.notes}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 -mr-2"
                      onClick={() => deleteAnnotation(ann.id)}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getColor = (color: string) => {
  const map: any = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    amber: '#f59e0b',
  };
  return map[color] || map.blue;
};
