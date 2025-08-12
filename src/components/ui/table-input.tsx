import React, { useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SectionData {
  id: string;
  startDepth: string;
  endDepth: string;
  holeDiameter: string;
}

interface FormationData {
  id: string;
  startDepth: string;
  endDepth: string;
  formationName: string;
}

interface TableInputProps {
  onConfirm: (sections: SectionData[], formations: FormationData[]) => void;
  initialSections?: SectionData[];
  initialFormations?: FormationData[];
}

const TableInput: React.FC<TableInputProps> = ({ onConfirm, initialSections, initialFormations }) => {
  const [sections, setSections] = useState<SectionData[]>(
    initialSections && initialSections.length > 0 
      ? initialSections 
      : [{ id: '1', startDepth: '', endDepth: '', holeDiameter: '' }]
  );
  
  const [formations, setFormations] = useState<FormationData[]>(
    initialFormations && initialFormations.length > 0 
      ? initialFormations 
      : [{ id: '1', startDepth: '', endDepth: '', formationName: '' }]
  );

  const addSectionRow = () => {
    const newSection: SectionData = {
      id: Date.now().toString(),
      startDepth: '',
      endDepth: '',
      holeDiameter: ''
    };
    setSections([...sections, newSection]);
  };

  const addFormationRow = () => {
    const newFormation: FormationData = {
      id: Date.now().toString(),
      startDepth: '',
      endDepth: '',
      formationName: ''
    };
    setFormations([...formations, newFormation]);
  };

  const updateSection = (id: string, field: keyof SectionData, value: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const updateFormation = (id: string, field: keyof FormationData, value: string) => {
    setFormations(formations.map(formation => 
      formation.id === id ? { ...formation, [field]: value } : formation
    ));
  };

  const removeSectionRow = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== id));
    }
  };

  const removeFormationRow = (id: string) => {
    if (formations.length > 1) {
      setFormations(formations.filter(formation => formation.id !== id));
    }
  };

  const handlePaste = (event: React.ClipboardEvent, type: 'section' | 'formation') => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text');
    const rows = pastedData.split('\n').filter(row => row.trim());
    
    if (type === 'section') {
      const newSections: SectionData[] = rows.map((row, index) => {
        const [startDepth, endDepth, holeDiameter] = row.split('\t');
        return {
          id: `pasted-${Date.now()}-${index}`,
          startDepth: startDepth?.trim() || '',
          endDepth: endDepth?.trim() || '',
          holeDiameter: holeDiameter?.trim() || ''
        };
      });
      setSections(newSections);
    } else {
      const newFormations: FormationData[] = rows.map((row, index) => {
        const [startDepth, endDepth, formationName] = row.split('\t');
        return {
          id: `pasted-${Date.now()}-${index}`,
          startDepth: startDepth?.trim() || '',
          endDepth: endDepth?.trim() || '',
          formationName: formationName?.trim() || ''
        };
      });
      setFormations(newFormations);
    }
  };

  return (
    <div className="space-y-8">
      {/* Run Summary Details for Depth Interval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enter Run Summary Details for Depth Interval Splicing Precision
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            Copy and paste data from Excel or enter manually. Use Tab or Ctrl+V to paste tabular data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Start Depth</TableHead>
                  <TableHead className="w-[200px]">End Depth</TableHead>
                  <TableHead className="w-[200px]">Hole Diameter</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody onPaste={(e) => handlePaste(e, 'section')}>
                {sections.map((section, index) => (
                  <TableRow key={section.id}>
                    <TableCell>
                      <Input
                        placeholder="e.g., 0"
                        value={section.startDepth}
                        onChange={(e) => updateSection(section.id, 'startDepth', e.target.value)}
                        className="border-0 focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g., 1589"
                        value={section.endDepth}
                        onChange={(e) => updateSection(section.id, 'endDepth', e.target.value)}
                        className="border-0 focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g., 24"
                        value={section.holeDiameter}
                        onChange={(e) => updateSection(section.id, 'holeDiameter', e.target.value)}
                        className="border-0 focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSectionRow(section.id)}
                        disabled={sections.length === 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-start items-center mt-4">
            <Button variant="outline" onClick={addSectionRow} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formation Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enter Formation Attribute
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            Define geological formations with depth ranges and names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Start Depth</TableHead>
                  <TableHead className="w-[200px]">End Depth</TableHead>
                  <TableHead className="w-[200px]">Formation Name</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody onPaste={(e) => handlePaste(e, 'formation')}>
                {formations.map((formation, index) => (
                  <TableRow key={formation.id}>
                    <TableCell>
                      <Input
                        placeholder="e.g., 30"
                        value={formation.startDepth}
                        onChange={(e) => updateFormation(formation.id, 'startDepth', e.target.value)}
                        className="border-0 focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g., 500"
                        value={formation.endDepth}
                        onChange={(e) => updateFormation(formation.id, 'endDepth', e.target.value)}
                        className="border-0 focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g., Toma"
                        value={formation.formationName}
                        onChange={(e) => updateFormation(formation.id, 'formationName', e.target.value)}
                        className="border-0 focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFormationRow(formation.id)}
                        disabled={formations.length === 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-start items-center mt-4">
            <Button variant="outline" onClick={addFormationRow} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Confirm Button */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={() => onConfirm(sections, formations)} 
          size="lg"
          className="px-8"
        >
          Confirm & Continue to Visualization
        </Button>
      </div>
    </div>
  );
};

export default TableInput;