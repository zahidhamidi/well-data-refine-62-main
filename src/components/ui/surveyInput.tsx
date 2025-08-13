import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface SurveyPoint {
  MD: number;
  Inclination: number;
}

interface SurveyInputProps {
  initialData: SurveyPoint[];
  onConfirm: (data: SurveyPoint[]) => void;
}

const SurveyInput: React.FC<SurveyInputProps> = ({ initialData, onConfirm }) => {
  const [rows, setRows] = React.useState<SurveyPoint[]>(initialData);

  const handleChange = (index: number, field: keyof SurveyPoint, value: string) => {
    const updated = [...rows];
    updated[index][field] = parseFloat(value);
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { MD: 0, Inclination: 0 }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>MD</TableHead>
            <TableHead>Inclination</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <input
                  type="number"
                  value={row.MD}
                  onChange={(e) => handleChange(index, 'MD', e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                />
              </TableCell>
              <TableCell>
                <input
                  type="number"
                  value={row.Inclination}
                  onChange={(e) => handleChange(index, 'Inclination', e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                />
              </TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => removeRow(index)}>Remove</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex space-x-2">
        <Button onClick={addRow}>Add Row</Button>
        <Button onClick={() => onConfirm(rows)} variant="outline">Confirm Survey</Button>
      </div>
    </div>
  );
};

export default SurveyInput;
