import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  depth: number;
  wob: number;
  rpm: number;
  tflo: number;
  rop: number;
}

interface DrillChartProps {
  data: DataPoint[];
  decimatedData?: DataPoint[];
  parameter: 'wob' | 'rpm' | 'tflo' |'rop';
  title: string;
  unit: string;
  color: string;
  
}

const DrillChart: React.FC<DrillChartProps> = ({
  data,
  decimatedData,
  parameter,
  title,
  unit,
  color
}) => {
  const displayData = decimatedData || data;
  const maxDepth = Math.max(...displayData.map(d => d.depth), 0);

  // Generate ticks at every 500 interval from 0 to maxDepth
  const tickInterval = 500;
  const ticks = [];
  for (let i = 0; i <= maxDepth; i += tickInterval) {
    ticks.push(i);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {decimatedData ? `${decimatedData.length} points (decimated)` : `${data.length} points (original)`}
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
                ticks={ticks}   // <-- Major ticks every 500 units
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
                  dx: 10,  // moves label left/right
                  dy: 80     // adjust vertical position if needed
                }}
              />


              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const xValue = Number(payload[0].value).toFixed(2); // Depth
                    const yValue = Number(payload[1].value).toFixed(2); // Parameter value
                    return (
                      <div style={{ background: 'white', padding: '5px', border: '1px solid #ccc' }}>
                        <div>{`${parameter.toUpperCase()} : ${yValue}`}</div>
                        <div>{`Depth: ${xValue}`}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Scatter
                name={title}
                data={displayData}
                fill={color}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};


export default DrillChart;
