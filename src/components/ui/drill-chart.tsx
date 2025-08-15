import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DrillChartProps {
  data: any[];               // Original dataset
  decimatedData?: any[];     // Optional decimated dataset
  parameter: string;         // Parameter to plot (e.g., "wob", "rpm")
  title: string;             // Chart title
  unit: string;              // Unit label (not used in axes here)
  color: string;             // Default point color
  selectedPoints: any[];     // Points that are currently selected
  onPointClick: (point: any) => void; // Callback when a point is clicked
}

const DrillChart: React.FC<DrillChartProps> = ({
  data,
  decimatedData,
  parameter,
  title,
  unit,
  color,
  selectedPoints,
  onPointClick
}) => {
  // Use decimated data if provided, else original data
  const baseData = decimatedData || data;

  // Filter out points where all values are zero
  const filteredData = baseData.filter(
    (point) =>
      !(point.tflo === 0 && point.rop === 0 && point.rpm === 0 && point.wob === 0)
  );

  // Max depth to set the X-axis domain
  const maxDepth = Math.max(...filteredData.map((d) => d.depth), 0);

  // Generate tick marks for the depth axis
  const tickInterval = 500;
  const ticks = [];
  for (let i = 0; i <= maxDepth; i += tickInterval) {
    ticks.push(i);
  }

  // Helper: Check if a point is currently selected
  const isPointSelected = (point: any) =>
    selectedPoints.some((sel) => sel.depth === point.depth && sel[parameter] === point[parameter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredData.length} points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="depth"
                type="number"
                scale="linear"
                domain={[0, maxDepth]}
                ticks={ticks}
                allowDataOverflow={false}
                label={{ value: 'Depth', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                dataKey={parameter}
                type="number"
                domain={[0, 'dataMax']}
                label={{
                  value: `${title}`,
                  angle: -90,
                  position: 'insideLeft',
                  dx: 10,
                  dy: 80
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const xValue = Number(payload[0].payload.depth).toFixed(2);
                    const yValue = Number(payload[0].payload[parameter]).toFixed(2);
                    return (
                      <div style={{ background: 'white', padding: '5px', border: '1px solid #ccc' }}>
                        <div>{`${parameter.toUpperCase()}: ${yValue}`}</div>
                        <div>{`Depth: ${xValue}`}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name={title}
                data={filteredData}
                fill={color}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const selected = isPointSelected(payload);
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={selected ? 6 : 4} // Bigger radius if selected
                      fill={selected ? 'red' : color} // Red highlight for selected
                      stroke={selected ? 'black' : 'none'}
                      strokeWidth={selected ? 1.5 : 0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onPointClick(payload)} // Click to select/deselect
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrillChart;
